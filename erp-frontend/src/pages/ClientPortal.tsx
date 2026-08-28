import { useEffect, useState } from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Plus, Minus } from 'lucide-react';

export default function ClientPortal() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const table = searchParams.get('table');
  
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<{ name: string; logo: string } | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  
  // Dummy Menu Data
  const categories = ['Starters', 'Main Course', 'Desserts', 'Beverages'];
  const [activeCategory, setActiveCategory] = useState('Starters');
  
  const menuItems = [
    { id: 1, category: 'Starters', name: 'Paneer Tikka', price: 250, type: 'veg', desc: 'Spiced cottage cheese roasted in tandoor.' },
    { id: 2, category: 'Starters', name: 'Chicken 65', price: 320, type: 'non-veg', desc: 'Spicy, deep-fried chicken piece with curry leaves.' },
    { id: 3, category: 'Main Course', name: 'Butter Chicken', price: 450, type: 'non-veg', desc: 'Creamy tomato gravy with tender chicken chunks.' },
    { id: 4, category: 'Main Course', name: 'Dal Makhani', price: 280, type: 'veg', desc: 'Slow-cooked black lentils with butter and cream.' },
    { id: 5, category: 'Desserts', name: 'Gulab Jamun', price: 120, type: 'veg', desc: 'Sweet fried dumplings in rose-flavored syrup.' },
    { id: 6, category: 'Beverages', name: 'Fresh Lime Soda', price: 90, type: 'veg', desc: 'Refreshing lime drink with mint.' },
  ];

  useEffect(() => {
    fetch('https://erp-api.neurolinx.in/api/auth/client/' + slug)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setClient(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [slug]);

  const updateCart = (id: number, delta: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((total, [id, qty]) => {
    const item = menuItems.find(m => m.id === parseInt(id));
    return total + (item ? item.price * qty : 0);
  }, 0);

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>Loading Menu...</div>;
  if (!client) return <Navigate to="/" replace />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: totalItems > 0 ? '80px' : '0' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {client.logo ? (
            <img src={client.logo} alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#6b7280' }}>
              {client.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', fontWeight: 'bold' }}>{client.name}</h1>
            {table && <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: '500' }}>Table {table}</div>}
          </div>
        </div>
      </div>

      {/* Categories Scroll */}
      <div style={{ backgroundColor: 'white', padding: '0.75rem 1rem', overflowX: 'auto', display: 'flex', gap: '0.75rem', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              padding: '0.5rem 1rem', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: '500',
              backgroundColor: activeCategory === cat ? '#111827' : '#f3f4f6',
              color: activeCategory === cat ? 'white' : '#4b5563'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {menuItems.filter(m => m.category === activeCategory).map(item => (
          <div key={item.id} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ width: '12px', height: '12px', border: item.type === 'veg' ? '1px solid #10b981' : '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: item.type === 'veg' ? '#10b981' : '#ef4444' }}></div>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#111827', fontWeight: '600' }}>{item.name}</h3>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>₹{item.price}</div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.4 }}>{item.desc}</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
              {!cart[item.id] ? (
                <button onClick={() => updateCart(item.id, 1)} style={{ backgroundColor: '#fef08a', color: '#854d0e', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  ADD
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fef08a', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  <button onClick={() => updateCart(item.id, -1)} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: '#854d0e' }}><Minus size={16} /></button>
                  <span style={{ fontWeight: 'bold', color: '#854d0e', padding: '0 0.5rem' }}>{cart[item.id]}</span>
                  <button onClick={() => updateCart(item.id, 1)} style={{ background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: '#854d0e' }}><Plus size={16} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Cart Footer */}
      {totalItems > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', backgroundColor: 'white', borderTop: '1px solid #e5e7eb', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.1)' }}>
          <button style={{ width: '100%', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '1rem', borderRadius: '8px', fontSize: '1.125rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <span>{totalItems} Item{totalItems > 1 ? 's' : ''} | ₹{totalPrice}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>View Cart <ChevronRight size={20} /></span>
          </button>
        </div>
      )}
    </div>
  );
}
