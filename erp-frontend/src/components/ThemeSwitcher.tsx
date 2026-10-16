import { useTheme } from '../context/ThemeContext';
import * as Icons from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'pill' | 'compact' | 'dropdown';
  className?: string;
}

export default function ThemeSwitcher({ variant = 'pill' }: ThemeSwitcherProps) {
  const { theme, setTheme, isDark } = useTheme();

  if (variant === 'dropdown') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', padding: '0.25rem 0.5rem' }}>
          Theme Preference
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: isDark ? '#0f172a' : '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setTheme('light')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: theme === 'light' ? '#ffffff' : 'transparent',
              color: theme === 'light' ? '#0284c7' : (isDark ? '#94a3b8' : '#64748b'),
              boxShadow: theme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Icons.Sun size={14} />
            <span>Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: theme === 'dark' ? '#3b82f6' : 'transparent',
              color: theme === 'dark' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
              boxShadow: theme === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Icons.Moon size={14} />
            <span>Dark Mode</span>
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        role="group"
        aria-label="Theme switcher"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
          padding: '3px',
          borderRadius: '9999px',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
        }}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          title="Light Mode"
          aria-pressed={theme === 'light'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: theme === 'light' ? '#0284c7' : 'transparent',
            color: theme === 'light' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Icons.Sun size={15} />
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          title="Dark Mode"
          aria-pressed={theme === 'dark'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: theme === 'dark' ? '#3b82f6' : 'transparent',
            color: theme === 'dark' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Icons.Moon size={15} />
        </button>
      </div>
    );
  }

  // Default: Prominent Pill Switcher with two explicit options (Light Mode & Dark Mode)
  return (
    <div
      role="group"
      aria-label="Theme switcher"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        padding: '3px',
        borderRadius: '9999px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        boxShadow: isDark 
          ? '0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)' 
          : '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Option 1: Light Mode */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
          backgroundColor: theme === 'light' ? '#0284c7' : 'transparent',
          color: theme === 'light' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
          boxShadow: theme === 'light' ? '0 1px 3px rgba(2, 132, 199, 0.3)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none'
        }}
      >
        <Icons.Sun size={15} style={{ strokeWidth: theme === 'light' ? 2.4 : 2 }} />
        <span>Light Mode</span>
      </button>

      {/* Option 2: Dark Mode */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
          backgroundColor: theme === 'dark' ? '#3b82f6' : 'transparent',
          color: theme === 'dark' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
          boxShadow: theme === 'dark' ? '0 1px 4px rgba(59, 130, 246, 0.4)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none'
        }}
      >
        <Icons.Moon size={15} style={{ strokeWidth: theme === 'dark' ? 2.4 : 2 }} />
        <span>Dark Mode</span>
      </button>
    </div>
  );
}
