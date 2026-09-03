package com.neurolinx.erp.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "restaurant_settings")
public class RestaurantSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String storeName = "Neurolinx POS";
    private String gstNumber;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @Column(columnDefinition = "TEXT")
    private String receiptFooter = "Thank you for dining with us!";
    
    private BigDecimal defaultTaxRate = new BigDecimal("5.0");
    private BigDecimal defaultDiscount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String upiQrImageBase64;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    public RestaurantSettings() {}
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }
    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getReceiptFooter() { return receiptFooter; }
    public void setReceiptFooter(String receiptFooter) { this.receiptFooter = receiptFooter; }
    public BigDecimal getDefaultTaxRate() { return defaultTaxRate; }
    public void setDefaultTaxRate(BigDecimal defaultTaxRate) { this.defaultTaxRate = defaultTaxRate; }
    public BigDecimal getDefaultDiscount() { return defaultDiscount; }
    public void setDefaultDiscount(BigDecimal defaultDiscount) { this.defaultDiscount = defaultDiscount; }
    public String getUpiQrImageBase64() { return upiQrImageBase64; }
    public void setUpiQrImageBase64(String upiQrImageBase64) { this.upiQrImageBase64 = upiQrImageBase64; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
}
