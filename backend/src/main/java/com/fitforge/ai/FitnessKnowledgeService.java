package com.fitforge.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitforge.workout.ExerciseLibraryItem;
import com.fitforge.workout.ExerciseLibraryRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.*;
import java.util.stream.StreamSupport;

@Service
public class FitnessKnowledgeService {
 private final ObjectMapper mapper;private final ExerciseLibraryRepository exercises;
 private JsonNode met,endurance,hypertrophy,nutrition,reserve,wger;private volatile List<ExerciseLibraryItem> exerciseCache;
 public FitnessKnowledgeService(ObjectMapper mapper,ExerciseLibraryRepository exercises){this.mapper=mapper;this.exercises=exercises;}
 @PostConstruct public void load()throws Exception{met=read("knowledge/mets_and_endurance_science.json");hypertrophy=read("knowledge/hypertrophy_strength_biomechanics.json");nutrition=read("knowledge/indian_nutrition_and_metabolism.json");reserve=read("knowledge/healthy_reserve_and_backlog_rules.json");wger=read("knowledge/wger_anatomy_and_splits.json");}
 private JsonNode read(String path)throws Exception{try(InputStream in=new ClassPathResource(path).getInputStream()){return mapper.readTree(in);}}
 public List<JsonNode> programs(){JsonNode p=wger.path("programs");return StreamSupport.stream(p.spliterator(),false).toList();}
 public synchronized void refreshExerciseCache(){exerciseCache=List.copyOf(exercises.findAll());}
 public JsonNode anatomy(){return wger.path("muscles");}
 public String retrieve(String query){String q=query==null?"":query.toLowerCase(Locale.ROOT);StringBuilder out=new StringBuilder("[MATCHING FITNESS KNOWLEDGE]\n");out.append("[mets_and_endurance_science.json] ").append(compact(met)).append("\n[hypertrophy_strength_biomechanics.json] ").append(compact(hypertrophy)).append("\n[indian_nutrition_and_metabolism.json] ").append(compact(nutrition)).append("\n[healthy_reserve_and_backlog_rules.json] ").append(compact(reserve)).append("\n");
  List<ExerciseLibraryItem> found=catalog().stream().map(e->Map.entry(e,score(e,q))).filter(x->x.getValue()>0).sorted(Map.Entry.<ExerciseLibraryItem,Integer>comparingByValue().reversed()).limit(5).map(Map.Entry::getKey).toList();out.append("Matching exercise database records (exact cues, muscles, equipment, level, image URLs): ");if(found.isEmpty())out.append("No exact exercise entry matched; do not invent database cues.\n");else for(var e:found){out.append("{name:").append(e.getName()).append(",primary:").append(e.getPrimaryMusclesJson()).append(",secondary:").append(e.getSecondaryMusclesJson()).append(",equipment:").append(e.getEquipment()).append(",level:").append(e.getLevel()).append(",Setup:").append(e.getSetup()).append(",Bracing:").append(e.getBrace()).append(",Execution:").append(e.getExecution()).append(",Common mistakes:").append(e.getCommonMistakes()).append(",instructions:").append(e.getInstructionsJson()).append(",images:").append(e.getImageUrlsJson()).append("} ");}out.append("\nMatching wger muscle anatomy and split templates: ");List<JsonNode> matched=new ArrayList<>();for(JsonNode m:wger.path("muscles")){String all=m.toString().toLowerCase(Locale.ROOT);if(relevant(all,q))matched.add(m);}for(JsonNode p:wger.path("programs")){if(relevant(p.toString().toLowerCase(Locale.ROOT),q))matched.add(p);}out.append(matched.isEmpty()?"No anatomy/split template matched.":matched.toString()).append("\n[/MATCHING FITNESS KNOWLEDGE]");return out.toString();}
 private List<ExerciseLibraryItem> catalog(){List<ExerciseLibraryItem> cached=exerciseCache;if(cached==null){refreshExerciseCache();cached=exerciseCache;}return cached;}
 private String compact(JsonNode n){try{return mapper.writeValueAsString(n);}catch(Exception e){return "{}";}}
 private boolean relevant(String source,String q){if(q.isBlank())return false;for(String token:q.split("[^\\p{L}0-9]+")){if(token.length()>2&&source.contains(token))return true;}return false;}
 private int score(ExerciseLibraryItem e,String q){if(q.isBlank())return 0;String name=e.getName().toLowerCase(Locale.ROOT);if(q.contains(name))return 100;String fields=(name+" "+e.getMuscleGroup()+" "+e.getPrimaryMusclesJson()+" "+e.getSecondaryMusclesJson()+" "+e.getEquipment()).toLowerCase(Locale.ROOT);int points=0;for(String token:q.split("[^\\p{L}0-9]+")){if(token.length()>2&&fields.contains(token))points+=token.length()>4?4:2;}return points;}
}
