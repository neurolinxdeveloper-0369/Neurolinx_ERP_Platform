package com.neurolinx.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "restaurant_printers")
public class RestaurantPrinter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // e.g. "Kitchen HOP-E200", "Cashier Printer"

    @Column(nullable = false)
    private String printerType; // "KOT" or "BILLING"

    private String connectionType = "BLUETOOTH"; // BLUETOOTH, USB, NETWORK
    
    // We save the bluetooth UUID or Mac address if available, or just a custom identifier
    private String deviceIdentifier; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    public RestaurantPrinter() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPrinterType() { return printerType; }
    public void setPrinterType(String printerType) { this.printerType = printerType; }
    public String getConnectionType() { return connectionType; }
    public void setConnectionType(String connectionType) { this.connectionType = connectionType; }
    public String getDeviceIdentifier() { return deviceIdentifier; }
    public void setDeviceIdentifier(String deviceIdentifier) { this.deviceIdentifier = deviceIdentifier; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
}
