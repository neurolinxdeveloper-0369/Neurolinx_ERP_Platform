# Complete Inventory Workflow Test & Trace Log
*Generated At:* 2026-10-26T17:03:50.708Z
*Target Environment:* https://erp-api.neurolinx.in

## Step 0: Authentication (Master Admin / Client Session)
- **Status:** 200
- **Auth Result:** Successful login as neurolinxdeveloper@gmail.com (Master Admin)

## Step 1: Add a Vendor (Vendor Management)
*Culture Data:* Indian Grain & Rice Wholesaler ("Sri Krishna Rice Mill & Agro Traders")
- **POST /api/inventory/vendors Status:** 200
- **Response:** ```json
{
  "address": "Plot 42, Miryalaguda Rice Complex, Nalgonda, Telangana",
  "balance": 0,
  "contactPerson": "Sita Rama Rao",
  "createdAt": "2026-10-26T17:03:52.333176738",
  "email": "srikrishna.ricemill@gmail.com",
  "gstNumber": "36AAAAA0000A1Z5",
  "id": 4,
  "name": "Sri Krishna Rice Mill & Agro Traders",
  "phone": "9848022338"
}
```
- **Vendor Created ID:** 4
- **GET /api/inventory/vendors Status (Refresh Check):** 200
- **Pass Condition:** PASS. Vendor "Sri Krishna Rice Mill & Agro Traders" is persistently stored and retrievable.

## Preparation: Verify / Create Raw Material (RICE)
- **Target Ingredient:** ID: 3, Name: "RICE", Current Stock: 160 kg, Cost: ₹20

## Step 2: Create a Purchase Order
- Ordered: 20 kg of RICE at ₹50 per kg
- Expected Total PO Cost: 20 * ₹50 = ₹1,000
- **POST /api/inventory/purchases Status:** 200
- **Response:** ```json
{
  "amountPaid": 0,
  "createdAt": "2026-10-26T17:03:52.845658732",
  "expectedDeliveryDate": "2026-10-27",
  "id": 7,
  "invoiceDate": "2026-10-26",
  "invoiceNumber": "INV-PO-231911",
  "items": [
    {
      "id": 3,
      "ingredient": {
        "costPerUnit": 20,
        "id": 3,
        "name": "RICE",
        "reorderLevel": 0,
        "stockLevel": 160,
        "unit": "kg"
      },
      "quantityOrdered": 20,
      "quantityReceived": 0,
      "unit": "kg",
      "unitCost": 50
    }
  ],
  "notes": "Test PO: 20kg Basmati Rice for restaurant daily biryani & jeera rice prep",
  "poNumber": "PO-231911",
  "status": "Ordered",
  "totalAmount": 1000,
  "vendor": {
    "address": "Plot 42, Miryalaguda Rice Complex, Nalgonda, Telangana",
    "balance": 0,
    "contactPerson": "Sita Rama Rao",
    "createdAt": "2026-10-26T17:03:52.333177",
    "email": "srikrishna.ricemill@gmail.com",
    "gstNumber": "36AAAAA0000A1Z5",
    "id": 4,
    "name": "Sri Krishna Rice Mill & Agro Traders",
    "phone": "9848022338"
  }
}
```
- **Created PO ID:** 7, PO Number: PO-231911, Total: ₹1000
- **Stock Level after PO creation:** 160 kg (Initial was 160)
- **Pass Condition:** PASS. Stock did NOT increase on PO creation.

## Step 3: Receive the Stock (Goods Receipt Inward)
- Invoice Number: TEST-INV-001
- Received Quantity: 20 kg at ₹50/kg
- **POST /api/inventory/purchases/7/receive Status:** 200
- **Response:** ```json
{
  "message": "Stock received and updated successfully",
  "purchaseOrderId": 7,
  "status": "Received",
  "totalBatchCost": 1000
}
```
- **Goods Receipt Confirmed Successfully.** Status: Received
- **Verified PO Status after receipt:** Received, Invoice: TEST-INV-001, Amount Paid: ₹1000

## Step 4: Verify Raw Material Balance & Stock Ledger
- Expected Stock: 160 + 20.0 = 180 kg
- **Actual Stock Level in Raw Materials:** 180 kg (Unit Cost: ₹50)
- **Pass Condition:** PASS. Stock incremented by exactly 20 kg (Current: 180 kg).
- **GET /api/inventory/movements Status:** 200
- **Stock Movement Found:** PURCHASE_RECEIPT, Qty: +20 kg, Previous: 160 -> New: 180, Reason: "Received stock against PO #PO-231911 (Invoice: TEST-INV-001)"
- **Pass Condition:** PASS. Stock movement ledger transaction successfully logged.

