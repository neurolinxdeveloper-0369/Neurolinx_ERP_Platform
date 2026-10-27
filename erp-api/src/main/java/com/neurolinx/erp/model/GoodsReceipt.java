package com.neurolinx.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "goods_receipts")
public class GoodsReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String receiptNumber; // e.g. GRN-1730000000

    @Column(nullable = false, length = 100)
    private String invoiceNumber;

    private LocalDate invoiceDate;

    private LocalDate receiptDate;

    @Column(nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal remainingBalance = BigDecimal.ZERO;

    @Column(length = 50)
    private String paymentStatus = "Unpaid"; // Paid, Partially Paid, Unpaid

    @Column(length = 50)
    private String paymentMethod = "CASH"; // UPI, CASH, CARD, NET_BANKING, BANK_TRANSFER, CREDIT

    @Column(length = 100)
    private String paymentReference;

    private LocalDate paymentDate;

    @Column(length = 50)
    private String status = "Completed"; // Completed, Partially Received

    @Column(length = 500)
    private String notes;

    @Column(length = 100)
    private String receivedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnore
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = true)
    @JsonIgnore
    private Branch branch;

    @OneToMany(mappedBy = "goodsReceipt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<GoodsReceiptItem> items = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public GoodsReceipt() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate invoiceDate) { this.invoiceDate = invoiceDate; }

    public LocalDate getReceiptDate() { return receiptDate; }
    public void setReceiptDate(LocalDate receiptDate) { this.receiptDate = receiptDate; }

    public BigDecimal getTotalAmount() { return totalAmount != null ? totalAmount : BigDecimal.ZERO; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getAmountPaid() { return amountPaid != null ? amountPaid : BigDecimal.ZERO; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

    public BigDecimal getRemainingBalance() { return remainingBalance != null ? remainingBalance : BigDecimal.ZERO; }
    public void setRemainingBalance(BigDecimal remainingBalance) { this.remainingBalance = remainingBalance; }

    public String getPaymentStatus() { return paymentStatus != null ? paymentStatus : "Unpaid"; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod != null ? paymentMethod : "CASH"; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }

    public String getStatus() { return status != null ? status : "Completed"; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getReceivedBy() { return receivedBy; }
    public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }

    public PurchaseOrder getPurchaseOrder() { return purchaseOrder; }
    public void setPurchaseOrder(PurchaseOrder purchaseOrder) { this.purchaseOrder = purchaseOrder; }

    public Vendor getVendor() { return vendor; }
    public void setVendor(Vendor vendor) { this.vendor = vendor; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public List<GoodsReceiptItem> getItems() { return items != null ? items : new ArrayList<>(); }
    public void setItems(List<GoodsReceiptItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
