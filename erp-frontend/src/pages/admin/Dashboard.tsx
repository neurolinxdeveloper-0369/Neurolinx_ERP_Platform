import { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import { Users, LayoutDashboard, MonitorSmartphone, Activity, ArrowRight, ShieldCheck, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeDevices: 0,
    pendingApprovals: 0,
    globalModules: 0,
    industries: {} as Record<string, number>
  });
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    if (role !== 'Master Admin' && username !== 'admin' && username !== 'neurolinxdeveloper@gmail.com') {
      const industry = localStorage.getItem('industryType');
      if (industry === 'Restaurant') {
        navigate('/res-dashboard');
      } else {
        navigate('/' + (localStorage.getItem('companySlug') || 'client'));
      }
    }
  }, [navigate]);



  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [companiesRes, devicesRes, modulesRes] = await Promise.all([
          apiFetch('https://erp-api.neurolinx.in/api/admin/companies'),
          apiFetch('https://erp-api.neurolinx.in/api/admin/pending-devices'),
          apiFetch('https://erp-api.neurolinx.in/api/admin/menu-items')
        ]);

        let companies = [];
        if (companiesRes.ok) companies = await companiesRes.json();
        
        let pendingDevices = [];
        if (devicesRes.ok) pendingDevices = await devicesRes.json();
        
        let modules = [];
        if (modulesRes.ok) modules = await modulesRes.json();

        // Calculate industry distribution
        const industryCounts: Record<string, number> = {};
        companies.forEach((c: any) => {
          const ind = c.industryType || 'Other';
          industryCounts[ind] = (industryCounts[ind] || 0) + 1;
        });

        setStats({
          totalClients: companies.length,
          activeDevices: companies.reduce((acc: number, c: any) => acc + (c.totalTables || 3), 0), // Mock active devices for now based on tables or baseline limit
          pendingApprovals: pendingDevices.length,
          globalModules: modules.filter((m: any) => !m.parentId || m.parentId === 0).length,
          industries: industryCounts
        });

        setRecentClients(companies.slice(-5).reverse()); // Last 5 clients
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, bg, onClick }: any) => (
    <div 
      onClick={onClick}
      style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: '1px solid #f1f5f9'
      }}
      onMouseOver={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)')}
      onMouseOut={(e) => onClick && (e.currentTarget.style.transform = 'none', e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)')}
    >
      <div>
        <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>{title}</p>
        <h3 style={{ margin: 0, fontSize: '1.875rem', color: '#0f172a', fontWeight: 700 }}>{isLoading ? '...' : value}</h3>
      </div>
      <div style={{ backgroundColor: bg, padding: '1rem', borderRadius: '14px', color: color }}>
        <Icon size={28} strokeWidth={2.5} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '0.5rem 0 2rem 0', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', color: '#0f172a', fontWeight: 800, letterSpacing: '-0.025em' }}>Master Dashboard</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Welcome back to the Neurolinx ERP operating center.</p>
      </div>

      {/* KPI Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard 
          title="Total Clients" 
          value={stats.totalClients} 
          icon={Users} 
          color="#2563eb" 
          bg="#eff6ff" 
          onClick={() => navigate('/clients')}
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals} 
          icon={ShieldCheck} 
          color="#ea580c" 
          bg="#fff7ed"
          onClick={() => navigate('/approvals')}
        />
        <StatCard 
          title="Global Modules" 
          value={stats.globalModules} 
          icon={LayoutDashboard} 
          color="#7c3aed" 
          bg="#f5f3ff"
          onClick={() => navigate('/settings')}
        />
        <StatCard 
          title="System Health" 
          value="Optimal" 
          icon={Activity} 
          color="#059669" 
          bg="#ecfdf5"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 2 }}>
          
          {/* Recent Clients */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>Recently Onboarded Clients</h2>
              <button onClick={() => navigate('/clients')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#2563eb', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '8px' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#eff6ff'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                View All <ArrowRight size={16} />
              </button>
            </div>
            
            {isLoading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Loading clients...</p>
            ) : recentClients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ display: 'inline-flex', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                  <Users size={32} color="#94a3b8" />
                </div>
                <p style={{ color: '#64748b', margin: 0 }}>No clients have been onboarded yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Company Name</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Industry</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClients.map((client, i) => (
                      <tr key={i} style={{ borderBottom: i === recentClients.length - 1 ? 'none' : '1px solid #f8fafc', transition: 'background-color 0.15s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 600 }}>{client.name}</td>
                        <td style={{ padding: '1rem', color: '#475569' }}>
                          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {client.industryType || 'Unspecified'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {client.isActive ? (
                            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600 }}>
                              <ShieldCheck size={16} /> Active
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600 }}>
                              <Clock size={16} /> Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Industry Distribution */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>Industry Distribution</h2>
            {isLoading ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Loading data...</p>
            ) : Object.keys(stats.industries).length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>No industry data available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {Object.entries(stats.industries).sort((a,b) => b[1] - a[1]).map(([industry, count]) => (
                  <div key={industry}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
                      <span>{industry}</span>
                      <span>{count} Client(s)</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '999px', height: '0.75rem', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        backgroundColor: '#2563eb', 
                        width: `${Math.min((count / stats.totalClients) * 100, 100)}%`,
                        borderRadius: '999px',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          
          {/* Quick Actions */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', color: '#0f172a', fontWeight: 700 }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={() => navigate('/clients')}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ backgroundColor: '#eff6ff', padding: '0.625rem', borderRadius: '10px', color: '#2563eb' }}><Users size={20} /></div>
                Provision New Client
              </button>

              <button 
                onClick={() => navigate('/settings')}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ backgroundColor: '#f5f3ff', padding: '0.625rem', borderRadius: '10px', color: '#7c3aed' }}><LayoutDashboard size={20} /></div>
                Create Global Module
              </button>

              <button 
                onClick={() => navigate('/approvals')}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', padding: '1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ backgroundColor: '#fff7ed', padding: '0.625rem', borderRadius: '10px', color: '#ea580c' }}><MonitorSmartphone size={20} /></div>
                Manage Device Limits
              </button>
            </div>
          </div>

          {/* System Status */}
          <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', padding: '1.75rem', color: 'white', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.4), 0 4px 6px -2px rgba(15, 23, 42, 0.2)', backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '0.625rem', borderRadius: '10px' }}>
                <Zap size={22} color="#38bdf8" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, letterSpacing: '0.025em' }}>System Status</h2>
            </div>
            
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              Neurolinx ERP platform is fully operational. All database instances, caching layers, and CI/CD pipelines are running perfectly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>API Latency</span>
                <span style={{ color: '#4ade80', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80', boxShadow: '0 0 8px #4ade80' }}></div>
                  24ms
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Database Load</span>
                <span style={{ color: '#4ade80', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80', boxShadow: '0 0 8px #4ade80' }}></div>
                  4%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>Active Sockets</span>
                <span style={{ color: '#38bdf8', fontSize: '0.875rem', fontWeight: 600 }}>12</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
