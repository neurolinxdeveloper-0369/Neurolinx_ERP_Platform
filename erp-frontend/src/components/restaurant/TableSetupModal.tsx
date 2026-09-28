import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

interface TableCapacityConfig {
  tableNumber: number;
  capacity: number;
}

interface TableSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (floor: number, tables: { capacity: number }[]) => Promise<void>;
  currentFloor: number;
  existingTables?: { capacity: number }[];
}

export default function TableSetupModal({
  isOpen,
  onClose,
  onSave,
  currentFloor,
  existingTables = []
}: TableSetupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFloor, setSelectedFloor] = useState<number>(currentFloor || 1);
  const [tableCount, setTableCount] = useState<number>(existingTables.length > 0 ? existingTables.length : 5);
  const [tableConfigs, setTableConfigs] = useState<TableCapacityConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedFloor(currentFloor || 1);
      const count = existingTables.length > 0 ? existingTables.length : 5;
      setTableCount(count);
      setErrorMsg(null);
    }
  }, [isOpen, currentFloor, existingTables]);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (tableCount < 1 || tableCount > 50) {
      setErrorMsg('Please enter a valid table count between 1 and 50.');
      return;
    }
    setErrorMsg(null);

    // Generate tables 1..tableCount
    const configs: TableCapacityConfig[] = [];
    for (let i = 1; i <= tableCount; i++) {
      // If we already had configuration for this index, preserve it
      const prev = existingTables[i - 1];
      configs.push({
        tableNumber: i,
        capacity: prev && [2, 4, 6, 8].includes(prev.capacity) ? prev.capacity : 4
      });
    }
    setTableConfigs(configs);
    setStep(2);
  };

  const handleCapacityChange = (index: number, newCap: number) => {
    setTableConfigs(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], capacity: newCap };
      return copy;
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMsg(null);
      const payload = tableConfigs.map(t => ({ capacity: t.capacity }));
      await onSave(selectedFloor, payload);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      setErrorMsg(err.message || 'Failed to save tables configuration.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Configure Floor Tables
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              {step === 1 ? 'Step 1 of 2: Select Floor & Table Count' : 'Step 2 of 2: Set Table Capacities'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {errorMsg}
            </div>
          )}

          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                  Floor
                </label>
                <select
                  value={selectedFloor}
                  onChange={e => setSelectedFloor(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    backgroundColor: 'white',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={1}>Floor 1</option>
                  <option value={2}>Floor 2</option>
                  <option value={3}>Floor 3</option>
                  <option value={4}>Floor 4</option>
                  <option value={5}>Floor 5</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                  Table Count
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={tableCount}
                  onChange={e => setTableCount(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 5"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  Specify how many tables to generate on Floor {selectedFloor} (1 to 50).
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                  Floor {selectedFloor}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  {tableConfigs.length} Tables Generated
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '320px',
                overflowY: 'auto',
                paddingRight: '0.25rem'
              }}>
                {tableConfigs.map((t, idx) => (
                  <div
                    key={t.tableNumber}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#f1f5f9',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}>
                        {t.tableNumber}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                        Table {t.tableNumber}
                      </span>
                    </div>

                    <select
                      value={t.capacity}
                      onChange={e => handleCapacityChange(idx, Number(e.target.value))}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: '#0f172a',
                        backgroundColor: '#f8fafc',
                        cursor: 'pointer'
                      }}
                    >
                      <option value={2}>2 Persons</option>
                      <option value={4}>4 Persons</option>
                      <option value={6}>6 Persons</option>
                      <option value={8}>8 Persons</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          backgroundColor: '#f8fafc'
        }}>
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.25rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinue}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 4px rgba(14, 165, 233, 0.25)'
                }}
              >
                Submit <Icons.ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.25rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  color: '#475569'
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: isSaving ? '#94a3b8' : '#059669',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: isSaving ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.25)'
                }}
              >
                {isSaving ? (
                  <>Saving Tables...</>
                ) : (
                  <>
                    <Icons.Check size={16} /> OK & Save Tables
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
