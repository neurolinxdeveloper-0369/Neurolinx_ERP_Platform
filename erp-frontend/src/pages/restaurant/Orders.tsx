import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function RestaurantOrders() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Expected future API call to fetch orders...
    // Per requirements: no hardcoded data, all values 0 if no orders
    setIsLoading(false);
  }, []);

  const Tab = ({ label, count, active }: { label: string, count: number, active?: boolean }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      border: active ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
      backgroundColor: active ? '#eff6ff' : 'white',
      cursor: 'pointer',
      color: active ? '#1e293b' : '#64748b',
      fontWeight: active ? 600 : 500,
      fontSize: '0.875rem',
      transition: 'all 0.2s ease'
    }}>
      {label}
      <span style={{
        backgroundColor: active ? '#3b82f6' : '#f1f5f9',
        color: active ? 'white' : '#94a3b8',
        padding: '0.1rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 700
      }}>
        {count}
      </span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Icons.FileText size={20} color="#334155" />
          <span style={{ fontWeight: 700, color: '#334155', fontSize: '1rem' }}>Order</span>
        </div>

        <div style={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
          <Icons.Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search Order ID or Customer Name" 
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem', color: '#334155', boxSizing: 'border-box' }}
          />
        </div>

        <button style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 1px 3px rgba(59,130,246,0.3)' }}>
          <Icons.Plus size={18} />
          Create New Order
        </button>
      </div>

      {/* Tabs and Sort Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Tab label="All" count={0} active={true} />
          <Tab label="In Progress" count={0} />
          <Tab label="Ready to Served" count={0} />
          <Tab label="Waiting for Payment" count={0} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '0.875rem', color: '#334155', fontWeight: 500 }}>
          <span>Sort by: <strong>Latest Order</strong></span>
          <Icons.ChevronDown size={16} color="#64748b" />
        </div>
      </div>

      {/* Content Area - No Mock Data */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', minHeight: '500px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <Icons.Inbox size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: 0, color: '#334155', fontSize: '1.25rem', fontWeight: 600 }}>No orders today</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>When new orders arrive, they will appear here.</p>
          </>
        )}
      </div>
    </div>
  );
}
