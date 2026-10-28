package com.tech.source.service;

import com.tech.source.model.*;
import com.tech.source.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InventoryServiceReceiveStockTest {

    @Mock private IngredientRepository ingredientRepository;
    @Mock private RecipeItemRepository recipeItemRepository;
    @Mock private StockBatchRepository stockBatchRepository;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private PurchaseOrderRepository purchaseOrderRepository;
    @Mock private PurchaseOrderItemRepository purchaseOrderItemRepository;
    @Mock private GoodsReceiptRepository goodsReceiptRepository;
    @Mock private GoodsReceiptItemRepository goodsReceiptItemRepository;
    @Mock private VendorRepository vendorRepository;

    @InjectMocks
    private InventoryService inventoryService;

    private Company testCompany;
    private Vendor testVendor;
    private Ingredient riceIngredient;
    private PurchaseOrder testPO;
    private PurchaseOrderItem poItemRice;

    @BeforeEach
    void setUp() {
        testCompany = new Company();
        testCompany.setId(1L);
        testCompany.setName("Spice Garden Restaurant");

        testVendor = new Vendor();
        testVendor.setId(10L);
        testVendor.setName("Sri Krishna Rice Mill");
        testVendor.setCompany(testCompany);

        riceIngredient = new Ingredient();
        riceIngredient.setId(101L);
        riceIngredient.setName("RICE");
        riceIngredient.setUnit("kg");
        riceIngredient.setStockLevel(new BigDecimal("50.0"));
        riceIngredient.setCostPerUnit(new BigDecimal("50.0"));
        riceIngredient.setCompany(testCompany);

        testPO = new PurchaseOrder();
        testPO.setId(201L);
        testPO.setPoNumber("PO-20261027");
        testPO.setCompany(testCompany);
        testPO.setVendor(testVendor);
        testPO.setStatus("Ordered");

        poItemRice = new PurchaseOrderItem();
        poItemRice.setId(301L);
        poItemRice.setPurchaseOrder(testPO);
        poItemRice.setIngredient(riceIngredient);
        poItemRice.setQuantityOrdered(new BigDecimal("20.0"));
        poItemRice.setQuantityReceived(BigDecimal.ZERO);
        poItemRice.setUnitCost(new BigDecimal("50.0"));
        poItemRice.setUnit("kg");

        List<PurchaseOrderItem> items = new ArrayList<>();
        items.add(poItemRice);
        testPO.setItems(items);
        testPO.setTotalAmount(new BigDecimal("1000.0"));
    }

    @Test
    @DisplayName("Validation: Missing Invoice Number must throw IllegalArgumentException")
    void testReceiveStock_MissingInvoice_ThrowsException() {
        Map<String, Object> itemData = Map.of(
                "ingredientId", 101L,
                "quantity", "10",
                "costPerUnit", "50",
                "unit", "kg"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryService.receiveStock(testPO, "", LocalDate.now(), LocalDate.now(), BigDecimal.ZERO, List.of(itemData), "admin")
        );
        assertTrue(ex.getMessage().contains("Invoice number is required"));
    }

    @Test
    @DisplayName("Idempotency: Duplicate Invoice Number for same PO must be rejected")
    void testReceiveStock_DuplicateInvoice_Rejected() {
        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "INV-9999"))
                .thenReturn(true);

        Map<String, Object> itemData = Map.of(
                "ingredientId", 101L,
                "quantity", "10",
                "costPerUnit", "50",
                "unit", "kg"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryService.receiveStock(testPO, "INV-9999", LocalDate.now(), LocalDate.now(), BigDecimal.ZERO, List.of(itemData), "admin")
        );
        assertTrue(ex.getMessage().contains("already been processed"));
        verify(ingredientRepository, never()).save(any());
    }

    @Test
    @DisplayName("Validation: Receiving Quantity Exceeding Remaining Ordered Quantity must be rejected")
    void testReceiveStock_ExceedingQuantity_Rejected() {
        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "INV-001"))
                .thenReturn(false);
        when(ingredientRepository.findById(101L)).thenReturn(Optional.of(riceIngredient));

        // Remaining is 20 kg, attempting to receive 25 kg
        Map<String, Object> itemData = Map.of(
                "ingredientId", 101L,
                "quantity", "25",
                "costPerUnit", "50",
                "unit", "kg"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryService.receiveStock(testPO, "INV-001", LocalDate.now(), LocalDate.now(), BigDecimal.ZERO, List.of(itemData), "admin")
        );
        assertTrue(ex.getMessage().contains("exceeds the remaining ordered quantity"));
        verify(ingredientRepository, never()).save(any());
    }

    @Test
    @DisplayName("Step 4 & 5: Partial Delivery correctly inwarded, PO marked Partially Received")
    void testReceiveStock_PartialDelivery_Success() {
        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "INV-PART-01"))
                .thenReturn(false);
        when(ingredientRepository.findById(101L)).thenReturn(Optional.of(riceIngredient));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(invocation -> {
            GoodsReceipt gr = invocation.getArgument(0);
            gr.setId(501L);
            return gr;
        });

        // Receive 8 kg out of 20 kg
        Map<String, Object> itemData = Map.of(
                "ingredientId", 101L,
                "quantity", "8.0",
                "costPerUnit", "50.0",
                "unit", "kg"
        );

        Map<String, Object> result = inventoryService.receiveStock(
                testPO,
                "INV-PART-01",
                LocalDate.now(),
                LocalDate.now(),
                new BigDecimal("400.0"),
                List.of(itemData),
                "Chef Ramesh"
        );

        assertNotNull(result);
        assertEquals("Partially Received", result.get("status"));
        assertEquals("Partially Received", testPO.getStatus());
        assertEquals(new BigDecimal("8.0"), poItemRice.getQuantityReceived());

        // Stock must increase by exactly 8.0 kg (from 50.0 to 58.0)
        assertEquals(new BigDecimal("58.0"), riceIngredient.getStockLevel());
        verify(ingredientRepository).save(riceIngredient);

        // FIFO batch created for 8.0 kg
        verify(stockBatchRepository).save(argThat(batch ->
                batch.getInitialQuantity().compareTo(new BigDecimal("8.0")) == 0 &&
                batch.getIngredient().getId().equals(101L)
        ));

        // Auditable movement recorded
        verify(stockMovementRepository).save(argThat(movement ->
                "PURCHASE_RECEIPT".equals(movement.getMovementType()) &&
                movement.getQuantity().compareTo(new BigDecimal("8.0")) == 0
        ));

        // GoodsReceipt persisted
        verify(goodsReceiptRepository).save(any(GoodsReceipt.class));
    }

    @Test
    @DisplayName("Step 4 & 5: Full Delivery completes the PO, marked Received")
    void testReceiveStock_FullDelivery_Success() {
        // First delivery: already received 8 kg
        poItemRice.setQuantityReceived(new BigDecimal("8.0"));
        riceIngredient.setStockLevel(new BigDecimal("58.0"));

        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "INV-FULL-02"))
                .thenReturn(false);
        when(ingredientRepository.findById(101L)).thenReturn(Optional.of(riceIngredient));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(invocation -> {
            GoodsReceipt gr = invocation.getArgument(0);
            gr.setId(502L);
            return gr;
        });

        // Inward remaining 12 kg
        Map<String, Object> itemData = Map.of(
                "ingredientId", 101L,
                "quantity", "12.0",
                "costPerUnit", "50.0",
                "unit", "kg"
        );

        Map<String, Object> result = inventoryService.receiveStock(
                testPO,
                "INV-FULL-02",
                LocalDate.now(),
                LocalDate.now(),
                new BigDecimal("600.0"),
                List.of(itemData),
                "Chef Ramesh"
        );

        assertNotNull(result);
        assertEquals("Received", result.get("status"));
        assertEquals("Received", testPO.getStatus());
        assertEquals(new BigDecimal("20.0"), poItemRice.getQuantityReceived());

        // Stock increases from 58.0 to 70.0 (+12.0 kg)
        assertEquals(new BigDecimal("70.0"), riceIngredient.getStockLevel());
        verify(ingredientRepository).save(riceIngredient);
    }

    @Test
    @DisplayName("Payment: Full payment marks GoodsReceipt Paid with 0 remaining balance")
    void testReceiveStock_Payment_FullPaid() {
        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "INV-PAY-01"))
                .thenReturn(false);
        when(ingredientRepository.findById(101L)).thenReturn(Optional.of(riceIngredient));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(invocation -> {
            GoodsReceipt gr = invocation.getArgument(0);
            gr.setId(503L);
            return gr;
        });

        // Receive 20 kg at 50/kg = 1000 total, pay 1000 via UPI
        Map<String, Object> itemData = Map.of(
                "ingredientId", 101L,
                "quantity", "20.0",
                "costPerUnit", "50.0",
                "unit", "kg"
        );

        Map<String, Object> result = inventoryService.receiveStock(
                testPO,
                "INV-PAY-01",
                LocalDate.now(),
                LocalDate.now(),
                new BigDecimal("1000.0"),
                "UPI",
                "UPI-REF-12345",
                LocalDate.now(),
                List.of(itemData),
                "Chef Ramesh"
        );

        assertNotNull(result);
        assertEquals("Paid", result.get("paymentStatus"));
        assertEquals("UPI", result.get("paymentMethod"));
        assertEquals(0, ((BigDecimal) result.get("amountPaid")).compareTo(new BigDecimal("1000.0")));
        assertEquals(0, ((BigDecimal) result.get("remainingBalance")).compareTo(BigDecimal.ZERO));
        verify(goodsReceiptRepository).save(argThat(gr ->
                "Paid".equals(gr.getPaymentStatus()) &&
                "UPI".equals(gr.getPaymentMethod()) &&
                gr.getRemainingBalance().compareTo(BigDecimal.ZERO) == 0
        ));
    }

    @Test
    @DisplayName("Payment: Partial payment updates vendor balance and marks Partially Paid")
    void testReceiveStock_Payment_PartialPayment_UpdatesVendorBalance() {
        testVendor.setBalance(new BigDecimal("200.0"));

        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "INV-PART-PAY"))
                .thenReturn(false);
        when(ingredientRepository.findById(101L)).thenReturn(Optional.of(riceIngredient));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(invocation -> {
            GoodsReceipt gr = invocation.getArgument(0);
            gr.setId(504L);
            return gr;
        });

        // Total 20 kg * 50 = 1000. Pay 400. Remaining balance = 600.
        Map<String, Object> itemData = Map.of(
                "ingredientId", 101L,
                "quantity", "20.0",
                "costPerUnit", "50.0",
                "unit", "kg"
        );

        Map<String, Object> result = inventoryService.receiveStock(
                testPO,
                "INV-PART-PAY",
                LocalDate.now(),
                LocalDate.now(),
                new BigDecimal("400.0"),
                "Card",
                "TXN-CARD-99",
                LocalDate.now(),
                List.of(itemData),
                "Chef Ramesh"
        );

        assertNotNull(result);
        assertEquals("Partially Paid", result.get("paymentStatus"));
        assertEquals("Card", result.get("paymentMethod"));
        assertEquals(0, ((BigDecimal) result.get("amountPaid")).compareTo(new BigDecimal("400.0")));
        assertEquals(0, ((BigDecimal) result.get("remainingBalance")).compareTo(new BigDecimal("600.0")));

        // Vendor balance updated: 200 + 600 = 800
        assertEquals(0, testVendor.getBalance().compareTo(new BigDecimal("800.0")));
        verify(vendorRepository).save(testVendor);
    }

    @Test
    @DisplayName("Payment Validation: Paying more than inward amount throws IllegalArgumentException")
    void testReceiveStock_Payment_ExceedingAmount_ThrowsException() {
        when(goodsReceiptRepository.existsByPurchaseOrderAndInvoiceNumberIgnoreCase(testPO, "INV-EXCEED"))
                .thenReturn(false);
        when(ingredientRepository.findById(101L)).thenReturn(Optional.of(riceIngredient));

        // Inward 10 kg * 50 = 500 total, but attempt to pay 600
        Map<String, Object> itemData = Map.of(
                "ingredientId", 101L,
                "quantity", "10.0",
                "costPerUnit", "50.0",
                "unit", "kg"
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryService.receiveStock(
                        testPO,
                        "INV-EXCEED",
                        LocalDate.now(),
                        LocalDate.now(),
                        new BigDecimal("600.0"),
                        "Cash",
                        null,
                        LocalDate.now(),
                        List.of(itemData),
                        "Chef Ramesh"
                )
        );
        assertTrue(ex.getMessage().contains("cannot exceed total inward purchase amount"));
    }
}
