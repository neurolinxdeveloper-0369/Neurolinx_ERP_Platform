/**
 * Utility functions for consistent Indian Standard Time (IST, UTC+05:30)
 * formatting across all orders, reports, dashboard, and kitchen screens.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

export function formatISTTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleTimeString('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateInput);
  }
}

export function formatISTDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateInput);
  }
}

export function formatISTDateTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const datePart = d.toLocaleDateString('en-IN', {
      timeZone: IST_TIMEZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-IN', {
      timeZone: IST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart}, ${timePart}`;
  } catch {
    return String(dateInput);
  }
}

export function getISTNowString(): string {
  return formatISTDateTime(new Date());
}

export function getISTTimeString(): string {
  return formatISTTime(new Date());
}

/**
 * Checks if a date matches today in IST (UTC+05:30)
 */
export function isTodayIST(dateInput: string | number | Date | null | undefined): boolean {
  if (!dateInput) return false;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    
    const dStr = d.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE }); // YYYY-MM-DD
    const nowStr = now.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
    return dStr === nowStr;
  } catch {
    return false;
  }
}

/**
 * Checks if a date falls within current month in IST
 */
export function isThisMonthIST(dateInput: string | number | Date | null | undefined): boolean {
  if (!dateInput) return false;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    
    const dStr = d.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE }).slice(0, 7); // YYYY-MM
    const nowStr = now.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE }).slice(0, 7);
    return dStr === nowStr;
  } catch {
    return false;
  }
}

/**
 * Checks if a date matches yesterday in IST (UTC+05:30)
 */
export function isYesterdayIST(dateInput: string | number | Date | null | undefined): boolean {
  if (!dateInput) return false;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dStr = d.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
    const yStr = yesterday.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
    return dStr === yStr;
  } catch {
    return false;
  }
}

/**
 * Checks if a date is within the past 7 days
 */
export function isPastWeekIST(dateInput: string | number | Date | null | undefined): boolean {
  if (!dateInput) return false;
  try {
    const d = new Date(dateInput).getTime();
    if (isNaN(d)) return false;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return d >= sevenDaysAgo;
  } catch {
    return false;
  }
}

/**
 * Returns elapsed minutes between order time and now
 */
export function getElapsedMinutes(dateInput: string | number | Date | null | undefined): number {
  if (!dateInput) return 0;
  try {
    const d = new Date(dateInput).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - d) / 60000));
  } catch {
    return 0;
  }
}
