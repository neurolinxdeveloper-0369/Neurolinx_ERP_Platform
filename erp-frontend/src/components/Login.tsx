import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('http://50.6.45.177:8088/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setShowOtpScreen(true);
      } else {
        setError(data.message || 'Login failed');
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
      const res = await fetch('http://50.6.45.177:8088/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', email); // We store email as username in frontend for now
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

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Left Side: Form */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.5rem 0' }}>
              {showOtpScreen ? 'Check your email' : 'Sign In'}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              {showOtpScreen ? `We sent a 6-digit code to ${email}` : 'Enter your credentials to access your workspace'}
            </p>
          </div>

          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!showOtpScreen ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '1rem', marginTop: '0.5rem', transition: 'background-color 0.2s' }}>
                {isLoading ? 'Signing in...' : 'Sign In with Email'}
              </button>
            </form>
          ) : (
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

              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '0.875rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '1rem', marginTop: '0.5rem', transition: 'background-color 0.2s' }}>
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              
              <button type="button" onClick={() => setShowOtpScreen(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}>
                Use a different email
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
