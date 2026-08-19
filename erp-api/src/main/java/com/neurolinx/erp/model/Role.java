package com.neurolinx.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    public Role() {}

    public Role(String name, Company company) {
        this.name = name;
        this.company = company;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
}
