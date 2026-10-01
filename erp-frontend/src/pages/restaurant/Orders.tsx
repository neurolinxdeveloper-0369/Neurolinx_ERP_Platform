import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { apiFetch } from '../../api';
import { usePrinter } from '../../context/PrinterContext';
import TableSetupModal from '../../components/restaurant/TableSetupModal';
import FloorTableLayout, { type RestaurantTableData } from '../../components/restaurant/FloorTableLayout';

interface Dish {
  id: number;
  name: string;
  price: number;
  category: { id: number, name: string };
  isAvailable: boolean;
  imageBase64?: string;
  isTodaysSpecial?: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface OrderItem {
  dish: Dish;
  quantity: number;
}

export interface PlacedOrder {
  id: string | number;
  orderNumber: string;
  orderType: 'Dine-In' | 'Takeaway' | 'Delivery';
  tableName?: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod?: string;
  status: string;
  createdAt: string;
}

export default function RestaurantOrders() {
  const { sendEscPos, connectedDevice } = usePrinter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway' | 'Delivery'>('Dine-In');
  const [viewMode, setViewMode] = useState<'POS' | 'Tables' | 'Reservations'>('POS');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [tables, setTables] = useState<RestaurantTableData[]>([]);
  const [loadingTables, setLoadingTables] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<PlacedOrder[]>(() => {
    const cached = localStorage.getItem('pos_recent_orders');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Modals
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');

  const loadFloorTables = async (floorNum: number) => {
    setLoadingTables(true);
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/pos/tables?floor=${floorNum}`);
      if (res.ok) {
        const data: RestaurantTableData[] = await res.json();
        setTables(data);
        localStorage.setItem(`floor_tables_${floorNum}`, JSON.stringify(data));
      } else {
        const cached = localStorage.getItem(`floor_tables_${floorNum}`);
        if (cached) {
          setTables(JSON.parse(cached));
        } else {
          setTables([]);
        }
      }
    } catch (err) {
      console.warn('Network error loading floor tables, using cache if available', err);
      const cached = localStorage.getItem(`floor_tables_${floorNum}`);
      if (cached) {
        setTables(JSON.parse(cached));
      } else {
        setTables([]);
      }
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'Tables') {
      loadFloorTables(activeFloor);
    }
  }, [viewMode, activeFloor]);

  const handleSaveTableConfig = async (floor: number, newTables: { capacity: number }[]) => {
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/pos/tables/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor, tables: newTables })
      });
      if (res.ok) {
        const saved: RestaurantTableData[] = await res.json();
        setActiveFloor(floor);
        setTables(saved);
        localStorage.setItem(`floor_tables_${floor}`, JSON.stringify(saved));
      } else {
        const fallbackTables: RestaurantTableData[] = newTables.map((t, idx) => ({
          id: Date.now() + idx,
          tableName: `Table ${idx + 1}`,
          capacity: t.capacity,
          floor: floor,
          position: idx + 1,
          status: 'Free'
        }));
        setActiveFloor(floor);
        setTables(fallbackTables);
        localStorage.setItem(`floor_tables_${floor}`, JSON.stringify(fallbackTables));
      }
    } catch (err) {
      console.error('Error saving table configuration, saving locally', err);
      const fallbackTables: RestaurantTableData[] = newTables.map((t, idx) => ({
        id: Date.now() + idx,
        tableName: `Table ${idx + 1}`,
        capacity: t.capacity,
        floor: floor,
        position: idx + 1,
        status: 'Free'
      }));
      setActiveFloor(floor);
      setTables(fallbackTables);
      localStorage.setItem(`floor_tables_${floor}`, JSON.stringify(fallbackTables));
    }
  };

  const handleTableStatusChange = async (tableId: number, newStatus: string) => {
    try {
      await apiFetch(`https://erp-api.neurolinx.in/api/pos/tables/${tableId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.warn('Could not persist status change to API', e);
    }
    setTables(prev => {
      const updated = prev.map(t => t.id === tableId ? { ...t, status: newStatus } : t);
      localStorage.setItem(`floor_tables_${activeFloor}`, JSON.stringify(updated));
      return updated;
    });
    if (selectedTableId === tableId && newStatus !== 'Free') {
      setSelectedTableId(null);
      setSelectedTableName('');
    }
  };

  const handleSelectTable = (table: RestaurantTableData) => {
    setSelectedTableId(table.id);
    setSelectedTableName(table.tableName);
    setOrderType('Dine-In');
  };

  useEffect(() => {
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/pos/categories').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/pos/dishes').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/settings').then(res => res.json())
    ]).then(([cats, items, sets]) => {
      setCategories(cats);
      setDishes(items);
      setSettings(sets);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });

    apiFetch('https://erp-api.neurolinx.in/api/pos/orders/recent')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: PlacedOrder[] = data.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            orderType: (o.orderType as any) || 'Dine-In',
            tableName: o.restaurantTable?.tableName,
            items: o.items ? o.items.map((it: any) => ({
              name: it.dish?.name || 'Dish Item',
              quantity: it.quantity || 1,
              price: it.price || 0
            })) : [],
            totalAmount: o.totalAmount || 0,
            paymentMethod: o.paymentMethod || 'UPI',
            status: o.status || 'Completed',
            createdAt: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
          }));
          setRecentOrders(mapped.slice(0, 10));
          localStorage.setItem('pos_recent_orders', JSON.stringify(mapped.slice(0, 10)));
        }
      })
      .catch(() => {});
  }, []);

  const addToCart = (dish: Dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.id === dish.id);
      if (existing) {
        return prev.map(item => item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.dish.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };
  
  // removeItem commented

  const generateKotReceipt = (orderNumber: string) => {
    const ESC = 0x1b; const GS = 0x1d; const encoder = new TextEncoder();
    let payload = new Uint8Array([ESC, 0x40, ESC, 0x61, 0x01, ESC, 0x21, 0x10]); // init, center, double height
    
    payload = new Uint8Array([...payload, ...encoder.encode("** KOT **\n"), ESC, 0x21, 0x00]);
    payload = new Uint8Array([...payload, ...encoder.encode(`Order: ${orderNumber} | ${orderType}\n`), ESC, 0x61, 0x00, ...encoder.encode("--------------------------------\n"), ESC, 0x21, 0x08]);
    
    cart.forEach(item => {
      payload = new Uint8Array([...payload, ...encoder.encode(`${item.quantity}x ${item.dish.name}\n`)]);
    });
    
    payload = new Uint8Array([...payload, ESC, 0x21, 0x00, ...encoder.encode("--------------------------------\n\n\n\n\n"), GS, 0x56, 0x41, 0x00]);
    return payload;
  };

  
  const rasterizeImage = async (base64Str: string): Promise<Uint8Array> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(new Uint8Array(0)); return; }
        
        let width = img.width;
        let height = img.height;
        if (width > 200) {
          height = Math.floor(height * (200 / width));
          width = 200;
        }
        width = Math.floor(width / 8) * 8; 
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;
        
        const xL = (width / 8) % 256;
        const xH = Math.floor((width / 8) / 256);
        const yL = height % 256;
        const yH = Math.floor(height / 256);
        
        const dataLength = (width / 8) * height;
        const buffer = new Uint8Array(8 + dataLength);
        
        buffer[0] = 0x1d; buffer[1] = 0x76; buffer[2] = 0x30; buffer[3] = 0x00;
        buffer[4] = xL; buffer[5] = xH; buffer[6] = yL; buffer[7] = yH;
        
        let offset = 8;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x += 8) {
            let b = 0;
            for (let bit = 0; bit < 8; bit++) {
              const idx = (y * width + (x + bit)) * 4;
              const brightness = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
              if (brightness < 128) {
                b |= (1 << (7 - bit));
              }
            }
            buffer[offset++] = b;
          }
        }
        resolve(buffer);
      };
      img.onerror = () => resolve(new Uint8Array(0));
      img.src = base64Str;
    });
  };

  const generateCustomerReceipt = async (orderNumber: string, total: number, tax: number) => {

    const ESC = 0x1b; const GS = 0x1d; const encoder = new TextEncoder();
    let payload = new Uint8Array([ESC, 0x40, ESC, 0x61, 0x01]);
    
    let storeName = settings?.storeName || "Neurolinx POS";
    payload = new Uint8Array([...payload, ESC, 0x21, 0x10, ...encoder.encode(`${storeName.toUpperCase()}\n`), ESC, 0x21, 0x00]);
    
    if (settings?.address) payload = new Uint8Array([...payload, ...encoder.encode(`${settings.address}\n`)]);
    if (settings?.gstNumber) payload = new Uint8Array([...payload, ...encoder.encode(`GST: ${settings.gstNumber}\n`)]);
    
    payload = new Uint8Array([...payload, ...encoder.encode("--------------------------------\n")]);
    payload = new Uint8Array([...payload, ...encoder.encode(`Order: ${orderNumber} | ${orderType} ${orderType === 'Dine-In' && selectedTableName ? '('+selectedTableName+')' : ''}\n`)]);
    payload = new Uint8Array([...payload, ...encoder.encode("--------------------------------\n"), ESC, 0x61, 0x00]);
    
    cart.forEach(item => {
      let line = `${item.quantity}x ${item.dish.name}`;
      let priceStr = `Rs.${(item.dish.price * item.quantity).toFixed(2)}`;
      let spaces = 32 - line.length - priceStr.length;
      if (spaces < 1) spaces = 1;
      payload = new Uint8Array([...payload, ...encoder.encode(`${line}${' '.repeat(spaces)}${priceStr}\n`)]);
    });
    
    payload = new Uint8Array([...payload, ...encoder.encode("--------------------------------\n")]);
    payload = new Uint8Array([...payload, ESC, 0x61, 0x02, ...encoder.encode(`Subtotal: Rs.${(total - tax).toFixed(2)}\n`)]);
    payload = new Uint8Array([...payload, ...encoder.encode(`Tax: Rs.${tax.toFixed(2)}\n`)]);
    payload = new Uint8Array([...payload, ESC, 0x21, 0x10, ...encoder.encode(`TOTAL: Rs.${total.toFixed(2)}\n`), ESC, 0x21, 0x00, ESC, 0x61, 0x01]);
    
    if (orderType === 'Dine-In') {
        if (settings?.upiQrImageBase64) {
          payload = new Uint8Array([...payload, ...encoder.encode("\nSCAN TO PAY (UPI)\n")]);
          const rasterData = await rasterizeImage(settings.upiQrImageBase64);
          payload = new Uint8Array([...payload, ...rasterData]); 
        }
      }
      
      if (settings?.receiptFooter) payload = new Uint8Array([...payload, ...encoder.encode(`\n${settings.receiptFooter}\n`)]);
    
    payload = new Uint8Array([...payload, ...encoder.encode("\n\n\n\n\n"), GS, 0x56, 0x41, 0x00]);
    return payload;
  };

  const placeOrder = (status: 'Completed' | 'Parked') => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
    const discountRate = settings?.defaultDiscount || 0.0;
    const discountAmount = total * (discountRate / 100);
    const subtotalAfterDiscount = total - discountAmount;
    const taxRate = settings?.defaultTaxRate || 5.0;
    const tax = subtotalAfterDiscount * (taxRate / 100);
    const finalTotal = subtotalAfterDiscount + tax;
    const currentTableId = selectedTableId;
    const currentTableName = selectedTableName || (currentTableId ? ('Table ' + currentTableId) : '');


    const handlePrint = (order: any) => {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) return;
      
      let itemsHtml = '';
      if (order.items) {
        order.items.forEach((item: any) => {
          itemsHtml += `
            <tr>
              <td style="padding: 4px 0; font-size: 14px;">${item.quantity}x ${item.name || 'Item'}</td>
              <td style="padding: 4px 0; text-align: right; font-size: 14px;">${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `;
        });
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${order.orderNumber}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h2 { margin: 0; font-size: 20px; }
            .header p { margin: 5px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .totals { border-top: 1px dashed #000; padding-top: 10px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .totals .grand-total { font-size: 18px; font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>RESTAURANT</h2>
            <p>Order #${order.orderNumber}</p>
            <p>${order.createdAt}</p>
            <p>${order.orderType}${order.tableName ? ' - ' + order.tableName : ''}</p>
          </div>
          
          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="grand-total"><span>Total</span> <span>${order.totalAmount?.toFixed(2)}</span></div>
          </div>
          
          <div class="footer">
            <p>Thank you for visiting!</p>
            <p>Powered by Neurolinx</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
    };

    const saveOrderLocally = (serverOrder?: any) => {

      const orderNum = serverOrder?.orderNumber || `ORD-${Date.now().toString().slice(-4)}`;
      const newOrderRecord: PlacedOrder = {
        id: serverOrder?.id || Date.now(),
        orderNumber: orderNum,
        orderType,
        tableName: orderType === 'Dine-In' ? (currentTableName || 'Table') : undefined,
        items: cart.map(c => ({ name: c.dish.name, quantity: c.quantity, price: c.dish.price })),
        totalAmount: finalTotal,
        paymentMethod: status === 'Parked' ? 'Unpaid' : paymentMethod,
        status: status,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setRecentOrders(prev => {
        const updated = [newOrderRecord, ...prev.filter(p => p.orderNumber !== orderNum)].slice(0, 10);
        localStorage.setItem('pos_recent_orders', JSON.stringify(updated));
        return updated;
      });

      // Dispatch event for Dashboard to catch live updates
      window.dispatchEvent(new CustomEvent('neurolinx_order_placed', { detail: newOrderRecord }));
      window.dispatchEvent(new Event('storage'));

      if (status === 'Completed') {
        handlePrint(newOrderRecord);
      }

      return newOrderRecord;
    };
    
    apiFetch('https://erp-api.neurolinx.in/api/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderType, 
        tableId: orderType === 'Dine-In' ? currentTableId : null,
        totalAmount: finalTotal, 
        taxApplied: tax,
        paymentMethod: status === 'Parked' ? null : paymentMethod,
        status: status,
        items: cart.map(c => ({ dishId: c.dish.id, quantity: c.quantity })) 
      })
    })
    .then(async res => {
      if (res.ok) {
        return res.json().catch(() => null);
      }
      return null;
    })
    .then(order => {
      if (status === 'Completed') {
        alert("Order placed successfully!");
        
        if (connectedDevice && order?.orderNumber) {
          // Print KOT
          sendEscPos(generateKotReceipt(order.orderNumber)).then(() => {
            // Then print Bill
            setTimeout(async () => {
              const billPayload = await generateCustomerReceipt(order.orderNumber, finalTotal, tax);
              sendEscPos(billPayload);
            }, 3000); // 3 second delay to let KOT finish cutting
          });
        }
      } else {
        alert("Order Parked successfully!");
      }

      if (orderType === 'Dine-In' && currentTableId) {
        handleTableStatusChange(currentTableId, status === 'Parked' ? 'Occupied' : 'Free');
      }

      saveOrderLocally(order);

      setSelectedTableId(null);
      setSelectedTableName('');
      setCart([]);
      setShowCheckout(false);
    })
    .catch(err => {
      console.warn("API order placement fallback to local", err);
      if (status === 'Completed') {
        alert("Order placed successfully!");
      } else {
        alert("Order Parked successfully!");
      }

      if (orderType === 'Dine-In' && currentTableId) {
        handleTableStatusChange(currentTableId, status === 'Parked' ? 'Occupied' : 'Free');
      }

      saveOrderLocally();

      setSelectedTableId(null);
      setSelectedTableName('');
      setCart([]);
      setShowCheckout(false);
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
  const discountRate = settings?.defaultDiscount || 0.0;
    const discountAmount = subtotal * (discountRate / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxRate = settings?.defaultTaxRate || 5.0;
  const tax = subtotalAfterDiscount * (taxRate / 100);
  const total = subtotalAfterDiscount + tax;

  const filteredDishes = dishes
    .filter(d => selectedCategory ? d.category && d.category.id === selectedCategory : true)
    .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading POS Terminal...</div>;

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Checkout - Rs. {total.toFixed(2)}</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {['UPI', 'Cash', 'Card'].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m as any)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: paymentMethod === m ? '2px solid #0ea5e9' : '1px solid #cbd5e1', backgroundColor: paymentMethod === m ? '#f0f9ff' : 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {m}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowCheckout(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => placeOrder('Completed')} style={{ flex: 1, padding: '0.75rem', border: 'none', borderRadius: '8px', backgroundColor: '#0ea5e9', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Complete Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Left Menu Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem' }}>
                <button onClick={() => setViewMode('POS')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'POS' ? 'white' : 'transparent', color: viewMode === 'POS' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'POS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Monitor size={16} /> Point of Sale
                </button>
                <button onClick={() => setViewMode('Tables')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'Tables' ? 'white' : 'transparent', color: viewMode === 'Tables' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'Tables' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.LayoutGrid size={16} /> Tables
                </button>
                <button onClick={() => setViewMode('Reservations')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'Reservations' ? 'white' : 'transparent', color: viewMode === 'Reservations' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'Reservations' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Calendar size={16} /> Reservations
                </button>
              </div>
            </div>
            
            {viewMode === 'POS' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search dishes..." 
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', width: '250px' }}
                />
              </div>
            )}
        </div>

        {viewMode === 'POS' && (
          <>
            {/* Categories */}
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem', scrollbarWidth: 'none' }}>
              <button 
                onClick={() => setSelectedCategory(null)}
                style={{ flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: selectedCategory === null ? '#0ea5e9' : '#f1f5f9', color: selectedCategory === null ? 'white' : '#475569', transition: 'all 0.2s' }}>
                All Items
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{ flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: selectedCategory === cat.id ? '#0ea5e9' : '#f1f5f9', color: selectedCategory === cat.id ? 'white' : '#475569', transition: 'all 0.2s' }}>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Dishes Grid */}
            {dishes.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <Icons.UtensilsCrossed size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: 0, color: '#334155' }}>No Dishes Found</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Add dishes in the Menu Management module to start taking orders.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {filteredDishes.map(dish => (
                  <div key={dish.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ height: '140px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {dish.imageBase64 ? (
                        <img src={dish.imageBase64} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Icons.Image size={32} color="#cbd5e1" />
                      )}
                      {!dish.isAvailable && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{dish.name}</h3>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '1.125rem' }}>₹{dish.price}</span>
                      <button 
                        disabled={!dish.isAvailable}
                        onClick={() => addToCart(dish)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: dish.isAvailable ? '#f0f9ff' : '#f1f5f9', color: dish.isAvailable ? '#0284c7' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: dish.isAvailable ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                        Add to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Orders List (Latest 10) */}
            <div style={{
              marginTop: '1.75rem',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Receipt size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      Recent Orders (Latest 10)
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Showing latest orders placed ({recentOrders.length} / 10)
                    </span>
                  </div>
                </div>
                {recentOrders.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Clear local recent orders history?")) {
                        setRecentOrders([]);
                        localStorage.removeItem('pos_recent_orders');
                      }
                    }}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icons.Trash2 size={13} /> Clear List
                  </button>
                )}
              </div>

              {recentOrders.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1'
                }}>
                  No orders placed yet. Once an order is completed or parked, the latest 10 orders will appear here row-by-row.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '0.65rem 1rem' }}>Order #</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Type & Table</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Items Ordered</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Total Amount</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Payment</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((ord, idx) => (
                        <tr
                          key={ord.id ? `${ord.id}-${idx}` : idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            #{ord.orderNumber}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: ord.orderType === 'Dine-In' ? '#eff6ff' : '#f1f5f9',
                              color: ord.orderType === 'Dine-In' ? '#1d4ed8' : '#475569'
                            }}>
                              {ord.orderType === 'Dine-In' ? (
                                <>
                                  <Icons.UtensilsCrossed size={12} />
                                  {ord.tableName ? ord.tableName : 'Dine-In'}
                                </>
                              ) : (
                                <>
                                  <Icons.ShoppingBag size={12} />
                                  Takeaway
                                </>
                              )}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', maxWidth: '280px', color: '#334155' }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}>
                              {ord.items.length > 0
                                ? ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')
                                : '—'}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0284c7' }}>
                            ₹{Number(ord.totalAmount).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#475569',
                              backgroundColor: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {ord.paymentMethod || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: ord.status === 'Completed' ? '#ecfdf5' : '#fffbeb',
                              color: ord.status === 'Completed' ? '#059669' : '#d97706'
                            }}>
                              {ord.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                            {ord.createdAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'Tables' && (
          <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0' }}>
            {/* Top Floor Bar & Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              backgroundColor: 'white',
              borderBottom: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              {/* Floor Switcher */}
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '12px', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map(floorNum => (
                  <button
                    key={floorNum}
                    onClick={() => setActiveFloor(floorNum)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      backgroundColor: activeFloor === floorNum ? '#0ea5e9' : 'transparent',
                      color: activeFloor === floorNum ? 'white' : '#64748b',
                      boxShadow: activeFloor === floorNum ? '0 2px 4px rgba(14, 165, 233, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Floor {floorNum}
                  </button>
                ))}
              </div>

              {/* Status Legend & Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Free
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Occupied
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0f172a' }} /> Reserved
                  </div>
                </div>

                <button
                  onClick={() => setIsSetupModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 1.2rem',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)'
                  }}
                >
                  <Icons.SlidersHorizontal size={16} /> Configure Tables
                </button>
              </div>
            </div>

            {/* Subtitle / Overview */}
            <div style={{ padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Floor {activeFloor}</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.75rem', fontWeight: 500 }}>
                  {tables.length} {tables.length === 1 ? 'table' : 'tables'} configured
                </span>
              </div>
              {tables.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                  💡 Click any Free table to assign it for Dine-In
                </div>
              )}
            </div>

            {/* Table Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', position: 'relative' }}>
              {loadingTables ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  Loading tables for Floor {activeFloor}...
                </div>
              ) : tables.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '350px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '2px dashed #cbd5e1',
                  margin: '1.5rem',
                  padding: '2rem'
                }}>
                  <Icons.Armchair size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem' }}>
                    No Tables Configured on Floor {activeFloor}
                  </h3>
                  <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.875rem', textAlign: 'center', maxWidth: '360px' }}>
                    Get started by setting the table count and seating capacities for Floor {activeFloor}.
                  </p>
                  <button
                    onClick={() => setIsSetupModalOpen(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.25)'
                    }}
                  >
                    <Icons.Plus size={16} /> Configure Floor {activeFloor} Tables
                  </button>
                </div>
              ) : (
                <FloorTableLayout
                  tables={tables}
                  selectedTableId={selectedTableId}
                  onSelectTable={handleSelectTable}
                  onStatusChange={handleTableStatusChange}
                />
              )}
            </div>

            {/* Floating Action Bar when a table is selected */}
            {selectedTableId && (
              <div style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#0f172a',
                borderRadius: '32px',
                padding: '0.5rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                zIndex: 50
              }}>
                <span style={{ color: 'white', fontSize: '0.875rem', paddingLeft: '0.75rem' }}>Selected:</span>
                <div style={{
                  backgroundColor: 'white',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: '#0f172a'
                }}>
                  {selectedTableName}
                  <Icons.X
                    size={16}
                    style={{ cursor: 'pointer', color: '#64748b' }}
                    onClick={() => {
                      setSelectedTableId(null);
                      setSelectedTableName('');
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    setOrderType('Dine-In');
                    setViewMode('POS');
                  }}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Continue to POS <Icons.ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'Reservations' && (
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.CalendarDays size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No Reservations Today</h2>
            <p style={{ color: '#64748b', margin: 0 }}>Upcoming reservations will appear here.</p>
            <button style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              + New Reservation
            </button>
          </div>
        )}
      </div>

      {/* Right Order Sidebar */}
      <div style={{ width: '350px', backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.5rem 0' }}>Current Order</h2>
        
        {/* Order Type Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setOrderType('Dine-In')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Dine-In' ? 'white' : 'transparent', color: orderType === 'Dine-In' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Dine-In' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Dine-In
          </button>
          <button onClick={() => { setOrderType('Takeaway'); setSelectedTableId(null); setSelectedTableName(''); }} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Takeaway' ? 'white' : 'transparent', color: orderType === 'Takeaway' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Takeaway</button>
            <button onClick={() => { setOrderType('Delivery'); setSelectedTableId(null); setSelectedTableName(''); }} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Delivery' ? 'white' : 'transparent', color: orderType === 'Delivery' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Delivery' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Delivery</button>
        </div>
        
        {orderType === 'Dine-In' && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Selected Table:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: selectedTableName ? '#0ea5e9' : '#94a3b8' }}>
                {selectedTableName || 'None'}
              </span>
              {selectedTableName ? (
                <Icons.X
                  size={14}
                  style={{ cursor: 'pointer', color: '#64748b' }}
                  onClick={() => {
                    setSelectedTableId(null);
                    setSelectedTableName('');
                  }}
                />
              ) : (
                <button
                  onClick={() => setViewMode('Tables')}
                  style={{
                    border: 'none',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Choose
                </button>
              )}
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <Icons.ShoppingCart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Your order is empty</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            {cart.map(item => (
              <div key={item.dish.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{item.dish.name}</div>
                  <div style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.875rem' }}>₹{item.dish.price}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem' }}>
                  <button onClick={() => updateQuantity(item.dish.id, -1)} style={{ padding: '0.25rem', border: 'none', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Minus size={14} /></button>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.dish.id, 1)} style={{ padding: '0.25rem', border: 'none', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Plus size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            <span>Tax ({taxRate}%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              disabled={cart.length === 0}
              onClick={() => placeOrder('Parked')}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: cart.length === 0 ? '#f8fafc' : 'white', color: cart.length === 0 ? '#cbd5e1' : '#64748b', border: cart.length === 0 ? '1px solid #f1f5f9' : '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Icons.Clock size={18} />
              Park Order
            </button>
            <button 
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: cart.length === 0 ? '#cbd5e1' : '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
              Place Order
            </button>
          </div>
        </div>
      </div>

      {/* Table Configuration Modal */}
      <TableSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSave={handleSaveTableConfig}
        currentFloor={activeFloor}
        existingTables={tables.map(t => ({ capacity: t.capacity }))}
      />
    </div>
  );
}
