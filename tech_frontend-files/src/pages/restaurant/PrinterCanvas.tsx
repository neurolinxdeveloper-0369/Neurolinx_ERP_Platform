import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { apiFetch } from '../../api';
import { usePrinter } from '../../context/PrinterContext';

interface Printer {
  id: number;
  name: string;
  printerType: 'KOT' | 'BILLING';
  connectionType: string;
}

export default function PrinterCanvas() {
  const { connectedDevice, isConnecting, connectionType, connectBluetoothPrinter, connectSerialPrinter, sendEscPos, disconnect, logs, clearLogs } = usePrinter();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Printer Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterType, setNewPrinterType] = useState<'KOT' | 'BILLING'>('KOT');
  const [newConnectionType, setNewConnectionType] = useState<'BLUETOOTH' | 'SERIAL'>('BLUETOOTH');

  const fetchPrinters = () => {
    apiFetch('https://erp-api.neurolinx.in/api/settings/printers')
      .then(res => res.json())
      .then(data => {
        setPrinters(data);
        setIsLoading(false);
      });
  };

  useEffect(() => { fetchPrinters(); }, []);

  const handleAddPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    apiFetch('https://erp-api.neurolinx.in/api/settings/printers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPrinterName, printerType: newPrinterType, connectionType: newConnectionType })
    }).then(() => {
      setShowAddForm(false);
      setNewPrinterName('');
      fetchPrinters();
    });
  };

  const handlePairAndAdd = async () => {
    try {
      const device = await connectBluetoothPrinter();
      if (device) {
        setNewPrinterName(device.name || 'Bluetooth Printer');
        setNewConnectionType('BLUETOOTH');
        setShowAddForm(true);
      }
    } catch (err: any) {
      alert(`Bluetooth Pairing Failed: ${err.message}`);
    }
  };

  const handleSerialConnect = async () => {
    try {
      const port = await connectSerialPrinter();
      if (port) {
        setNewPrinterName('USB / COM Printer');
        setNewConnectionType('SERIAL');
        setShowAddForm(true);
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        alert(`Serial Connection Failed: ${err.message}`);
      }
    }
  };

  const removePrinter = (id: number) => {
    apiFetch(`https://erp-api.neurolinx.in/api/settings/printers/${id}`, { method: 'DELETE' }).then(fetchPrinters);
  };

  const testKotPrint = () => {
    const ESC = 0x1b; const GS = 0x1d; const encoder = new TextEncoder();
    const payload = new Uint8Array([
      ESC, 0x40,
      ESC, 0x61, 0x01, // Center align
      ESC, 0x21, 0x10, // Double height
      ...encoder.encode("** KOT **\n"),
      ESC, 0x21, 0x00, // Normal font
      ...encoder.encode("Table: 12  |  Dine-In\n"),
      ESC, 0x61, 0x00, // Left align
      ...encoder.encode("--------------------------------\n"),
      ESC, 0x21, 0x08, // Bold
      ...encoder.encode("1x Butter Chicken\n"),
      ...encoder.encode("2x Roti\n"),
      ESC, 0x21, 0x00, // Normal
      ...encoder.encode("--------------------------------\n"),
      ...encoder.encode("\n\n\n\n"),
      GS, 0x56, 0x41, 0x00 // Cut
    ]);
    sendEscPos(payload);
  };

  
  const testCustomerBill = async () => {

    const ESC = 0x1b; const GS = 0x1d; const encoder = new TextEncoder();
    
    // We simulate Dine-In bill (needs QR) vs Takeaway
    const isDineIn = true;

    let textPayload = "DINEFINE RESTAURANT\n";
    textPayload += "123 Culinary Avenue\n";
    textPayload += "Phone: (555) 123-4567\n";
    textPayload += "--------------------------------\n";
    textPayload += "Date: 30/09/2025 20:15\n";
    textPayload += "Receipt: #R-2547\n";
    textPayload += "--------------------------------\n";
    textPayload += "2x Caesar Salad           $24.00\n";
    textPayload += "1x Grilled Salmon         $22.00\n";
    textPayload += "--------------------------------\n";
    textPayload += "Subtotal:                 $46.00\n";
    textPayload += "Tax (5%):                 $2.30 \n";
    textPayload += "TOTAL:                    $48.30\n";
    textPayload += "--------------------------------\n";
    
    let baseCmds = [ESC, 0x40, ESC, 0x61, 0x01]; // init, center
    let textBuffer = encoder.encode(textPayload);
    
    let qrCommands: Uint8Array = new Uint8Array(0);
    // Note: Since this is a test page and we don't fetch settings here, we can't test actual image rasterization here unless we fetch settings. We will just leave it as placeholder for the test bill, or skip it.
    if (isDineIn) {
        qrCommands = new Uint8Array([...encoder.encode("\n[ QR CODE prints here for Dine-In ]\n")]);
    }

    let footer = [
      ...encoder.encode("\nThank you for dining with us!\n\n\n\n"),
      GS, 0x56, 0x41, 0x00
    ];

    const payload = new Uint8Array([...baseCmds, ...textBuffer, ...qrCommands, ...footer]);
    sendEscPos(payload);
  };

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading Printers...</div>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>Printer Canvas</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Manage Bluetooth POS and KOT printers.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0284c7', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          <Icons.Plus size={18} /> Add Printer
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddPrinter} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Printer Name</label>
            <input required type="text" value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} placeholder="e.g. Counter Printer / M2-Max" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <div style={{ width: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Printer Type</label>
            <select value={newPrinterType} onChange={e => setNewPrinterType(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}>
              <option value="KOT">KOT (Kitchen)</option>
              <option value="BILLING">Billing (Cashier)</option>
            </select>
          </div>
          <div style={{ width: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Connection Type</label>
            <select value={newConnectionType} onChange={e => setNewConnectionType(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}>
              <option value="BLUETOOTH">Bluetooth (BLE)</option>
              <option value="SERIAL">USB / Virtual COM</option>
            </select>
          </div>
          <button type="submit" style={{ backgroundColor: '#16a34a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save</button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Connection Panel */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icons.Bluetooth size={24} color={connectedDevice ? "#16a34a" : "#0284c7"} />
                <div>
                  <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Active Hardware Connection</h2>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                    {connectedDevice ? (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>Connected to {connectedDevice.name} ({connectionType || 'ACTIVE'})</span>
                    ) : (
                      'Pair a Bluetooth BLE printer or connect via USB / Bluetooth COM port.'
                    )}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {connectedDevice && (
                  <button 
                    onClick={disconnect}
                    style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    Disconnect
                  </button>
                )}
                <button 
                  onClick={handlePairAndAdd}
                  disabled={isConnecting || connectedDevice !== null}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem', backgroundColor: connectedDevice ? '#e2e8f0' : '#0284c7', color: connectedDevice ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: connectedDevice ? 'not-allowed' : 'pointer' }}>
                  <Icons.Bluetooth size={16} />
                  {isConnecting ? 'Scanning...' : 'Pair Bluetooth'}
                </button>
                <button 
                  onClick={handleSerialConnect}
                  disabled={isConnecting || connectedDevice !== null}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem', backgroundColor: connectedDevice ? '#e2e8f0' : '#475569', color: connectedDevice ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: connectedDevice ? 'not-allowed' : 'pointer' }}>
                  <Icons.Cable size={16} />
                  Connect USB / COM
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <button 
                onClick={testKotPrint}
                disabled={!connectedDevice}
                style={{ flex: 1, padding: '1rem', backgroundColor: !connectedDevice ? '#f8fafc' : '#f0fdf4', color: !connectedDevice ? '#94a3b8' : '#166534', border: !connectedDevice ? '1px dashed #cbd5e1' : '1px solid #bbf7d0', borderRadius: '8px', fontWeight: 600, cursor: !connectedDevice ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Icons.ChefHat size={20} /> Test KOT Bill (No Prices)
              </button>
              <button 
                onClick={testCustomerBill}
                disabled={!connectedDevice}
                style={{ flex: 1, padding: '1rem', backgroundColor: !connectedDevice ? '#f8fafc' : '#eff6ff', color: !connectedDevice ? '#94a3b8' : '#1d4ed8', border: !connectedDevice ? '1px dashed #cbd5e1' : '1px solid #bfdbfe', borderRadius: '8px', fontWeight: 600, cursor: !connectedDevice ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Icons.Receipt size={20} /> Test Customer Bill (With Prices)
              </button>
            </div>
          </div>

          {/* M2-Max / Android POS Notice Banner */}
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <Icons.Info size={24} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#1e40af', fontSize: '0.95rem', fontWeight: 600 }}>
                Using an All-in-One POS Terminal (e.g. iMin M2-Max, Sunmi)?
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', color: '#1e3a8a', fontSize: '0.85rem', lineHeight: '1.5' }}>
                The <strong>M2-Max</strong> is an Android POS terminal with an integrated thermal printer. It broadcasts as an Android mobile tablet (Classic Bluetooth), which is why it appears in Windows 11 Bluetooth settings but <em>cannot</em> be discovered by Chrome's Web Bluetooth API (which only pairs Low Energy BLE peripherals).
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.825rem', color: '#1d4ed8' }}>
                <div>🚀 <strong>Direct Printing (Recommended):</strong> Connect your M2-Max to Wi-Fi, open Google Chrome directly on the M2-Max screen, and log in to <code>https://one.neurolinx.in</code>. Orders printed from the terminal trigger the built-in printer directly!</div>
                <div>🔌 <strong>From Windows PC:</strong> If paired to Windows, Windows assigns it a virtual COM port. Click <strong>"Connect USB / COM"</strong> above and select the assigned COM port.</div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Logs Panel */}
        <div style={{ backgroundColor: '#1e293b', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', color: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
              <Icons.Terminal size={18} /> Diagnostic Logs
            </h2>
            <button onClick={clearLogs} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Clear</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {logs && logs.length === 0 && <span style={{ color: '#475569' }}>Awaiting connection...</span>}
            {logs && logs.map((log, idx) => (
              <div key={idx} style={{ color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#22c55e' : '#cbd5e1', lineHeight: '1.4' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Saved Printers List */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {printers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No printers added yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Printer Name</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Connection</th>
                <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {printers.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', color: '#1e293b', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ backgroundColor: p.printerType === 'KOT' ? '#fef3c7' : '#e0e7ff', color: p.printerType === 'KOT' ? '#b45309' : '#3730a3', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{p.printerType}</span>
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    {connectedDevice && (
                      (p.connectionType === 'BLUETOOTH' && connectionType === 'BLUETOOTH') ||
                      (p.connectionType === 'SERIAL' && connectionType === 'SERIAL')
                    ) ? (
                      <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {connectionType === 'SERIAL' ? <Icons.Cable size={14} /> : <Icons.Bluetooth size={14} />} Active (Connected)
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {p.connectionType === 'SERIAL' ? <Icons.Cable size={14} /> : <Icons.Bluetooth size={14} />} {p.connectionType === 'SERIAL' ? 'USB / COM Port' : 'Bluetooth (BLE)'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => removePrinter(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Icons.Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