## Step 5: Connect RICE to a Recipe (Recipe Management)
*Culture Data:* Dish = "Hyderabadi Jeera Rice (Special Basmati)", 0.2 kg (200 g) per serving
- Creating dish "Hyderabadi Jeera Rice"...
- **Created Dish:** ID 24, "Hyderabadi Jeera Rice", Price ₹180
- **POST /api/inventory/recipes/24 Status:** 200
- **GET /api/inventory/recipes/24 Status:** 200
- **Recipe Items:** ```json
[
  {
    "dish": {
      "category": null,
      "description": null,
      "discountPercentage": 0,
      "id": 24,
      "imageBase64": null,
      "isAvailable": true,
      "isTodaysSpecial": false,
      "name": "Hyderabadi Jeera Rice",
      "price": 180,
      "stockLevel": null
    },
    "id": 5,
    "ingredient": {
      "costPerUnit": 50,
      "hibernateLazyInitializer": {},
      "id": 3,
      "name": "RICE",
      "reorderLevel": 0,
      "stockLevel": 180,
      "unit": "kg"
    },
    "quantityRequired": 0.2,
    "unit": "kg"
  }
]
```
- **Recipe requirement:** 0.2 kg of "RICE" per serving
- **Pass Condition:** PASS. Recipe requirement preserved as 0.2 kg per serving.
- **Stock after Recipe creation:** 180 kg (Previous: 180 kg)
- **Pass Condition:** PASS. Creating recipe alone did NOT reduce stock.

## Step 6: Test Automatic Stock Deduction on POS Customer Order
- Configured consumption event: Customer Order Creation / POS Sale (POST /api/pos/orders)
- Order: 5 servings of "Hyderabadi Jeera Rice"
- Expected Consumption: 5 * 0.2 kg = 1.0 kg RICE
- Expected New Stock: 180 - 1.0 = 179 kg
- **POST /api/pos/orders Status:** 200
- **Order Response:** ID 92, Order Number: 260009, Inventory Deducted: true
- **Actual Stock Level after Order:** 179 kg
- **Pass Condition:** PASS. Stock decreased by exactly 1.0 kg (from 180 to 179 kg).
- **Sale Movement Found:** SALE_CONSUMPTION, Qty: -1 kg, Balance: 180 -> 179, Reason: "Sold 5x Hyderabadi Jeera Rice"
- **Idempotency Condition:** PASS. Stock remained 179 kg. No double deduction occurred.

## Step 7: Test Waste Management
- Waste Record: 0.5 kg of RICE
- Reason: "Prep station spillage / rice container seal rupture"
- Expected Stock: 179 - 0.5 = 178.5 kg
- **POST /api/inventory/waste Status:** 200
- **Response:** ```json
{
  "costLost": 25,
  "createdAt": "2026-10-26T17:03:56.986222568",
  "dateRecorded": "2026-10-26",
  "id": 1,
  "ingredient": {
    "costPerUnit": 50,
    "id": 3,
    "name": "RICE",
    "reorderLevel": 0,
    "stockLevel": 178.5,
    "unit": "kg"
  },
  "quantity": 0.5,
  "reason": "Prep station spillage / rice container seal rupture",
  "staffName": "Chef Ramesh Kumar",
  "unit": "kg"
}
```
- **Actual Stock after Waste:** 178.5 kg
- **Pass Condition:** PASS. Stock decreased by 0.5 kg to 178.5 kg.
- **Waste History Entry Confirmed:** ID 1, Qty: 0.5 kg, Reason: "Prep station spillage / rice container seal rupture", Cost Lost: ₹25

## Step 8: Test Remaining Features (Enterprise Phases 1-5)
*Testing Phase 1-5 Endpoints against Server API:*

### 8.1 Restock Alerts & Auto-PO
- **GET /api/inventory/alerts Status:** 404
- **Response:** {"timestamp":"2026-10-26T17:03:57.284Z","status":404,"error":"Not Found","path":"/api/inventory/alerts"}
- **POST /api/inventory/purchases/auto-generate Status:** 405
- **Response:** {"timestamp":"2026-10-26T17:03:57.400Z","status":405,"error":"Method Not Allowed","path":"/api/inventory/purchases/auto-generate"}

### 8.2 Inter-Branch Transfers (ITO)
- **GET /api/inventory/transfers Status:** 404
- **Response:** {"timestamp":"2026-10-26T17:03:57.494Z","status":404,"error":"Not Found","path":"/api/inventory/transfers"}

### 8.3 Physical Stock Audits & Cycle Counts
- **GET /api/inventory/audits Status:** 404
- **Response:** {"timestamp":"2026-10-26T17:03:57.604Z","status":404,"error":"Not Found","path":"/api/inventory/audits"}

### 8.4 Barcode Quick Lookup
- **GET /api/inventory/barcode/RAW-RICE-001 Status:** 404
- **Response:** {"timestamp":"2026-10-26T17:03:57.693Z","status":404,"error":"Not Found","path":"/api/inventory/barcode/RAW-RICE-001"}

### 8.5 Vendor Invoice Document Attachment
- **POST /api/inventory/purchases/7/attach-invoice Status:** 404
- **Response:** {"timestamp":"2026-10-26T17:03:57.796Z","status":404,"error":"Not Found","path":"/api/inventory/purchases/7/attach-invoice"}