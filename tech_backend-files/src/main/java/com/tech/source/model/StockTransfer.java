package com.tech.source.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stock_transfers")
public class StockTransfer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String transferNumber; // e.g. ITO-2026-001

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_branch_id", nullable = true)
    private Branch sourceBranch; // null represents Central Commissary

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_branch_id", nullable = false)
    private Branch destinationBranch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnore
    private Company company;

    @Column(nullable = false, length = 30)
    private String status = "Draft"; // Draft, Pending Approval, Dispatched (In-Transit), Received, Cancelled

    @Column(length = 500)
    private String notes;

    private String dispatchedBy;
    private LocalDateTime dispatchedAt;

    private String receivedBy;
    private LocalDateTime receivedAt;

    @OneToMany(mappedBy = "transfer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<StockTransferItem> items = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public StockTransfer() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTransferNumber() { return transferNumber; }
    public void setTransferNumber(String transferNumber) { this.transferNumber = transferNumber; }
    public Branch getSourceBranch() { return sourceBranch; }
    public void setSourceBranch(Branch sourceBranch) { this.sourceBranch = sourceBranch; }
    public Branch getDestinationBranch() { return destinationBranch; }
    public void setDestinationBranch(Branch destinationBranch) { this.destinationBranch = destinationBranch; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getDispatchedBy() { return dispatchedBy; }
    public void setDispatchedBy(String dispatchedBy) { this.dispatchedBy = dispatchedBy; }
    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }
    public String getReceivedBy() { return receivedBy; }
    public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }
    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }
    public List<StockTransferItem> getItems() { return items != null ? items : new ArrayList<>(); }
    public void setItems(List<StockTransferItem> items) { this.items = items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
