package com.fitforge.nutrition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface IndianFoodItemRepository extends JpaRepository<IndianFoodItem,Long>{
 List<IndianFoodItem> findByUserIdIsNullOrUserIdOrderByNameAsc(Long userId);
 List<IndianFoodItem> findByUserIdIsNullOrderByNameAsc();
 boolean existsByUserIdIsNull();
 java.util.Optional<IndianFoodItem> findFirstByUserIdAndNameIgnoreCase(Long userId,String name);
 java.util.Optional<IndianFoodItem> findFirstByUserIdIsNullAndNameIgnoreCase(String name);
}
