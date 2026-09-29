package com.neurolinx.erp.repository;
import com.neurolinx.erp.model.RecipeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RecipeItemRepository extends JpaRepository<RecipeItem, Long> {
    List<RecipeItem> findByDishId(Long dishId);
}
