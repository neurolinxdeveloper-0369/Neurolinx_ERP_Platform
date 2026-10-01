# Phase 2 Implementation Plan: Restaurant ERP

This document outlines the systematic implementation of Phase 2 features based on the approved scope.

## 1. Raw Materials & Vendors (Procurement)
- [ ] **Backend Entities**: Create `Vendor.java` and `PurchaseOrder.java` (with `PurchaseOrderItem`).
- [ ] **Backend Controllers**: Build `VendorController.java` and `PurchaseOrderController.java`.
- [ ] **Frontend**: Build `/res-vendors` screen (Supplier list, adding vendors).
- [ ] **Frontend**: Build Purchase Order workflow (Stock intake, payments).

## 2. Recipe & Cost Management
- [ ] **Backend**: Use existing `RecipeItem.java` but link it to Dishes and Ingredients properly with costs.
- [ ] **Frontend**: Build `/res-recipes` screen (Recipe creation, ingredient mapping).
- [ ] **Logic**: Implement auto-deduction of ingredients when a `CustomerOrder` is completed.
- [ ] **Logic**: Calculate food cost percentage and margin reporting.

## 3. Waste Management
- [ ] **Backend**: Create `WasteEntry.java` (Item, Quantity, Reason Code, Cost).
- [ ] **Frontend**: Build `/res-waste` screen (Waste entry form, daily summary, spoilage tracking).

## 4. Staff & Shift Module
- [ ] **Backend**: Create `Staff.java`, `Shift.java`, and `Attendance.java`.
- [ ] **Frontend**: Build `/res-staff` screen (Employee list, roles, shift assignment).

## 5. Analytics
- [ ] **Backend**: Enhance `RestaurantController.java` to return deep analytics (sales by time, category performance).
- [ ] **Frontend**: Build `/res-analytics` screen to visualize the data.

## 6. Printer and Kitchen Workflow
- [ ] **Backend/Frontend**: Enhance `Orders.tsx` to handle KOT queue, Kitchen display, and structured receipt printing.
