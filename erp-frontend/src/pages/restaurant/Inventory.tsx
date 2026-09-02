import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

export default function RestaurantInventory() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // API call will go here
    setIsLoading(false);
  }, []);

  const FilterPill = ({ label, count, active }: { label: string, count: number, active?: boolean }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.5rem 0.75rem',
      borderRadius: '8px',
      border: active ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
      backgroundColor: active ? '#eff6ff' : '#f8fafc',
      cursor: 'pointer',
      color: active ? '#1e293b' : '#64748b',
      fontWeight: active ? 600 : 500,
      fontSize: '0.85rem',
      transition: 'all 0.2s ease',
      flex: '1 1 calc(50% - 0.5rem)',
      minWidth: '100px'
    }}>
      {label}
      <span style={{
        backgroundColor: active ? '#3b82f6' : '#e2e8f0',
        color: active ? 'white' : '#94a3b8',
        padding: '0.15rem 0.45rem',
        borderRadius: '9999px',
        fontSize: '0.65rem',
        fontWeight: 700
      }}>
        {count}
      </span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Icons.Archive size={20} color="#334155" />
            <span style={{ fontWeight: 700, color: '#334155', fontSize: '1rem' }}>Inventory</span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button style={{ backgroundColor: 'white', color: '#1e293b', border: '1px solid #e2e8f0', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Menu</button>
            <button style={{ backgroundColor: 'transparent', color: '#94a3b8', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Ingredients</button>
            <button style={{ backgroundColor: 'transparent', color: '#94a3b8', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Request List</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ maxWidth: '400px', position: 'relative', flex: 1 }}>
            <Icons.Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search Dish Name Here" 
              style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem', color: '#334155', boxSizing: 'border-box' }}
            />
          </div>

          <button style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 1px 3px rgba(59,130,246,0.3)' }}>
            <Icons.Plus size={18} />
            Add New Dish
          </button>
        </div>
      </div>

      {/* Main Content Split */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, alignItems: 'flex-start' }}>
        
        {/* Left Filter Sidebar */}
        <div style={{ width: '280px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 700 }}>Filter</h3>
          
          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dishes Status</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <FilterPill label="All" count={0} active={true} />
              <FilterPill label="Available" count={0} />
              <FilterPill label="Not Available" count={0} />
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Level</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <FilterPill label="All" count={0} active={true} />
              <FilterPill label="Low" count={0} />
              <FilterPill label="Medium" count={0} />
              <FilterPill label="High" count={0} />
              <FilterPill label="Empty" count={0} />
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <FilterPill label="All" count={0} active={true} />
              <FilterPill label="Soup" count={0} />
              <FilterPill label="Noodle" count={0} />
              <FilterPill label="Rice" count={0} />
              <FilterPill label="Dessert" count={0} />
              <FilterPill label="Drink" count={0} />
            </div>
          </div>

          <button style={{ marginTop: '0.5rem', backgroundColor: 'white', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s ease' }}>
            <Icons.RotateCcw size={16} />
            Reset Filter
          </button>
        </div>

        {/* Right Menu List */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: 700 }}>Menu List</h3>
          
          {/* Empty State */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <>
                <Icons.UtensilsCrossed size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: 0, color: '#334155', fontSize: '1.25rem', fontWeight: 600 }}>No dishes in inventory</h3>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>Click "Add New Dish" to build your menu.</p>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
