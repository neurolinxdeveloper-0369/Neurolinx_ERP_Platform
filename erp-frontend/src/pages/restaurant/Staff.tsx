import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api';
import * as Icons from 'lucide-react';

export default function Staff() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'employees' | 'shifts'>('employees');
  
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [empForm, setEmpForm] = useState({ id: 0, name: '', phone: '', email: '', jobRole: 'Waiter', salaryType: 'Monthly', baseSalary: '', isActive: true, joiningDate: new Date().toISOString().split('T')[0] });

  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftForm, setShiftForm] = useState({ employeeId: '', shiftDate: new Date().toISOString().split('T')[0], shiftType: 'Full Day', attendanceStatus: 'Scheduled' });
  const [shiftDateFilter, setShiftDateFilter] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = () => {
    setIsLoading(true);
    let shiftUrl = 'https://erp-api.neurolinx.in/api/staff/shifts';
    if (shiftDateFilter) shiftUrl += `?date=${shiftDateFilter}`;
    
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/staff/employees').then(res => res.json()),
      apiFetch(shiftUrl).then(res => res.json())
    ]).then(([e, s]) => {
      setEmployees(e); setShifts(s); setIsLoading(false);
    }).catch(e => { console.error(e); setIsLoading(false); });
  };

  useEffect(() => { fetchData(); }, [shiftDateFilter]);

  const handleEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = empForm.id ? `https://erp-api.neurolinx.in/api/staff/employees/${empForm.id}` : 'https://erp-api.neurolinx.in/api/staff/employees';
    const method = empForm.id ? 'PUT' : 'POST';
    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empForm)
    }).then(() => {
      setShowEmpForm(false);
      fetchData();
    });
  };

  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apiFetch('https://erp-api.neurolinx.in/api/staff/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shiftForm)
    }).then(() => {
      setShowShiftForm(false);
      fetchData();
    });
  };

  const updateAttendance = (id: number, status: string) => {
    apiFetch(`https://erp-api.neurolinx.in/api/staff/shifts/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendanceStatus: status })
    }).then(fetchData);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Staff & Shift Management</h2>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('employees')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'employees' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'employees' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Employee Roster</button>
        <button onClick={() => setActiveTab('shifts')} style={{ padding: '1rem 2rem', background: 'none', border: 'none', borderBottom: activeTab === 'shifts' ? '2px solid #0284c7' : '2px solid transparent', color: activeTab === 'shifts' ? '#0284c7' : '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>Shifts & Attendance</button>
      </div>

      {activeTab === 'employees' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button onClick={() => { setEmpForm({ id: 0, name: '', phone: '', email: '', jobRole: 'Waiter', salaryType: 'Monthly', baseSalary: '', isActive: true, joiningDate: new Date().toISOString().split('T')[0] }); setShowEmpForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.UserPlus size={18} /> Add Employee
            </button>
          </div>

          {showEmpForm && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
              <form onSubmit={handleEmpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Name</label>
                    <input required type="text" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Role</label>
                    <select required value={empForm.jobRole} onChange={e => setEmpForm({...empForm, jobRole: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <option value="Manager">Manager</option>
                      <option value="Chef">Chef</option>
                      <option value="Waiter">Waiter</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Cleaner">Cleaner</option>
                      <option value="Delivery">Delivery</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Phone</label>
                    <input type="text" value={empForm.phone} onChange={e => setEmpForm({...empForm, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Salary Type</label>
                    <select required value={empForm.salaryType} onChange={e => setEmpForm({...empForm, salaryType: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <option value="Monthly">Monthly</option>
                      <option value="Hourly">Hourly</option>
                      <option value="Daily">Daily</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Base Salary</label>
                    <input required type="number" step="0.01" value={empForm.baseSalary} onChange={e => setEmpForm({...empForm, baseSalary: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Status</label>
                    <select required value={empForm.isActive ? 'Active' : 'Inactive'} onChange={e => setEmpForm({...empForm, isActive: e.target.value === 'Active'})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={() => setShowEmpForm(false)} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Employee</button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? <div>Loading...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Phone</th>
                  <th style={{ padding: '1rem' }}>Salary</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{e.name}</td>
                    <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0284c7' }}>{e.jobRole}</span></td>
                    <td style={{ padding: '1rem' }}>{e.phone || '-'}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>₹{e.baseSalary?.toFixed(2)} ({e.salaryType})</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: e.isActive ? '#d1fae5' : '#fee2e2', color: e.isActive ? '#10b981' : '#ef4444' }}>
                        {e.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => { setEmpForm(e); setShowEmpForm(true); }} style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}><Icons.Edit size={18} /></button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>No employees added yet.</td></tr>}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'shifts' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ fontWeight: 600, color: '#475569' }}>Date:</label>
              <input type="date" value={shiftDateFilter} onChange={e => setShiftDateFilter(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <button onClick={() => { setShiftForm({...shiftForm, shiftDate: shiftDateFilter}); setShowShiftForm(true); }} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icons.CalendarPlus size={18} /> Assign Shift
            </button>
          </div>

          {showShiftForm && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
              <form onSubmit={handleShiftSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Employee</label>
                  <select required value={shiftForm.employeeId} onChange={e => setShiftForm({...shiftForm, employeeId: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">Select Employee</option>
                    {employees.filter(e => e.isActive).map(e => <option key={e.id} value={e.id}>{e.name} ({e.jobRole})</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Shift Type</label>
                  <select required value={shiftForm.shiftType} onChange={e => setShiftForm({...shiftForm, shiftType: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Full Day">Full Day</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Assign</button>
                </div>
                <div style={{ flex: 0.5 }}>
                  <button type="button" onClick={() => setShowShiftForm(false)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {isLoading ? <div>Loading...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem' }}>Employee</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Shift</th>
                  <th style={{ padding: '1rem' }}>Attendance Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Mark Attendance</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{s.employee?.name}</td>
                    <td style={{ padding: '1rem' }}>{s.employee?.jobRole}</td>
                    <td style={{ padding: '1rem' }}>{s.shiftType}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', 
                        backgroundColor: s.attendanceStatus === 'Present' ? '#d1fae5' : s.attendanceStatus === 'Absent' ? '#fee2e2' : '#fef3c7',
                        color: s.attendanceStatus === 'Present' ? '#10b981' : s.attendanceStatus === 'Absent' ? '#ef4444' : '#d97706'
                      }}>
                        {s.attendanceStatus}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <select 
                        value={s.attendanceStatus} 
                        onChange={e => updateAttendance(s.id, e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Half Day">Half Day</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {shifts.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>No shifts assigned for this date.</td></tr>}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
