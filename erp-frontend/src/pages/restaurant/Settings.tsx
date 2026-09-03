import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { apiFetch } from '../../api';

export default function RestaurantSettings() {
  const [taxRate, setTaxRate] = useState(5.0);
  const [discountPercent, setDiscountPercent] = useState(0.0);
  const [storeName, setStoreName] = useState('Spice Nation');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for dining with us!');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [upiQrImageBase64, setUpiQrImageBase64] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Password Change States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState('');
  const username = localStorage.getItem('username');

  const handleSendOtp = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch('https://erp-api.neurolinx.in/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username })
      });
      if (res.ok) {
        setOtpSent(true);
        setAccountMsg('OTP sent to your email.');
      } else {
        setAccountMsg('Failed to send OTP.');
      }
    } catch (err) {
      setAccountMsg('Network error.');
    }
  };

  const handleChangePassword = async (e: any) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setAccountMsg('Passwords do not match.');
      return;
    }
    if (!otp) {
      setAccountMsg('Please enter OTP.');
      return;
    }
    try {
      const res = await fetch('https://erp-api.neurolinx.in/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, otp, newPassword })
      });
      if (res.ok) {
        setAccountMsg('Password changed successfully!');
        setOtpSent(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setAccountMsg(data.message || 'Failed to change password.');
      }
    } catch (err) {
      setAccountMsg('Network error.');
    }
  };

  useEffect(() => {
    apiFetch('https://erp-api.neurolinx.in/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.storeName) setStoreName(data.storeName);
        if (data.gstNumber) setGstNumber(data.gstNumber);
        if (data.address) setAddress(data.address);
        if (data.receiptFooter) setReceiptFooter(data.receiptFooter);
        if (data.defaultTaxRate !== undefined) setTaxRate(data.defaultTaxRate);
        if (data.defaultDiscount !== undefined) setDiscountPercent(data.defaultDiscount);
        if (data.upiQrImageBase64) setUpiQrImageBase64(data.upiQrImageBase64);
        setIsLoading(false);
      }).catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    apiFetch('https://erp-api.neurolinx.in/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName, gstNumber, address, receiptFooter, 
        defaultTaxRate: taxRate, defaultDiscount: discountPercent, upiQrImageBase64
      })
    }).then(() => {
      alert('Settings saved successfully!');
    });
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUpiQrImageBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading Settings...</div>;

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
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Default Discount (%)</label>
              <input type="number" step="0.1" value={discountPercent} onChange={e => setDiscountPercent(parseFloat(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.Receipt size={20} color="#0284c7" /> Receipt Configuration
          </h2>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Store Name</label>
              <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>GST Number</label>
              <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Restaurant Address</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Receipt Footer Message</label>
            <textarea value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Payment QR Code (Prints on Dine-In bills)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {upiQrImageBase64 && (
                <img src={upiQrImageBase64} alt="QR Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
              )}
              <label style={{ padding: '0.75rem 1.25rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', border: '1px dashed #cbd5e1' }}>
                <Icons.Upload size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Upload QR Image
                <input type="file" accept="image/*" onChange={handleQrUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        {/* Account & Security Settings */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icons.Lock size={20} color="#0284c7" /> Account & Security
          </h3>
          
          <div style={{ maxWidth: '400px' }}>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>Change password for account: <strong>{username}</strong></p>
            
            {!otpSent ? (
              <button 
                onClick={handleSendOtp}
                type="button"
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Send OTP to Email
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>6-Digit OTP</label>
                  <input type="text" placeholder="Enter OTP from email" value={otp} onChange={e => setOtp(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>New Password</label>
                  <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Confirm New Password</label>
                  <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
                </div>
                <button 
                  type="button"
                  onClick={handleChangePassword}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Verify & Change Password
                </button>
              </div>
            )}
            {accountMsg && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: accountMsg.includes('success') ? '#16a34a' : '#ef4444' }}>{accountMsg}</p>}
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
