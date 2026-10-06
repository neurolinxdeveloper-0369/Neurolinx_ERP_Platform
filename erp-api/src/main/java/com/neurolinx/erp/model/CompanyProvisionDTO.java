package com.neurolinx.erp.model;

import java.util.List;
import java.util.Map;

public class CompanyProvisionDTO {
    private String companyName;
    private String industryType;
    private String email;
    private String password;
    
    private String logoBase64;
    private String contactNumber;
    private String address;
    private String clientName;
    private String websiteUrl;
    private Integer totalTables;
    private Integer totalFloors;

    private String gstin;
    private String panNumber;
    private String registrationNumber;
    private String foodLicense;

    private String operatingHours;
    private String serviceModel;
    private String kitchenSetup;

    private List<Map<String, String>> branches;

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getIndustryType() { return industryType; }
    public void setIndustryType(String industryType) { this.industryType = industryType; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

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

    public Integer getTotalFloors() { return totalFloors; }
    public void setTotalFloors(Integer totalFloors) { this.totalFloors = totalFloors; }

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

    public List<Map<String, String>> getBranches() { return branches; }
    public void setBranches(List<Map<String, String>> branches) { this.branches = branches; }
}
