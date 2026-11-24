package com.fitforge.nutrition;
import jakarta.persistence.*; import java.time.LocalDate;
@Entity @Table(name="nutrition_grocery_lists",uniqueConstraints=@UniqueConstraint(name="uk_grocery_user_week",columnNames={"user_id","week_start_date"}),indexes=@Index(name="idx_grocery_user_week",columnList="user_id,week_start_date"))
public class GroceryList {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @Column(name="user_id",nullable=false) private Long userId; @Column(name="week_start_date",nullable=false) private LocalDate weekStartDate; @Column(name="items_json",nullable=false,columnDefinition="text") private String itemsJson;
 protected GroceryList(){} public GroceryList(Long userId,LocalDate week,String json){this.userId=userId;this.weekStartDate=week;this.itemsJson=json;} public void setItemsJson(String v){itemsJson=v;} public Long getId(){return id;} public Long getUserId(){return userId;} public LocalDate getWeekStartDate(){return weekStartDate;} public String getItemsJson(){return itemsJson;}
}
