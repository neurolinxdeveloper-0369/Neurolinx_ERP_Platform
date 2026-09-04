import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { apiFetch } from '../../api';
import { usePrinter } from '../../context/PrinterContext';

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

export default function RestaurantOrders() {
  const { sendEscPos, connectedDevice } = usePrinter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway'>('Dine-In');
  const [viewMode, setViewMode] = useState<'POS' | 'Tables' | 'Reservations'>('POS');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [activeTableTab, setActiveTableTab] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<string>('1st Floor');
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  // Modals
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');

    const tableLayout = [
    { id: 'A1', type: 'square', seats: 4, status: 'available', x: 0, y: 0 },
    { id: 'A2', type: 'square', seats: 4, status: 'reserved', time: '17:00 PM', x: 1, y: 0 },
    { id: 'A3', type: 'rect-h', seats: 6, status: 'cant-select', x: 2, y: 0 },
    { id: 'A6', type: 'rect-h', seats: 4, status: 'in-progress', text: 'In Progress', orderId: 'DI104', x: 3, y: 0 },
    { id: 'A7', type: 'rect-v', seats: 6, status: 'reserved', time: '17:00 PM', x: 4, y: 0, rowSpan: 2 },
    
    { id: 'A4', type: 'square', seats: 4, status: 'available', x: 0, y: 1 },
    { id: 'A5', type: 'square', seats: 4, status: 'available', x: 1, y: 1 },
    { id: 'A8', type: 'square-lg', seats: 4, status: 'available', x: 2, y: 1 },
    { id: 'A9', type: 'square', seats: 4, status: 'available', x: 3, y: 1 },
    
    { id: 'A10', type: 'square', seats: 4, status: 'available', x: 0, y: 2 },
    { id: 'A11', type: 'rect-h-lg', seats: 4, status: 'in-progress', text: 'In Progress', orderId: 'DI105', x: 1, y: 2 },
    { id: 'A12', type: 'square', seats: 4, status: 'available', x: 2, y: 2 },
    { id: 'A13', type: 'rect-h-lg', seats: 6, status: 'in-progress', orderId: 'DI106', x: 3, y: 2 },
    { id: 'A14', type: 'rect-v-lg', seats: 6, status: 'cant-select', x: 4, y: 2 }
  ];

  const getTableColor = (status: string, isSelected: boolean) => {
    if (isSelected) return { bg: '#e2e8f0', border: '#3b82f6', text: '#1e293b' }; // Selected (A8)
    switch(status) {
      case 'available': return { bg: 'white', border: '#e2e8f0', text: '#1e293b' };
      case 'in-progress': return { bg: '#f59e0b', border: '#f59e0b', text: 'white' };
      case 'reserved': return { bg: '#0f172a', border: '#0f172a', text: 'white' };
      case 'cant-select': return { bg: '#e2e8f0', border: '#e2e8f0', text: '#64748b' };
      default: return { bg: 'white', border: '#e2e8f0', text: '#1e293b' };
    }
  };

  const renderChairs = (type: string, status: string) => {
    const chairColor = status === 'in-progress' ? '#f59e0b' : status === 'reserved' ? '#0f172a' : status === 'cant-select' ? '#cbd5e1' : '#f1f5f9';
    const chairStyle = { position: 'absolute' as 'absolute', backgroundColor: chairColor, borderRadius: '4px' };
    
    if (type === 'square' || type === 'square-lg') {
      return (
        <>
          <div style={{ ...chairStyle, top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, left: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} />
          <div style={{ ...chairStyle, right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} />
        </>
      );
    }
    if (type.includes('rect-h')) {
      return (
        <>
          <div style={{ ...chairStyle, top: '-8px', left: '20%', width: '24px', height: '6px' }} />
          {type === 'rect-h-lg' ? <div style={{ ...chairStyle, top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} /> : null}
          <div style={{ ...chairStyle, top: '-8px', right: '20%', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, bottom: '-8px', left: '20%', width: '24px', height: '6px' }} />
          {type === 'rect-h-lg' ? <div style={{ ...chairStyle, bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} /> : null}
          <div style={{ ...chairStyle, bottom: '-8px', right: '20%', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, left: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} />
          <div style={{ ...chairStyle, right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} />
        </>
      );
    }
    if (type.includes('rect-v')) {
      return (
        <>
          <div style={{ ...chairStyle, top: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '6px' }} />
          <div style={{ ...chairStyle, left: '-8px', top: '20%', width: '6px', height: '24px' }} />
          {type === 'rect-v-lg' ? <div style={{ ...chairStyle, left: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} /> : null}
          <div style={{ ...chairStyle, left: '-8px', bottom: '20%', width: '6px', height: '24px' }} />
          <div style={{ ...chairStyle, right: '-8px', top: '20%', width: '6px', height: '24px' }} />
          {type === 'rect-v-lg' ? <div style={{ ...chairStyle, right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '24px' }} /> : null}
          <div style={{ ...chairStyle, right: '-8px', bottom: '20%', width: '6px', height: '24px' }} />
        </>
      );
    }
    return null;
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
    payload = new Uint8Array([...payload, ...encoder.encode(`Order: ${orderNumber} | ${orderType} ${orderType === 'Dine-In' && selectedTable ? '('+selectedTable+')' : ''}\n`)]);
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
    const taxRate = settings?.defaultTaxRate || 5.0;
    const tax = total * (taxRate / 100);
    const finalTotal = total + tax;
    
    apiFetch('https://erp-api.neurolinx.in/api/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        orderType, 
        totalAmount: finalTotal, 
        taxApplied: tax,
        paymentMethod: status === 'Parked' ? null : paymentMethod,
        status: status,
        items: cart.map(c => ({ dishId: c.dish.id, quantity: c.quantity })) 
      })
    }).then(res => res.json()).then(order => {
      if (status === 'Completed') {
        alert("Order placed successfully!");
        
        if (connectedDevice) {
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
      setCart([]);
      setShowCheckout(false);
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
  const taxRate = settings?.defaultTaxRate || 5.0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

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
          </>
        )}

        {viewMode === 'Tables' && (
          <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '12px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Top Legend Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem', gap: '1rem', alignItems: 'center', backgroundColor: 'transparent', zIndex: 10 }}>
              <div style={{ display: 'flex', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', gap: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid #cbd5e1', backgroundColor: 'white' }} /> Available</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Not Available</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0f172a' }} /> Reserved</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} /> Can't Select</div>
              </div>
              <div style={{ display: 'flex', backgroundColor: 'white', padding: '0.25rem', borderRadius: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                {['1st Floor', '2nd Floor', '3rd Floor'].map(floor => (
                  <button key={floor} onClick={() => setActiveFloor(floor)} style={{ padding: '0.375rem 1rem', border: 'none', borderRadius: '20px', fontWeight: 600, cursor: 'pointer', backgroundColor: activeFloor === floor ? '#f1f5f9' : 'transparent', color: activeFloor === floor ? '#1e293b' : '#94a3b8' }}>
                    {floor}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Grid Area */}
            <div style={{ flex: 1, position: 'relative', overflowY: 'auto', padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(3, 140px)', gap: '2.5rem', paddingBottom: '5rem' }}>
                {tableLayout.map(t => {
                  const isSelected = activeTableTab === t.id;
                  const colors = getTableColor(t.status, isSelected);
                  
                  return (
                    <div key={t.id} style={{ 
                      gridColumn: t.x + 1, 
                      gridRow: `${t.y + 1} / span ${t.rowSpan || 1}`,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Chairs */}
                      {renderChairs(t.type, t.status)}
                      
                      {/* Table Body */}
                      <div 
                        onClick={() => t.status !== 'cant-select' && setActiveTableTab(t.id)}
                        style={{ 
                          width: t.type.includes('rect-h') ? '100%' : '80px', 
                          height: t.type.includes('rect-v') ? '100%' : '80px', 
                          backgroundColor: colors.bg,
                          border: `2px solid ${colors.border}`,
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          cursor: t.status === 'cant-select' ? 'not-allowed' : 'pointer',
                          boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
                          transition: 'all 0.2s',
                          zIndex: 2
                        }}>
                        
                        <span style={{ fontWeight: 700, color: colors.text }}>{t.id}</span>
                        
                        {/* Tags / Info */}
                        {t.time && (
                          <div style={{ position: 'absolute', bottom: '8px', backgroundColor: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icons.Clock size={10} /> {t.time}
                          </div>
                        )}
                        {t.text && (
                          <div style={{ position: 'absolute', bottom: '8px', backgroundColor: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icons.Coffee size={10} /> {t.text}
                          </div>
                        )}
                        {t.orderId && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.65rem', fontWeight: 700, color: 'white' }}>
                            {t.orderId}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Floating Action Bar */}
            {activeTableTab && (
              <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#0f172a', borderRadius: '32px', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', zIndex: 50 }}>
                <span style={{ color: 'white', fontSize: '0.875rem', paddingLeft: '1rem' }}>Table Selected:</span>
                <div style={{ backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                  Table {activeTableTab}
                  <Icons.X size={16} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => setActiveTableTab(null)} />
                </div>
                <button style={{ backgroundColor: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                  <Icons.CalendarDays size={16} /> Info Reservation
                </button>
                <button 
                  onClick={() => { setOrderType('Dine-In'); setSelectedTable(`Table ${activeTableTab}`); setViewMode('POS'); setActiveTableTab(null); }}
                  style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginRight: '0.25rem' }}>
                  Continue <Icons.ArrowRight size={16} />
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
          <button 
            onClick={() => setOrderType('Takeaway')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Takeaway' ? 'white' : 'transparent', color: orderType === 'Takeaway' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Takeaway
          </button>
        </div>
        
        {orderType === 'Dine-In' && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Selected Table:</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0ea5e9' }}>{selectedTable || 'None'}</span>
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
    </div>
  );
}
