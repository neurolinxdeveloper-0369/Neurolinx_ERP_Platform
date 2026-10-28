package com.tech.source.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "purchase_order_items")
public class PurchaseOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    @JsonIgnore
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false)
    private BigDecimal quantityOrdered = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal quantityReceived = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(length = 20)
    private String unit;

    public PurchaseOrderItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PurchaseOrder getPurchaseOrder() { return purchaseOrder; }
    public void setPurchaseOrder(PurchaseOrder purchaseOrder) { this.purchaseOrder = purchaseOrder; }
    public Ingredient getIngredient() { return ingredient; }
    public void setIngredient(Ingredient ingredient) { this.ingredient = ingredient; }
    public BigDecimal getQuantityOrdered() { return quantityOrdered != null ? quantityOrdered : BigDecimal.ZERO; }
    public void setQuantityOrdered(BigDecimal quantityOrdered) { this.quantityOrdered = quantityOrdered; }
    public BigDecimal getQuantityReceived() { return quantityReceived != null ? quantityReceived : BigDecimal.ZERO; }
    public void setQuantityReceived(BigDecimal quantityReceived) { this.quantityReceived = quantityReceived; }
    public BigDecimal getUnitCost() { return unitCost != null ? unitCost : BigDecimal.ZERO; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public String getUnit() { return unit != null ? unit : (ingredient != null ? ingredient.getUnit() : "kg"); }
    public void setUnit(String unit) { this.unit = unit; }
}
