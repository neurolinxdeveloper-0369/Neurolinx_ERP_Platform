package com.tech.source.repository;

import com.tech.source.model.Company;
import com.tech.source.model.Ingredient;
import com.tech.source.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByCompanyOrderByCreatedAtDesc(Company company);
    List<StockMovement> findByCompanyAndIngredientOrderByCreatedAtDesc(Company company, Ingredient ingredient);
    List<StockMovement> findByCompanyAndBranchIdOrderByCreatedAtDesc(Company company, Long branchId);
}
