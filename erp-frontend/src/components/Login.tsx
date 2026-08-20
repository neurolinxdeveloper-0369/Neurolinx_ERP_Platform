import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'SELECT' | 'PASSWORD' | 'OTP_VERIFY' | 'DEVICE_OTP'>('SELECT');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('https://erp-api.neurolinx.in/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, deviceId: getDeviceId() })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresDeviceOtp) {
          setLoginMode('DEVICE_OTP');
        } else {
          localStorage.setItem('token', data.token);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('username', email);
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('https://erp-api.neurolinx.in/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setLoginMode('OTP_VERIFY');
      } else {
        setError(data.message || 'Failed to request OTP');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('https://erp-api.neurolinx.in/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, deviceId: getDeviceId() })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresDeviceOtp) {
          setLoginMode('DEVICE_OTP');
          setOtp(''); // clear OTP for next step
        } else {
          localStorage.setItem('token', data.token);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('username', email);
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyDeviceOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('https://erp-api.neurolinx.in/api/auth/verify-device-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, deviceId: getDeviceId() })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('username', email);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('https://erp-api.neurolinx.in/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential, deviceId: getDeviceId() })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requiresDeviceOtp) {
          setEmail(data.email);
          setLoginMode('DEVICE_OTP');
        } else {
          localStorage.setItem('token', data.token);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('username', data.email);
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'No user found for this Google account.');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Left Side: Form */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
              {loginMode === 'OTP_VERIFY' ? 'Check your email' : 'Sign In'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              {loginMode === 'OTP_VERIFY' ? `We sent a 6-digit code to ${email}` : 'Choose a method to access your workspace'}
            </p>
          </div>

          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {loginMode === 'SELECT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google Login Failed')}
                  theme="outline"
                  size="large"
                  width="380"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 500, letterSpacing: '0.05em' }}>OR CONTINUE WITH EMAIL</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              </div>

              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Email address</label>
                  <input 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                
                <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' }}>
                  {isLoading ? 'Sending...' : 'Send OTP Login Code'}
                </button>

                <button type="button" onClick={() => setLoginMode('PASSWORD')} style={{ width: '100%', padding: '0.875rem', backgroundColor: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem', transition: 'background-color 0.2s' }}>
                  Sign in with Password
                </button>
              </form>
            </div>
          )}

          {loginMode === 'PASSWORD' && (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Email address</label>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '1rem', marginTop: '0.5rem' }}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              
              <button type="button" onClick={() => setLoginMode('SELECT')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}>
                Back to other options
              </button>
            </form>
          )}

          {loginMode === 'OTP_VERIFY' && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>6-Digit OTP</label>
                <input 
                  type="text" 
                  placeholder="123456" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  required 
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none', textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25rem' }}
                />
              </div>

              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '1rem', marginTop: '0.5rem' }}>
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              
              <button type="button" onClick={() => setLoginMode('SELECT')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}>
                Use a different method
              </button>
            </form>
          )}

          {loginMode === 'DEVICE_OTP' && (
            <form onSubmit={handleVerifyDeviceOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '6px', fontSize: '0.875rem', textAlign: 'center' }}>
                You are logging in from a new unrecognized device. Please check your email for a verification code to authorize this device.
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>6-Digit Device Authorization Code</label>
                <input 
                  type="text" 
                  placeholder="123456" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  required 
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box', outline: 'none', textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.25rem' }}
                />
              </div>

              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', backgroundColor: '#eab308', color: 'white', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '1rem', marginTop: '0.5rem' }}>
                {isLoading ? 'Verifying Device...' : 'Authorize Device & Continue'}
              </button>
              
              <button type="button" onClick={() => setLoginMode('SELECT')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}>
                Cancel
              </button>
            </form>
          )}

          <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '3rem', lineHeight: '1.5' }}>
            By continuing, you confirm you agree to Neurolinx contacting you about our product and services. You can opt out at any time. Find out more about how we use data in our privacy policy.
          </p>
        </div>
      </div>

      {/* Right Side: Branding (hidden on small screens, flex on large) */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem', backgroundColor: '#f8fafc', borderLeft: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
              N
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Neurolinx One</h2>
          </div>
          
          <h3 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem', lineHeight: '1.2' }}>
            Welcome to a new experience
          </h3>
          
          <p style={{ fontSize: '1rem', color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Neurolinx One is a software dedicated to you and your employees. Built on an entirely new type of data architecture, you'll have profiles and records of every interaction within your network in minutes, always updated in real-time.
          </p>
          
          <p style={{ fontSize: '1rem', color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            You'll be able to track your performance and attendance in the company seamlessly across our entire suite of global modules.
          </p>
          
          <p style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a' }}>
            Let's begin.
          </p>
        </div>
      </div>
      
    </div>
  );
}
