import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { apiFetch } from '../api';

export default function MasterLayout() {
  const [menus, setMenus] = useState<any[]>([]);
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
      return;
    }

    if (username === 'admin' || username === 'neurolinxdeveloper@gmail.com') {
      setMenus([
        { name: "Dashboard", route: "/dashboard", icon: "layout-dashboard" },
        { name: "Clients", route: "/clients", icon: "users" },
        { name: "Device Approvals", route: "/approvals", icon: "shield-check" },
        { name: "Global Modules", route: "/settings", icon: "settings" }
      ]);
    } else {
      apiFetch(`https://erp-api.neurolinx.in/api/menus/my-menus/${username}`)
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
    // Basic mapping for lucide-react icons based on string names from DB
    const IconComponent = (Icons as any)[
      iconName.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')
    ] || Icons.Circle;
    return <IconComponent size={20} />;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', color: '#374151', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', color: '#0f172a' }}>
          Neurolinx One
        </div>
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menus.map((menu, index) => (
            <Link 
              key={index} 
              to={menu.route}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', color: '#475569', textDecoration: 'none', borderRadius: '8px', fontWeight: '500' }}
              onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f0f9ff'; e.currentTarget.style.color = '#0284c7'; }}
              onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
            >
              {renderIcon(menu.icon)}
              {menu.name}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.875rem', wordBreak: 'break-all' }}>{username}</div>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', padding: '0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '60px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '1.25rem' }}>Dashboard</h2>
        </header>
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
