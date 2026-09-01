import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';

export default function DeviceApprovals() {
  const [devices, setDevices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    fetchDevices();
    fetchCompanies();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/admin/pending-devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/admin/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const approveDevice = async (id: number) => {
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/admin/approve-device/' + id, { method: 'POST' });
      if (res.ok) {
        fetchDevices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBypassLimit = async (companyId: number, bypass: boolean) => {
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/admin/companies/' + companyId + '/bypass-limit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bypass })
      });
      if (res.ok) {
        fetchCompanies();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem', marginBottom: '1rem' }}>Client Device Settings</h1>
        <p style={{ color: '#4b5563', marginBottom: '1rem' }}>By default, clients are limited to 3 active device sessions before they require Master Admin approval. Toggle "Unlimited Devices" to disable this rule for a specific client.</p>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <thead style={{ backgroundColor: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Client Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Industry</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Device Limit Rule</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, i) => (
              <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem', color: '#111827' }}>{company.name}</td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>{company.industryType}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      backgroundColor: !company.bypassDeviceLimit ? '#d1fae5' : '#fee2e2',
                      color: !company.bypassDeviceLimit ? '#065f46' : '#991b1b'
                    }}>
                      {!company.bypassDeviceLimit ? 'Limit Enforced' : 'Unlimited (Bypassed)'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleBypassLimit(company.id, false)}
                        disabled={!company.bypassDeviceLimit}
                        style={{ 
                          padding: '0.375rem 0.75rem', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: !company.bypassDeviceLimit ? 'not-allowed' : 'pointer',
                          backgroundColor: !company.bypassDeviceLimit ? '#e5e7eb' : '#10b981',
                          color: !company.bypassDeviceLimit ? '#9ca3af' : 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        Enable Limit
                      </button>
                      <button 
                        onClick={() => toggleBypassLimit(company.id, true)}
                        disabled={company.bypassDeviceLimit}
                        style={{ 
                          padding: '0.375rem 0.75rem', 
                          border: 'none', 
                          borderRadius: '4px', 
                          cursor: company.bypassDeviceLimit ? 'not-allowed' : 'pointer',
                          backgroundColor: company.bypassDeviceLimit ? '#e5e7eb' : '#ef4444',
                          color: company.bypassDeviceLimit ? '#9ca3af' : 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        Disable Limit
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No clients found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem', marginBottom: '1rem' }}>Pending Approvals</h1>
        {devices.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No pending device approvals.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: '#f3f4f6' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Device ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, i) => (
                <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', color: '#111827' }}>{device.email}</td>
                  <td style={{ padding: '1rem', color: '#6b7280', fontFamily: 'monospace' }}>{device.deviceId}</td>
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => approveDevice(device.id)} style={{ backgroundColor: '#10b981', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Approve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
