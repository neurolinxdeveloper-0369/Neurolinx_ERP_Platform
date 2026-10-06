package com.neurolinx.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "companies")
public class Company {
    private String subdomain;
    public String getSubdomain() { return subdomain; }
    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }
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

    private String gstin;
    private String panNumber;
    private String registrationNumber;
    private String foodLicense;

    private String operatingHours;
    private String serviceModel;
    private String kitchenSetup;

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

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
    
    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }
    
    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getFoodLicense() { return foodLicense; }
    public void setFoodLicense(String foodLicense) { this.foodLicense = foodLicense; }

    public String getOperatingHours() { return operatingHours; }
    public void setOperatingHours(String operatingHours) { this.operatingHours = operatingHours; }

    public String getServiceModel() { return serviceModel; }
    public void setServiceModel(String serviceModel) { this.serviceModel = serviceModel; }

    public String getKitchenSetup() { return kitchenSetup; }
    public void setKitchenSetup(String kitchenSetup) { this.kitchenSetup = kitchenSetup; }

    public Boolean getBypassDeviceLimit() { return bypassDeviceLimit; }
    public void setBypassDeviceLimit(Boolean bypassDeviceLimit) { this.bypassDeviceLimit = bypassDeviceLimit; }
}
