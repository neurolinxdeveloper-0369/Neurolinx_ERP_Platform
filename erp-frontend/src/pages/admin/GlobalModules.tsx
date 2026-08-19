import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function GlobalModules() {
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://50.6.45.177:8088/api/admin/menu-items')
      .then(res => res.json())
      .then(data => setModules(data))
      .catch(err => console.error("Failed to load modules", err));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>Global Modules</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Manage all available menu items in the ERP system.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          <Plus size={18} />
          Add Module
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500' }}>Module Name</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500' }}>Route</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500' }}>Icon</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500' }}>Master Status</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem', color: '#111827', fontWeight: '500' }}>{mod.name}</td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>{mod.frontendRoute}</td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>{mod.icon}</td>
                <td style={{ padding: '1rem' }}>
                  {mod.isMasterEnabled ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', backgroundColor: '#d1fae5', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                      <CheckCircle size={14} /> Active
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                      <XCircle size={14} /> Disabled
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', marginRight: '0.5rem' }}><Edit2 size={18} /></button>
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {modules.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Loading modules...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
