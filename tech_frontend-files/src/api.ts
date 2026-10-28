export const apiFetch = async (url: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const branchId = localStorage.getItem('activeBranchId');
  if (branchId && branchId !== 'global') {
    headers.set('X-Branch-Id', branchId);
  }
  
  let res = await fetch(url, { ...options, headers });
  
  if ((res.status === 401 || res.status === 403) && token && !url.includes('/api/auth/')) {
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

/**
 * Safe parser for order timestamps from Spring Boot / PostgreSQL.
 * If timestamp is an ISO string without timezone (e.g. "2026-10-28T15:47:00"),
 * it interprets it in Asia/Kolkata (IST: +05:30) to prevent browser timezone shifts.
 */
export const parseOrderDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  if (Array.isArray(dateVal)) {
    const [y, m, d, h = 0, min = 0, s = 0] = dateVal;
    const pad = (n: number) => String(n).padStart(2, '0');
    return new Date(`${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(s)}+05:30`);
  }
  if (typeof dateVal === 'number') {
    return new Date(dateVal);
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return new Date();
    // If it's already a time string like "03:47 PM" or "11:38 AM"
    if (/^\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)$/i.test(trimmed)) {
      const todayStr = new Date().toISOString().split('T')[0];
      return new Date(`${todayStr} ${trimmed}`);
    }
    // If it already includes a timezone offset (+/-HH:MM or +/-HHMM or Z)
    if (/[Z+-]\d\d(?::?\d\d)?$/i.test(trimmed) || trimmed.endsWith('Z')) {
      const parsed = new Date(trimmed);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    // ISO string without timezone e.g. "2026-10-28T15:47:00" or "2026-10-28 15:47:00"
    const normalized = trimmed.replace(' ', 'T');
    const parsed = new Date(`${normalized}+05:30`);
    if (!isNaN(parsed.getTime())) return parsed;
    const fallback = new Date(trimmed);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Format order time consistently in 12-hour AM/PM format for Asia/Kolkata (IST).
 * E.g., "03:47 PM"
 */
export const formatOrderTime = (dateVal: any): string => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (/^\d{1,2}:\d{2}\s*(?:AM|PM)$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
  }
  try {
    const d = parseOrderDate(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return String(dateVal);
  }
};

/**
 * Format order full date and time for Asia/Kolkata (IST).
 * E.g., "28 Oct 2026, 03:47 PM"
 */
export const formatOrderDateTime = (dateVal: any): string => {
  if (!dateVal) return '';
  try {
    const d = parseOrderDate(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return String(dateVal);
  }
};
