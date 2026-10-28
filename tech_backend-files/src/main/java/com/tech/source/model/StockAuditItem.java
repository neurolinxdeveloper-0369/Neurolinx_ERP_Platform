package com.tech.source.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "stock_audit_items")
public class StockAuditItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_id", nullable = false)
    @JsonIgnore
    private StockAudit audit;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false)
    private BigDecimal systemQuantity = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal physicalQuantity = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal varianceQuantity = BigDecimal.ZERO; // physicalQuantity - systemQuantity

    @Column(nullable = false)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal varianceValue = BigDecimal.ZERO; // varianceQuantity * unitCost

    @Column(nullable = false, length = 20)
    private String unit = "kg";

    @Column(length = 100)
    private String discrepancyReason; // "Unlogged Waste", "Portioning Loss", "Theft / Missing", "Count Correction", "Damaged Goods"

    public StockAuditItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public StockAudit getAudit() { return audit; }
    public void setAudit(StockAudit audit) { this.audit = audit; }
    public Ingredient getIngredient() { return ingredient; }
    public void setIngredient(Ingredient ingredient) { this.ingredient = ingredient; }
    public BigDecimal getSystemQuantity() { return systemQuantity != null ? systemQuantity : BigDecimal.ZERO; }
    public void setSystemQuantity(BigDecimal systemQuantity) { this.systemQuantity = systemQuantity; }
    public BigDecimal getPhysicalQuantity() { return physicalQuantity != null ? physicalQuantity : BigDecimal.ZERO; }
    public void setPhysicalQuantity(BigDecimal physicalQuantity) { this.physicalQuantity = physicalQuantity; }
    public BigDecimal getVarianceQuantity() { return varianceQuantity != null ? varianceQuantity : BigDecimal.ZERO; }
    public void setVarianceQuantity(BigDecimal varianceQuantity) { this.varianceQuantity = varianceQuantity; }
    public BigDecimal getUnitCost() { return unitCost != null ? unitCost : BigDecimal.ZERO; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public BigDecimal getVarianceValue() { return varianceValue != null ? varianceValue : BigDecimal.ZERO; }
    public void setVarianceValue(BigDecimal varianceValue) { this.varianceValue = varianceValue; }
    public String getUnit() { return unit != null ? unit : "kg"; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getDiscrepancyReason() { return discrepancyReason; }
    public void setDiscrepancyReason(String discrepancyReason) { this.discrepancyReason = discrepancyReason; }
}
