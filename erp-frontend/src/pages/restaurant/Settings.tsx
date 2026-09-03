import { useState } from 'react';
import * as Icons from 'lucide-react';

export default function RestaurantSettings() {
  const [taxRate, setTaxRate] = useState(5.0);
  const [discountPercent, setDiscountPercent] = useState(0.0);
  const [storeName, setStoreName] = useState('Spice Nation');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for dining with us!');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate saving to backend
    alert('Settings saved successfully! These taxes and discounts will now apply to all new orders.');
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>Store Settings</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Configure global tax rates, discounts, and receipt information.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Taxes and Discounts */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.Percent size={20} color="#0284c7" /> Taxes & Discounts
          </h2>
          
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Global Tax Rate (%)</label>
              <input type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Applies to the subtotal of all orders (e.g. GST).</p>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Default Discount (%)</label>
              <input type="number" step="0.1" value={discountPercent} onChange={e => setDiscountPercent(parseFloat(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Automatically applied to the order subtotal.</p>
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.Receipt size={20} color="#0284c7" /> Receipt Configuration
          </h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Store Name on Receipt</label>
            <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Receipt Footer Message</label>
            <textarea value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button type="submit" style={{ padding: '0.75rem 2rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
