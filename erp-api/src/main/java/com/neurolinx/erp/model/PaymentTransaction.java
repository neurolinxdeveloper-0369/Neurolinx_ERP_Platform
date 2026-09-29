package com.neurolinx.erp.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder order;

    @Column(nullable = false)
    private String gateway; // e.g. "STRIPE", "RAZORPAY", "CASH"

    private String transactionId; // Gateway transaction ID

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, COMPLETED, FAILED, REFUNDED

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public PaymentTransaction() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CustomerOrder getOrder() { return order; }
    public void setOrder(CustomerOrder order) { this.order = order; }
    public String getGateway() { return gateway; }
    public void setGateway(String gateway) { this.gateway = gateway; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
