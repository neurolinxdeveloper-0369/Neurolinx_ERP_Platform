import os

path = 'erp-frontend/src/components/MasterLayout.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add states
text = text.replace(
    "const [showProfileMenu, setShowProfileMenu] = useState(false);",
    """const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState('');"""
)

# 2. Add handlers
text = text.replace(
    "const handleLogout = () => {",
    """const handleSendOtp = async () => {
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

  const handleChangePassword = async () => {
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
        setTimeout(() => setShowAccountSettings(false), 2000);
      } else {
        const data = await res.json();
        setAccountMsg(data.message || 'Failed to change password.');
      }
    } catch (err) {
      setAccountMsg('Network error.');
    }
  };

  const handleLogout = () => {"""
)

# 3. Add onClick to Account Settings button
old_button = """                      <button 
                        style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#334155', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Icons.Settings size={16} />
                        Account Settings
                      </button>"""

new_button = """                      <button 
                        onClick={() => { setShowProfileMenu(false); setShowAccountSettings(true); setOtpSent(false); setAccountMsg(''); setOtp(''); setNewPassword(''); setConfirmPassword(''); }}
                        style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#334155', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Icons.Settings size={16} />
                        Account Settings
                      </button>"""

text = text.replace(old_button, new_button)

# 4. Add modal JSX before closing div of the component
modal_jsx = """
      {/* Account Settings Modal */}
      {showAccountSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>Account Settings</h2>
              <button onClick={() => setShowAccountSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <Icons.X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#334155' }}>Change Password</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>Account: {username}</p>
              
              {!otpSent ? (
                <button 
                  onClick={handleSendOtp}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Send OTP to Email
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
                  <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
                  <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' }} />
                  <button 
                    onClick={handleChangePassword}
                    style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Verify & Change Password
                  </button>
                </div>
              )}
              {accountMsg && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: accountMsg.includes('success') ? '#16a34a' : '#ef4444', textAlign: 'center' }}>{accountMsg}</p>}
            </div>
          </div>
        </div>
      )}
"""

text = text.replace("    </div>\n  );\n}", modal_jsx + "    </div>\n  );\n}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched MasterLayout.tsx")
