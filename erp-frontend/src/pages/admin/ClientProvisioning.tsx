import { useState, useEffect } from 'react';
import { Plus, Users, Settings, Building2, X } from 'lucide-react';

export default function ClientProvisioning() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [companyName, setCompanyName] = useState('');
  const [industryType, setIndustryType] = useState('Restaurant');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('http://50.6.45.177:8088/api/admin/companies')
      .then(res => res.json())
      .then(data => setCompanies(data))
      .catch(err => console.error("Failed to load companies", err));
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const res = await fetch('http://50.6.45.177:8088/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, industryType, username, password })
      });
      
      if (res.ok) {
        const newClient = await res.json();
        setCompanies([...companies, newClient]);
        setShowModal(false);
        setCompanyName('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
      } else {
        alert('Failed to create client');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem' }}>Client Provisioning</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Manage client companies, roles, and module access.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
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
        {companies.length === 0 && (
          <p style={{ color: '#6b7280' }}>No clients found. Click "Create Client" to add one.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Create New Client</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Company Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Joe's Cafe"
                  required
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Industry Type</label>
                <select 
                  value={industryType}
                  onChange={e => setIndustryType(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                >
                  <option value="Restaurant">Restaurant</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Hybrid (Hotel & Restaurant)">Hybrid (Hotel & Restaurant)</option>
                  <option value="Software">Software</option>
                  <option value="Hybrid (Software & Hardware)">Hybrid (Software & Hardware)</option>
                  <option value="Electronics (Manufacturing & Assembly)">Electronics (Manufacturing & Assembly)</option>
                </select>
              </div>

              <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#374151' }}>Client Admin Account</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="e.g. joe_admin"
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter a secure password"
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>Confirm Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      required
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                {isSubmitting ? 'Creating...' : 'Save Client'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
