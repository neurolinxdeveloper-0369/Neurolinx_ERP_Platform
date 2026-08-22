import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';

export default function DeviceApprovals() {
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    fetchDevices();
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

  const approveDevice = async (id: number) => {
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/admin/approve-device/${id}`, { method: 'POST' });
      if (res.ok) {
        fetchDevices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 style={{ margin: 0, color: '#111827', fontSize: '1.5rem', marginBottom: '2rem' }}>Device Approvals</h1>
      {devices.length === 0 ? (
        <p>No pending device approvals.</p>
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
  );
}
