package com.neurolinx.erp.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "ingredients")
public class Ingredient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal stockLevel = BigDecimal.ZERO;

    @Column(nullable = false)
    private String unit; // e.g. "kg", "g", "liter", "ml", "pcs"

    public Ingredient() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getStockLevel() { return stockLevel; }
    public void setStockLevel(BigDecimal stockLevel) { this.stockLevel = stockLevel; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
}
