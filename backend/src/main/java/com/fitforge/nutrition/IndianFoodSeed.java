package com.fitforge.nutrition;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
public class IndianFoodSeed {
 // Nutrients are per 100 g edible portion; common cooked dishes are recipe estimates.
 @Bean ApplicationRunner seedIndianFoods(IndianFoodItemRepository foods){return args->{
  List<IndianFoodItem> items=List.of(
   food("Chapati / Roti",297,8.1,54.4,3.7,8.2,"piece","COOKED",40),
   food("Cooked white rice",130,2.7,28.2,0.3,0.4,"g","COOKED",150),
   food("Dal tadka",116,6.5,14.5,3.8,4.5,"katori","COOKED",180),
   food("Moong dal, cooked",105,7.0,19.2,0.4,7.6,"katori","COOKED",180),
   food("Chavli bhaji",95,5.5,13.0,2.2,5.3,"katori","COOKED",160),
   food("Poha",180,3.5,30.0,5.0,2.5,"katori","COOKED",180),
   food("Upma",160,4.0,25.0,4.5,2.0,"katori","COOKED",180),
   food("Idli",146,5.0,29.0,0.7,1.5,"piece","COOKED",40),
   food("Dosa",168,4.0,28.0,4.0,1.5,"piece","COOKED",80),
   food("Paneer",305,18.9,2.4,24.8,0.0,"g","RAW",100),
   food("Paneer bhurji",190,13.0,6.0,12.5,1.0,"katori","COOKED",160),
   food("Chicken breast, raw",120,22.5,0.0,2.6,0.0,"g","RAW",100),
   food("Chicken breast, cooked",165,31.0,0.0,3.6,0.0,"g","COOKED",100),
   food("Whole egg",143,12.6,0.7,9.5,0.0,"piece","RAW",50),
   food("Oats, dry",389,16.9,66.3,6.9,10.6,"g","RAW",40),
   food("Toned milk",61,3.2,4.8,3.0,0.0,"ml","RAW",200),
   food("Plain curd",61,3.5,4.7,3.3,0.0,"katori","COOKED",150),
   food("Greek yogurt, plain",73,10.0,4.0,1.9,0.0,"g","RAW",150),
   food("Moong sprouts",30,3.0,5.9,0.2,1.8,"katori","RAW",100),
   food("Banana",89,1.1,22.8,0.3,2.6,"piece","RAW",118),
   food("Soy chunks, dry",345,52.0,33.0,0.5,13.0,"g","RAW",30),
   food("Whey protein powder",400,80.0,10.0,6.0,0.0,"scoop","RAW",30),
   food("Almonds",579,21.2,21.6,49.9,12.5,"g","RAW",15)
  );java.util.Set<String> existing=foods.findByUserIdIsNullOrderByNameAsc().stream().map(f->f.getName().toLowerCase(java.util.Locale.ROOT)).collect(java.util.stream.Collectors.toSet());foods.saveAll(items.stream().filter(f->!existing.contains(f.getName().toLowerCase(java.util.Locale.ROOT))).toList());
 };}
 private static IndianFoodItem food(String n,double k,double p,double c,double f,double fiber,String unit,String prep,double serving){return new IndianFoodItem(n,k,p,c,f,fiber,unit,prep,serving,null,false);}
}
