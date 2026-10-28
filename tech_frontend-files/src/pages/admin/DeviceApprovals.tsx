import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { MonitorSmartphone, Shield, ShieldAlert, ShieldCheck, Smartphone, Check, Building2 } from 'lucide-react';

export default function DeviceApprovals() {
  const [devices, setDevices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDevices(), fetchCompanies()]).finally(() => setIsLoading(false));
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

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading device configurations...</div>;
  }

  return (
    <div style={{ padding: '0.5rem 0 2rem 0', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Pending Approvals Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ backgroundColor: '#fff7ed', padding: '0.625rem', borderRadius: '10px', color: '#ea580c' }}>
            <MonitorSmartphone size={24} strokeWidth={2.5} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.025em' }}>Pending Approvals</h1>
        </div>
        <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '1rem', marginLeft: '3.5rem' }}>
          Devices that hit the connection limit and require manual approval.
        </p>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', overflow: 'hidden', marginLeft: '3.5rem' }}>
          {devices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div style={{ display: 'inline-flex', backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                <ShieldCheck size={32} color="#059669" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.125rem' }}>All Clear</h3>
              <p style={{ color: '#64748b', margin: 0 }}>No pending device approvals at this time.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Employee Email</th>
                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Device Fingerprint</th>
                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device, i) => (
                    <tr key={i} style={{ borderBottom: i === devices.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background-color 0.15s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1.25rem 1.5rem', color: '#0f172a', fontWeight: 600 }}>{device.email}</td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Smartphone size={16} color="#94a3b8" />
                          <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.875rem', backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            {device.deviceId}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => approveDevice(device.id)} 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#10b981', color: 'white', padding: '0.625rem 1.25rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'background-color 0.2s', boxShadow: '0 1px 2px rgba(16, 185, 129, 0.2)' }}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#059669'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#10b981'}
                        >
                          <Check size={16} /> Approve Access
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Client Device Settings Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '0.625rem', borderRadius: '10px', color: '#2563eb' }}>
            <Building2 size={24} strokeWidth={2.5} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.025em' }}>Client Security Policies</h1>
        </div>
        <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '1rem', marginLeft: '3.5rem', maxWidth: '800px' }}>
          By default, clients are strictly limited to 3 active device sessions before they trigger a Master Admin approval request. You can override and bypass this security policy per-client below.
        </p>
        
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)', overflow: 'hidden', marginLeft: '3.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Client Profile</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Policy Status</th>
                  <th style={{ textAlign: 'right', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Override Controls</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, i) => (
                  <tr key={i} style={{ borderBottom: i === companies.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background-color 0.15s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{company.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{company.industryType}</div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {!company.bypassDeviceLimit ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                          <Shield size={14} /> LIMIT ENFORCED
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                          <ShieldAlert size={14} /> BYPASSED (UNLIMITED)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '8px', gap: '0.25rem' }}>
                        <button 
                          onClick={() => toggleBypassLimit(company.id, false)}
                          disabled={!company.bypassDeviceLimit}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.5rem 0.75rem', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: !company.bypassDeviceLimit ? 'not-allowed' : 'pointer',
                            backgroundColor: !company.bypassDeviceLimit ? 'white' : 'transparent',
                            color: !company.bypassDeviceLimit ? '#0f172a' : '#64748b',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            boxShadow: !company.bypassDeviceLimit ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          <ShieldCheck size={16} /> Enforce
                        </button>
                        <button 
                          onClick={() => toggleBypassLimit(company.id, true)}
                          disabled={company.bypassDeviceLimit}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.5rem 0.75rem', 
                            border: 'none', 
                            borderRadius: '6px', 
                            cursor: company.bypassDeviceLimit ? 'not-allowed' : 'pointer',
                            backgroundColor: company.bypassDeviceLimit ? 'white' : 'transparent',
                            color: company.bypassDeviceLimit ? '#dc2626' : '#64748b',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            boxShadow: company.bypassDeviceLimit ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          <ShieldAlert size={16} /> Bypass
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '3rem 0', textAlign: 'center', color: '#64748b' }}>No clients configured.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
