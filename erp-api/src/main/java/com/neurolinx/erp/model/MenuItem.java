package com.neurolinx.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "menu_items")
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String frontendRoute;

    private String icon;

    // Master kill switch. If false, no one sees this menu, regardless of their role.
    @Column(nullable = false)
    private Boolean isMasterEnabled = true;

    public MenuItem() {}

    public MenuItem(String name, String frontendRoute, String icon) {
        this.name = name;
        this.frontendRoute = frontendRoute;
        this.icon = icon;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getFrontendRoute() { return frontendRoute; }
    public void setFrontendRoute(String frontendRoute) { this.frontendRoute = frontendRoute; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public Boolean getIsMasterEnabled() { return isMasterEnabled; }
    public void setIsMasterEnabled(Boolean masterEnabled) { isMasterEnabled = masterEnabled; }
}
