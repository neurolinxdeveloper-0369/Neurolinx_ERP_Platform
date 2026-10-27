import os

path = 'erp-frontend/src/pages/restaurant/Kitchen.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

conflict_target = """    } finally {
      setUpdatingOrderId(null);
    }
=======
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
        fetchOrders();
      } else {
        alert(data.message || 'Simulation failed');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' };
      case 'Preparing': return { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' };
      case 'Ready': return { bg: '#d1fae5', text: '#10b981', border: '#6ee7b7' };
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
>>>>>>> 74e452e (Implement Option 2: Aggregator Middleware Hub for Swiggy & Zomato with KDS and Test Simulators)
    }
  };"""

conflict_repl = """    } finally {
      setUpdatingOrderId(null);
    }
  };

  const simulateOnlineOrder = async (channel: 'Swiggy' | 'Zomato') => {
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
        fetchOrders(false);
      } else {
        alert(data.message || 'Simulation failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };"""

text = text.replace(conflict_target, conflict_repl)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Kitchen.tsx resolved cleanly")
