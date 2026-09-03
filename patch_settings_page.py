import os

path = 'erp-frontend/src/pages/restaurant/Settings.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add states
state_injection = """  const [isLoading, setIsLoading] = useState(true);

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
  };"""

text = text.replace("  const [isLoading, setIsLoading] = useState(true);", state_injection)


# Add UI
ui_injection = """        </div>

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

        <div style={{ textAlign: 'right' }}>"""

text = text.replace("        </div>\n\n        <div style={{ textAlign: 'right' }}>", ui_injection)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched Settings.tsx")
