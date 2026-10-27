package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.User;
import com.neurolinx.erp.model.Vendor;
import com.neurolinx.erp.repository.CompanyRepository;
import com.neurolinx.erp.repository.UserRepository;
import com.neurolinx.erp.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VendorControllerTest {

    @Mock private VendorRepository vendorRepository;
    @Mock private UserRepository userRepo;
    @Mock private CompanyRepository companyRepo;
    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

    @InjectMocks
    private VendorController vendorController;

    private Company testCompany;
    private Vendor testVendor;

    @BeforeEach
    void setUp() {
        testCompany = new Company();
        testCompany.setId(1L);
        testCompany.setName("Test Restaurant");

        testVendor = new Vendor();
        testVendor.setId(10L);
        testVendor.setName("Test Rice Supplier");
        testVendor.setCompany(testCompany);

        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getName()).thenReturn("admin@neurolinx.in");
        SecurityContextHolder.setContext(securityContext);

        User user = new User();
        user.setEmail("admin@neurolinx.in");
        user.setCompany(testCompany);
        lenient().when(userRepo.findByEmail("admin@neurolinx.in")).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("deleteVendor: Cleans up all child records (items, receipts, orders) and deletes vendor from DB")
    void testDeleteVendor_Success() {
        when(vendorRepository.findById(10L)).thenReturn(Optional.of(testVendor));

        ResponseEntity<?> response = vendorController.deleteVendor(10L);

        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("Vendor and associated records deleted successfully from database", body.get("message"));

        // Verify unlinking ingredients preferred vendor
        verify(jdbcTemplate).update(contains("UPDATE ingredients SET preferred_vendor_id = NULL"), eq(10L));

        // Verify unlinking stock batches
        verify(jdbcTemplate).update(contains("UPDATE stock_batches SET purchase_order_id = NULL"), eq(10L));

        // Verify deleting goods receipt items
        verify(jdbcTemplate).update(contains("DELETE FROM goods_receipt_items"), eq(10L), eq(10L));

        // Verify deleting goods receipts
        verify(jdbcTemplate).update(contains("DELETE FROM goods_receipts"), eq(10L), eq(10L));

        // Verify deleting purchase order items
        verify(jdbcTemplate).update(contains("DELETE FROM purchase_order_items"), eq(10L));

        // Verify deleting purchase orders
        verify(jdbcTemplate).update(contains("DELETE FROM purchase_orders WHERE vendor_id = ?"), eq(10L));

        // Verify deleting vendor entity and flushing to DB
        verify(vendorRepository).delete(testVendor);
        verify(vendorRepository).flush();
    }

    @Test
    @DisplayName("deleteVendor: Returns 404 when vendor does not exist")
    void testDeleteVendor_NotFound() {
        when(vendorRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = vendorController.deleteVendor(999L);

        assertEquals(404, response.getStatusCode().value());
        verify(vendorRepository, never()).delete(any());
        verify(jdbcTemplate, never()).update(anyString(), any(Object[].class));
    }

    @Test
    @DisplayName("deleteVendor: Returns 403 when vendor belongs to different company")
    void testDeleteVendor_Unauthorized() {
        Company otherCompany = new Company();
        otherCompany.setId(99L);
        otherCompany.setName("Other Restaurant");

        Vendor otherVendor = new Vendor();
        otherVendor.setId(20L);
        otherVendor.setCompany(otherCompany);

        when(vendorRepository.findById(20L)).thenReturn(Optional.of(otherVendor));

        ResponseEntity<?> response = vendorController.deleteVendor(20L);

        assertEquals(403, response.getStatusCode().value());
        verify(vendorRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteVendor: Handles SQL/DB exception gracefully and returns 500")
    void testDeleteVendor_ExceptionHandling() {
        when(vendorRepository.findById(10L)).thenReturn(Optional.of(testVendor));
        doThrow(new RuntimeException("DB Connection Timeout")).when(jdbcTemplate).update(contains("UPDATE ingredients"), any(Object[].class));

        ResponseEntity<?> response = vendorController.deleteVendor(10L);

        assertEquals(500, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertTrue(body.get("message").toString().contains("Failed to delete vendor"));
    }
}
