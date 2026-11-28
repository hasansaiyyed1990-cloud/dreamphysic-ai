package com.fitforge.nutrition;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitforge.auth.AppUserRepository;
import com.fitforge.ai.AiDtos;
import com.fitforge.progress.WeightRepository;
import com.fitforge.progress.WeightEntry;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
public class NutritionModuleService {
 private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
 /** Carry-forward is capped at one week of the planned deficit so the backlog cannot balloon. */
 private static final int MAX_CARRY_FORWARD_DAYS = 7;

 private final AppUserRepository users;
 private final IndianFoodItemRepository foods;
 private final FoodDiaryRepository diary;
 private final FavoriteMealRepository favorites;
 private final FatLossMissionRepository missions;
 private final HydrationFiberRepository hydration;
 private final GroceryListRepository groceries;
 private final NutritionReminderRepository reminders;
 private final ObjectMapper mapper;
 private final DailyCalorieBalanceRepository balances;
 private final DeadlineChangeRepository deadlineChanges;
 private final WeightRepository weights;
 private final MealCategoryRepository categories;
 private final NutritionTargetsRepository targets;

 /** Default slots created for a new account; users can rename, reorder, add or delete them. */
 private static final String[][] DEFAULT_CATEGORIES = {
  {"Early Morning","06:00"},{"Breakfast","08:30"},{"Mid-Morning Snack","11:00"},{"Lunch","13:30"},
  {"Evening Snack","17:00"},{"Pre-Workout","18:00"},{"Post-Workout","20:00"},{"Dinner","21:00"},{"Late-Night Snack","23:00"}
 };

 /** Reference daily amounts used until the user saves their own targets. */
 private static final Map<String,Double> DEFAULT_MICRO_TARGETS;
 static {
  Map<String,Double> m=new LinkedHashMap<>();
  m.put("vitaminA",900.0); m.put("vitaminB1",1.2); m.put("vitaminB2",1.3); m.put("vitaminB3",16.0); m.put("vitaminB5",5.0);
  m.put("vitaminB6",1.3); m.put("vitaminB7",30.0); m.put("vitaminB9",400.0); m.put("vitaminB12",2.4); m.put("vitaminC",90.0);
  m.put("vitaminD",20.0); m.put("vitaminE",15.0); m.put("vitaminK",120.0);
  m.put("calcium",1000.0); m.put("iron",14.0); m.put("magnesium",400.0); m.put("zinc",11.0); m.put("potassium",3500.0);
  m.put("phosphorus",700.0); m.put("selenium",55.0); m.put("copper",0.9); m.put("manganese",2.3); m.put("iodine",150.0);
  DEFAULT_MICRO_TARGETS=Collections.unmodifiableMap(m);
 }

 public NutritionModuleService(AppUserRepository users,IndianFoodItemRepository foods,FoodDiaryRepository diary,FavoriteMealRepository favorites,FatLossMissionRepository missions,HydrationFiberRepository hydration,GroceryListRepository groceries,NutritionReminderRepository reminders,ObjectMapper mapper,DailyCalorieBalanceRepository balances,DeadlineChangeRepository deadlineChanges,WeightRepository weights,MealCategoryRepository categories,NutritionTargetsRepository targets){
  this.users=users;
  this.foods=foods;
  this.diary=diary;
  this.favorites=favorites;
  this.missions=missions;
  this.hydration=hydration;
  this.groceries=groceries;
  this.reminders=reminders;
  this.mapper=mapper;
  this.balances=balances;
  this.deadlineChanges=deadlineChanges;
  this.weights=weights;
  this.categories=categories;
  this.targets=targets;
 }

 private Long uid(String email){return users.findByEmail(email).orElseThrow(()->new IllegalArgumentException("Authenticated user not found")).getId();}

 public List<NutritionModuleDtos.Food> foods(String email,String search,boolean includeCustom){
  Long id=uid(email);
  String q=search==null?"":search.trim().toLowerCase(Locale.ROOT);
  return foods.findByUserIdIsNullOrUserIdOrderByNameAsc(id).stream().filter(f->includeCustom||!f.isCustom()).filter(f->q.isBlank()||f.getName().toLowerCase(Locale.ROOT).contains(q)).map(this::foodDto).toList();
 }

 @Transactional public NutritionModuleDtos.Food customFood(String email,NutritionModuleDtos.CustomFoodInput i){
  var f=foods.save(new IndianFoodItem(i.name().trim(),i.calories(),i.proteinG(),i.carbsG(),i.fatG(),i.fiberG(),i.defaultUnit(),prep(i.preparationType()),i.servingGrams(),uid(email),true,writeMicros(i.micros())));
  return foodDto(f);
 }

