package com.neurolinx.erp.model;

public class CompanyProvisionDTO {
    private String companyName;
    private String industryType;
    private String email;
    private String password;
    
    private String logoBase64;
    private String contactNumber;
    private String address;

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
}
