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
  const [orderType, setOrderType] = useState<'Table' | 'Reservation'>('Table');
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  // Modals
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');

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
  
  const removeItem = (id: number) => {
    setCart(prev => prev.filter(item => item.dish.id !== id));
  };

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

  const generateCustomerReceipt = (orderNumber: string, total: number, tax: number) => {
    const ESC = 0x1b; const GS = 0x1d; const encoder = new TextEncoder();
    let payload = new Uint8Array([ESC, 0x40, ESC, 0x61, 0x01]);
    
    let storeName = settings?.storeName || "Neurolinx POS";
    payload = new Uint8Array([...payload, ESC, 0x21, 0x10, ...encoder.encode(`${storeName.toUpperCase()}\n`), ESC, 0x21, 0x00]);
    
    if (settings?.address) payload = new Uint8Array([...payload, ...encoder.encode(`${settings.address}\n`)]);
    if (settings?.gstNumber) payload = new Uint8Array([...payload, ...encoder.encode(`GST: ${settings.gstNumber}\n`)]);
    
    payload = new Uint8Array([...payload, ...encoder.encode("--------------------------------\n")]);
    payload = new Uint8Array([...payload, ...encoder.encode(`Order: ${orderNumber} | ${orderType}\n`)]);
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
    
    if (orderType === 'Table') {
        payload = new Uint8Array([...payload, ...encoder.encode("\nSCAN TO PAY (UPI)\n")]);
        // Here we just put a placeholder until image rasterizer is built
        payload = new Uint8Array([...payload, ...encoder.encode("[ QR CODE ]\n")]); 
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
            setTimeout(() => {
              sendEscPos(generateCustomerReceipt(order.orderNumber, finalTotal, tax));
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
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', color: '#1e293b' }}>Complete Order</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
              <span>Total to Pay:</span>
              <span style={{ color: '#0284c7' }}>₹{total.toFixed(2)}</span>
            </div>
            
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: '#475569' }}>Select Payment Method:</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              {['Cash', 'UPI', 'Card'].map(method => (
                <button key={method} onClick={() => setPaymentMethod(method as any)} style={{ flex: 1, padding: '1rem', border: paymentMethod === method ? '2px solid #0284c7' : '1px solid #cbd5e1', borderRadius: '8px', background: paymentMethod === method ? '#f0f9ff' : 'white', fontWeight: 600, color: paymentMethod === method ? '#0284c7' : '#475569', cursor: 'pointer' }}>
                  {method}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowCheckout(false)} style={{ flex: 1, padding: '1rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => placeOrder('Completed')} style={{ flex: 2, padding: '1rem', border: 'none', borderRadius: '8px', background: '#16a34a', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Icons.CheckCircle size={20} /> {connectedDevice ? 'Pay & Print Bills' : 'Pay & Complete'}
              </button>
            </div>
            {!connectedDevice && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '1rem', textAlign: 'center' }}>No printer connected. KOT will not print.</p>}
          </div>
        </div>
      )}

      {/* Left Menu Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Point of Sale</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dishes..." 
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', width: '250px' }}
            />
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <button 
            onClick={() => setSelectedCategory(null)}
            style={{ 
              padding: '0.5rem 1.25rem', borderRadius: '999px', border: 'none', fontWeight: 600, cursor: 'pointer',
              backgroundColor: selectedCategory === null ? '#0284c7' : '#f1f5f9',
              color: selectedCategory === null ? 'white' : '#475569',
              whiteSpace: 'nowrap'
            }}>
            All Items
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{ 
                padding: '0.5rem 1.25rem', borderRadius: '999px', border: 'none', fontWeight: 600, cursor: 'pointer',
                backgroundColor: selectedCategory === cat.id ? '#0284c7' : '#f1f5f9',
                color: selectedCategory === cat.id ? 'white' : '#475569',
                whiteSpace: 'nowrap'
              }}>
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
                {dish.isTodaysSpecial && <div style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#f59e0b', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>SPECIAL</div>}
                
                <div style={{ height: '120px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {dish.imageBase64 ? <img src={dish.imageBase64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icons.Image size={32} color="#cbd5e1" />}
                </div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b', fontSize: '1rem' }}>{dish.name}</h4>
                <p style={{ margin: 0, color: '#0284c7', fontWeight: 700, fontSize: '1.125rem' }}>₹{dish.price}</p>
                <button 
                  onClick={() => addToCart(dish)}
                  disabled={!dish.isAvailable}
                  style={{ 
                    marginTop: '1rem', padding: '0.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: dish.isAvailable ? 'pointer' : 'not-allowed',
                    backgroundColor: dish.isAvailable ? '#f0f9ff' : '#f1f5f9', color: dish.isAvailable ? '#0284c7' : '#94a3b8'
                  }}>
                  {dish.isAvailable ? 'Add to Order' : 'Out of Stock'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Order Sidebar */}
      <div style={{ width: '350px', backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.5rem 0' }}>Current Order</h2>
        
        {/* Order Type Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setOrderType('Table')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Table' ? 'white' : 'transparent', color: orderType === 'Table' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Icons.Monitor size={18} /> Table
          </button>
          <button 
            onClick={() => setOrderType('Reservation')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Reservation' ? 'white' : 'transparent', color: orderType === 'Reservation' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Reservation' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Icons.Calendar size={18} /> Reservation
          </button>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem' }}>
          {cart.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <Icons.ShoppingCart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Your order is empty</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => (
                <div key={item.dish.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 0.25rem 0', color: '#1e293b', fontSize: '0.875rem' }}>{item.dish.name}</h5>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>₹{item.dish.price}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <button onClick={() => updateQuantity(item.dish.id, -1)} style={{ border: 'none', background: 'white', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}><Icons.Minus size={14} /></button>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155', width: '16px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.dish.id, 1)} style={{ border: 'none', background: 'white', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0284c7' }}><Icons.Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeItem(item.dish.id)} style={{ border: 'none', background: '#fee2e2', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626' }}><Icons.Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
            <span>Tax ({taxRate}%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.25rem', fontWeight: 800 }}>
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => placeOrder('Parked')}
              disabled={cart.length === 0}
              style={{ 
                flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.875rem', cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                backgroundColor: 'white', color: cart.length > 0 ? '#475569' : '#94a3b8'
              }}>
              <Icons.Clock size={16} style={{ display: 'block', margin: '0 auto 0.25rem' }}/> Park Order
            </button>
            <button 
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              style={{ 
                flex: 2, padding: '1rem', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                backgroundColor: cart.length > 0 ? '#0284c7' : '#cbd5e1', color: 'white', boxShadow: cart.length > 0 ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
              }}>
              Place Order
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
