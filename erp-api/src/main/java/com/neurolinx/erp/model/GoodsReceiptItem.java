package com.neurolinx.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "goods_receipt_items")
public class GoodsReceiptItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goods_receipt_id", nullable = false)
    @JsonIgnore
    private GoodsReceipt goodsReceipt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false)
    private BigDecimal quantityOrdered = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal quantityPreviouslyReceived = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal quantityReceived = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal quantityRemaining = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Column(length = 20)
    private String unit;

    private LocalDate expiryDate;

    public GoodsReceiptItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public GoodsReceipt getGoodsReceipt() { return goodsReceipt; }
    public void setGoodsReceipt(GoodsReceipt goodsReceipt) { this.goodsReceipt = goodsReceipt; }

    public Ingredient getIngredient() { return ingredient; }
    public void setIngredient(Ingredient ingredient) { this.ingredient = ingredient; }

    public BigDecimal getQuantityOrdered() { return quantityOrdered != null ? quantityOrdered : BigDecimal.ZERO; }
    public void setQuantityOrdered(BigDecimal quantityOrdered) { this.quantityOrdered = quantityOrdered; }

    public BigDecimal getQuantityPreviouslyReceived() { return quantityPreviouslyReceived != null ? quantityPreviouslyReceived : BigDecimal.ZERO; }
    public void setQuantityPreviouslyReceived(BigDecimal quantityPreviouslyReceived) { this.quantityPreviouslyReceived = quantityPreviouslyReceived; }

    public BigDecimal getQuantityReceived() { return quantityReceived != null ? quantityReceived : BigDecimal.ZERO; }
    public void setQuantityReceived(BigDecimal quantityReceived) { this.quantityReceived = quantityReceived; }

    public BigDecimal getQuantityRemaining() { return quantityRemaining != null ? quantityRemaining : BigDecimal.ZERO; }
    public void setQuantityRemaining(BigDecimal quantityRemaining) { this.quantityRemaining = quantityRemaining; }

    public BigDecimal getUnitCost() { return unitCost != null ? unitCost : BigDecimal.ZERO; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

    public BigDecimal getTotalCost() { return totalCost != null ? totalCost : BigDecimal.ZERO; }
    public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }

    public String getUnit() { return unit != null ? unit : (ingredient != null ? ingredient.getUnit() : "kg"); }
    public void setUnit(String unit) { this.unit = unit; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
}
