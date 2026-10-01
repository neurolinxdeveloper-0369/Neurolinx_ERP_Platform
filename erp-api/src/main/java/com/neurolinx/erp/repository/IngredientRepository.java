package com.neurolinx.erp.repository;
import com.neurolinx.erp.model.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    java.util.List<com.neurolinx.erp.model.Ingredient> findByCompany(com.neurolinx.erp.model.Company company);
    java.util.List<com.neurolinx.erp.model.Ingredient> findByCompanyAndBranchId(com.neurolinx.erp.model.Company company, Long branchId);
}
