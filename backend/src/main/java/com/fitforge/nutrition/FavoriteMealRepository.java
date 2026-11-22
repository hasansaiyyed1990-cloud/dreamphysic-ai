package com.fitforge.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface FavoriteMealRepository extends JpaRepository<FavoriteMeal,Long>{List<FavoriteMeal> findByUserEmailOrderByNameAsc(String email);Optional<FavoriteMeal> findByIdAndUserEmail(Long id,String email);}
