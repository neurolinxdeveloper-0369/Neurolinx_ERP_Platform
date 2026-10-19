package com.neurolinx.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "waste_entries")
public class WasteEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnore
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = true)
    @JsonIgnore
    private Branch branch;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(length = 20)
    private String unit;

    @Column(nullable = false)
    private BigDecimal costLost = BigDecimal.ZERO;

    @Column(nullable = false)
    private String reason; // Spoilage, Spilled, Expired, Burnt, Other

    @Column(length = 100)
    private String staffName;

    private LocalDate dateRecorded;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public WasteEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Ingredient getIngredient() { return ingredient; }
    public void setIngredient(Ingredient ingredient) { this.ingredient = ingredient; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public String getUnit() { return unit != null ? unit : (ingredient != null ? ingredient.getUnit() : "kg"); }
    public void setUnit(String unit) { this.unit = unit; }
    public BigDecimal getCostLost() { return costLost != null ? costLost : BigDecimal.ZERO; }
    public void setCostLost(BigDecimal costLost) { this.costLost = costLost; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }
    public LocalDate getDateRecorded() { return dateRecorded; }
    public void setDateRecorded(LocalDate dateRecorded) { this.dateRecorded = dateRecorded; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
