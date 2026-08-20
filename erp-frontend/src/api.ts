export const apiFetch = async (url: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  let res = await fetch(url, { ...options, headers });
  
  if (res.status === 401 && token && !url.includes('/api/auth/')) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshRes = await fetch('https://erp-api.neurolinx.in/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('token', data.token);
        headers.set('Authorization', `Bearer ${data.token}`);
        // Retry original request
        res = await fetch(url, { ...options, headers }); 
      } else {
        localStorage.clear();
        window.location.href = '/';
      }
    } else {
      localStorage.clear();
      window.location.href = '/';
    }
  }
  return res;
};
