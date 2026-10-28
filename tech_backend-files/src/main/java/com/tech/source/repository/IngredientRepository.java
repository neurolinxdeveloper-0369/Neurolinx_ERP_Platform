package com.tech.source.repository;
import com.tech.source.model.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    java.util.List<com.tech.source.model.Ingredient> findByCompany(com.tech.source.model.Company company);
    java.util.List<com.tech.source.model.Ingredient> findByCompanyAndBranchId(com.tech.source.model.Company company, Long branchId);
}
