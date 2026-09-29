package com.neurolinx.erp.multitenancy;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class CurrentTenantResolver implements CurrentTenantIdentifierResolver {

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant != null) {
            return tenant;
        }
        return "public"; // Default schema
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
