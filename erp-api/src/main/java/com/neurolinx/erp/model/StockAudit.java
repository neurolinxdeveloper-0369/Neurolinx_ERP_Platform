package com.neurolinx.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stock_audits")
public class StockAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String auditNumber; // e.g. AUD-2026-001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnore
    private Company company;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = true)
    private Branch branch;

    @Column(length = 100)
    private String storageZone = "All"; // "Cold Storage", "Dry Store", "Bar / Beverage", "Prep Line", "All"

    @Column(nullable = false, length = 30)
    private String status = "Draft"; // Draft, Reconciled, Cancelled

    private String auditedBy;
    private LocalDate auditDate = LocalDate.now();

    @Column(nullable = false)
    private BigDecimal totalVarianceValue = BigDecimal.ZERO;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<StockAuditItem> items = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public StockAudit() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAuditNumber() { return auditNumber; }
    public void setAuditNumber(String auditNumber) { this.auditNumber = auditNumber; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public String getStorageZone() { return storageZone != null ? storageZone : "All"; }
    public void setStorageZone(String storageZone) { this.storageZone = storageZone; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAuditedBy() { return auditedBy; }
    public void setAuditedBy(String auditedBy) { this.auditedBy = auditedBy; }
    public LocalDate getAuditDate() { return auditDate; }
    public void setAuditDate(LocalDate auditDate) { this.auditDate = auditDate; }
    public BigDecimal getTotalVarianceValue() { return totalVarianceValue != null ? totalVarianceValue : BigDecimal.ZERO; }
    public void setTotalVarianceValue(BigDecimal totalVarianceValue) { this.totalVarianceValue = totalVarianceValue; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public List<StockAuditItem> getItems() { return items != null ? items : new ArrayList<>(); }
    public void setItems(List<StockAuditItem> items) { this.items = items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
