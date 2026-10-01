package com.neurolinx.erp.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "ingredients")
public class Ingredient {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Branch branch;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal stockLevel = BigDecimal.ZERO;

    @Column(nullable = false)
    private String unit; // e.g. "kg", "g", "liter", "ml", "pcs"

        @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Company company;

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public Ingredient() {}
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getStockLevel() { return stockLevel; }
    public void setStockLevel(BigDecimal stockLevel) { this.stockLevel = stockLevel; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
}
