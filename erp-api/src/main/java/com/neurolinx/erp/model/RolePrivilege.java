package com.neurolinx.erp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "role_privileges")
public class RolePrivilege {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(nullable = false)
    private Boolean canRead = true;

    @Column(nullable = false)
    private Boolean canWrite = false;

    @Column(nullable = false)
    private Boolean canDelete = false;

    public RolePrivilege() {}

    public RolePrivilege(Role role, MenuItem menuItem, Boolean canRead, Boolean canWrite, Boolean canDelete) {
        this.role = role;
        this.menuItem = menuItem;
        this.canRead = canRead;
        this.canWrite = canWrite;
        this.canDelete = canDelete;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public MenuItem getMenuItem() { return menuItem; }
    public void setMenuItem(MenuItem menuItem) { this.menuItem = menuItem; }

    public Boolean getCanRead() { return canRead; }
    public void setCanRead(Boolean canRead) { this.canRead = canRead; }

    public Boolean getCanWrite() { return canWrite; }
    public void setCanWrite(Boolean canWrite) { this.canWrite = canWrite; }

    public Boolean getCanDelete() { return canDelete; }
    public void setCanDelete(Boolean canDelete) { this.canDelete = canDelete; }
}
