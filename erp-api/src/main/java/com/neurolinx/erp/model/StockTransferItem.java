package com.neurolinx.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "stock_transfer_items")
public class StockTransferItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_id", nullable = false)
    @JsonIgnore
    private StockTransfer transfer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false)
    private BigDecimal quantityRequested = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal quantityDispatched = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal quantityReceived = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String unit = "kg";

    @Column(nullable = false)
    private BigDecimal costPerUnit = BigDecimal.ZERO;

    public StockTransferItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public StockTransfer getTransfer() { return transfer; }
    public void setTransfer(StockTransfer transfer) { this.transfer = transfer; }
    public Ingredient getIngredient() { return ingredient; }
    public void setIngredient(Ingredient ingredient) { this.ingredient = ingredient; }
    public BigDecimal getQuantityRequested() { return quantityRequested != null ? quantityRequested : BigDecimal.ZERO; }
    public void setQuantityRequested(BigDecimal quantityRequested) { this.quantityRequested = quantityRequested; }
    public BigDecimal getQuantityDispatched() { return quantityDispatched != null ? quantityDispatched : BigDecimal.ZERO; }
    public void setQuantityDispatched(BigDecimal quantityDispatched) { this.quantityDispatched = quantityDispatched; }
    public BigDecimal getQuantityReceived() { return quantityReceived != null ? quantityReceived : BigDecimal.ZERO; }
    public void setQuantityReceived(BigDecimal quantityReceived) { this.quantityReceived = quantityReceived; }
    public String getUnit() { return unit != null ? unit : "kg"; }
    public void setUnit(String unit) { this.unit = unit; }
    public BigDecimal getCostPerUnit() { return costPerUnit != null ? costPerUnit : BigDecimal.ZERO; }
    public void setCostPerUnit(BigDecimal costPerUnit) { this.costPerUnit = costPerUnit; }
}
