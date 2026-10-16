import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import AccountSettingsModal from './AccountSettingsModal';
import { apiFetch } from '../api';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';

export default function MasterLayout() {
  const [menus, setMenus] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [branches, setBranches] = useState<any[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string>(localStorage.getItem('activeBranchId') || 'global');
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username');
  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const isMasterAdmin = username === 'admin' || username === 'neurolinxdeveloper@gmail.com' || localStorage.getItem('role') === 'Master Admin';
  const companyName = isMasterAdmin ? 'NGPL' : (localStorage.getItem('companyName') || (localStorage.getItem('industryType') === 'Restaurant' ? 'Restaurant POS' : 'Admin Portal'));
  const companyLogo = localStorage.getItem('companyLogo');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
      return;
    }

    if (username === 'admin' || username === 'neurolinxdeveloper@gmail.com') {
      setMenus([
        { id: 1001, name: "Dashboard", route: "/dashboard", icon: "layout-dashboard", parentId: 0 },
        { id: 1002, name: "Clients", route: "/clients", icon: "users", parentId: 0 },
        { id: 1003, name: "Device Approvals", route: "/approvals", icon: "shield-check", parentId: 0 },
        { id: 1004, name: "Global Modules", route: "/settings", icon: "settings", parentId: 0 }
      ]);
    } else {
      apiFetch('https://erp-api.neurolinx.in/api/menus/my-menus/' + username)
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) return;
          const filtered = data.filter((m: any) => m.route !== '/res-qr-ordering' && m.name !== 'QR Ordering');
          if (!filtered.some((m: any) => m.route === '/res-dashboard' || m.route === '/dashboard')) {
            filtered.unshift({ id: -1, name: "Dashboard", route: "/res-dashboard", icon: "layout-dashboard", parentId: null });
          }
          setMenus(filtered);
        })
        .catch(err => console.error("Failed to load menus", err));
    }

    if (username !== 'admin' && username !== 'neurolinxdeveloper@gmail.com') {
      apiFetch('https://erp-api.neurolinx.in/api/branches')
        .then(res => res.json())
        .then(data => setBranches(data))
        .catch(err => console.error(err));
    }
  }, [navigate, username]);




  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const renderIcon = (iconName: string) => {
    if (!iconName) return <Icons.Circle size={16} />;
    const IconComponent = (Icons as any)[
      iconName.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
    ] || Icons.Circle;
    return <IconComponent size={20} />;
  };

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const parentMenus = menus.filter(m => !m.parentId || m.parentId === 0);

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: isDark ? '#0b1120' : '#f9fafb', transition: 'background-color 0.2s ease' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '250px', 
        backgroundColor: isDark ? '#111827' : '#ffffff', 
        borderRight: isDark ? '1px solid #1f2937' : 'none', 
        boxShadow: isDark ? '4px 0 20px rgba(0,0,0,0.5)' : '4px 0 15px rgba(0,0,0,0.05)', 
        color: isDark ? '#cbd5e1' : '#374151', 
        display: 'flex', 
        flexDirection: 'column', 
        zIndex: 50,
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}>
        <div style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 1.5rem', fontSize: '1.25rem', fontWeight: 'bold', borderBottom: 'none', boxSizing: 'border-box' }}>
          <span style={{ color: isDark ? '#60a5fa' : '#1d4ed8' }}>Neurolinx</span><span style={{ color: isDark ? '#f8fafc' : '#1e293b' }}>One</span>
        </div>
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {parentMenus.map((menu, index) => {
            const children = menus.filter(m => m.parentId === menu.id);
            const hasChildren = children.length > 0;
            const isExpanded = expanded[menu.id];
            const isCurrent = location.pathname === menu.route;
            
            return (
              <div key={index}>
                <Link 
                  to={hasChildren ? '#' : menu.route}
                  onClick={hasChildren ? (e) => toggleExpand(menu.id, e) : undefined}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '0.75rem', 
                    color: isCurrent 
                      ? (isDark ? '#93c5fd' : '#0284c7') 
                      : (isDark ? '#94a3b8' : '#475569'), 
                    textDecoration: 'none', 
                    borderRadius: '8px', 
                    fontWeight: '500',
                    backgroundColor: isCurrent 
                      ? (isDark ? '#1e3a8a' : '#f0f9ff') 
                      : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={e => { 
                    e.currentTarget.style.backgroundColor = isCurrent 
                      ? (isDark ? '#1e3a8a' : '#f0f9ff') 
                      : (isDark ? '#1f2937' : '#f0f9ff'); 
                    e.currentTarget.style.color = isDark ? '#93c5fd' : '#0284c7'; 
                  }}
                  onMouseOut={e => { 
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = 'transparent'; 
                      e.currentTarget.style.color = isDark ? '#94a3b8' : '#475569'; 
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {renderIcon(menu.icon)}
                    {menu.name}
                      {hasChildren && (
                        <span style={{ 
                          backgroundColor: location.pathname.startsWith(menu.route) 
                            ? (isDark ? '#1e3a8a' : '#bae6fd') 
                            : (isDark ? '#374151' : '#e2e8f0'), 
                          color: location.pathname.startsWith(menu.route) 
                            ? (isDark ? '#93c5fd' : '#0369a1') 
                            : (isDark ? '#94a3b8' : '#64748b'), 
                          padding: '0.1rem 0.5rem', 
                          borderRadius: '999px', 
                          fontSize: '0.7rem', 
                          fontWeight: 600 
                        }}>
                          {children.length}
                        </span>
                      )}
                    </div>
                    {hasChildren && (
                    isExpanded ? <Icons.ChevronDown size={16} /> : <Icons.ChevronRight size={16} />
                  )}
                </Link>

                {hasChildren && isExpanded && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    marginLeft: '1.5rem', 
                    marginTop: '0.25rem', 
                    borderLeft: isDark ? '1px solid #374151' : '1px solid #e5e7eb', 
                    paddingLeft: '0.5rem', 
                    gap: '0.25rem' 
                  }}>
                    {children.map(child => {
                      const isChildCurrent = location.pathname === child.route;
                      return (
                        <Link
                          key={child.id}
                          to={child.route}
                          style={{ 
                            display: 'block', 
                            padding: '0.5rem 0.75rem', 
                            color: isChildCurrent 
                              ? (isDark ? '#93c5fd' : '#0284c7') 
                              : (isDark ? '#94a3b8' : '#64748b'), 
                            textDecoration: 'none', 
                            borderRadius: '6px', 
                            fontSize: '0.875rem',
                            backgroundColor: isChildCurrent 
                              ? (isDark ? '#1e3a8a' : '#f0f9ff') 
                              : 'transparent',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseOver={e => { 
                            e.currentTarget.style.backgroundColor = isDark ? '#1f2937' : '#f0f9ff'; 
                            e.currentTarget.style.color = isDark ? '#93c5fd' : '#0284c7'; 
                          }}
                          onMouseOut={e => { 
                            if (!isChildCurrent) {
                              e.currentTarget.style.backgroundColor = 'transparent'; 
                              e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b'; 
                            }
                          }}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: isDark ? '#0b1120' : '#f9fafb', transition: 'background-color 0.2s ease' }}>
        <header style={{ height: '80px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', boxSizing: 'border-box', position: 'relative', zIndex: 40 }}>
          
          {/* Left Pill: Company Logo & Title */}
          <div style={{ 
            backgroundColor: isDark ? '#1e293b' : '#ffffff', 
            padding: '0.5rem 1.25rem', 
            borderRadius: '9999px', 
            border: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
            boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            transition: 'background-color 0.2s ease, border-color 0.2s ease'
          }}>
            {companyLogo && <img src={companyLogo} alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }} />}
            <span style={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
              {companyName}
            </span>
          </div>

          {/* Center Pill: Search & Filters */}
          <div style={{ 
            backgroundColor: isDark ? '#1e293b' : '#ffffff', 
            padding: '0.35rem 0.5rem 0.35rem 1.25rem', 
            borderRadius: '9999px', 
            border: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
            boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)', 
            display: 'flex', 
            alignItems: 'center', 
            width: '500px', 
            maxWidth: '40%',
            transition: 'background-color 0.2s ease, border-color 0.2s ease'
          }}>
            <Icons.Search size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            <input 
              type="text" 
              placeholder="Search anything..." 
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '0.5rem 0.75rem', flex: 1, fontSize: '0.9rem', color: isDark ? '#f8fafc' : '#334155' }} 
            />
            <button style={{ 
              background: isDark ? '#0f172a' : '#f8fafc', 
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
              borderRadius: '9999px', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: isDark ? '#94a3b8' : '#475569' 
            }} title="Filters">
              <Icons.SlidersHorizontal size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme Switcher Pill (Light Mode & Dark Mode options) */}
            <ThemeSwitcher variant="pill" />

            {/* Date Pill */}
            <div style={{ 
              backgroundColor: isDark ? '#1e293b' : '#ffffff', 
              padding: '0.5rem 1.1rem', 
              borderRadius: '9999px', 
              border: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
              boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: isDark ? '#cbd5e1' : '#475569', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              transition: 'background-color 0.2s ease, border-color 0.2s ease'
            }}>
              <Icons.Calendar size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              {todayDateStr}
            </div>

            {/* Right Pill: Profile & Notifications */}
            <div style={{ 
              backgroundColor: isDark ? '#1e293b' : '#ffffff', 
              padding: '0.25rem 0.5rem 0.25rem 1rem', 
              borderRadius: '9999px', 
              border: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
              boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.4)' : '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              transition: 'background-color 0.2s ease, border-color 0.2s ease'
            }}>
              
              {/* Notification Bell */}
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: isDark ? '#cbd5e1' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Bell size={18} />
                <span style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: '50%', border: isDark ? '2px solid #1e293b' : '2px solid white' }}></span>
              </button>
              
              <div style={{ width: '1px', height: '20px', backgroundColor: isDark ? '#334155' : '#e2e8f0' }}></div>

              {/* Branch Switcher Dropdown */}
              {branches.length > 0 && (
                <div 
                  style={{ position: 'relative', marginRight: '0.5rem' }}
                  onMouseEnter={() => setShowBranchMenu(true)}
                  onMouseLeave={() => setShowBranchMenu(false)}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    cursor: 'pointer', 
                    padding: '0.45rem 0.85rem', 
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc', 
                    borderRadius: '8px', 
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' 
                  }}>
                    <Icons.Store size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#f8fafc' : '#334155' }}>
                      {activeBranchId === 'global' ? 'Global (All Branches)' : branches.find(b => b.id.toString() === activeBranchId)?.name || 'Unknown Branch'}
                    </span>
                    <Icons.ChevronDown size={14} color={isDark ? '#94a3b8' : '#94a3b8'} />
                  </div>

                  {showBranchMenu && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '0.5rem', width: '220px', zIndex: 50 }}>
                      <div style={{ 
                        backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                        borderRadius: '12px', 
                        boxShadow: isDark ? '0 20px 25px -5px rgba(0,0,0,0.6)' : '0 20px 25px -5px rgba(0,0,0,0.15)', 
                        border: isDark ? '1px solid #334155' : '1px solid #f1f5f9', 
                        padding: '0.5rem' 
                      }}>
                        <button 
                          onClick={() => { localStorage.setItem('activeBranchId', 'global'); setActiveBranchId('global'); window.dispatchEvent(new Event('branch_changed')); }}
                          style={{ 
                            width: '100%', 
                            padding: '0.5rem 1rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            background: activeBranchId === 'global' ? (isDark ? '#1e3a8a' : '#eff6ff') : 'none', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            color: activeBranchId === 'global' ? (isDark ? '#93c5fd' : '#2563eb') : (isDark ? '#cbd5e1' : '#334155'), 
                            fontSize: '0.875rem', 
                            fontWeight: 500, 
                            textAlign: 'left' 
                          }}
                        >
                          Global (All Branches)
                        </button>
                        <div style={{ height: '1px', backgroundColor: isDark ? '#334155' : '#e2e8f0', margin: '0.25rem 0' }}></div>
                        {branches.map(b => (
                          <button 
                            key={b.id}
                            onClick={() => { localStorage.setItem('activeBranchId', b.id.toString()); setActiveBranchId(b.id.toString()); window.dispatchEvent(new Event('branch_changed')); }}
                            style={{ 
                              width: '100%', 
                              padding: '0.5rem 1rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              background: activeBranchId === b.id.toString() ? (isDark ? '#1e3a8a' : '#eff6ff') : 'none', 
                              border: 'none', 
                              borderRadius: '8px', 
                              cursor: 'pointer', 
                              color: activeBranchId === b.id.toString() ? (isDark ? '#93c5fd' : '#2563eb') : (isDark ? '#cbd5e1' : '#334155'), 
                              fontSize: '0.875rem', 
                              fontWeight: 500, 
                              textAlign: 'left' 
                            }}
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* User Profile Dropdown */}
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowProfileMenu(true)}
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.8rem', fontWeight: 700, lineHeight: '1.2' }}>{username ? (username.split('@')[0].length > 12 ? username.split('@')[0].substring(0, 12) + '...' : username.split('@')[0]) : 'User'}</span>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.7rem', fontWeight: 500, lineHeight: '1.2' }}>{localStorage.getItem('role') || 'Master Admin'}</span>
                  </div>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: isDark ? '#93c5fd' : '#2563eb', 
                    fontWeight: 600, 
                    border: isDark ? '1px solid #2563eb' : '1px solid #bfdbfe' 
                  }}>
                    {username ? username.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '0.5rem', width: '230px', zIndex: 50 }}>
                    <div style={{ 
                      backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                      borderRadius: '16px', 
                      boxShadow: isDark ? '0 20px 25px -5px rgba(0,0,0,0.6)' : '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                      border: isDark ? '1px solid #334155' : '1px solid #f1f5f9', 
                      padding: '0.5rem' 
                    }}>
                      <button 
                        onClick={() => { setShowAccountSettings(true); setShowProfileMenu(false); }}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem 1rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          background: 'none', 
                          border: 'none', 
                          borderRadius: '10px', 
                          cursor: 'pointer', 
                          color: isDark ? '#cbd5e1' : '#334155', 
                          fontSize: '0.875rem', 
                          fontWeight: 500, 
                          textAlign: 'left' 
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f8fafc'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Icons.Settings size={16} />
                        Account Settings
                      </button>

                      <div style={{ height: '1px', backgroundColor: isDark ? '#334155' : '#e2e8f0', margin: '0.35rem 0' }}></div>

                      {/* Theme Switcher inside Dropdown */}
                      <div style={{ padding: '0.25rem 0.5rem' }}>
                        <ThemeSwitcher variant="dropdown" />
                      </div>
                      
                      <div style={{ height: '1px', backgroundColor: isDark ? '#334155' : '#e2e8f0', margin: '0.35rem 0' }}></div>
                      
                      <button 
                        onClick={handleLogout}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem 1rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          background: 'none', 
                          border: 'none', 
                          borderRadius: '10px', 
                          cursor: 'pointer', 
                          color: '#ef4444', 
                          fontSize: '0.875rem', 
                          fontWeight: 500, 
                          textAlign: 'left' 
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = isDark ? '#450a0a' : '#fef2f2'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Icons.LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <AccountSettingsModal 
          onClose={() => setShowAccountSettings(false)} 
          username={username} 
        />
      )}
    </div>
  );
}
