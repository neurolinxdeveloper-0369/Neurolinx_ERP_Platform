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
}
