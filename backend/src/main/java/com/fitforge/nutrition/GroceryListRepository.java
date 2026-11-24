package com.fitforge.nutrition;
import org.springframework.data.jpa.repository.JpaRepository; import java.time.LocalDate; import java.util.Optional;
public interface GroceryListRepository extends JpaRepository<GroceryList,Long>{Optional<GroceryList> findByUserIdAndWeekStartDate(Long userId,LocalDate weekStartDate);}
