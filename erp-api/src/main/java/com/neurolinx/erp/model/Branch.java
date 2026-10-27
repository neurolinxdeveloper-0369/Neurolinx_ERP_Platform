package com.neurolinx.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "branches")
public class Branch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnore
    private Company company;

    @Column(nullable = false)
    private String name;

    private String location;
    private String contactNumber;
    private String email;

    @Column(nullable = false)
    private Boolean isActive = true;

    private String swiggyOutletId;
    private String zomatoRestaurantId;
    private String urbanpiperStoreId;
    private String urbanpiperApiKey;
    private String urbanpiperUsername;
    private Boolean autoAcceptOrders = true;
    private Boolean onlineOrderingActive = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Branch() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getSwiggyOutletId() { return swiggyOutletId; }
    public void setSwiggyOutletId(String swiggyOutletId) { this.swiggyOutletId = swiggyOutletId; }
    public String getZomatoRestaurantId() { return zomatoRestaurantId; }
    public void setZomatoRestaurantId(String zomatoRestaurantId) { this.zomatoRestaurantId = zomatoRestaurantId; }
    public String getUrbanpiperStoreId() { return urbanpiperStoreId; }
    public void setUrbanpiperStoreId(String urbanpiperStoreId) { this.urbanpiperStoreId = urbanpiperStoreId; }
    public Boolean getAutoAcceptOrders() { return autoAcceptOrders; }
    public void setAutoAcceptOrders(Boolean autoAcceptOrders) { this.autoAcceptOrders = autoAcceptOrders; }
    public Boolean getOnlineOrderingActive() { return onlineOrderingActive; }
    public void setOnlineOrderingActive(Boolean onlineOrderingActive) { this.onlineOrderingActive = onlineOrderingActive; }
    public String getUrbanpiperApiKey() { return urbanpiperApiKey; }
    public void setUrbanpiperApiKey(String urbanpiperApiKey) { this.urbanpiperApiKey = urbanpiperApiKey; }
    public String getUrbanpiperUsername() { return urbanpiperUsername; }
    public void setUrbanpiperUsername(String urbanpiperUsername) { this.urbanpiperUsername = urbanpiperUsername; }
}