import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { apiFetch } from '../api';

export default function MasterLayout() {
  const [menus, setMenus] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
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
        <header style={{ height: '70px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', boxSizing: 'border-box' }}>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '1.25rem' }}>Neurolinx One</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>{username}</span>
            <button 
              onClick={handleLogout}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              Logout
            </button>
          </div>
        </header>
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
