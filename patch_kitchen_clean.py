import os

path = 'erp-frontend/src/pages/restaurant/Kitchen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add simulateOnlineOrder function
fn_target = """  // Update order kitchen status with strict server verification"""

fn_inject = """  const [isSimulating, setIsSimulating] = useState(false);

  const simulateOnlineOrder = async (channel: 'Swiggy' | 'Zomato') => {
    setIsSimulating(true);
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/aggregators/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessToast(`Simulated ${channel} Order #${data.orderNumber} placed into KDS!`);
        setTimeout(() => setSuccessToast(null), 3500);
        await fetchOrders(false);
      } else {
        alert(data.message || 'Simulation failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Update order kitchen status with strict server verification"""

text = text.replace(fn_target, fn_inject)

# 2. Add header simulation buttons
ctrl_target = """        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>"""

ctrl_inject = """        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Quick Simulation Buttons */}
          <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '6px' }}>
            <button 
              disabled={isSimulating}
              onClick={() => simulateOnlineOrder('Swiggy')} 
              style={{ padding: '0.4rem 0.65rem', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              title="Test incoming Swiggy order via Middleware"
            >
              <Icons.Zap size={13} /> + Sim Swiggy
            </button>
            <button 
              disabled={isSimulating}
              onClick={() => simulateOnlineOrder('Zomato')} 
              style={{ padding: '0.4rem 0.65rem', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              title="Test incoming Zomato order via Middleware"
            >
              <Icons.Zap size={13} /> + Sim Zomato
            </button>
          </div>"""

text = text.replace(ctrl_target, ctrl_inject)

# 3. Add Swiggy and Zomato badges to card
badge_target = """                      {order.orderType === 'Delivery' && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: '#ecfeff',
                          color: '#0e7490',
                          border: '1px solid #a5f3fc',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Icons.Truck size={10} /> Delivery
                        </span>
                      )}"""

badge_inject = """                      {order.orderType === 'Delivery' && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: '#ecfeff',
                          color: '#0e7490',
                          border: '1px solid #a5f3fc',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <Icons.Truck size={10} /> Delivery
                        </span>
                      )}
                      {order.orderType === 'Swiggy' && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: '#fff7ed',
                          color: '#ea580c',
                          border: '1px solid #fed7aa',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          🛵 Swiggy
                        </span>
                      )}
                      {order.orderType === 'Zomato' && (
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          🛵 Zomato
                        </span>
                      )}"""

text = text.replace(badge_target, badge_inject)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Kitchen.tsx enhanced with Swiggy/Zomato cleanly")
