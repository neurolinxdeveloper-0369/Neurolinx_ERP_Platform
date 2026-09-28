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
  onStatusChange?: (tableId: number, newStatus: string) => void;
}

export default function FloorTableLayout({
  tables,
  selectedTableId,
  onSelectTable,
  onStatusChange
}: FloorTableLayoutProps) {
  if (tables.length === 0) {
    return null;
  }

  const renderChairIndicators = (capacity: number, status: string, isSelected: boolean) => {
    const chairColor = isSelected
      ? '#3b82f6'
      : status === 'Occupied'
      ? '#f59e0b'
      : status === 'Reserved'
      ? '#1e293b'
      : '#cbd5e1';

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      backgroundColor: chairColor,
      borderRadius: '4px',
      transition: 'all 0.2s ease-in-out'
    };

    if (capacity === 2) {
      return (
        <>
          {/* Top chair */}
          <div style={{ ...baseStyle, top: '-7px', left: '50%', transform: 'translateX(-50%)', width: '28px', height: '6px' }} />
          {/* Bottom chair */}
          <div style={{ ...baseStyle, bottom: '-7px', left: '50%', transform: 'translateX(-50%)', width: '28px', height: '6px' }} />
        </>
      );
    }

    if (capacity === 4) {
      return (
        <>
          {/* Top */}
          <div style={{ ...baseStyle, top: '-7px', left: '50%', transform: 'translateX(-50%)', width: '28px', height: '6px' }} />
          {/* Bottom */}
          <div style={{ ...baseStyle, bottom: '-7px', left: '50%', transform: 'translateX(-50%)', width: '28px', height: '6px' }} />
          {/* Left */}
          <div style={{ ...baseStyle, left: '-7px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '28px' }} />
          {/* Right */}
          <div style={{ ...baseStyle, right: '-7px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '28px' }} />
        </>
      );
    }

    if (capacity === 6) {
      return (
        <>
          {/* Top 2 */}
          <div style={{ ...baseStyle, top: '-7px', left: '28%', transform: 'translateX(-50%)', width: '26px', height: '6px' }} />
          <div style={{ ...baseStyle, top: '-7px', left: '72%', transform: 'translateX(-50%)', width: '26px', height: '6px' }} />
          {/* Bottom 2 */}
          <div style={{ ...baseStyle, bottom: '-7px', left: '28%', transform: 'translateX(-50%)', width: '26px', height: '6px' }} />
          <div style={{ ...baseStyle, bottom: '-7px', left: '72%', transform: 'translateX(-50%)', width: '26px', height: '6px' }} />
          {/* Left */}
          <div style={{ ...baseStyle, left: '-7px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '28px' }} />
          {/* Right */}
          <div style={{ ...baseStyle, right: '-7px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '28px' }} />
        </>
      );
    }

    // 8 seats
    return (
      <>
        {/* Top 3 */}
        <div style={{ ...baseStyle, top: '-7px', left: '20%', transform: 'translateX(-50%)', width: '22px', height: '6px' }} />
        <div style={{ ...baseStyle, top: '-7px', left: '50%', transform: 'translateX(-50%)', width: '22px', height: '6px' }} />
        <div style={{ ...baseStyle, top: '-7px', left: '80%', transform: 'translateX(-50%)', width: '22px', height: '6px' }} />
        {/* Bottom 3 */}
        <div style={{ ...baseStyle, bottom: '-7px', left: '20%', transform: 'translateX(-50%)', width: '22px', height: '6px' }} />
        <div style={{ ...baseStyle, bottom: '-7px', left: '50%', transform: 'translateX(-50%)', width: '22px', height: '6px' }} />
        <div style={{ ...baseStyle, bottom: '-7px', left: '80%', transform: 'translateX(-50%)', width: '22px', height: '6px' }} />
        {/* Left */}
        <div style={{ ...baseStyle, left: '-7px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '28px' }} />
        {/* Right */}
        <div style={{ ...baseStyle, right: '-7px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '28px' }} />
      </>
    );
  };

  const getTableDimensions = (capacity: number) => {
    switch (capacity) {
      case 2:
        return { width: '100px', height: '80px' };
      case 4:
        return { width: '110px', height: '85px' };
      case 6:
        return { width: '140px', height: '85px' };
      case 8:
        return { width: '175px', height: '85px' };
      default:
        return { width: '110px', height: '85px' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Occupied':
        return {
          bg: '#fef3c7',
          color: '#d97706',
          label: 'Occupied',
          dot: '#f59e0b'
        };
      case 'Reserved':
        return {
          bg: '#0f172a',
          color: '#ffffff',
          label: 'Reserved',
          dot: '#38bdf8'
        };
      case 'Free':
      default:
        return {
          bg: '#ecfdf5',
          color: '#059669',
          label: 'Free',
          dot: '#10b981'
        };
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
      gap: '2.5rem',
      padding: '1.5rem',
      justifyItems: 'center',
      alignItems: 'center'
    }}>
      {tables.map(table => {
        const isSelected = selectedTableId === table.id;
        const status = table.status || 'Free';
        const isFree = status === 'Free';
        const dimensions = getTableDimensions(table.capacity);
        const badge = getStatusBadge(status);

        return (
          <div
            key={table.id}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px'
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
                backgroundColor: isSelected ? '#eff6ff' : 'white',
                border: isSelected
                  ? '2px solid #3b82f6'
                  : isFree
                  ? '2px solid #e2e8f0'
                  : status === 'Occupied'
                  ? '2px solid #f59e0b'
                  : '2px solid #334155',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: isFree ? 'pointer' : 'default',
                boxShadow: isSelected
                  ? '0 0 0 4px rgba(59, 130, 246, 0.25), 0 8px 16px -4px rgba(59, 130, 246, 0.1)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease',
                zIndex: 2,
                userSelect: 'none'
              }}
            >
              {/* Chair Indicators */}
              {renderChairIndicators(table.capacity, status, isSelected)}

              {/* Table Name */}
              <span style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: isSelected ? '#1d4ed8' : '#0f172a',
                lineHeight: 1.2
              }}>
                {table.tableName}
              </span>

              {/* Seats Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#64748b',
                marginTop: '3px'
              }}>
                <Icons.User size={11} /> {table.capacity} Seats
              </div>

              {/* Status Badge */}
              <div style={{
                marginTop: '4px',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: badge.bg,
                color: badge.color,
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: badge.dot
                }} />
                {badge.label}
              </div>
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
                  marginTop: '8px',
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
                  gap: '3px'
                }}
              >
                <Icons.CheckCircle2 size={11} /> Free Table
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
