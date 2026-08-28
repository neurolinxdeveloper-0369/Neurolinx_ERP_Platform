package com.neurolinx.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "companies")
public class Company {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String industryType;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(columnDefinition = "TEXT")
    private String logoBase64;

    private String contactNumber;

    private String address;

    private String clientName;
    
    private String websiteUrl;
    
    private Integer totalTables;

    @Column(columnDefinition = "boolean default false")
    private Boolean bypassDeviceLimit = false;

    public Company() {}

    public Company(String name, String industryType) {
        this.name = name;
        this.industryType = industryType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getIndustryType() { return industryType; }
    public void setIndustryType(String industryType) { this.industryType = industryType; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public String getLogoBase64() { return logoBase64; }
    public void setLogoBase64(String logoBase64) { this.logoBase64 = logoBase64; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }

    public Integer getTotalTables() { return totalTables; }
    public void setTotalTables(Integer totalTables) { this.totalTables = totalTables; }

    public Boolean getBypassDeviceLimit() { return bypassDeviceLimit; }
    public void setBypassDeviceLimit(Boolean bypassDeviceLimit) { this.bypassDeviceLimit = bypassDeviceLimit; }
}
