import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MasterLayout from './components/MasterLayout';
import Dashboard from './pages/admin/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Protected Routes Wrapper */}
        <Route element={<MasterLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<div style={{padding: '2rem'}}><h1>Clients Module</h1><p>Client provisioning goes here.</p></div>} />
          <Route path="/settings" element={<div style={{padding: '2rem'}}><h1>Global Settings</h1><p>Module setup goes here.</p></div>} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
