import { useState } from 'react'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  }

  if (token) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Admin Panel</h1>
        <p>Welcome, {username}!</p>
        <p>Your Token: {token.substring(0, 20)}...</p>
        <button onClick={() => setToken('')}>Logout</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '300px', margin: '0 auto' }}>
      <h1>ERP Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default App
