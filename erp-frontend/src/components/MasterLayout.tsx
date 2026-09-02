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
      <div style={{ width: '250px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', color: '#374151', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '70px', display: 'flex', alignItems: 'center', padding: '0 1.5rem', fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', color: '#0f172a', boxSizing: 'border-box' }}>
          Neurolinx One
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
                    padding: '0.75rem', color: '#475569', textDecoration: 'none', 
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
                          display: 'block', padding: '0.5rem 0.75rem', color: '#64748b', 
                          textDecoration: 'none', borderRadius: '6px', fontSize: '0.875rem',
                          backgroundColor: location.pathname === child.route ? '#f0f9ff' : 'transparent'
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
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
        <header style={{ height: '70px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 2rem', boxSizing: 'border-box', position: 'relative', zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Notification Bell */}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Bell size={20} />
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
            </button>
            
            <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }}></div>

            {/* User Profile Dropdown */}
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem 0' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 600 }}>
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 600 }}>{username ? (username.split('@')[0].length > 15 ? username.split('@')[0].substring(0, 15) + '...' : username.split('@')[0]) : 'User'}</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>{localStorage.getItem('role') || 'Master Admin'}</span>
                </div>
                <Icons.ChevronDown size={16} color="#64748b" />
              </div>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: '-0.25rem',
                  width: '200px', 
                  backgroundColor: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                  border: '1px solid #f1f5f9',
                  padding: '0.5rem',
                  zIndex: 50
                }}>
                  <button 
                    style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#334155', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Icons.Settings size={16} />
                    Account Settings
                  </button>
                  
                  <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0.25rem 0' }}></div>
                  
                  <button 
                    onClick={handleLogout}
                    style={{ width: '100%', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Icons.LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
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
