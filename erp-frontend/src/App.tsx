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
import PrinterCanvas from './pages/restaurant/PrinterCanvas';
import RestaurantSettings from './pages/restaurant/Settings';
import { PrinterProvider } from './context/PrinterContext';
import RestaurantOrders from './pages/restaurant/Orders';
import RestaurantInventory from './pages/restaurant/Inventory';
import PlaceholderModule from './components/PlaceholderModule';

function App() {
  return (
    <PrinterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Protected Routes Wrapper (renders the Sidebar + Topnav) */}
          <Route element={<MasterLayout />}>
            {/* Master Admin Routes */}
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/clients" element={<ClientProvisioning />} />
            <Route path="/welcome" element={<div style={{padding: '2rem', fontSize: '1.5rem', fontWeight: 'bold'}}>Welcome to Neurolinx ERP. Your industry-specific dashboard is under construction!</div>} />
            <Route path="/settings" element={<GlobalModules />} />
            <Route path="/approvals" element={<DeviceApprovals />} />
            
            {/* Client Modules */}
            <Route path="/res-dashboard" element={<RestaurantDashboard />} />
              <Route path="/res-orders" element={<RestaurantOrders />} />
              <Route path="/res-inventory" element={<RestaurantInventory />} />
              <Route path="/res-waste" element={<PlaceholderModule title="Waste Management" iconName="Trash2" description="Track and analyze kitchen waste and spoilage." />} />
              <Route path="/res-vendors" element={<PlaceholderModule title="Vendor Management" iconName="Users" description="Manage suppliers, purchase orders, and supplier payments." />} />
              <Route path="/res-raw-materials" element={<PlaceholderModule title="Raw Materials" iconName="Box" description="Monitor raw material inventory and stock alerts." />} />
              <Route path="/res-recipes" element={<PlaceholderModule title="Recipe Management" iconName="ChefHat" description="Build recipes to automatically deduct raw ingredients on sales." />} />
              <Route path="/res-billing" element={<PlaceholderModule title="Billing" iconName="Receipt" description="View all past invoices, receipts, and split payments." />} />
              <Route path="/res-analytics" element={<PlaceholderModule title="Analytics" iconName="LineChart" description="Deep dive into sales trends, popular items, and staff performance." />} />
              <Route path="/res-documents" element={<PlaceholderModule title="Documents" iconName="FileText" description="Store compliance documents, licenses, and contracts." />} />
              <Route path="/res-staff" element={<PlaceholderModule title="Staff" iconName="UserCog" description="Manage employees, roles, shifts, and payroll." />} />
              <Route path="/res-support" element={<PlaceholderModule title="Support" iconName="LifeBuoy" description="Contact Neurolinx support for help and troubleshooting." />} />
              <Route path="/res-printers" element={<PrinterCanvas />} />
              <Route path="/res-settings" element={<RestaurantSettings />} />
          </Route>
          
          <Route path="/:slug" element={<ClientPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PrinterProvider>
  );
}

export default App;
