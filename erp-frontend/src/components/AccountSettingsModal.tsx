import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { apiFetch } from '../api';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';

export default function AccountSettingsModal({ onClose, username }: { onClose: () => void, username: string | null }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance'>('profile');
  const { isDark, theme, setTheme, isSyncing } = useTheme();
  
  // Security States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState('');
  
  // Profile States
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (activeTab === 'profile') {
      setIsLoading(true);
      apiFetch('https://erp-api.neurolinx.in/api/settings/my-company')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Not found');
        })
        .then(data => {
          setCompanyDetails(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [activeTab]);

  const handleSendOtp = async () => {
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
      setAccountMsg('Error connecting to server.');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setAccountMsg('Passwords do not match.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setAccountMsg('Password must be 8+ chars with upper, lower, number, and special char.');
      return;
    }
    
    try {
      const res = await fetch('https://erp-api.neurolinx.in/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, otp, newPassword })
      });
      if (res.ok) {
        setAccountMsg('Password changed successfully.');
      } else {
        setAccountMsg('Failed to change password. Invalid OTP?');
      }
    } catch (err) {
      setAccountMsg('Error changing password.');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setProfileMsg('');
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/settings/my-company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyDetails)
      });
      if (res.ok) {
        setProfileMsg('Profile updated successfully!');
      } else {
        setProfileMsg('Failed to update profile.');
      }
    } catch (err) {
      setProfileMsg('Error saving profile.');
    }
    setIsSaving(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ 
        backgroundColor: isDark ? '#1e293b' : '#ffffff', 
        border: isDark ? '1px solid #334155' : 'none',
        color: isDark ? '#f8fafc' : '#0f172a',
        padding: '2rem', 
        borderRadius: '16px', 
        width: '100%', 
        maxWidth: '620px', 
        maxHeight: '90vh', 
        overflowY: 'auto', 
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700 }}>Account Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b' }}>
            <Icons.X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ 
              padding: '0.75rem 1rem', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'profile' ? '2px solid #2563eb' : '2px solid transparent', 
              color: activeTab === 'profile' ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#64748b'), 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            Company Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            style={{ 
              padding: '0.75rem 1rem', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'security' ? '2px solid #2563eb' : '2px solid transparent', 
              color: activeTab === 'security' ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#64748b'), 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            Security & Password
          </button>
          <button 
            onClick={() => setActiveTab('appearance')}
            style={{ 
              padding: '0.75rem 1rem', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'appearance' ? '2px solid #2563eb' : '2px solid transparent', 
              color: activeTab === 'appearance' ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#64748b'), 
              fontWeight: 600, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Icons.Palette size={16} />
            Theme & Appearance
          </button>
        </div>

        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', margin: '0 0 0.4rem 0' }}>Interface Theme</h3>
              <p style={{ fontSize: '0.875rem', color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>
                Select your preferred interface display mode. This will be saved to your browser session.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Option 1: Light Mode Card */}
              <div
                onClick={() => setTheme('light')}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: theme === 'light' ? '2px solid #0284c7' : (isDark ? '1px solid #334155' : '1px solid #e2e8f0'),
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  boxShadow: theme === 'light' ? '0 0 0 3px rgba(2, 132, 199, 0.2)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: theme === 'light' ? '#0284c7' : (isDark ? '#f8fafc' : '#0f172a') }}>
                    <Icons.Sun size={20} color={theme === 'light' ? '#0284c7' : '#eab308'} />
                    Light Mode
                  </div>
                  {theme === 'light' && (
                    <span style={{ backgroundColor: '#0284c7', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.Check size={12} />
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.4' }}>
                  Clean, high-brightness layout ideal for daytime and bright workspace environments.
                </p>
              </div>

              {/* Option 2: Dark Mode Card */}
              <div
                onClick={() => setTheme('dark')}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: theme === 'dark' ? '2px solid #3b82f6' : (isDark ? '1px solid #334155' : '1px solid #e2e8f0'),
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  boxShadow: theme === 'dark' ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: theme === 'dark' ? '#3b82f6' : (isDark ? '#f8fafc' : '#0f172a') }}>
                    <Icons.Moon size={20} color={theme === 'dark' ? '#3b82f6' : '#64748b'} />
                    Dark Mode
                  </div>
                  {theme === 'dark' && (
                    <span style={{ backgroundColor: '#3b82f6', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.Check size={12} />
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.4' }}>
                  Sleek low-glare dark layout reducing eye strain and enhancing contrast in low-light settings.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem' }}>
              <ThemeSwitcher variant="pill" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                {isSyncing ? (
                  <>
                    <Icons.Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Syncing preference with server...</span>
                  </>
                ) : (
                  <>
                    <Icons.CheckCircle2 size={13} color="#16a34a" />
                    <span>Synced with server database</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'security' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>Account: {username}</p>
            {!otpSent ? (
              <button onClick={handleSendOtp} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                Send OTP to Email
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
                <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
                <button onClick={handleChangePassword} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  Verify & Change Password
                </button>
              </div>
            )}
            {accountMsg && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: accountMsg.includes('success') ? '#16a34a' : '#ef4444', textAlign: 'center' }}>{accountMsg}</p>}
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            {isLoading ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>Loading profile...</p>
            ) : companyDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>Company Name</label>
                    <input type="text" value={companyDetails.name || ''} onChange={e => setCompanyDetails({...companyDetails, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>Contact Number</label>
                    <input type="text" value={companyDetails.contactNumber || ''} onChange={e => setCompanyDetails({...companyDetails, contactNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>Address / Location</label>
                  <input type="text" value={companyDetails.address || ''} onChange={e => setCompanyDetails({...companyDetails, address: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>GSTIN</label>
                    <input type="text" value={companyDetails.gstin || ''} onChange={e => setCompanyDetails({...companyDetails, gstin: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>PAN Number</label>
                    <input type="text" value={companyDetails.panNumber || ''} onChange={e => setCompanyDetails({...companyDetails, panNumber: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>Food License (FSSAI)</label>
                    <input type="text" value={companyDetails.foodLicense || ''} onChange={e => setCompanyDetails({...companyDetails, foodLicense: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>Registration No.</label>
                    <input type="text" value={companyDetails.registrationNumber || ''} onChange={e => setCompanyDetails({...companyDetails, registrationNumber: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600, marginTop: '0.5rem' }}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                {profileMsg && <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: profileMsg.includes('success') ? '#16a34a' : '#ef4444', textAlign: 'center' }}>{profileMsg}</p>}
              </div>
            ) : (
              <p style={{ color: '#ef4444', textAlign: 'center' }}>Could not load company details. Are you a Master Admin?</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
