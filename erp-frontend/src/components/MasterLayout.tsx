import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { apiFetch } from '../api';

export default function MasterLayout() {
  const [menus, setMenus] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username');
  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const companyName = localStorage.getItem('companyName') || (localStorage.getItem('industryType') === 'Restaurant' ? 'Restaurant POS' : 'Admin Portal');
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
        .then(data => setMenus(data))
        .catch(err => console.error("Failed to load menus", err));
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'white', borderRight: 'none', boxShadow: '4px 0 15px rgba(0,0,0,0.05)', color: '#374151', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
        <div style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 1.5rem', fontSize: '1.25rem', fontWeight: 'bold', borderBottom: 'none', boxSizing: 'border-box' }}>
          <span style={{ color: '#1d4ed8' }}>Neurolinx</span><span style={{ color: '#1e293b' }}>One</span>
        </div>
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {parentMenus.map((menu, index) => {
            const children = menus.filter(m => m.parentId === menu.id);
            const hasChildren = children.length > 0;
            const isExpanded = expanded[menu.id];
            
            return (
              <div key={index}>
                <Link 
                  to={hasChildren ? '#' : menu.route}
                  onClick={hasChildren ? (e) => toggleExpand(menu.id, e) : undefined}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '0.75rem', color: location.pathname === menu.route ? '#0284c7' : '#475569', textDecoration: 'none', 
                    borderRadius: '8px', fontWeight: '500',
                    backgroundColor: location.pathname === menu.route ? '#f0f9ff' : 'transparent'
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f0f9ff'; e.currentTarget.style.color = '#0284c7'; }}
                  onMouseOut={e => { 
                    if (location.pathname !== menu.route) {
                      e.currentTarget.style.backgroundColor = 'transparent'; 
                      e.currentTarget.style.color = '#475569'; 
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {renderIcon(menu.icon)}
                    {menu.name}
                  </div>
                  {hasChildren && (
                    isExpanded ? <Icons.ChevronDown size={16} /> : <Icons.ChevronRight size={16} />
                  )}
                </Link>

                {hasChildren && isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '1.5rem', marginTop: '0.25rem', borderLeft: '1px solid #e5e7eb', paddingLeft: '0.5rem', gap: '0.25rem' }}>
                    {children.map(child => (
                      <Link
                        key={child.id}
                        to={child.route}
                        style={{ 
                          display: 'block', padding: '0.5rem 0.75rem', color: location.pathname === child.route ? '#0284c7' : '#64748b', 
                          textDecoration: 'none', borderRadius: '6px', fontSize: '0.875rem',
                          backgroundColor: location.pathname === child.route ? '#f0f9ff' : 'transparent'
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f0f9ff'; e.currentTarget.style.color = '#0284c7'; }}
                        onMouseOut={e => { 
                          if (location.pathname !== child.route) {
                            e.currentTarget.style.backgroundColor = 'transparent'; 
                            e.currentTarget.style.color = '#64748b'; 
                          }
                        }}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '80px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', boxSizing: 'border-box', position: 'relative', zIndex: 40 }}>
          
          {/* Left Pill: Company Logo & Title */}
          <div style={{ backgroundColor: 'white', padding: '0.5rem 1.25rem', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {companyLogo && <img src={companyLogo} alt="Logo" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }} />}
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
              {companyName}
            </span>
          </div>

          {/* Center Pill: Search & Filters */}
          <div style={{ backgroundColor: 'white', padding: '0.35rem 0.5rem 0.35rem 1.25rem', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', width: '600px', maxWidth: '50%' }}>
            <Icons.Search size={18} color="#64748b" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '0.5rem 0.75rem', flex: 1, fontSize: '0.9rem', color: '#334155' }} 
            />
            <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9999px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }} title="Filters">
              <Icons.SlidersHorizontal size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Date Pill */}
            <div style={{ backgroundColor: 'white', padding: '0.5rem 1.25rem', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
              <Icons.Calendar size={16} color="#64748b" />
              {todayDateStr}
            </div>

            {/* Right Pill: Profile & Notifications */}
            <div style={{ backgroundColor: 'white', padding: '0.25rem 0.5rem 0.25rem 1rem', borderRadius: '9999px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              
              {/* Notification Bell */}
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.Bell size={18} />
                <span style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></span>
              </button>
              
              <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0' }}></div>

              {/* User Profile Dropdown */}
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowProfileMenu(true)}
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ color: '#0f172a', fontSize: '0.8rem', fontWeight: 700, lineHeight: '1.2' }}>{username ? (username.split('@')[0].length > 12 ? username.split('@')[0].substring(0, 12) + '...' : username.split('@')[0]) : 'User'}</span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 500, lineHeight: '1.2' }}>{localStorage.getItem('role') || 'Master Admin'}</span>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 600, border: '1px solid #bfdbfe' }}>
                    {username ? username.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, paddingTop: '0.5rem', width: '200px', zIndex: 50 }}>
                  <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', padding: '0.5rem' }}>
                    <button 
                      style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#334155', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icons.Settings size={16} />
                      Account Settings
                    </button>
                    
                    <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.25rem 0' }}></div>
                    
                    <button 
                      onClick={handleLogout}
                      style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#ef4444', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
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
    </div>
  );
}
