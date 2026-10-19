package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.Ingredient;
import com.neurolinx.erp.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByCompanyOrderByCreatedAtDesc(Company company);
    List<StockMovement> findByCompanyAndIngredientOrderByCreatedAtDesc(Company company, Ingredient ingredient);
    List<StockMovement> findByCompanyAndBranchIdOrderByCreatedAtDesc(Company company, Long branchId);
}
