package com.neurolinx.erp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import com.neurolinx.erp.service.InventoryService;
import com.neurolinx.erp.service.InvoiceParserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InvoiceVerificationTest {

    @Mock private PurchaseOrderRepository purchaseOrderRepository;
    @Mock private PurchaseOrderItemRepository purchaseOrderItemRepository;
    @Mock private VendorRepository vendorRepository;
    @Mock private IngredientRepository ingredientRepository;
    @Mock private GoodsReceiptRepository goodsReceiptRepository;
    @Mock private UserRepository userRepo;
    @Mock private CompanyRepository companyRepo;
    @Mock private InventoryService inventoryService;
    @Mock private InvoiceParserService invoiceParserService;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

    @InjectMocks
    private PurchaseController purchaseController;

    private Company testCompany;
    private Vendor testVendor;
    private PurchaseOrder testPO;
    private Ingredient riceIngredient;

    @BeforeEach
    void setUp() {
        testCompany = new Company();
        testCompany.setId(1L);
        testCompany.setName("Spice Garden Restaurant");

        testVendor = new Vendor();
        testVendor.setId(10L);
        testVendor.setName("Geddit Convenience Private Limited");
        testVendor.setCompany(testCompany);

        testPO = new PurchaseOrder();
        testPO.setId(201L);
        testPO.setPoNumber("PO-601674");
        testPO.setCompany(testCompany);
        testPO.setVendor(testVendor);
        testPO.setStatus("Ordered");
        testPO.setInvoiceNumber("261036G002900941");
        testPO.setTotalAmount(new BigDecimal("243.00"));

        riceIngredient = new Ingredient();
        riceIngredient.setId(101L);
        riceIngredient.setName("RICE");
        riceIngredient.setCompany(testCompany);

        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getName()).thenReturn("admin@neurolinx.in");
        SecurityContextHolder.setContext(securityContext);

        User mockUser = new User();
        mockUser.setEmail("admin@neurolinx.in");
        mockUser.setCompany(testCompany);
        lenient().when(userRepo.findByEmail("admin@neurolinx.in")).thenReturn(Optional.of(mockUser));
        lenient().when(companyRepo.findAll()).thenReturn(List.of(testCompany));
    }

    @Test
    @DisplayName("Validation: Reject fake / invalid invoice number (e.g. ##$sdf)")
    void testVerifyInvoice_InvalidInvoice_Rejected() {
        when(purchaseOrderRepository.findById(201L)).thenReturn(Optional.of(testPO));
        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "##$sdf")).thenReturn(false);

        Map<String, Object> payload = Map.of(
                "invoiceNumber", "##$sdf",
                "vendorId", 10L
        );

        ResponseEntity<?> res = purchaseController.verifyInvoice(201L, payload);
        assertEquals(200, res.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertNotNull(body);
        assertEquals(false, body.get("verified"));
        assertEquals("INVALID", body.get("status"));
        assertTrue(body.get("message").toString().contains("does not match"));
    }

    @Test
    @DisplayName("Validation: Reject Vendor mismatch")
    void testVerifyInvoice_VendorMismatch_Rejected() {
        when(purchaseOrderRepository.findById(201L)).thenReturn(Optional.of(testPO));

        // Vendor ID 99 instead of 10
        Map<String, Object> payload = Map.of(
                "invoiceNumber", "261036G002900941",
                "vendorId", 99L
        );

        ResponseEntity<?> res = purchaseController.verifyInvoice(201L, payload);
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertNotNull(body);
        assertEquals(false, body.get("verified"));
        assertEquals("VENDOR_MISMATCH", body.get("status"));
        assertTrue(body.get("message").toString().contains("Vendor Mismatch"));
    }

    @Test
    @DisplayName("Validation: Reject Duplicate invoice")
    void testVerifyInvoice_DuplicateInvoice_Rejected() {
        when(purchaseOrderRepository.findById(201L)).thenReturn(Optional.of(testPO));
        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "261036G002900941")).thenReturn(true);

        Map<String, Object> payload = Map.of(
                "invoiceNumber", "261036G002900941",
                "vendorId", 10L
        );

        ResponseEntity<?> res = purchaseController.verifyInvoice(201L, payload);
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertNotNull(body);
        assertEquals(false, body.get("verified"));
        assertEquals("DUPLICATE", body.get("status"));
        assertTrue(body.get("message").toString().contains("Duplicate Invoice Detected"));
    }

    @Test
    @DisplayName("Success: Verify matching supplier invoice against original invoice data")
    void testVerifyInvoice_ValidInvoice_Verified() throws Exception {
        when(purchaseOrderRepository.findById(201L)).thenReturn(Optional.of(testPO));
        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "261036G002900941")).thenReturn(false);
        when(invoiceParserService.isVendorMatch(any(), any(), any())).thenReturn(true);

        // Attached invoice data for Zepto sample
        Map<String, Object> invoiceData = new LinkedHashMap<>();
        invoiceData.put("invoiceNumber", "261036G002900941");
        invoiceData.put("invoiceDate", "2026-10-09");
        invoiceData.put("vendorName", "Geddit Convenience Private Limited (Zepto)");
        invoiceData.put("vendorGstin", "36AAJCG0980D1ZP");
        invoiceData.put("taxableAmount", 210.48);
        invoiceData.put("taxAmount", 32.52);
        invoiceData.put("invoiceTotal", 243.00);

        List<Map<String, Object>> items = List.of(
                Map.of("itemCode", "22021010", "description", "Thums Up Cola 2.25L", "quantity", 1, "lineTotal", 88.00)
        );
        invoiceData.put("items", items);

        testPO.setInvoiceData(new ObjectMapper().writeValueAsString(invoiceData));

        when(invoiceParserService.reconcileWithPO(any(), eq(testPO), any())).thenReturn(items);

        Map<String, Object> payload = Map.of(
                "invoiceNumber", "261036G002900941",
                "vendorId", 10L
        );

        ResponseEntity<?> res = purchaseController.verifyInvoice(201L, payload);
        assertEquals(200, res.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("verified"));
        assertEquals("VERIFIED", body.get("status"));
        assertEquals("261036G002900941", body.get("invoiceNumber"));
        assertNotNull(body.get("items"));
    }

    @Test
    @DisplayName("Validation: Reject when invoice supplier does not match PO vendor")
    void testVerifyInvoice_InvoiceSupplierMismatch_Rejected() throws Exception {
        when(purchaseOrderRepository.findById(201L)).thenReturn(Optional.of(testPO));
        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "261036G002900941")).thenReturn(false);
        when(invoiceParserService.isVendorMatch(any(), any(), any())).thenReturn(false);

        Map<String, Object> invoiceData = new LinkedHashMap<>();
        invoiceData.put("invoiceNumber", "261036G002900941");
        invoiceData.put("vendorName", "Sri Krishna Rice Mill & Agro Traders");
        testPO.setInvoiceData(new ObjectMapper().writeValueAsString(invoiceData));

        Map<String, Object> payload = Map.of(
                "invoiceNumber", "261036G002900941",
                "vendorId", 10L
        );

        ResponseEntity<?> res = purchaseController.verifyInvoice(201L, payload);
        assertEquals(200, res.getStatusCode().value());
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertNotNull(body);
        assertEquals(false, body.get("verified"));
        assertEquals("VENDOR_MISMATCH", body.get("status"));
        assertTrue(body.get("message").toString().contains("Vendor Mismatch"));
    }
}
