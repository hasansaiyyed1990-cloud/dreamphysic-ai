package com.fitforge.workout;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitforge.ai.FitnessKnowledgeService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.io.InputStream;

@Component @Order(20)
public class ExerciseDatasetImporter implements ApplicationRunner {
 private static final String URL="https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
 private final ExerciseLibraryRepository repository;private final ObjectMapper mapper;private final FitnessKnowledgeService knowledge;
 public ExerciseDatasetImporter(ExerciseLibraryRepository repository,ObjectMapper mapper,FitnessKnowledgeService knowledge){this.repository=repository;this.mapper=mapper;this.knowledge=knowledge;}
 @Override public void run(ApplicationArguments args){
  try{importAll();}catch(Exception e){org.slf4j.LoggerFactory.getLogger(ExerciseDatasetImporter.class).error("Exercise dataset import failed; continuing startup",e);}
 }
 private void importAll()throws Exception{
  if(repository.count()>=800){knowledge.refreshExerciseCache();return;}
  JsonNode root;
  try{root=download();if(!root.isArray()||root.size()<800)throw new IllegalStateException("Exercise database response was incomplete");}
  catch(Exception offline){try(InputStream in=new ClassPathResource("knowledge/exercises_fallback.json").getInputStream()){root=mapper.readTree(in);}if(!root.isArray()||root.size()<800)throw new IllegalStateException("Local exercise fallback is incomplete",offline);}
  Map<String,ExerciseLibraryItem> existing=new HashMap<>();repository.findAll().forEach(e->existing.put(e.getName().toLowerCase(Locale.ROOT),e));List<ExerciseLibraryItem> upserts=new ArrayList<>(root.size());Set<ExerciseLibraryItem> seen=Collections.newSetFromMap(new IdentityHashMap<>());
  for(JsonNode x:root){String name=text(x,"name");if(name.isBlank())continue;List<String> primary=strings(x.path("primaryMuscles")),secondary=strings(x.path("secondaryMuscles")),instructions=strings(x.path("instructions")),images=strings(x.path("images"));String muscle=primary.isEmpty()?"General":title(primary.get(0));String setup=instructions.isEmpty()?"Set up with stable contact points and a pain-free stance.":instructions.get(0);String brace=instructions.stream().filter(s->s.toLowerCase(Locale.ROOT).contains("brace")||s.toLowerCase(Locale.ROOT).contains("stabil" )).findFirst().orElse("Brace your trunk, control the range, and keep the working joints aligned.");String execution=instructions.size()>2?String.join(" ",instructions.subList(1,instructions.size()-1)):String.join(" ",instructions);String mistakes="Avoid losing the described setup, using momentum, or shortening the controlled range; stop if the movement causes sharp pain.";String primaryJson=mapper.writeValueAsString(primary),secondaryJson=mapper.writeValueAsString(secondary),instructionsJson=mapper.writeValueAsString(instructions);List<String> imageUrls=images.stream().map(p->"https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"+p).toList();String imagesJson=mapper.writeValueAsString(imageUrls);String level=text(x,"level"),equipment=text(x,"equipment");ExerciseLibraryItem e=existing.get(name.toLowerCase(Locale.ROOT));if(e==null)e=new ExerciseLibraryItem(name,muscle,equipment,setup,brace,execution,mistakes,primaryJson,secondaryJson,level,instructionsJson,imagesJson,"FREE_EXERCISE_DB");else e.importFrom(muscle,equipment,setup,brace,execution,mistakes,primaryJson,secondaryJson,level,instructionsJson,imagesJson,"FREE_EXERCISE_DB");if(seen.add(e))upserts.add(e);existing.put(name.toLowerCase(Locale.ROOT),e);}
  repository.saveAll(upserts);knowledge.refreshExerciseCache();
 }
 private JsonNode download()throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(URL).openConnection();c.setRequestMethod("GET");c.setConnectTimeout(4000);c.setReadTimeout(7000);c.setRequestProperty("User-Agent","FitForge-Exercise-Catalog/1.0");try(InputStream in=c.getInputStream()){return mapper.readTree(in);}finally{c.disconnect();}}
 private String text(JsonNode n,String key){return n.path(key).asText("").trim();}
 private List<String> strings(JsonNode n){List<String> out=new ArrayList<>();if(n.isArray())n.forEach(x->{if(x.isTextual())out.add(x.asText());});return out;}
 private String title(String v){String[] parts=v.replace('_',' ').split("\\s+");return Arrays.stream(parts).map(s->s.isBlank()?s:s.substring(0,1).toUpperCase(Locale.ROOT)+s.substring(1)).reduce((a,b)->a+" "+b).orElse("General");}
}
