import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MasterLayout from './components/MasterLayout';
import AdminDashboard from './pages/admin/Dashboard';
import GlobalModules from './pages/admin/GlobalModules';
import ClientProvisioning from './pages/admin/ClientProvisioning';
import DeviceApprovals from './pages/admin/DeviceApprovals';
import ClientPortal from './pages/ClientPortal';

// Industry specific modules
import RestaurantDashboard from './pages/restaurant/Dashboard';
import RestaurantOrders from './pages/restaurant/Orders';
import RestaurantInventory from './pages/restaurant/Inventory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Protected Routes Wrapper (renders the Sidebar + Topnav) */}
        <Route element={<MasterLayout />}>
          {/* Master Admin Routes */}
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/clients" element={<ClientProvisioning />} />
          <Route path="/settings" element={<GlobalModules />} />
          <Route path="/approvals" element={<DeviceApprovals />} />
          
          {/* Client Modules */}
          <Route path="/res-dashboard" element={<RestaurantDashboard />} />
            <Route path="/res-orders" element={<RestaurantOrders />} />
            <Route path="/res-inventory" element={<RestaurantInventory />} />
        </Route>
        
        <Route path="/:slug" element={<ClientPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