 /** Edit a user's own custom food. Global seeded foods are read-only. */
 @Transactional public NutritionModuleDtos.Food updateCustomFood(String email,Long id,NutritionModuleDtos.CustomFoodInput i){
  Long owner=uid(email);
  IndianFoodItem f=foods.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Food not found"));
  if(!f.isCustom()||!owner.equals(f.getUserId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Not your custom food");
  f.update(i.name().trim(),i.calories(),i.proteinG(),i.carbsG(),i.fatG(),i.fiberG(),i.defaultUnit(),prep(i.preparationType()),i.servingGrams(),writeMicros(i.micros()));
  return foodDto(foods.save(f));
 }

 /** Delete a user's own custom food. Diary history stores its own values, so past days are unaffected. */
 @Transactional public void deleteCustomFood(String email,Long id){
  Long owner=uid(email);
  IndianFoodItem f=foods.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Food not found"));
  if(!f.isCustom()||!owner.equals(f.getUserId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Not your custom food");
  foods.delete(f);
 }

 public NutritionModuleDtos.DiaryDay day(String email,LocalDate date){return day(uid(email),date);}

 private NutritionModuleDtos.DiaryDay day(Long id,LocalDate date){
  var es=diary.findByUserIdAndEntryDateOrderByLoggedAtAsc(id,date);
  double[] t=totals(es);
  Map<String,Double> micros=new LinkedHashMap<>();
  for(var e:es) sumInto(micros,parseMicros(e.getMicrosJson()),1);
  return new NutritionModuleDtos.DiaryDay(date,t[0],t[1],t[2],t[3],t[4],
   micros.getOrDefault("sugar",0.0),micros.getOrDefault("satFat",0.0),micros.getOrDefault("sodium",0.0),
   micros,es.stream().map(this::diaryDto).toList());
 }

 @Transactional public NutritionModuleDtos.Diary addDiary(String email,NutritionModuleDtos.DiaryInput i){
  Long id=uid(email);
  validateCategory(id,i.mealCategory());
  if(i.preparationType()!=null)prep(i.preparationType());
  var input=calculateFromCatalog(id,i);
  var saved=diary.save(new FoodDiaryEntry(id,input,writeMicros(input.micros())));
  recalcBalance(id,saved.getEntryDate());
  return diaryDto(saved);
 }

 /** Duplicate one meal slot (all its foods) to another date/category. */
 @Transactional public NutritionModuleDtos.DiaryDay copyMeal(String email,NutritionModuleDtos.CopyMealInput i){
  Long id=uid(email);
  validateCategory(id,i.toCategory());
  var source=diary.findByUserIdAndEntryDateOrderByLoggedAtAsc(id,i.fromDate()).stream()
   .filter(e->e.getMealCategory().equalsIgnoreCase(i.fromCategory().trim())).toList();
  if(source.isEmpty())throw new IllegalArgumentException("Us meal me koi food nahi hai · Nothing to copy");
  for(var e:source){
   var input=new NutritionModuleDtos.DiaryInput(i.toDate(),i.toCategory(),e.getFoodName(),e.getQuantity(),e.getUnit(),e.getPreparationType(),e.getCalories(),e.getProteinG(),e.getCarbsG(),e.getFatG(),e.getFiberG(),e.getScanConfidence(),parseMicros(e.getMicrosJson()));
   diary.save(new FoodDiaryEntry(id,input,e.getMicrosJson()));
  }
  recalcBalance(id,i.toDate());
  return day(id,i.toDate());
 }

 /** Copy an entire day's diary to another date (meal plan style). */
 @Transactional public NutritionModuleDtos.DiaryDay copyDay(String email,NutritionModuleDtos.CopyDayInput i){
  Long id=uid(email);
  var source=diary.findByUserIdAndEntryDateOrderByLoggedAtAsc(id,i.fromDate());
  if(source.isEmpty())throw new IllegalArgumentException("Us din kuch log nahi hua · Nothing to copy");
  for(var e:source){
   var input=new NutritionModuleDtos.DiaryInput(i.toDate(),e.getMealCategory(),e.getFoodName(),e.getQuantity(),e.getUnit(),e.getPreparationType(),e.getCalories(),e.getProteinG(),e.getCarbsG(),e.getFatG(),e.getFiberG(),e.getScanConfidence(),parseMicros(e.getMicrosJson()));
   diary.save(new FoodDiaryEntry(id,input,e.getMicrosJson()));
  }
  recalcBalance(id,i.toDate());
  return day(id,i.toDate());
 }

 @Transactional public NutritionModuleDtos.Diary updateDiary(String email,Long id,NutritionModuleDtos.DiaryInput i){
  Long user=uid(email);
  validateCategory(user,i.mealCategory());
  if(i.preparationType()!=null)prep(i.preparationType());
  var e=diary.findByIdAndUserId(id,user).orElseThrow(()->new IllegalArgumentException("Diary entry not found"));
  LocalDate previousDate=e.getEntryDate();
  var input=calculateFromCatalog(user,i);
  e.update(input,writeMicros(input.micros()));
  // Editing macros or moving the entry to another day must refresh that day's calorie balance.
  recalcBalance(user,previousDate);
  recalcBalance(user,e.getEntryDate());
  return diaryDto(e);
 }

 @Transactional public void deleteDiary(String email,Long id){
  Long user=uid(email);
  var e=diary.findByIdAndUserId(id,user).orElseThrow(()->new IllegalArgumentException("Diary entry not found"));
  LocalDate date=e.getEntryDate();
  diary.delete(e);
  recalcBalance(user,date);
 }

 /**
  * Recompute the stored calorie balance for a date after the day's intake changed.
  * Only existing balance rows are touched; nothing is invented for days without one.
  */
 @Transactional public void recalculateBalance(String email,LocalDate date){
  if(date==null)return;
  recalcBalance(uid(email),date);
 }

 private void recalcBalance(Long id,LocalDate date){
  if(date==null)return;
  var existing=balances.findByUserIdAndEntryDate(id,date);
  if(existing.isEmpty())return;
  var row=existing.get();
  var mission=missions.findByUserId(id).orElse(null);
  double tdee=row.getEstimatedTdee()>0?row.getEstimatedTdee():(mission==null?1800:mission.getMaintenanceCalories());
  double plan=row.getPlannedDeficit()>0?row.getPlannedDeficit():(mission==null?0:Math.max(0,mission.getMaintenanceCalories()-mission.getDailyCalorieBudget()));
  double consumed=day(id,date).calories();
  double actual=tdee-consumed;
  double credited=Math.min(plan,Math.max(0,actual));
  double pending=capPending(plan,previousPending(id,date)+Math.max(0,plan-credited));
  row.update(tdee,consumed,plan,pending);
  balances.save(row);
 }

 public List<NutritionModuleDtos.Favorite> favorites(String email){return favorites.findByUserIdOrderByNameAsc(uid(email)).stream().map(this::favoriteDto).toList();}

 @Transactional public NutritionModuleDtos.Favorite addFavorite(String email,NutritionModuleDtos.FavoriteInput i){
  Long id=uid(email);
  double[] t=favoriteTotals(i.items());
  String json=write(i.items());
  var f=favorites.save(new FavoriteMeal(email,id,i.mealName(),json,(int)Math.round(t[0]),t[1],t[2],t[3],t[4],null));
  return favoriteDto(f);
 }

 @Transactional public void deleteFavorite(String email,Long id){favorites.delete(favorites.findByIdAndUserId(id,uid(email)).orElseThrow(()->new IllegalArgumentException("Favorite meal not found")));}

 @Transactional public NutritionModuleDtos.DiaryDay logFavorite(String email,Long id,LocalDate date,String category){
  Long user=uid(email);
  validateCategory(user,category);
  var f=favorites.findByIdAndUserId(id,user).orElseThrow(()->new IllegalArgumentException("Favorite meal not found"));
  try{
   var items=mapper.readValue(f.getItemsJson(),new TypeReference<List<NutritionModuleDtos.FavoriteItemInput>>(){});
   for(var item:items){
    var in=new NutritionModuleDtos.DiaryInput(date,category,item.foodName(),item.quantity(),item.unit(),item.preparationType(),item.calories(),item.proteinG(),item.carbsG(),item.fatG(),item.fiberG(),null,null);
    diary.save(new FoodDiaryEntry(user,in,null));
   }
  }catch(Exception e){throw new IllegalStateException("Favorite meal items could not be read");}
  recalcBalance(user,date);
  return day(user,date);
 }

 public NutritionModuleDtos.Mission mission(String email,LocalDate date){
  Long id=uid(email);
  var m=missions.findByUserId(id).orElseGet(()->missions.save(new FatLossMission(id,new NutritionModuleDtos.MissionInput(null,null,null,null,null,null))));
  double consumed=day(id,date).calories();
  var prior=diary.findByUserIdAndEntryDateBetweenOrderByEntryDateAscLoggedAtAsc(id,m.getStartDate(),date);
  Map<LocalDate,Double> byDate=new HashMap<>();
  prior.forEach(e->byDate.merge(e.getEntryDate(),e.getCalories(),Double::sum));
  double cumulative=byDate.entrySet().stream().mapToDouble(e->m.getMaintenanceCalories()-e.getValue()).sum();
  return missionDto(m,consumed,cumulative);
 }

 @Transactional public NutritionModuleDtos.CalorieBalance recordBalance(String email,NutritionModuleDtos.CalorieBalanceInput input){
  Long id=uid(email);
  var m=missionEntity(id);
  LocalDate date=input.entryDate();
  double tdee=input.estimatedTdee()==null?m.getMaintenanceCalories():input.estimatedTdee();
  double plan=input.plannedDeficit()==null?Math.max(0,tdee-m.getDailyCalorieBudget()):Math.max(0,input.plannedDeficit());
  double consumed=day(id,date).calories();
  double actual=tdee-consumed;
  double previous=previousPending(id,date);
  double credited=Math.min(plan,Math.max(0,actual));
  double pending=capPending(plan,previous+Math.max(0,plan-credited));
  var b=balances.findByUserIdAndEntryDate(id,date).orElseGet(()->new DailyCalorieBalance(id,date,tdee,consumed,plan,pending));
  b.update(tdee,consumed,plan,pending);
  return balanceDto(balances.save(b));
 }

 public NutritionModuleDtos.BacklogReview backlog(String email){
  Long id=uid(email);
  var m=missionEntity(id);
  double gap=balances.findTopByUserIdOrderByEntryDateDesc(id).map(DailyCalorieBalance::getPendingGapKcal).orElse(0.0);
  long remaining=Math.max(0,java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(IST),m.getRevisedDeadline()));
  return new NutritionModuleDtos.BacklogReview(gap,m.getOriginalDeadline(),m.getRevisedDeadline(),remaining,false,"",Math.max(0,m.getMaintenanceCalories()-m.getDailyCalorieBudget()),Math.max(0,m.getMaintenanceCalories()-m.getDailyCalorieBudget())*7,balances.findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(id,m.getStartDate(),LocalDate.now(IST)).stream().map(this::balanceDto).toList());
 }

 @Transactional public NutritionModuleDtos.BacklogReview reviewBacklog(String email){
  Long id=uid(email);
  var m=missionEntity(id);
  LocalDate today=LocalDate.now(IST),week=today.minusDays(6);
  double plan=Math.max(0,m.getMaintenanceCalories()-m.getDailyCalorieBudget());
  double pending=previousPending(id,week);
  for(LocalDate d=week.isBefore(m.getStartDate())?m.getStartDate():week;!d.isAfter(today);d=d.plusDays(1)){
   LocalDate reviewDay=d;
   double consumed=day(id,reviewDay).calories(),actual=m.getMaintenanceCalories()-consumed,credited=Math.min(plan,Math.max(0,actual));
   pending=capPending(plan,pending+Math.max(0,plan-credited));
   double currentPending=pending;
   var b=balances.findByUserIdAndEntryDate(id,reviewDay).orElseGet(()->new DailyCalorieBalance(id,reviewDay,m.getMaintenanceCalories(),consumed,plan,currentPending));
   b.update(m.getMaintenanceCalories(),consumed,plan,currentPending);
   balances.save(b);
  }
  double currentWeight=weights.findTopByUserEmailOrderByDateDesc(email).map(WeightEntry::getWeightKg).orElse(m.getStartWeightKg());
  double weeklyRate=observedLossPerWeek(email,m);
  double plannedRate=Math.min(.75,plan*7/7700.0);
  double rate=weeklyRate>0?Math.min(.75,weeklyRate):Math.max(.1,plannedRate);
  double remainKg=Math.max(0,currentWeight-m.getTargetWeightKg());
  long weightDays=remainKg==0?0:(long)Math.ceil(remainKg/(rate/7));
  long gapDays=plan<=0?30:(long)Math.ceil(pending/plan);
  long projection=Math.max(weightDays,gapDays);
  LocalDate old=m.getRevisedDeadline(),revised=today.plusDays(projection);
  if(revised.isBefore(old))revised=old;
  boolean changed=!revised.equals(old);
  String notification=changed?"Your goal deadline was extended to reflect recorded progress. Keep the normal training plan; no catch-up cardio or crash dieting is needed.":"Your goal timeline remains on track; no extra exercise is owed.";
  m.reviseDeadline(revised);
  missions.save(m);
  if(changed)deadlineChanges.save(new DeadlineChange(id,m.getOriginalDeadline(),revised,notification,plan,plan*7));
  List<NutritionModuleDtos.CalorieBalance> history=balances.findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(id,m.getStartDate(),today).stream().map(this::balanceDto).toList();
  return new NutritionModuleDtos.BacklogReview(pending,m.getOriginalDeadline(),revised,Math.max(0,java.time.temporal.ChronoUnit.DAYS.between(today,revised)),changed,notification,plan,plan*7,history);
 }

 public List<DeadlineChange> deadlineHistory(String email){return deadlineChanges.findByUserIdOrderByChangedAtDesc(uid(email));}

 @Transactional public NutritionModuleDtos.Mission saveMission(String email,NutritionModuleDtos.MissionInput i,LocalDate date){
  Long id=uid(email);
  var m=missions.findByUserId(id).orElseGet(()->new FatLossMission(id,i));
  if(m.getId()!=null)m.update(i);
  m=missions.save(m);
  double consumed=day(id,date).calories();
  var entries=diary.findByUserIdAndEntryDateBetweenOrderByEntryDateAscLoggedAtAsc(id,m.getStartDate(),date);
  Map<LocalDate,Double> byDate=new HashMap<>();
  entries.forEach(e->byDate.merge(e.getEntryDate(),e.getCalories(),Double::sum));
  int maintenance=m.getMaintenanceCalories();
  double cumulative=byDate.entrySet().stream().mapToDouble(e->maintenance-e.getValue()).sum();
  return missionDto(m,consumed,cumulative);
 }

 public NutritionModuleDtos.Analytics analytics(String email,int days,LocalDate from,LocalDate to){
  Long id=uid(email);
  LocalDate end=to==null?LocalDate.now(IST):to;
  LocalDate start=from==null?end.minusDays(Math.max(1,days)-1L):from;
  if(start.isAfter(end))throw new IllegalArgumentException("startDate must be on or before endDate");
  if(from==null&&(days<1||days>366))throw new IllegalArgumentException("days must be between 1 and 366");
  var es=diary.findByUserIdAndEntryDateBetweenOrderByEntryDateAscLoggedAtAsc(id,start,end);
  Map<LocalDate,List<FoodDiaryEntry>> map=new HashMap<>();
  es.forEach(e->map.computeIfAbsent(e.getEntryDate(),k->new ArrayList<>()).add(e));
  int n=(int)(end.toEpochDay()-start.toEpochDay()+1);
  var mission=missions.findByUserId(id).orElse(null);
  double target=mission==null?1800:mission.getDailyCalorieBudget();
  double maintenance=mission==null?1800:mission.getMaintenanceCalories();
  double proteinTarget=mission==null?144:mission.getStartWeightKg()*1.6;
  List<NutritionModuleDtos.DailyAnalytics> daily=new ArrayList<>();
  List<LocalDate> missed=new ArrayList<>();
  double[] sum=new double[5];
  LocalDate best=null;
  double bestScore=Double.MAX_VALUE;
  int consistent=0,loggedDays=0;
  double deficit=0;
  for(LocalDate d=start;!d.isAfter(end);d=d.plusDays(1)){
   var list=map.getOrDefault(d,List.of());
   double[] t=totals(list);
   boolean c=!list.isEmpty()&&t[0]<=target;
   boolean p=t[1]>=proteinTarget;
   daily.add(new NutritionModuleDtos.DailyAnalytics(d,t[0],t[1],t[2],t[3],t[4],c,p));
   if(!c||!p)missed.add(d);
   if(c&&p)consistent++;
   if(!list.isEmpty()){
    loggedDays++;
    deficit+=maintenance-t[0];
   }
   for(int j=0;j<5;j++)sum[j]+=t[j];
   double score=Math.abs(target-t[0])+(p?0:Math.max(0,proteinTarget-t[1])*2);
   if(!list.isEmpty()&&score<bestScore){bestScore=score;best=d;}
  }
  return new NutritionModuleDtos.Analytics(start,end,sum[0]/n,sum[1]/n,sum[2]/n,sum[3]/n,sum[4]/n,loggedDays==0?0:deficit/loggedDays,100.0*consistent/n,best==null?null:best.toString(),missed,daily);
 }

 /** order: code, label, unit, limitType (MIN = target to reach, MAX = upper limit). */
 private static final String[][] MICRO_DEFS = {
  {"vitaminA","Vitamin A","µg","MIN"},{"vitaminB1","Vitamin B1","mg","MIN"},{"vitaminB2","Vitamin B2","mg","MIN"},
  {"vitaminB3","Vitamin B3","mg","MIN"},{"vitaminB5","Vitamin B5","mg","MIN"},{"vitaminB6","Vitamin B6","mg","MIN"},
  {"vitaminB7","Vitamin B7","µg","MIN"},{"vitaminB9","Vitamin B9","µg","MIN"},{"vitaminB12","Vitamin B12","µg","MIN"},
  {"vitaminC","Vitamin C","mg","MIN"},{"vitaminD","Vitamin D","µg","MIN"},{"vitaminE","Vitamin E","mg","MIN"},{"vitaminK","Vitamin K","µg","MIN"},
  {"calcium","Calcium","mg","MIN"},{"iron","Iron","mg","MIN"},{"magnesium","Magnesium","mg","MIN"},{"zinc","Zinc","mg","MIN"},
  {"potassium","Potassium","mg","MIN"},{"phosphorus","Phosphorus","mg","MIN"},{"selenium","Selenium","µg","MIN"},
  {"copper","Copper","mg","MIN"},{"manganese","Manganese","mg","MIN"},{"iodine","Iodine","µg","MIN"},
  {"sodium","Sodium","mg","MAX"},{"sugar","Sugar","g","MAX"},{"satFat","Saturated fat","g","MAX"}
 };

 public List<NutritionModuleDtos.Micronutrient> micronutrients(String email,LocalDate date){
  Long id=uid(email);
  var day=day(id,date);
  var t=targets(email);
  List<NutritionModuleDtos.Micronutrient> out=new ArrayList<>();
  for(var d:MICRO_DEFS){
   String code=d[0];
   boolean hasData=day.micros().containsKey(code);
   double consumed=day.micros().getOrDefault(code,0.0);
   Double target;
   if(code.equals("sodium"))target=t.sodiumMgMax();
   else if(code.equals("sugar"))target=t.sugarGMax();
   else if(code.equals("satFat"))target=22.0;
   else{
    Double fallback=DEFAULT_MICRO_TARGETS.get(code);
    Double saved=t.micros()==null?null:t.micros().get(code);
    target=saved!=null?saved:fallback;
   }
   if(target==null)target=0.0;
   boolean max="MAX".equals(d[3]);
   double remaining=Math.max(0,target-consumed);
   double percent=target<=0?0:round1(consumed*100.0/target);
   String status;
   if(!hasData)status="NO_DATA";
   else if(max)status=consumed>target?"OVER_LIMIT":"ON_TRACK";
   else status=percent>=100?"MET":percent>=70?"ON_TRACK":"BELOW";
   out.add(new NutritionModuleDtos.Micronutrient(code,d[1],d[2],target,round1(consumed),round1(remaining),percent,hasData,status));
  }
  return out;
 }

 // ---------- Meal categories (custom, ordered, timed) ----------

 public List<NutritionModuleDtos.MealCategory> categories(String email){
  Long id=uid(email);
  var list=categories.findByUserIdOrderBySortOrderAscNameAsc(id);
  if(list.isEmpty())list=seedCategories(id);
  return list.stream().map(this::categoryDto).toList();
 }

 private List<MealCategory> seedCategories(Long userId){
  List<MealCategory> created=new ArrayList<>();
  for(int i=0;i<DEFAULT_CATEGORIES.length;i++){
   created.add(new MealCategory(userId,DEFAULT_CATEGORIES[i][0],i*10,DEFAULT_CATEGORIES[i][1],true));
  }
  return categories.saveAll(created);
 }

 @Transactional public NutritionModuleDtos.MealCategory addCategory(String email,NutritionModuleDtos.MealCategoryInput i){
  Long id=uid(email);
  categories(id);
  String name=i.name().trim();
  if(categories.existsByUserIdAndNameIgnoreCase(id,name))throw new IllegalArgumentException("Ye meal category already hai · Category already exists");
  int order=i.sortOrder()==null?nextCategoryOrder(id):i.sortOrder();
  return categoryDto(categories.save(new MealCategory(id,name,order,i.timeLabel(),false)));
 }

 @Transactional public NutritionModuleDtos.MealCategory updateCategory(String email,Long id,NutritionModuleDtos.MealCategoryInput i){
  Long user=uid(email);
  var c=categories.findByIdAndUserId(id,user).orElseThrow(()->new IllegalArgumentException("Meal category not found"));
  String name=i.name()==null?null:i.name().trim();
  if(name!=null&&!name.equalsIgnoreCase(c.getName())&&categories.existsByUserIdAndNameIgnoreCase(user,name))
   throw new IllegalArgumentException("Ye meal category already hai · Category already exists");
  c.update(name,i.sortOrder(),i.timeLabel());
  return categoryDto(categories.save(c));
 }

 @Transactional public void reorderCategories(String email,NutritionModuleDtos.CategoryReorderInput i){
  Long user=uid(email);
  List<Long> ids=i.ids();
  for(int idx=0;idx<ids.size();idx++){
   int order=idx*10;
   categories.findByIdAndUserId(ids.get(idx),user).ifPresent(c->{c.moveTo(order);categories.save(c);});
  }
 }

 /** Delete a slot. History is never dropped: entries move to the target slot (or the delete is refused). */
 @Transactional public void deleteCategory(String email,Long id,Long moveEntriesToId){
  Long user=uid(email);
  var c=categories.findByIdAndUserId(id,user).orElseThrow(()->new IllegalArgumentException("Meal category not found"));
  var all=diary.findByUserIdAndEntryDateBetweenOrderByEntryDateAscLoggedAtAsc(user,LocalDate.of(2000,1,1),LocalDate.of(2100,1,1));
  var affected=all.stream().filter(e->e.getMealCategory().equalsIgnoreCase(c.getName())).toList();
  if(!affected.isEmpty()){
   if(moveEntriesToId==null)throw new IllegalArgumentException("Is category me "+affected.size()+" logged entries hain. Pehle batayein kahan move karein.");
   var target=categories.findByIdAndUserId(moveEntriesToId,user).orElseThrow(()->new IllegalArgumentException("Target meal category not found"));
   affected.forEach(e->{e.moveCategory(target.getName());diary.save(e);});
  }
  categories.delete(c);
 }

 // ---------- Custom nutrition targets ----------

 public NutritionModuleDtos.Targets targets(String email){
  Long id=uid(email);
  return targets.findByUserId(id).map(this::targetsDto).orElseGet(()->defaultTargets(id));
 }

 @Transactional public NutritionModuleDtos.Targets saveTargets(String email,NutritionModuleDtos.TargetsInput i){
  Long id=uid(email);
  var t=targets.findByUserId(id).orElseGet(()->new NutritionTargets(id,i,writeMicros(i.micros())));
  t.apply(i);
  t.setMicrosJson(writeMicros(i.micros()));
  return targetsDto(targets.save(t));
 }

 private NutritionModuleDtos.Targets defaultTargets(Long userId){
  var m=missions.findByUserId(userId).orElse(null);
  double cal=m==null?2000:Math.max(1200,m.getDailyCalorieBudget());
  double startWeight=m==null?0:m.getStartWeightKg();
  double protein=startWeight>0?Math.round(startWeight*1.6):120;
  return new NutritionModuleDtos.Targets(cal,protein,round1(cal*0.45/4),round1(cal*0.25/9),25,2500,2300,50,DEFAULT_MICRO_TARGETS);
 }

 public NutritionModuleDtos.Hydration hydration(String email,LocalDate date){
  Long id=uid(email);
  var h=hydration.findByUserIdAndLogDate(id,date).orElse(new HydrationFiberLog(id,date,new NutritionModuleDtos.HydrationInput(0,null,null)));
  double fiber=totals(diary.findByUserIdAndEntryDateOrderByLoggedAtAsc(id,date))[4];
  return new NutritionModuleDtos.Hydration(date,h.getWaterMl(),h.getWaterGoalMl(),h.getFiberTargetG(),fiber,Math.max(0,h.getFiberTargetG()-fiber));
 }

 @Transactional public NutritionModuleDtos.Hydration saveHydration(String email,LocalDate date,NutritionModuleDtos.HydrationInput i){
  Long id=uid(email);
  var h=hydration.findByUserIdAndLogDate(id,date).orElseGet(()->new HydrationFiberLog(id,date,i));
  h.update(i);
  hydration.save(h);
  return hydration(email,date);
 }

 public NutritionModuleDtos.Grocery grocery(String email){
  Long id=uid(email);
  LocalDate week=LocalDate.now(IST).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
  return groceries.findByUserIdAndWeekStartDate(id,week).map(this::groceryDto).orElse(new NutritionModuleDtos.Grocery(null,week,"[]"));
 }

 @Transactional public NutritionModuleDtos.Grocery putGrocery(String email,NutritionModuleDtos.GroceryInput i){
  Long id=uid(email);
  LocalDate week=i.weekStartDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
  var g=groceries.findByUserIdAndWeekStartDate(id,week).orElseGet(()->new GroceryList(id,week,i.itemsJson()));
  g.setItemsJson(i.itemsJson());
  return groceryDto(groceries.save(g));
 }

 public NutritionModuleDtos.Reminders reminders(String email){
  var p=reminders.findByUserId(uid(email)).orElse(null);
  return p==null?new NutritionModuleDtos.Reminders(null,null,null,null,null):new NutritionModuleDtos.Reminders(p.getMealReminderJson(),p.getProteinReminderJson(),p.getWaterReminderJson(),p.getWeightReminderJson(),p.getEodVerdictReminderJson());
 }

 @Transactional public NutritionModuleDtos.Reminders putReminders(String email,NutritionModuleDtos.ReminderInput i){
  Long id=uid(email);
  var p=reminders.findByUserId(id).orElseGet(()->new NutritionReminderPref(id));
  p.update(i);
  reminders.save(p);
  return reminders(email);
 }

 public double proteinTarget(String email){return missions.findByUserId(uid(email)).map(m->m.getStartWeightKg()*1.6).orElse(144.0);}
 public double dailyCalorieBudget(String email){return missions.findByUserId(uid(email)).map(FatLossMission::getDailyCalorieBudget).orElse(1500);}

 public AiProteinData proteinData(String email,LocalDate date){
  Long id=uid(email);
  double consumed=totals(diary.findByUserIdAndEntryDateOrderByLoggedAtAsc(id,date))[1];
  double target=proteinTarget(email);
  Map<String,IndianFoodItem> byName=new HashMap<>();
  foods.findByUserIdIsNullOrUserIdOrderByNameAsc(id).forEach(f->byName.put(f.getName().toLowerCase(Locale.ROOT),f));
  var options=List.of(
   proteinOption("chicken-curd","Chicken breast + curd",List.of(new ProteinChoice("Chicken breast, cooked",120,"g"),new ProteinChoice("Plain curd",100,"g")),byName),
   proteinOption("egg-yogurt","Eggs + Greek yogurt",List.of(new ProteinChoice("Whole egg",2,"piece"),new ProteinChoice("Greek yogurt, plain",150,"g")),byName),
   proteinOption("soy-paneer","Soy chunks + paneer",List.of(new ProteinChoice("Soy chunks, dry",35,"g"),new ProteinChoice("Paneer",75,"g")),byName));
  return new AiProteinData(target,consumed,Math.max(0,target-consumed),options);
 }

 private AiDtos.ProteinOption proteinOption(String id,String name,List<ProteinChoice> choices,Map<String,IndianFoodItem> foods){
  List<AiDtos.ProteinLogItem> items=new ArrayList<>();
  double[] t=new double[5];
  for(var c:choices){
   var f=foods.get(c.name().toLowerCase(Locale.ROOT));
   if(f==null)continue;
   double grams=c.unit().equals("piece")?c.quantity()*f.getServingGrams():c.quantity();
   double scale=grams/100.0;
   double cal=f.getCalories()*scale,p=f.getProteinG()*scale,carb=f.getCarbsG()*scale,fat=f.getFatG()*scale,fiber=f.getFiberG()*scale;
   t[0]+=cal;t[1]+=p;t[2]+=carb;t[3]+=fat;t[4]+=fiber;
   items.add(new AiDtos.ProteinLogItem(f.getName(),c.quantity(),c.unit(),f.getPreparationType(),cal,p,carb,fat,fiber));
  }
  return new AiDtos.ProteinOption(id,"SNACKS",name,items,t[0],t[1],t[2],t[3],t[4]);
 }

 public record AiProteinData(double target,double consumed,double remaining,List<AiDtos.ProteinOption> options){}
 private record ProteinChoice(String name,double quantity,String unit){}

 public List<NutritionModuleDtos.Diary> recentDiary(String email,LocalDate from,LocalDate to){return diary.findByUserIdAndEntryDateBetweenOrderByEntryDateAscLoggedAtAsc(uid(email),from,to).stream().map(this::diaryDto).toList();}

 private NutritionModuleDtos.Food foodDto(IndianFoodItem f){return new NutritionModuleDtos.Food(f.getId(),f.getName(),f.getCalories(),f.getProteinG(),f.getCarbsG(),f.getFatG(),f.getFiberG(),f.getDefaultUnit(),f.getPreparationType(),f.isCustom(),f.getUserId(),f.getServingGrams(),parseMicros(f.getMicrosJson()));}
 private NutritionModuleDtos.Diary diaryDto(FoodDiaryEntry e){return new NutritionModuleDtos.Diary(e.getId(),e.getUserId(),e.getEntryDate(),e.getLoggedAt(),e.getMealCategory(),e.getFoodName(),e.getQuantity(),e.getUnit(),e.getPreparationType(),e.getCalories(),e.getProteinG(),e.getCarbsG(),e.getFatG(),e.getFiberG(),e.getScanConfidence(),parseMicros(e.getMicrosJson()));}
 private NutritionModuleDtos.MealCategory categoryDto(MealCategory c){return new NutritionModuleDtos.MealCategory(c.getId(),c.getName(),c.getSortOrder(),c.getTimeLabel(),c.isDefault());}
 private NutritionModuleDtos.Targets targetsDto(NutritionTargets t){return new NutritionModuleDtos.Targets(t.getCalories(),t.getProteinG(),t.getCarbsG(),t.getFatG(),t.getFiberG(),t.getWaterMl(),t.getSodiumMgMax(),t.getSugarGMax(),parseMicros(t.getMicrosJson()));}

 private int nextCategoryOrder(Long userId){return categories.findByUserIdOrderBySortOrderAscNameAsc(userId).stream().mapToInt(MealCategory::getSortOrder).max().orElse(0)+10;}

 private Map<String,Double> parseMicros(String json){
  if(json==null||json.isBlank())return Map.of();
  try{return mapper.readValue(json,new TypeReference<Map<String,Double>>(){});}catch(Exception e){return Map.of();}
 }

 private String writeMicros(Map<String,Double> micros){
  if(micros==null||micros.isEmpty())return null;
  Map<String,Double> clean=new LinkedHashMap<>();
  micros.forEach((k,v)->{if(k!=null&&v!=null&&!k.isBlank()&&v.doubleValue()!=0)clean.put(k,round1(v.doubleValue()));});
  return clean.isEmpty()?null:write(clean);
 }

 private Map<String,Double> scaleMicros(Map<String,Double> base,double factor){
  if(base==null||base.isEmpty())return Map.of();
  Map<String,Double> scaled=new LinkedHashMap<>();
  base.forEach((k,v)->{if(v!=null)scaled.put(k,round1(v.doubleValue()*factor));});
  return scaled;
 }

 private void sumInto(Map<String,Double> totals,Map<String,Double> add,double factor){
  if(add==null)return;
  add.forEach((k,v)->{if(v!=null)totals.merge(k,round1(v.doubleValue()*factor),Double::sum);});
 }

 private double round1(double v){return Math.round(v*10.0)/10.0;}
 private NutritionModuleDtos.Favorite favoriteDto(FavoriteMeal f){return new NutritionModuleDtos.Favorite(f.getId(),f.getName(),f.getItemsJson(),f.getCalories(),f.getProteinG(),f.getCarbsG(),f.getFatG(),f.getFiberG()==null?0:f.getFiberG());}
 private NutritionModuleDtos.Grocery groceryDto(GroceryList g){return new NutritionModuleDtos.Grocery(g.getId(),g.getWeekStartDate(),g.getItemsJson());}
 private NutritionModuleDtos.Mission missionDto(FatLossMission m,double c,double cumulative){return new NutritionModuleDtos.Mission(m.getId(),m.getStartWeightKg(),m.getTargetWeightKg(),m.getStartDate(),m.getTargetDate(),m.getMaintenanceCalories(),m.getDailyCalorieBudget(),c,m.getDailyCalorieBudget()-c,m.getMaintenanceCalories()-c,cumulative);}
 private FatLossMission missionEntity(Long id){return missions.findByUserId(id).orElseGet(()->missions.save(new FatLossMission(id,new NutritionModuleDtos.MissionInput(null,null,null,null,null,null))));}
 private NutritionModuleDtos.CalorieBalance balanceDto(DailyCalorieBalance b){return new NutritionModuleDtos.CalorieBalance(b.getId(),b.getEntryDate(),b.getEstimatedTdee(),b.getConsumedCalories(),b.getPlannedDeficit(),b.getActualDeficit(),b.getPendingGapKcal());}

 private double previousPending(Long id,LocalDate date){
  var m=missions.findByUserId(id).orElse(null);
  LocalDate end=date.minusDays(1);
  if(m==null||end.isBefore(m.getStartDate()))return 0;
  return balances.findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(id,m.getStartDate(),end).stream().reduce((x,y)->y).map(DailyCalorieBalance::getPendingGapKcal).orElse(0.0);
 }

 private double capPending(double plan,double pending){
  if(plan<=0)return 0;
  return Math.min(plan*MAX_CARRY_FORWARD_DAYS,Math.max(0,pending));
 }

 private double observedLossPerWeek(String email,FatLossMission m){
  var entries=weights.findByUserEmailAndDateBetweenOrderByDateAsc(email,m.getStartDate(),LocalDate.now(IST));
  if(entries.size()<2)return 0;
  LocalDate cutoff=LocalDate.now(IST).minusDays(7);
  var old=entries.stream().filter(w->!w.getDate().isAfter(cutoff)).toList();
  var recent=entries.stream().filter(w->!w.getDate().isBefore(cutoff)).toList();
  double first=old.isEmpty()?entries.get(0).getWeightKg():old.stream().mapToDouble(WeightEntry::getWeightKg).average().orElse(entries.get(0).getWeightKg());
  double last=recent.isEmpty()?entries.get(entries.size()-1).getWeightKg():recent.stream().mapToDouble(WeightEntry::getWeightKg).average().orElse(entries.get(entries.size()-1).getWeightKg());
  long days=Math.max(1,java.time.temporal.ChronoUnit.DAYS.between(entries.get(0).getDate(),entries.get(entries.size()-1).getDate()));
  return Math.max(0,(first-last)*7.0/days);
 }

 private String prep(String s){
  String p=s.toUpperCase(Locale.ROOT);
  if(!p.equals("RAW")&&!p.equals("COOKED"))throw new IllegalArgumentException("preparationType must be RAW or COOKED");
  return p;
 }

 private NutritionModuleDtos.DiaryInput calculateFromCatalog(Long id,NutritionModuleDtos.DiaryInput i){
  if(i.scanConfidence()!=null)return i;
  boolean customMicros=i.micros()!=null&&!i.micros().isEmpty();
  var f=foods.findFirstByUserIdAndNameIgnoreCase(id,i.foodName()).or(()->foods.findFirstByUserIdIsNullAndNameIgnoreCase(i.foodName())).orElse(null);
  if(f==null)return i;
  String unit=i.unit().trim().toLowerCase(Locale.ROOT);
  double grams;
  if(unit.equals("g")||unit.equals("gram")||unit.equals("grams")||unit.equals("ml"))grams=i.quantity();
  else if(unit.equalsIgnoreCase(f.getDefaultUnit()))grams=i.quantity()*f.getServingGrams();
  else return i;
  double factor=grams/100.0;
  return new NutritionModuleDtos.DiaryInput(i.entryDate(),i.mealCategory(),i.foodName(),i.quantity(),i.unit(),i.preparationType()==null?f.getPreparationType():i.preparationType(),f.getCalories()*factor,f.getProteinG()*factor,f.getCarbsG()*factor,f.getFatG()*factor,f.getFiberG()*factor,null,customMicros?i.micros():scaleMicros(parseMicros(f.getMicrosJson()),factor));
 }

 /** Meal slots are user-defined, so validation checks the user's own list. */
 private void validateCategory(Long userId,String s){
  if(s==null||s.isBlank())throw new IllegalArgumentException("Meal category is required");
  var list=categories.findByUserIdOrderBySortOrderAscNameAsc(userId);
  if(list.isEmpty())list=seedCategories(userId);
  boolean ok=list.stream().anyMatch(c->c.getName().equalsIgnoreCase(s.trim()));
  if(!ok)throw new IllegalArgumentException("Unknown meal category: "+s.trim());
 }

 private List<NutritionModuleDtos.MealCategory> categories(Long userId){
  var list=categories.findByUserIdOrderBySortOrderAscNameAsc(userId);
  if(list.isEmpty())list=seedCategories(userId);
  return list.stream().map(this::categoryDto).toList();
 }

 private double[] totals(List<FoodDiaryEntry> es){
  double[] t=new double[5];
  for(var e:es){t[0]+=e.getCalories();t[1]+=e.getProteinG();t[2]+=e.getCarbsG();t[3]+=e.getFatG();t[4]+=e.getFiberG();}
  return t;
 }

 private double[] favoriteTotals(List<NutritionModuleDtos.FavoriteItemInput> items){
  double[] t=new double[5];
  for(var e:items){t[0]+=e.calories();t[1]+=e.proteinG();t[2]+=e.carbsG();t[3]+=e.fatG();t[4]+=e.fiberG();}
  return t;
 }

 private String write(Object o){try{return mapper.writeValueAsString(o);}catch(Exception e){throw new IllegalArgumentException("Could not serialize items");}}
}
