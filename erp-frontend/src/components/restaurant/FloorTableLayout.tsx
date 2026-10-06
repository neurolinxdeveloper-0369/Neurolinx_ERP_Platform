import React from 'react';
import * as Icons from 'lucide-react';

export interface RestaurantTableData {
  id: number;
  tableName: string;
  capacity: number;
  floor: number;
  position?: number;
  status: 'Free' | 'Occupied' | 'Reserved' | string;
}

interface FloorTableLayoutProps {
  tables: RestaurantTableData[];
  selectedTableId: number | null;
  onSelectTable: (table: RestaurantTableData) => void;
  onStatusChange?: (tableId: number, status: string) => void;
}

export default function FloorTableLayout({ tables, selectedTableId, onSelectTable, onStatusChange }: FloorTableLayoutProps) {

  const getStyleTheme = (status: string, isSelected: boolean) => {
    if (isSelected) {
      return {
        surface: '#eff6ff',
        text: '#1d4ed8',
        chair: '#3b82f6',
        border: '2px solid #3b82f6'
      };
    }
    switch (status) {
      case 'Occupied':
        return {
          surface: '#f59e0b',
          text: '#ffffff',
          chair: '#d97706',
          border: 'none',
          badgeBg: 'rgba(255,255,255,0.2)',
          badgeText: '#ffffff',
          label: 'In Progress'
        };
      case 'Reserved':
        return {
          surface: '#1e293b',
          text: '#ffffff',
          chair: '#0f172a',
          border: 'none',
          badgeBg: 'rgba(255,255,255,0.2)',
          badgeText: '#ffffff',
          label: '17:00 PM' // Mock time for now as per screenshot
        };
      case 'Free':
      default:
        return {
          surface: '#f8fafc',
          text: '#475569',
          chair: '#cbd5e1',
          border: '1px solid #e2e8f0',
          badgeBg: null,
          badgeText: null,
          label: null
        };
    }
  };

  const renderChairIndicators = (capacity: number, chairColor: string) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: chairColor,
      borderRadius: '4px',
      transition: 'all 0.2s ease-in-out'
    };

    if (capacity === 2) {
      return (
        <>
          <div style={{ ...baseStyle, top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '5px' }} />
          <div style={{ ...baseStyle, bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '5px' }} />
        </>
      );
    }

    if (capacity === 4) {
      return (
        <>
          <div style={{ ...baseStyle, top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '5px' }} />
          <div style={{ ...baseStyle, bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: '24px', height: '5px' }} />
          <div style={{ ...baseStyle, left: '-6px', top: '50%', transform: 'translateY(-50%)', width: '5px', height: '24px' }} />
          <div style={{ ...baseStyle, right: '-6px', top: '50%', transform: 'translateY(-50%)', width: '5px', height: '24px' }} />
        </>
      );
    }

    if (capacity === 6) {
      return (
        <>
          <div style={{ ...baseStyle, top: '-6px', left: '30%', transform: 'translateX(-50%)', width: '20px', height: '5px' }} />
          <div style={{ ...baseStyle, top: '-6px', left: '70%', transform: 'translateX(-50%)', width: '20px', height: '5px' }} />
          <div style={{ ...baseStyle, bottom: '-6px', left: '30%', transform: 'translateX(-50%)', width: '20px', height: '5px' }} />
          <div style={{ ...baseStyle, bottom: '-6px', left: '70%', transform: 'translateX(-50%)', width: '20px', height: '5px' }} />
          <div style={{ ...baseStyle, left: '-6px', top: '50%', transform: 'translateY(-50%)', width: '5px', height: '24px' }} />
          <div style={{ ...baseStyle, right: '-6px', top: '50%', transform: 'translateY(-50%)', width: '5px', height: '24px' }} />
        </>
      );
    }

    // 8+ seats
    return (
      <>
        <div style={{ ...baseStyle, top: '-6px', left: '20%', transform: 'translateX(-50%)', width: '18px', height: '5px' }} />
        <div style={{ ...baseStyle, top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '18px', height: '5px' }} />
        <div style={{ ...baseStyle, top: '-6px', left: '80%', transform: 'translateX(-50%)', width: '18px', height: '5px' }} />
        <div style={{ ...baseStyle, bottom: '-6px', left: '20%', transform: 'translateX(-50%)', width: '18px', height: '5px' }} />
        <div style={{ ...baseStyle, bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: '18px', height: '5px' }} />
        <div style={{ ...baseStyle, bottom: '-6px', left: '80%', transform: 'translateX(-50%)', width: '18px', height: '5px' }} />
        <div style={{ ...baseStyle, left: '-6px', top: '50%', transform: 'translateY(-50%)', width: '5px', height: '24px' }} />
        <div style={{ ...baseStyle, right: '-6px', top: '50%', transform: 'translateY(-50%)', width: '5px', height: '24px' }} />
      </>
    );
  };

  const getTableDimensions = (capacity: number) => {
    switch (capacity) {
      case 2:
        return { width: '80px', height: '80px', borderRadius: '24px' };
      case 4:
        return { width: '100px', height: '80px', borderRadius: '28px' };
      case 6:
        return { width: '130px', height: '80px', borderRadius: '28px' };
      case 8:
      default:
        return { width: '160px', height: '80px', borderRadius: '28px' };
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '3rem',
      padding: '2rem 1.5rem',
      justifyItems: 'center',
      alignItems: 'center'
    }}>
      {tables.map(table => {
        const isSelected = selectedTableId === table.id;
        const status = table.status || 'Free';
        const isFree = status === 'Free';
        const dimensions = getTableDimensions(table.capacity);
        const theme = getStyleTheme(status, isSelected);

        return (
          <div
            key={table.id}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px'
            }}
          >
            {/* Table Surface */}
            <div
              onClick={() => {
                if (isFree) {
                  onSelectTable(table);
                }
              }}
              style={{
                width: dimensions.width,
                height: dimensions.height,
                backgroundColor: theme.surface,
                border: theme.border,
                borderRadius: dimensions.borderRadius,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: isFree ? 'pointer' : 'default',
                boxShadow: isSelected
                  ? '0 0 0 4px rgba(59, 130, 246, 0.25), 0 8px 16px -4px rgba(59, 130, 246, 0.1)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease',
                zIndex: 2,
                userSelect: 'none'
              }}
            >
              {/* Chair Indicators */}
              {renderChairIndicators(table.capacity, theme.chair)}

              {/* Table Name */}
              <span style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: theme.text,
                lineHeight: 1,
                marginBottom: theme.label ? '4px' : '0'
              }}>
                {table.tableName}
              </span>

              {/* Status Badge inside table (like screenshot) */}
              {theme.label && (
                <div style={{
                  backgroundColor: theme.badgeBg,
                  color: theme.badgeText,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {status === 'Reserved' ? <Icons.Clock size={10} /> : <Icons.User size={10} />}
                  {theme.label}
                </div>
              )}
            </div>

            {/* Quick status management (if Occupied or Reserved) */}
            {onStatusChange && !isFree && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(table.id, 'Free');
                }}
                title="Mark table as Free"
                style={{
                  position: 'absolute',
                  bottom: '-25px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#059669',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  zIndex: 3,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
              >
                <Icons.CheckCircle2 size={11} /> Mark Free
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
