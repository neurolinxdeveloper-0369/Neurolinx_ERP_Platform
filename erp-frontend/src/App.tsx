import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MasterLayout from './components/MasterLayout';
import Dashboard from './pages/admin/Dashboard';
import GlobalModules from './pages/admin/GlobalModules';
import ClientProvisioning from './pages/admin/ClientProvisioning';
import DeviceApprovals from './pages/admin/DeviceApprovals';
import ClientPortal from './pages/ClientPortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Protected Routes Wrapper */}
        <Route element={<MasterLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<ClientProvisioning />} />
          <Route path="/settings" element={<GlobalModules />} />
          <Route path="/approvals" element={<DeviceApprovals />} />
        </Route>
        
        <Route path="/:slug" element={<ClientPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
