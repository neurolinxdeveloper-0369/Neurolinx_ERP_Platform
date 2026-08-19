import { useState, useEffect } from 'react';
import { Plus, Users, Settings, Building2 } from 'lucide-react';

export default function ClientProvisioning() {
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://50.6.45.177:8088/api/admin/companies')
      .then(res => res.json())
      .then(data => setCompanies(data))
      .catch(err => console.error("Failed to load companies", err));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>Client Provisioning</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Manage client companies, roles, and module access.</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          <Plus size={18} />
          Create Client
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {companies.map((company, index) => (
          <div key={index} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '8px', color: '#3b82f6' }}>
                <Building2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#111827' }}>{company.name}</h3>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{company.industryType}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
              <button style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                <Users size={16} /> Roles
              </button>
              <button style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                <Settings size={16} /> Modules
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
