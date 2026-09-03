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
  const { connectedDevice, isConnecting, connectBluetoothPrinter, sendEscPos, disconnect } = usePrinter();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Printer Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterType, setNewPrinterType] = useState<'KOT' | 'BILLING'>('KOT');

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
      body: JSON.stringify({ name: newPrinterName, printerType: newPrinterType, connectionType: 'BLUETOOTH' })
    }).then(() => {
      setShowAddForm(false);
      setNewPrinterName('');
      fetchPrinters();
    });
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

  const testCustomerBill = () => {
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
    
    let qrCommands: number[] = [];
    if (isDineIn) {
        qrCommands = [
          ...encoder.encode("\nSCAN TO PAY (UPI)\n"),
          ...encoder.encode("[ QR CODE IMAGE ]\n")
        ];
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
        <form onSubmit={handleAddPrinter} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Printer Name</label>
            <input required type="text" value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} placeholder="e.g. Kitchen Printer 1" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <div style={{ width: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>Printer Type</label>
            <select value={newPrinterType} onChange={e => setNewPrinterType(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}>
              <option value="KOT">KOT (Kitchen)</option>
              <option value="BILLING">Billing (Cashier)</option>
            </select>
          </div>
          <button type="submit" style={{ backgroundColor: '#16a34a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save</button>
        </form>
      )}

      {/* Connection Panel */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icons.Bluetooth size={24} color={connectedDevice ? "#16a34a" : "#0284c7"} />
            <div>
              <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>Active Bluetooth Connection</h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                {connectedDevice ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Connected to {connectedDevice.name} (Global)</span> : 'Pair your device (e.g. HOP-E200) to keep it active across all screens.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {connectedDevice && (
              <button 
                onClick={disconnect}
                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Disconnect
              </button>
            )}
            <button 
              onClick={connectBluetoothPrinter}
              disabled={isConnecting || connectedDevice !== null}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: connectedDevice ? '#e2e8f0' : '#0284c7', color: connectedDevice ? '#94a3b8' : 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: connectedDevice ? 'not-allowed' : 'pointer' }}>
              {isConnecting ? 'Scanning...' : 'Pair Printer'}
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
                    <Icons.Bluetooth size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> {p.connectionType}
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
