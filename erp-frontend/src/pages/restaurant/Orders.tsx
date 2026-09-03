import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { apiFetch } from '../../api';

interface Dish {
  id: number;
  name: string;
  price: number;
  category: { id: number, name: string };
  isAvailable: boolean;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway'>('Dine-In');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/pos/categories').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/pos/dishes').then(res => res.json())
    ]).then(([cats, items]) => {
      setCategories(cats);
      setDishes(items);
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

  const placeOrder = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
    apiFetch('https://erp-api.neurolinx.in/api/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderType, totalAmount: total, items: cart.map(c => ({ dishId: c.dish.id, quantity: c.quantity })) })
    }).then(res => res.json()).then(() => {
      alert("Order placed successfully!");
      setCart([]);
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const filteredDishes = selectedCategory ? dishes.filter(d => d.category && d.category.id === selectedCategory) : dishes;

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading POS Terminal...</div>;

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Left Menu Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Point of Sale</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Search dishes..." 
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
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
          {categories.length === 0 && (
            <span style={{ color: '#94a3b8', fontStyle: 'italic', alignSelf: 'center' }}>No categories created yet.</span>
          )}
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
              <div key={dish.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '120px', backgroundColor: '#f1f5f9', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Image size={32} color="#cbd5e1" />
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
            onClick={() => setOrderType('Dine-In')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Dine-In' ? 'white' : 'transparent', color: orderType === 'Dine-In' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Dine-In' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Dine-In
          </button>
          <button 
            onClick={() => setOrderType('Takeaway')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Takeaway' ? 'white' : 'transparent', color: orderType === 'Takeaway' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            Takeaway
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '0.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <button onClick={() => updateQuantity(item.dish.id, -1)} style={{ border: 'none', background: 'white', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}><Icons.Minus size={14} /></button>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#334155', width: '16px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.dish.id, 1)} style={{ border: 'none', background: 'white', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0284c7' }}><Icons.Plus size={14} /></button>
                  </div>
                  <div style={{ width: '60px', textAlign: 'right', fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>
                    ₹{item.dish.price * item.quantity}
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
            <span>Tax (5%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.25rem', fontWeight: 800 }}>
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <button 
            onClick={placeOrder}
            disabled={cart.length === 0}
            style={{ 
              width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
              backgroundColor: cart.length > 0 ? '#0284c7' : '#cbd5e1', color: 'white', boxShadow: cart.length > 0 ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none'
            }}>
            Place Order
          </button>
        </div>
      </div>
      
    </div>
  );
}
