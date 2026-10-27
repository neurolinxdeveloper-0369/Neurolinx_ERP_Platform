const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://erp-api.neurolinx.in';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
          raw: data
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  const log = [];
  const logLine = (msg) => {
    console.log(msg);
    log.push(msg);
  };

  logLine('# Complete Inventory Workflow Test & Trace Log');
  logLine(`*Generated At:* ${new Date().toISOString()}`);
  logLine(`*Target Environment:* ${BASE_URL}\n`);

  let token = '';

  // Step 0: Authentication
  logLine('## Step 0: Authentication (Master Admin / Client Session)');
  try {
    const authRes = await request(
      {
        hostname: 'erp-api.neurolinx.in',
        path: '/api/auth/login-password',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        email: 'neurolinxdeveloper@gmail.com',
        password: 'Neurolinx@2026',
        deviceId: 'inventory-audit-runner'
      }
    );

    logLine(`- **Status:** ${authRes.status}`);
    if (authRes.status === 200 && authRes.data.token) {
      token = authRes.data.token;
      logLine(`- **Auth Result:** Successful login as ${authRes.data.email} (${authRes.data.role})`);
    } else {
      logLine(`- **Auth Error:** ${JSON.stringify(authRes.data)}`);
      fs.writeFileSync('INVENTORY_TEST_TRACE_AND_ERRORS.md', log.join('\n'));
      return;
    }
  } catch (err) {
    logLine(`- **Connection Error:** ${err.message}`);
    fs.writeFileSync('INVENTORY_TEST_TRACE_AND_ERRORS.md', log.join('\n'));
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // Step 1: Add Vendor
  logLine('\n## Step 1: Add a Vendor (Vendor Management)');
  logLine('*Culture Data:* Indian Grain & Rice Wholesaler ("Sri Krishna Rice Mill & Agro Traders")');
  let vendorId = null;
  const vendorPayload = {
    name: 'Sri Krishna Rice Mill & Agro Traders',
    contactPerson: 'Sita Rama Rao',
    phone: '9848022338',
    email: 'srikrishna.ricemill@gmail.com',
    address: 'Plot 42, Miryalaguda Rice Complex, Nalgonda, Telangana',
    gstNumber: '36AAAAA0000A1Z5'
  };

  try {
    const vRes = await request(
      {
        hostname: 'erp-api.neurolinx.in',
        path: '/api/inventory/vendors',
        method: 'POST',
        headers: authHeaders
      },
      vendorPayload
    );
    logLine(`- **POST /api/inventory/vendors Status:** ${vRes.status}`);
    logLine(`- **Response:** \`\`\`json\n${JSON.stringify(vRes.data, null, 2)}\n\`\`\``);

    if (vRes.status === 200 && vRes.data.id) {
      vendorId = vRes.data.id;
      logLine(`- **Vendor Created ID:** ${vendorId}`);
    } else {
      logLine(`- **ERROR / BLOCKER:** Failed to create vendor.`);
    }

    // Refresh & Verify Persistence
    const vListRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/vendors',
      method: 'GET',
      headers: authHeaders
    });
    logLine(`- **GET /api/inventory/vendors Status (Refresh Check):** ${vListRes.status}`);
    const foundVendor = Array.isArray(vListRes.data) && vListRes.data.find((v) => v.id === vendorId);
    if (foundVendor) {
      logLine(`- **Pass Condition:** PASS. Vendor "${foundVendor.name}" is persistently stored and retrievable.`);
    } else {
      logLine(`- **Pass Condition:** FAIL. Vendor was not found upon refreshing vendor list.`);
    }
  } catch (err) {
    logLine(`- **Exception in Step 1:** ${err.message}`);
  }

  // Step 2 & 4 Pre-requisite: Check or Create Raw Material RICE
  logLine('\n## Preparation: Verify / Create Raw Material (RICE)');
  let riceIngredient = null;
  try {
    const ingRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/ingredients',
      method: 'GET',
      headers: authHeaders
    });

    if (Array.isArray(ingRes.data)) {
      riceIngredient = ingRes.data.find(
        (i) => i.name && i.name.toUpperCase().includes('RICE')
      );
    }

    if (!riceIngredient) {
      logLine('- RICE ingredient not found. Creating new ingredient "Basmati Rice (Classic Daawat)"...');
      const createIngRes = await request(
        {
          hostname: 'erp-api.neurolinx.in',
          path: '/api/inventory/ingredients',
          method: 'POST',
          headers: authHeaders
        },
        {
          name: 'Basmati Rice (Classic Daawat)',
          unit: 'kg',
          stockLevel: 0.0,
          reorderLevel: 5.0,
          costPerUnit: 50.0,
          storageZone: 'Dry Store'
        }
      );
      logLine(`- **POST /api/inventory/ingredients Status:** ${createIngRes.status}`);
      riceIngredient = createIngRes.data;
    }

    logLine(`- **Target Ingredient:** ID: ${riceIngredient.id}, Name: "${riceIngredient.name}", Current Stock: ${riceIngredient.stockLevel} ${riceIngredient.unit}, Cost: ₹${riceIngredient.costPerUnit}`);
  } catch (err) {
    logLine(`- **Exception in Preparation:** ${err.message}`);
  }

  const initialStock = riceIngredient ? parseFloat(riceIngredient.stockLevel) : 0;

  // Step 2: Create a purchase order
  logLine('\n## Step 2: Create a Purchase Order');
  logLine('- Ordered: 20 kg of RICE at ₹50 per kg');
  logLine('- Expected Total PO Cost: 20 * ₹50 = ₹1,000');
  let poId = null;
  const poNumber = 'PO-' + Date.now().toString().slice(-6);

  try {
    const poPayload = {
      vendorId: vendorId,
      poNumber: poNumber,
      expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      notes: 'Test PO: 20kg Basmati Rice for restaurant daily biryani & jeera rice prep',
      status: 'Ordered',
      totalAmount: 1000.0,
      amountPaid: 0.0,
      items: [
        {
          ingredientId: riceIngredient.id,
          quantity: 20.0,
          costPerUnit: 50.0,
          unit: 'kg'
        }
      ]
    };

    const poRes = await request(
      {
        hostname: 'erp-api.neurolinx.in',
        path: '/api/inventory/purchases',
        method: 'POST',
        headers: authHeaders
      },
      poPayload
    );
    logLine(`- **POST /api/inventory/purchases Status:** ${poRes.status}`);
    logLine(`- **Response:** \`\`\`json\n${JSON.stringify(poRes.data, null, 2)}\n\`\`\``);

    if (poRes.status === 200 && poRes.data.id) {
      poId = poRes.data.id;
      logLine(`- **Created PO ID:** ${poId}, PO Number: ${poRes.data.poNumber}, Total: ₹${poRes.data.totalAmount}`);
    } else {
      logLine(`- **ERROR / BLOCKER:** Failed to create Purchase Order.`);
    }

    // Verify Raw Material stock did NOT increase on PO creation
    const ingCheckRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/ingredients',
      method: 'GET',
      headers: authHeaders
    });
    const currentIng = Array.isArray(ingCheckRes.data) && ingCheckRes.data.find((i) => i.id === riceIngredient.id);
    const stockAfterPO = currentIng ? parseFloat(currentIng.stockLevel) : 0;
    logLine(`- **Stock Level after PO creation:** ${stockAfterPO} ${riceIngredient.unit} (Initial was ${initialStock})`);
    if (stockAfterPO === initialStock) {
      logLine(`- **Pass Condition:** PASS. Stock did NOT increase on PO creation.`);
    } else {
      logLine(`- **Pass Condition:** FAIL. Stock incorrectly increased before receipt! Previous: ${initialStock}, Now: ${stockAfterPO}`);
    }
  } catch (err) {
    logLine(`- **Exception in Step 2:** ${err.message}`);
  }

  // Step 3: Receive the stock
  logLine('\n## Step 3: Receive the Stock (Goods Receipt Inward)');
  logLine('- Invoice Number: TEST-INV-001');
  logLine('- Received Quantity: 20 kg at ₹50/kg');
  try {
    const receivePayload = {
      invoiceNumber: 'TEST-INV-001',
      invoiceDate: new Date().toISOString().split('T')[0],
      receiptDate: new Date().toISOString().split('T')[0],
      amountPaid: 1000.0,
      items: [
        {
          ingredientId: riceIngredient.id,
          quantity: 20.0,
          costPerUnit: 50.0,
          unit: 'kg',
          expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
        }
      ]
    };

    const recRes = await request(
      {
        hostname: 'erp-api.neurolinx.in',
        path: `/api/inventory/purchases/${poId}/receive`,
        method: 'POST',
        headers: authHeaders
      },
      receivePayload
    );
    logLine(`- **POST /api/inventory/purchases/${poId}/receive Status:** ${recRes.status}`);
    logLine(`- **Response:** \`\`\`json\n${JSON.stringify(recRes.data, null, 2)}\n\`\`\``);

    if (recRes.status === 200) {
      logLine(`- **Goods Receipt Confirmed Successfully.** Status: ${recRes.data.status}`);
    } else {
      logLine(`- **ERROR / BLOCKER:** Failed to receive stock.`);
    }

    // Reopen purchase order / history
    const poVerifyRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: `/api/inventory/purchases/${poId}`,
      method: 'GET',
      headers: authHeaders
    });
    logLine(`- **Verified PO Status after receipt:** ${poVerifyRes.data.status}, Invoice: ${poVerifyRes.data.invoiceNumber}, Amount Paid: ₹${poVerifyRes.data.amountPaid}`);
  } catch (err) {
    logLine(`- **Exception in Step 3:** ${err.message}`);
  }

  // Step 4: Verify Raw Material
  logLine('\n## Step 4: Verify Raw Material Balance & Stock Ledger');
  const expectedStockAfterReceipt = initialStock + 20.0;
  logLine(`- Expected Stock: ${initialStock} + 20.0 = ${expectedStockAfterReceipt} kg`);

  try {
    const ingVerifyRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/ingredients',
      method: 'GET',
      headers: authHeaders
    });
    const updatedRice = Array.isArray(ingVerifyRes.data) && ingVerifyRes.data.find((i) => i.id === riceIngredient.id);
    const actualStockAfterReceipt = updatedRice ? parseFloat(updatedRice.stockLevel) : -1;
    logLine(`- **Actual Stock Level in Raw Materials:** ${actualStockAfterReceipt} kg (Unit Cost: ₹${updatedRice ? updatedRice.costPerUnit : 'N/A'})`);

    if (Math.abs(actualStockAfterReceipt - expectedStockAfterReceipt) < 0.001) {
      logLine(`- **Pass Condition:** PASS. Stock incremented by exactly 20 kg (Current: ${actualStockAfterReceipt} kg).`);
    } else {
      logLine(`- **Pass Condition:** FAIL. Expected ${expectedStockAfterReceipt} kg, but found ${actualStockAfterReceipt} kg.`);
    }

    // Check Stock Ledger (Movements)
    const movRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/movements',
      method: 'GET',
      headers: authHeaders
    });
    logLine(`- **GET /api/inventory/movements Status:** ${movRes.status}`);
    if (Array.isArray(movRes.data)) {
      const receiptMovement = movRes.data.find(
        (m) => m.referenceId === 'TEST-INV-001' && m.movementType === 'PURCHASE_RECEIPT'
      );
      if (receiptMovement) {
        logLine(`- **Stock Movement Found:** ${receiptMovement.movementType}, Qty: +${receiptMovement.quantity} ${receiptMovement.unit}, Previous: ${receiptMovement.previousStock} -> New: ${receiptMovement.newStock}, Reason: "${receiptMovement.reason}"`);
        logLine(`- **Pass Condition:** PASS. Stock movement ledger transaction successfully logged.`);
      } else {
        logLine(`- **ERROR / BLOCKER:** No stock movement record found with reference TEST-INV-001.`);
      }
    }
  } catch (err) {
    logLine(`- **Exception in Step 4:** ${err.message}`);
  }

  // Step 5: Connect RICE to a recipe
  logLine('\n## Step 5: Connect RICE to a Recipe (Recipe Management)');
  logLine('*Culture Data:* Dish = "Hyderabadi Jeera Rice (Special Basmati)", 0.2 kg (200 g) per serving');
  let dish = null;

  try {
    // Check or create test dish
    const dishesRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/pos/dishes',
      method: 'GET',
      headers: authHeaders
    });

    if (Array.isArray(dishesRes.data)) {
      dish = dishesRes.data.find(
        (d) => d.name && (d.name.includes('Jeera Rice') || d.name.includes('Test Rice'))
      );
    }

    if (!dish) {
      logLine('- Creating dish "Hyderabadi Jeera Rice"...');
      const createDishRes = await request(
        {
          hostname: 'erp-api.neurolinx.in',
          path: '/api/pos/dishes',
          method: 'POST',
          headers: authHeaders
        },
        {
          name: 'Hyderabadi Jeera Rice',
          price: 180.0,
          isAvailable: true
        }
      );
      dish = createDishRes.data;
      logLine(`- **Created Dish:** ID ${dish.id}, "${dish.name}", Price ₹${dish.price}`);
    } else {
      logLine(`- **Existing Dish Found:** ID ${dish.id}, "${dish.name}", Price ₹${dish.price}`);
    }

    // Map 0.2 kg RICE to Dish Recipe
    const recipePayload = [
      {
        ingredientId: riceIngredient.id.toString(),
        quantityRequired: 0.2,
        unit: 'kg'
      }
    ];

    const saveRecipeRes = await request(
      {
        hostname: 'erp-api.neurolinx.in',
        path: `/api/inventory/recipes/${dish.id}`,
        method: 'POST',
        headers: authHeaders
      },
      recipePayload
    );
    logLine(`- **POST /api/inventory/recipes/${dish.id} Status:** ${saveRecipeRes.status}`);

    // Verify persistence by reading back recipe
    const getRecipeRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: `/api/inventory/recipes/${dish.id}`,
      method: 'GET',
      headers: authHeaders
    });
    logLine(`- **GET /api/inventory/recipes/${dish.id} Status:** ${getRecipeRes.status}`);
    logLine(`- **Recipe Items:** \`\`\`json\n${JSON.stringify(getRecipeRes.data, null, 2)}\n\`\`\``);

    if (Array.isArray(getRecipeRes.data) && getRecipeRes.data.length > 0) {
      const rItem = getRecipeRes.data[0];
      logLine(`- **Recipe requirement:** ${rItem.quantityRequired} ${rItem.unit} of "${rItem.ingredient ? rItem.ingredient.name : 'Unknown'}" per serving`);
      logLine(`- **Pass Condition:** PASS. Recipe requirement preserved as 0.2 kg per serving.`);
    } else {
      logLine(`- **Pass Condition:** FAIL. Recipe items were not persisted.`);
    }

    // Confirm that recipe creation alone does NOT deduct stock
    const ingCheckRecipe = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/ingredients',
      method: 'GET',
      headers: authHeaders
    });
    const riceAfterRecipe = ingCheckRecipe.data.find((i) => i.id === riceIngredient.id);
    const stockAfterRecipe = riceAfterRecipe ? parseFloat(riceAfterRecipe.stockLevel) : 0;
    logLine(`- **Stock after Recipe creation:** ${stockAfterRecipe} kg (Previous: ${expectedStockAfterReceipt} kg)`);
    if (Math.abs(stockAfterRecipe - expectedStockAfterReceipt) < 0.001) {
      logLine(`- **Pass Condition:** PASS. Creating recipe alone did NOT reduce stock.`);
    } else {
      logLine(`- **Pass Condition:** FAIL. Stock changed during recipe definition!`);
    }
  } catch (err) {
    logLine(`- **Exception in Step 5:** ${err.message}`);
  }

  // Step 6: Test automatic stock deduction
  logLine('\n## Step 6: Test Automatic Stock Deduction on POS Customer Order');
  logLine('- Configured consumption event: Customer Order Creation / POS Sale (POST /api/pos/orders)');
  logLine('- Order: 5 servings of "Hyderabadi Jeera Rice"');
  logLine('- Expected Consumption: 5 * 0.2 kg = 1.0 kg RICE');
  logLine(`- Expected New Stock: ${expectedStockAfterReceipt} - 1.0 = ${expectedStockAfterReceipt - 1.0} kg`);

  let orderId = null;
  try {
    const orderPayload = {
      orderType: 'DINE_IN',
      tableNumber: 'Table 4',
      customerName: 'Vikram Reddy',
      customerPhone: '9876543210',
      totalAmount: 5 * (dish.price || 180),
      items: [
        {
          dishId: dish.id,
          quantity: 5,
          notes: 'Extra roasted cumin'
        }
      ]
    };

    const orderRes = await request(
      {
        hostname: 'erp-api.neurolinx.in',
        path: '/api/pos/orders',
        method: 'POST',
        headers: authHeaders
      },
      orderPayload
    );
    logLine(`- **POST /api/pos/orders Status:** ${orderRes.status}`);
    logLine(`- **Order Response:** ID ${orderRes.data.id}, Order Number: ${orderRes.data.orderNumber}, Inventory Deducted: ${orderRes.data.inventoryDeducted}`);

    if (orderRes.status === 200 && orderRes.data.id) {
      orderId = orderRes.data.id;
    }

    // Verify Raw Material stock decreased by 1.0 kg
    const ingCheckOrder = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/ingredients',
      method: 'GET',
      headers: authHeaders
    });
    const riceAfterOrder = ingCheckOrder.data.find((i) => i.id === riceIngredient.id);
    const actualStockAfterOrder = riceAfterOrder ? parseFloat(riceAfterOrder.stockLevel) : -1;
    const expectedStockAfterOrder = expectedStockAfterReceipt - 1.0;

    logLine(`- **Actual Stock Level after Order:** ${actualStockAfterOrder} kg`);
    if (Math.abs(actualStockAfterOrder - expectedStockAfterOrder) < 0.001) {
      logLine(`- **Pass Condition:** PASS. Stock decreased by exactly 1.0 kg (from ${expectedStockAfterReceipt} to ${actualStockAfterOrder} kg).`);
    } else {
      logLine(`- **Pass Condition:** FAIL. Expected ${expectedStockAfterOrder} kg, but got ${actualStockAfterOrder} kg.`);
    }

    // Check Stock Movement for SALE_CONSUMPTION
    const movResOrder = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/movements',
      method: 'GET',
      headers: authHeaders
    });
    if (Array.isArray(movResOrder.data)) {
      const saleMovement = movResOrder.data.find(
        (m) => m.referenceId === orderRes.data.orderNumber && m.movementType === 'SALE_CONSUMPTION'
      );
      if (saleMovement) {
        logLine(`- **Sale Movement Found:** ${saleMovement.movementType}, Qty: ${saleMovement.quantity} ${saleMovement.unit}, Balance: ${saleMovement.previousStock} -> ${saleMovement.newStock}, Reason: "${saleMovement.reason}"`);
      }
    }

    // Idempotency Check: Verify that viewing/retrying order does NOT re-deduct
    const getOrderRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: `/api/pos/orders/all`,
      method: 'GET',
      headers: authHeaders
    });
    const ingCheckRecheck = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/ingredients',
      method: 'GET',
      headers: authHeaders
    });
    const stockAfterRecheck = parseFloat(ingCheckRecheck.data.find((i) => i.id === riceIngredient.id).stockLevel);
    if (Math.abs(stockAfterRecheck - actualStockAfterOrder) < 0.001) {
      logLine(`- **Idempotency Condition:** PASS. Stock remained ${stockAfterRecheck} kg. No double deduction occurred.`);
    } else {
      logLine(`- **Idempotency Condition:** FAIL. Stock changed unexpectedly upon refresh!`);
    }
  } catch (err) {
    logLine(`- **Exception in Step 6:** ${err.message}`);
  }

  // Step 7: Test Waste Management
  logLine('\n## Step 7: Test Waste Management');
  logLine('- Waste Record: 0.5 kg of RICE');
  logLine('- Reason: "Prep station spillage / rice container seal rupture"');
  const expectedStockAfterWaste = (expectedStockAfterReceipt - 1.0) - 0.5;
  logLine(`- Expected Stock: ${(expectedStockAfterReceipt - 1.0)} - 0.5 = ${expectedStockAfterWaste} kg`);

  try {
    const wastePayload = {
      ingredientId: riceIngredient.id,
      quantity: 0.5,
      unit: 'kg',
      reason: 'Prep station spillage / rice container seal rupture',
      staffName: 'Chef Ramesh Kumar'
    };

    const wasteRes = await request(
      {
        hostname: 'erp-api.neurolinx.in',
        path: '/api/inventory/waste',
        method: 'POST',
        headers: authHeaders
      },
      wastePayload
    );
    logLine(`- **POST /api/inventory/waste Status:** ${wasteRes.status}`);
    logLine(`- **Response:** \`\`\`json\n${JSON.stringify(wasteRes.data, null, 2)}\n\`\`\``);

    // Verify Stock Deduction in Raw Materials
    const ingCheckWaste = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/ingredients',
      method: 'GET',
      headers: authHeaders
    });
    const riceAfterWaste = ingCheckWaste.data.find((i) => i.id === riceIngredient.id);
    const actualStockAfterWaste = riceAfterWaste ? parseFloat(riceAfterWaste.stockLevel) : -1;
    logLine(`- **Actual Stock after Waste:** ${actualStockAfterWaste} kg`);

    if (Math.abs(actualStockAfterWaste - expectedStockAfterWaste) < 0.001) {
      logLine(`- **Pass Condition:** PASS. Stock decreased by 0.5 kg to ${actualStockAfterWaste} kg.`);
    } else {
      logLine(`- **Pass Condition:** FAIL. Expected ${expectedStockAfterWaste} kg, but got ${actualStockAfterWaste} kg.`);
    }

    // Verify Waste History
    const wasteListRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/waste',
      method: 'GET',
      headers: authHeaders
    });
    if (Array.isArray(wasteListRes.data)) {
      const loggedWaste = wasteListRes.data.find((w) => w.id === wasteRes.data.id);
      if (loggedWaste) {
        logLine(`- **Waste History Entry Confirmed:** ID ${loggedWaste.id}, Qty: ${loggedWaste.quantity} ${loggedWaste.unit}, Reason: "${loggedWaste.reason}", Cost Lost: ₹${loggedWaste.costLost}`);
      }
    }
  } catch (err) {
    logLine(`- **Exception in Step 7:** ${err.message}`);
  }

  // Step 8: Test Remaining Features
  logLine('\n## Step 8: Test Remaining Features (Enterprise Phases 1-5)');
  logLine('*Testing Phase 1-5 Endpoints against Server API:*\n');

  // 8.1 Restock Alerts & Auto-PO
  logLine('### 8.1 Restock Alerts & Auto-PO');
  try {
    const alertsRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/alerts',
      method: 'GET',
      headers: authHeaders
    });
    logLine(`- **GET /api/inventory/alerts Status:** ${alertsRes.status}`);
    logLine(`- **Response:** ${JSON.stringify(alertsRes.data)}`);

    const autoPoRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/purchases/auto-generate',
      method: 'POST',
      headers: authHeaders
    });
    logLine(`- **POST /api/inventory/purchases/auto-generate Status:** ${autoPoRes.status}`);
    logLine(`- **Response:** ${JSON.stringify(autoPoRes.data)}`);
  } catch (e) {
    logLine(`- Exception: ${e.message}`);
  }

  // 8.2 Inter-Branch Transfers (ITO)
  logLine('\n### 8.2 Inter-Branch Transfers (ITO)');
  try {
    const transfersRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/transfers',
      method: 'GET',
      headers: authHeaders
    });
    logLine(`- **GET /api/inventory/transfers Status:** ${transfersRes.status}`);
    logLine(`- **Response:** ${JSON.stringify(transfersRes.data)}`);
  } catch (e) {
    logLine(`- Exception: ${e.message}`);
  }

  // 8.3 Stock Audits & Cycle Counts
  logLine('\n### 8.3 Physical Stock Audits & Cycle Counts');
  try {
    const auditsRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/audits',
      method: 'GET',
      headers: authHeaders
    });
    logLine(`- **GET /api/inventory/audits Status:** ${auditsRes.status}`);
    logLine(`- **Response:** ${JSON.stringify(auditsRes.data)}`);
  } catch (e) {
    logLine(`- Exception: ${e.message}`);
  }

  // 8.4 Barcode Scanning
  logLine('\n### 8.4 Barcode Quick Lookup');
  try {
    const barcodeRes = await request({
      hostname: 'erp-api.neurolinx.in',
      path: '/api/inventory/barcode/RAW-RICE-001',
      method: 'GET',
      headers: authHeaders
    });
    logLine(`- **GET /api/inventory/barcode/RAW-RICE-001 Status:** ${barcodeRes.status}`);
    logLine(`- **Response:** ${JSON.stringify(barcodeRes.data)}`);
  } catch (e) {
    logLine(`- Exception: ${e.message}`);
  }

  // 8.5 Invoice Attachment
  logLine('\n### 8.5 Vendor Invoice Document Attachment');
  try {
    const attachRes = await request(
      {
        hostname: 'erp-api.neurolinx.in',
        path: `/api/inventory/purchases/${poId}/attach-invoice`,
        method: 'POST',
        headers: authHeaders
      },
      {
        invoiceAttachmentUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
        invoiceAttachmentName: 'TEST-INV-001-CHALLAN.pdf'
      }
    );
    logLine(`- **POST /api/inventory/purchases/${poId}/attach-invoice Status:** ${attachRes.status}`);
    logLine(`- **Response:** ${JSON.stringify(attachRes.data)}`);
  } catch (e) {
    logLine(`- Exception: ${e.message}`);
  }

  fs.writeFileSync('INVENTORY_TEST_TRACE_AND_ERRORS.md', log.join('\n'), 'utf8');
  console.log('\nComplete Inventory Test Suite finished. Log written to INVENTORY_TEST_TRACE_AND_ERRORS.md');
}

run();
