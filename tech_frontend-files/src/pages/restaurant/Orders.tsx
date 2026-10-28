import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { apiFetch } from '../../api';
import { usePrinter } from '../../context/PrinterContext';
import TableSetupModal from '../../components/restaurant/TableSetupModal';
import FloorTableLayout, { type RestaurantTableData } from '../../components/restaurant/FloorTableLayout';
import DeliveryManagement from './DeliveryManagement';

interface Dish {
  id: number;
  name: string;
  price: number;
  category: { id: number, name: string };
  isAvailable: boolean;
  imageBase64?: string;
  isTodaysSpecial?: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface OrderItem {
  dish: Dish;
  quantity: number;
}

export interface PlacedOrder {
  id: string | number;
  orderNumber: string;
  orderType: 'Dine-In' | 'Takeaway' | 'Delivery';
  tableName?: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  paymentMethod?: string;
  status: string;
  notes?: string;
  orderSource?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryArea?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  deliveryInstructions?: string;
  deliveryStaffName?: string;
  deliveryStatus?: string;
  expectedDeliveryTime?: string;
  createdAt: string;
}

export interface ReservationData {
  id: string;
  customerName: string;
  phone: string;
  tableId: number;
  tableName: string;
  guests: number;
  date: string;
  time: string;
  status: 'Reserved' | 'Seated' | 'Cancelled';
  notes?: string;
  createdAt: string;
}

export default function RestaurantOrders() {
  const { sendEscPos, connectedDevice } = usePrinter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway' | 'Delivery'>('Dine-In');
  const [viewMode, setViewMode] = useState<'POS' | 'Tables' | 'Reservations' | 'Deliveries'>('POS');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [tables, setTables] = useState<RestaurantTableData[]>([]);
  const [loadingTables, setLoadingTables] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<PlacedOrder[]>(() => {
    const cached = localStorage.getItem('pos_recent_orders');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Delivery Form State
  const [deliveryCustomerName, setDeliveryCustomerName] = useState('');
  const [deliveryCustomerPhone, setDeliveryCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryStaffId, setDeliveryStaffId] = useState<string>('');
  const [deliveryPrepMinutes, setDeliveryPrepMinutes] = useState<number>(20);
  const [deliveryDurationMinutes, setDeliveryDurationMinutes] = useState<number>(30);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [activeDeliveryCount, setActiveDeliveryCount] = useState<number>(0);

  // Modals
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('UPI');

  // Reservations State
  const [reservations, setReservations] = useState<ReservationData[]>(() => {
    const cached = localStorage.getItem('restaurant_reservations');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationFilter, setReservationFilter] = useState<'Today' | 'Upcoming' | 'All'>('Today');

  // Reservation Form State
  const [resCustomerName, setResCustomerName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resTableId, setResTableId] = useState<number | null>(null);
  const [resGuests, setResGuests] = useState<number>(2);
  const [resDate, setResDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [resTime, setResTime] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toTimeString().substring(0, 5);
  });
  const [resNotes, setResNotes] = useState('');
  const [resError, setResError] = useState('');

  const openNewReservationModal = (preselectedTableId?: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setResCustomerName('');
    setResPhone('');
    setResGuests(2);
    setResDate(todayStr);
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    setResTime(d.toTimeString().substring(0, 5));
    setResNotes('');
    setResError('');

    if (preselectedTableId) {
      setResTableId(preselectedTableId);
    } else if (tables.length > 0) {
      const freeTable = tables.find(t => t.status === 'Free') || tables[0];
      setResTableId(freeTable.id);
    } else {
      setResTableId(null);
    }
    setIsReservationModalOpen(true);
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resCustomerName.trim()) {
      setResError('Please enter customer name.');
      return;
    }
    if (!resPhone.trim()) {
      setResError('Please enter phone number.');
      return;
    }
    if (!resTableId) {
      setResError('Please select a table.');
      return;
    }

    const selectedTable = tables.find(t => t.id === resTableId);
    const tableName = selectedTable ? selectedTable.tableName : `Table ${resTableId}`;

    const newRes: ReservationData = {
      id: `res_${Date.now()}`,
      customerName: resCustomerName.trim(),
      phone: resPhone.trim(),
      tableId: resTableId,
      tableName,
      guests: Number(resGuests) || 2,
      date: resDate,
      time: resTime,
      status: 'Reserved',
      notes: resNotes.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = [newRes, ...reservations];
    setReservations(updated);
    localStorage.setItem('restaurant_reservations', JSON.stringify(updated));

    // If reservation is for TODAY, immediately update the table status to 'Reserved'
    const todayStr = new Date().toISOString().split('T')[0];
    if (resDate === todayStr) {
      await handleTableStatusChange(resTableId, 'Reserved');
    }

    setIsReservationModalOpen(false);
  };

  const handleSeatReservation = async (res: ReservationData) => {
    await handleTableStatusChange(res.tableId, 'Occupied');
    const updated = reservations.map(r => r.id === res.id ? { ...r, status: 'Seated' as const } : r);
    setReservations(updated);
    localStorage.setItem('restaurant_reservations', JSON.stringify(updated));

    setSelectedTableId(res.tableId);
    setSelectedTableName(res.tableName);
    setOrderType('Dine-In');
    setViewMode('POS');
  };

  const handleCancelReservation = async (res: ReservationData) => {
    const updated = reservations.map(r => r.id === res.id ? { ...r, status: 'Cancelled' as const } : r);
    setReservations(updated);
    localStorage.setItem('restaurant_reservations', JSON.stringify(updated));

    const table = tables.find(t => t.id === res.tableId);
    if (table && table.status === 'Reserved') {
      await handleTableStatusChange(res.tableId, 'Free');
    }
  };

  const loadFloorTables = async (floorNum: number) => {
    setLoadingTables(true);
    try {
      const res = await apiFetch(`https://erp-api.neurolinx.in/api/pos/tables?floor=${floorNum}`);
      if (res.ok) {
        let data: RestaurantTableData[] = await res.json();
        
        // Auto-configure from Company provisioning if empty on Floor 1
        if (data.length === 0 && floorNum === 1) {
          try {
            const compRes = await apiFetch('https://erp-api.neurolinx.in/api/settings/my-company');
            if (compRes.ok) {
              const compData = await compRes.json();
              if (compData.totalTables && compData.totalTables > 0) {
                const autoTables = Array(compData.totalTables).fill({ capacity: 4, tableName: 'Unmapped Table' });
                
                // Save them via API directly so it persists
                const confRes = await apiFetch('https://erp-api.neurolinx.in/api/pos/tables/configure', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ floor: 1, tables: autoTables })
                });
                if (confRes.ok) {
                  data = await confRes.json();
                }
              }
            }
          } catch (e) {
            console.error('Failed to auto-configure tables', e);
          }
        }
        
        setTables(data);
        localStorage.setItem(`floor_tables_${floorNum}`, JSON.stringify(data));
      } else {
        const cached = localStorage.getItem(`floor_tables_${floorNum}`);
        if (cached) {
          setTables(JSON.parse(cached));
        } else {
          setTables([]);
        }
      }
    } catch (err) {
      console.warn('Network error loading floor tables, using cache if available', err);
      const cached = localStorage.getItem(`floor_tables_${floorNum}`);
      if (cached) {
        setTables(JSON.parse(cached));
      } else {
        setTables([]);
      }
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    loadFloorTables(activeFloor);
  }, [viewMode, activeFloor]);

  const handleSaveTableConfig = async (floor: number, newTables: { capacity: number }[]) => {
    try {
      const res = await apiFetch('https://erp-api.neurolinx.in/api/pos/tables/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor, tables: newTables })
      });
      if (res.ok) {
        const saved: RestaurantTableData[] = await res.json();
        setActiveFloor(floor);
        setTables(saved);
        localStorage.setItem(`floor_tables_${floor}`, JSON.stringify(saved));
      } else {
        const fallbackTables: RestaurantTableData[] = newTables.map((t, idx) => ({
          id: Date.now() + idx,
          tableName: `Table ${idx + 1}`,
          capacity: t.capacity,
          floor: floor,
          position: idx + 1,
          status: 'Free'
        }));
        setActiveFloor(floor);
        setTables(fallbackTables);
        localStorage.setItem(`floor_tables_${floor}`, JSON.stringify(fallbackTables));
      }
    } catch (err) {
      console.error('Error saving table configuration, saving locally', err);
      const fallbackTables: RestaurantTableData[] = newTables.map((t, idx) => ({
        id: Date.now() + idx,
        tableName: `Table ${idx + 1}`,
        capacity: t.capacity,
        floor: floor,
        position: idx + 1,
        status: 'Free'
      }));
      setActiveFloor(floor);
      setTables(fallbackTables);
      localStorage.setItem(`floor_tables_${floor}`, JSON.stringify(fallbackTables));
    }
  };

  const handleTableStatusChange = async (tableId: number, newStatus: string) => {
    try {
      await apiFetch(`https://erp-api.neurolinx.in/api/pos/tables/${tableId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.warn('Could not persist status change to API', e);
    }
    setTables(prev => {
      const updated = prev.map(t => t.id === tableId ? { ...t, status: newStatus } : t);
      localStorage.setItem(`floor_tables_${activeFloor}`, JSON.stringify(updated));
      return updated;
    });
    if (selectedTableId === tableId && newStatus !== 'Free') {
      setSelectedTableId(null);
      setSelectedTableName('');
    }
  };

  const handleUpdateTableCapacity = async (tableId: number, capacity: number, tableName?: string) => {
    try {
      const payload: any = { capacity };
      if (tableName) payload.tableName = tableName;
      await apiFetch(`https://erp-api.neurolinx.in/api/pos/tables/${tableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Could not update table to API', e);
    }
    setTables(prev => {
      const updated = prev.map(t => t.id === tableId ? { ...t, capacity, ...(tableName ? { tableName } : {}) } : t);
      localStorage.setItem(`floor_tables_${activeFloor}`, JSON.stringify(updated));
      return updated;
    });
    if (tableName) setSelectedTableName(tableName);
  };

  const handleSelectTable = (table: RestaurantTableData) => {
    setSelectedTableId(table.id);
    setSelectedTableName(table.tableName);
    setOrderType('Dine-In');
  };

  useEffect(() => {
    Promise.all([
      apiFetch('https://erp-api.neurolinx.in/api/pos/categories').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/pos/dishes').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/settings').then(res => res.json()),
      apiFetch('https://erp-api.neurolinx.in/api/settings/my-company').then(res => res.ok ? res.json() : null),
      apiFetch('https://erp-api.neurolinx.in/api/staff/employees').then(res => res.ok ? res.json() : []).catch(() => [])
    ]).then(([cats, items, sets, comp, staff]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setDishes(Array.isArray(items) ? items : []);
      setSettings(sets);
      if (comp) setCompany(comp);
      if (Array.isArray(staff)) setStaffList(staff.filter((s: any) => s.isActive !== false));
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });

    const fetchRecentOrders = () => {
      apiFetch('https://erp-api.neurolinx.in/api/pos/orders/recent')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped: PlacedOrder[] = data.map((o: any) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              orderType: (o.orderType as any) || 'Dine-In',
              tableName: o.restaurantTable?.tableName,
              items: o.items ? o.items.map((it: any) => ({
                name: it.dish?.name || it.dishName || 'Dish Item',
                quantity: it.quantity || 1,
                price: it.price || 0
              })) : [],
              totalAmount: o.totalAmount || 0,
              paymentMethod: o.paymentMethod || 'UPI',
              status: o.status || 'Completed',
              notes: o.notes,
              orderSource: o.orderSource,
              customerName: o.customerName,
              customerPhone: o.customerPhone,
              deliveryAddress: o.deliveryAddress,
              deliveryArea: o.deliveryArea,
              deliveryCity: o.deliveryCity,
              deliveryPostalCode: o.deliveryPostalCode,
              deliveryInstructions: o.deliveryInstructions,
              deliveryStaffName: o.deliveryStaffName,
              deliveryStatus: o.deliveryStatus,
              expectedDeliveryTime: o.expectedDeliveryTime,
              createdAt: o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
            }));
            setRecentOrders(mapped.slice(0, 10));
            localStorage.setItem('pos_recent_orders', JSON.stringify(mapped.slice(0, 10)));
          }
        })
        .catch(() => {});

      // Sync active delivery count
      apiFetch('https://erp-api.neurolinx.in/api/pos/orders/deliveries')
        .then(res => res.ok ? res.json() : [])
        .then(delivs => {
          if (Array.isArray(delivs)) {
            const active = delivs.filter(d => d.deliveryStatus !== 'Delivered' && d.deliveryStatus !== 'Cancelled').length;
            setActiveDeliveryCount(active);
          }
        })
        .catch(() => {});
    };

    fetchRecentOrders();
    const interval = setInterval(fetchRecentOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (dish: Dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.id === dish.id);
      if (existing) {
        return prev.map(item => item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.dish.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };
  
  // removeItem commented

  const generateKotReceipt = (orderNumber: string) => {
    const ESC = 0x1b; const GS = 0x1d; const encoder = new TextEncoder();
    let payload = new Uint8Array([ESC, 0x40, ESC, 0x61, 0x01, ESC, 0x21, 0x10]); // init, center, double height
    
    payload = new Uint8Array([...payload, ...encoder.encode("** KOT **\n"), ESC, 0x21, 0x00]);
    payload = new Uint8Array([...payload, ...encoder.encode(`Order: ${orderNumber} | ${orderType}\n`), ESC, 0x61, 0x00, ...encoder.encode("--------------------------------\n"), ESC, 0x21, 0x08]);
    
    cart.forEach(item => {
      payload = new Uint8Array([...payload, ...encoder.encode(`${item.quantity}x ${item.dish.name}\n`)]);
    });
    
    payload = new Uint8Array([...payload, ESC, 0x21, 0x00, ...encoder.encode("--------------------------------\n\n\n\n\n"), GS, 0x56, 0x41, 0x00]);
    return payload;
  };

  
  const rasterizeImage = async (base64Str: string): Promise<Uint8Array> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(new Uint8Array(0)); return; }
        
        let width = img.width;
        let height = img.height;
        if (width > 200) {
          height = Math.floor(height * (200 / width));
          width = 200;
        }
        width = Math.floor(width / 8) * 8; 
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;
        
        const xL = (width / 8) % 256;
        const xH = Math.floor((width / 8) / 256);
        const yL = height % 256;
        const yH = Math.floor(height / 256);
        
        const dataLength = (width / 8) * height;
        const buffer = new Uint8Array(8 + dataLength);
        
        buffer[0] = 0x1d; buffer[1] = 0x76; buffer[2] = 0x30; buffer[3] = 0x00;
        buffer[4] = xL; buffer[5] = xH; buffer[6] = yL; buffer[7] = yH;
        
        let offset = 8;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x += 8) {
            let b = 0;
            for (let bit = 0; bit < 8; bit++) {
              const idx = (y * width + (x + bit)) * 4;
              const brightness = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;
              if (brightness < 128) {
                b |= (1 << (7 - bit));
              }
            }
            buffer[offset++] = b;
          }
        }
        resolve(buffer);
      };
      img.onerror = () => resolve(new Uint8Array(0));
      img.src = base64Str;
    });
  };

  const generateCustomerReceipt = async (orderNumber: string, total: number, tax: number) => {

    const ESC = 0x1b; const GS = 0x1d; const encoder = new TextEncoder();
    let payload = new Uint8Array([ESC, 0x40, ESC, 0x61, 0x01]);
    
    let storeName = settings?.storeName || "Neurolinx POS";
    payload = new Uint8Array([...payload, ESC, 0x21, 0x10, ...encoder.encode(`${storeName.toUpperCase()}\n`), ESC, 0x21, 0x00]);
    
    if (settings?.address) payload = new Uint8Array([...payload, ...encoder.encode(`${settings.address}\n`)]);
    if (settings?.gstNumber) payload = new Uint8Array([...payload, ...encoder.encode(`GST: ${settings.gstNumber}\n`)]);
    
    payload = new Uint8Array([...payload, ...encoder.encode("--------------------------------\n")]);
    payload = new Uint8Array([...payload, ...encoder.encode(`Order: ${orderNumber} | ${orderType} ${orderType === 'Dine-In' && selectedTableName ? '('+selectedTableName+')' : ''}\n`)]);
    payload = new Uint8Array([...payload, ...encoder.encode("--------------------------------\n"), ESC, 0x61, 0x00]);
    
    cart.forEach(item => {
      let line = `${item.quantity}x ${item.dish.name}`;
      let priceStr = `Rs.${(item.dish.price * item.quantity).toFixed(2)}`;
      let spaces = 32 - line.length - priceStr.length;
      if (spaces < 1) spaces = 1;
      payload = new Uint8Array([...payload, ...encoder.encode(`${line}${' '.repeat(spaces)}${priceStr}\n`)]);
    });
    
    payload = new Uint8Array([...payload, ...encoder.encode("--------------------------------\n")]);
    payload = new Uint8Array([...payload, ESC, 0x61, 0x02, ...encoder.encode(`Subtotal: Rs.${(total - tax).toFixed(2)}\n`)]);
    payload = new Uint8Array([...payload, ...encoder.encode(`Tax: Rs.${tax.toFixed(2)}\n`)]);
    payload = new Uint8Array([...payload, ESC, 0x21, 0x10, ...encoder.encode(`TOTAL: Rs.${total.toFixed(2)}\n`), ESC, 0x21, 0x00, ESC, 0x61, 0x01]);
    
    if (orderType === 'Dine-In') {
        if (settings?.upiQrImageBase64) {
          payload = new Uint8Array([...payload, ...encoder.encode("\nSCAN TO PAY (UPI)\n")]);
          const rasterData = await rasterizeImage(settings.upiQrImageBase64);
          payload = new Uint8Array([...payload, ...rasterData]); 
        }
      }
      
      if (settings?.receiptFooter) payload = new Uint8Array([...payload, ...encoder.encode(`\n${settings.receiptFooter}\n`)]);
    
    payload = new Uint8Array([...payload, ...encoder.encode("\n\n\n\n\n"), GS, 0x56, 0x41, 0x00]);
    return payload;
  };

  const placeOrder = (status: 'Completed' | 'Parked') => {
    if (cart.length === 0) return;

    if (orderType === 'Delivery') {
      if (!deliveryCustomerName.trim()) {
        setDeliveryError('Customer name is required for delivery.');
        setIsDeliveryModalOpen(true);
        return;
      }
      if (!deliveryCustomerPhone.trim()) {
        setDeliveryError('Customer contact phone is required for delivery.');
        setIsDeliveryModalOpen(true);
        return;
      }
      if (!deliveryAddress.trim()) {
        setDeliveryError('Delivery address is required.');
        setIsDeliveryModalOpen(true);
        return;
      }
    }

    const total = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
    const discountRate = settings?.defaultDiscount || 0.0;
    const discountAmount = total * (discountRate / 100);
    const subtotalAfterDiscount = total - discountAmount;
    const taxRate = settings?.defaultTaxRate || 5.0;
    const tax = subtotalAfterDiscount * (taxRate / 100);
    const finalTotal = subtotalAfterDiscount + tax;
    const currentTableId = selectedTableId;
    const currentTableName = selectedTableName || (currentTableId ? ('Table ' + currentTableId) : '');

    const handlePrint = (order: any) => {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) return;
      
      let itemsHtml = '';
      if (order.items) {
        order.items.forEach((item: any) => {
          itemsHtml += `
            <tr>
              <td style="padding: 4px 0; font-size: 14px;">${item.quantity}x ${item.name || 'Item'}</td>
              <td style="padding: 4px 0; text-align: right; font-size: 14px;">${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `;
        });
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${order.orderNumber}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h2 { margin: 0; font-size: 20px; }
            .header p { margin: 5px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .totals { border-top: 1px dashed #000; padding-top: 10px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .totals .grand-total { font-size: 18px; font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>RESTAURANT</h2>
            <p>Order #${order.orderNumber}</p>
            <p>${order.createdAt}</p>
            <p>${order.orderType}${order.tableName ? ' - ' + order.tableName : ''}</p>
            ${order.orderType === 'Delivery' ? `<p style="font-size:12px;margin:2px 0;"><strong>Customer:</strong> ${order.customerName || ''} (${order.customerPhone || ''})<br/><strong>Address:</strong> ${order.deliveryAddress || ''}</p>` : ''}
          </div>
          
          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="grand-total"><span>Total</span> <span>${order.totalAmount?.toFixed(2)}</span></div>
          </div>
          
          <div class="footer">
            <p>Thank you for visiting!</p>
            <p>Powered by Neurolinx</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
    };

    const saveOrderLocally = (serverOrder?: any) => {
      const orderNum = serverOrder?.orderNumber || `ORD-${Date.now().toString().slice(-4)}`;
      const newOrderRecord: PlacedOrder = {
        id: serverOrder?.id || Date.now(),
        orderNumber: orderNum,
        orderType,
        tableName: orderType === 'Dine-In' ? (currentTableName || 'Table') : undefined,
        items: cart.map(c => ({ name: c.dish.name, quantity: c.quantity, price: c.dish.price })),
        totalAmount: finalTotal,
        paymentMethod: status === 'Parked' ? 'Unpaid' : paymentMethod,
        status: status,
        customerName: orderType === 'Delivery' ? deliveryCustomerName.trim() : undefined,
        customerPhone: orderType === 'Delivery' ? deliveryCustomerPhone.trim() : undefined,
        deliveryAddress: orderType === 'Delivery' ? deliveryAddress.trim() : undefined,
        deliveryArea: orderType === 'Delivery' ? deliveryArea.trim() : undefined,
        deliveryCity: orderType === 'Delivery' ? deliveryCity.trim() : undefined,
        deliveryPostalCode: orderType === 'Delivery' ? deliveryPostalCode.trim() : undefined,
        deliveryInstructions: orderType === 'Delivery' ? deliveryInstructions.trim() : undefined,
        deliveryStaffName: orderType === 'Delivery' && deliveryStaffId ? staffList.find(s => String(s.id) === deliveryStaffId)?.name : undefined,
        deliveryStatus: orderType === 'Delivery' ? 'Order Placed' : undefined,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setRecentOrders(prev => {
        const updated = [newOrderRecord, ...prev.filter(p => p.orderNumber !== orderNum)].slice(0, 10);
        localStorage.setItem('pos_recent_orders', JSON.stringify(updated));
        return updated;
      });

      // Dispatch event for Dashboard to catch live updates
      window.dispatchEvent(new CustomEvent('neurolinx_order_placed', { detail: newOrderRecord }));
      window.dispatchEvent(new Event('storage'));

      if (status === 'Completed') {
        handlePrint(newOrderRecord);
      }

      return newOrderRecord;
    };
    
    const orderPayload: any = { 
      orderType, 
      tableId: orderType === 'Dine-In' ? currentTableId : null,
      totalAmount: finalTotal, 
      taxApplied: tax,
      paymentMethod: status === 'Parked' ? null : paymentMethod,
      status: status,
      kitchenStatus: 'Pending',
      items: cart.map(c => ({ dishId: c.dish.id, quantity: c.quantity })) 
    };

    if (orderType === 'Delivery') {
      orderPayload.customerName = deliveryCustomerName.trim();
      orderPayload.customerPhone = deliveryCustomerPhone.trim();
      orderPayload.deliveryAddress = deliveryAddress.trim();
      if (deliveryArea.trim()) orderPayload.deliveryArea = deliveryArea.trim();
      if (deliveryCity.trim()) orderPayload.deliveryCity = deliveryCity.trim();
      if (deliveryPostalCode.trim()) orderPayload.deliveryPostalCode = deliveryPostalCode.trim();
      if (deliveryInstructions.trim()) orderPayload.deliveryInstructions = deliveryInstructions.trim();
      if (deliveryStaffId) orderPayload.deliveryStaffId = deliveryStaffId;
      orderPayload.estimatedPrepMinutes = deliveryPrepMinutes;
      orderPayload.estimatedDeliveryMinutes = deliveryDurationMinutes;
      orderPayload.deliveryStatus = 'Order Placed';
    }

    apiFetch('https://erp-api.neurolinx.in/api/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    })
    .then(async res => {
      if (!res.ok) {
        let errMessage = `Server error (${res.status})`;
        try {
          const errData = await res.json();
          if (errData.message) errMessage = errData.message;
        } catch (e) {}
        throw new Error(errMessage);
      }
      return res.json();
    })
    .then(order => {
      if (status === 'Completed') {
        alert(orderType === 'Delivery' ? "Delivery order placed successfully!" : "Order placed successfully!");
        
        if (connectedDevice && order?.orderNumber) {
          // Print KOT
          sendEscPos(generateKotReceipt(order.orderNumber)).then(() => {
            // Then print Bill
            setTimeout(async () => {
              const billPayload = await generateCustomerReceipt(order.orderNumber, finalTotal, tax);
              sendEscPos(billPayload);
            }, 3000); // 3 second delay to let KOT finish cutting
          });
        }
      } else {
        alert(orderType === 'Delivery' ? "Delivery order Parked successfully!" : "Order Parked successfully!");
      }

      if (orderType === 'Dine-In' && currentTableId) {
        handleTableStatusChange(currentTableId, status === 'Parked' ? 'Occupied' : 'Free');
      }

      if (orderType === 'Delivery') {
        setActiveDeliveryCount(prev => prev + 1);
        setDeliveryCustomerName('');
        setDeliveryCustomerPhone('');
        setDeliveryAddress('');
        setDeliveryArea('');
        setDeliveryCity('');
        setDeliveryPostalCode('');
        setDeliveryInstructions('');
        setDeliveryStaffId('');
        setDeliveryError('');
        setIsDeliveryModalOpen(false);
      }

      saveOrderLocally(order);

      setSelectedTableId(null);
      setSelectedTableName('');
      setCart([]);
      setShowCheckout(false);
    })
    .catch(err => {
      console.error("Order placement failed on server:", err);
      alert(`Failed to place order: ${err.message || 'Server error'}. The order was NOT saved.`);
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
  const discountRate = settings?.defaultDiscount || 0.0;
    const discountAmount = subtotal * (discountRate / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxRate = settings?.defaultTaxRate || 5.0;
  const tax = subtotalAfterDiscount * (taxRate / 100);
  const total = subtotalAfterDiscount + tax;

  const filteredDishes = dishes
    .filter(d => selectedCategory ? d.category && d.category.id === selectedCategory : true)
    .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading POS Terminal...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100%', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Checkout - Rs. {total.toFixed(2)}</h2>
            
            {orderType === 'Delivery' && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.825rem' }}>
                <div style={{ fontWeight: 700, color: '#166534', marginBottom: '2px' }}>
                  Delivery to: {deliveryCustomerName || 'Customer'} ({deliveryCustomerPhone || 'No Phone'})
                </div>
                <div style={{ color: '#334155', fontSize: '0.78rem' }}>
                  {deliveryAddress || 'No Address'}{deliveryArea ? `, ${deliveryArea}` : ''}{deliveryCity ? `, ${deliveryCity}` : ''}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '4px' }}>
                  Ready in: {deliveryPrepMinutes}m | Transit: {deliveryDurationMinutes}m | Driver: {deliveryStaffId ? (staffList.find(s => String(s.id) === deliveryStaffId)?.name || 'Assigned') : 'Unassigned (dispatch later)'}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              {['UPI', 'Cash', 'Card'].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m as any)} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: paymentMethod === m ? '2px solid #0ea5e9' : '1px solid #cbd5e1', backgroundColor: paymentMethod === m ? '#f0f9ff' : 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {m}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowCheckout(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => placeOrder('Completed')} style={{ flex: 1, padding: '0.75rem', border: 'none', borderRadius: '8px', backgroundColor: '#0ea5e9', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Complete Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Left Menu Section */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem' }}>
                <button onClick={() => setViewMode('POS')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'POS' ? 'white' : 'transparent', color: viewMode === 'POS' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'POS' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Monitor size={16} /> Point of Sale
                </button>
                <button onClick={() => setViewMode('Tables')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'Tables' ? 'white' : 'transparent', color: viewMode === 'Tables' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'Tables' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.LayoutGrid size={16} /> Tables
                </button>
                <button onClick={() => setViewMode('Reservations')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'Reservations' ? 'white' : 'transparent', color: viewMode === 'Reservations' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'Reservations' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Calendar size={16} /> Reservations
                </button>
                <button onClick={() => setViewMode('Deliveries')} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: viewMode === 'Deliveries' ? 'white' : 'transparent', color: viewMode === 'Deliveries' ? '#0f172a' : '#64748b', boxShadow: viewMode === 'Deliveries' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icons.Truck size={16} /> Deliveries
                  {activeDeliveryCount > 0 && (
                    <span style={{ backgroundColor: '#0284c7', color: 'white', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                      {activeDeliveryCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {viewMode === 'POS' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search dishes..." 
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', width: '250px' }}
                />
              </div>
            )}
        </div>

        {viewMode === 'POS' && (
          <>
            {/* Categories */}
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem', scrollbarWidth: 'none' }}>
              <button 
                onClick={() => setSelectedCategory(null)}
                style={{ flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: selectedCategory === null ? '#0ea5e9' : '#f1f5f9', color: selectedCategory === null ? 'white' : '#475569', transition: 'all 0.2s' }}>
                All Items
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{ flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '20px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: selectedCategory === cat.id ? '#0ea5e9' : '#f1f5f9', color: selectedCategory === cat.id ? 'white' : '#475569', transition: 'all 0.2s' }}>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Dishes Grid */}
            {dishes.length === 0 ? (
              <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <Icons.UtensilsCrossed size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: 0, color: '#334155' }}>No Dishes Found</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Add dishes in the Menu Management module to start taking orders.</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', 
                gap: '1.25rem', 
                minHeight: '380px',
                maxHeight: '560px', 
                overflowY: 'auto', 
                padding: '0.25rem 0.5rem 0.75rem 0.25rem',
                alignContent: 'start',
                scrollbarWidth: 'thin'
              }}>
                {filteredDishes.map(dish => (
                  <div 
                    key={dish.id} 
                    style={{ 
                      backgroundColor: 'white', 
                      borderRadius: '16px', 
                      padding: '1rem', 
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      position: 'relative',
                      minHeight: '260px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ height: '140px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {dish.imageBase64 ? (
                        <img src={dish.imageBase64} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Icons.Image size={32} color="#cbd5e1" />
                      )}
                      {!dish.isAvailable && (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dish.name}>
                      {dish.name}
                    </h3>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                      <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '1.125rem' }}>₹{dish.price}</span>
                      <button 
                        disabled={!dish.isAvailable}
                        onClick={() => addToCart(dish)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: dish.isAvailable ? '#f0f9ff' : '#f1f5f9', color: dish.isAvailable ? '#0284c7' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: dish.isAvailable ? 'pointer' : 'not-allowed', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                        Add to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Orders List (Latest 10) */}
            <div style={{
              marginTop: '1.75rem',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Receipt size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                      Recent Orders (Latest 10)
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Showing latest orders placed ({recentOrders.length} / 10)
                    </span>
                  </div>
                </div>
                {recentOrders.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Clear local recent orders history?")) {
                        setRecentOrders([]);
                        localStorage.removeItem('pos_recent_orders');
                      }
                    }}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Icons.Trash2 size={13} /> Clear List
                  </button>
                )}
              </div>

              {recentOrders.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1'
                }}>
                  No orders placed yet. Once an order is completed or parked, the latest 10 orders will appear here row-by-row.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '380px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '0.65rem 1rem' }}>Order #</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Type & Table</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Items Ordered</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Total Amount</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Payment</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Status</th>
                        <th style={{ padding: '0.65rem 1rem' }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((ord, idx) => (
                        <tr
                          key={ord.id ? `${ord.id}-${idx}` : idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                            #{ord.orderNumber}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: ord.orderType === 'Dine-In' ? '#eff6ff' : '#f1f5f9',
                              color: ord.orderType === 'Dine-In' ? '#1d4ed8' : '#475569'
                            }}>
                              {ord.orderType === 'Dine-In' ? (
                                <>
                                  <Icons.UtensilsCrossed size={12} />
                                  {ord.tableName ? ord.tableName : 'Dine-In'}
                                </>
                              ) : (
                                <>
                                  <Icons.ShoppingBag size={12} />
                                  Takeaway
                                </>
                              )}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', maxWidth: '280px', color: '#334155' }}>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}>
                              {ord.items.length > 0
                                ? ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')
                                : '—'}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0284c7' }}>
                            ₹{Number(ord.totalAmount).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#475569',
                              backgroundColor: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {ord.paymentMethod || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: ord.status === 'Completed' ? '#ecfdf5' : '#fffbeb',
                              color: ord.status === 'Completed' ? '#059669' : '#d97706'
                            }}>
                              {ord.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                            {ord.createdAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === 'Tables' && (
          <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0' }}>
            {/* Top Floor Bar & Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              backgroundColor: 'white',
              borderBottom: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '1rem',
              position: 'relative'
            }}>
              
              {/* Center Status Legend */}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.4rem 1.2rem', borderRadius: '32px', gap: '1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#475569', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #cbd5e1' }} /> Available
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Not Available
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1e293b' }} /> Reserved
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} /> Can't Select
                </div>
              </div>

              {/* Right Side Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'absolute', right: '1.5rem' }}>
                {/* Floor Switcher */}
                <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '0.2rem', borderRadius: '24px', gap: '0.2rem' }}>
                  {Array.from({ length: company?.totalFloors || 1 }, (_, i) => i + 1).map(floorNum => (
                    <button
                      key={floorNum}
                      onClick={() => setActiveFloor(floorNum)}
                      style={{
                        padding: '0.4rem 1.25rem',
                        border: 'none',
                        borderRadius: '20px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: activeFloor === floorNum ? '#e2e8f0' : 'transparent',
                        color: activeFloor === floorNum ? '#334155' : '#94a3b8',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {floorNum}{floorNum === 1 ? 'st' : floorNum === 2 ? 'nd' : floorNum === 3 ? 'rd' : 'th'} Floor
                    </button>
                  ))}
                </div>

                {/* Configure Button */}
                <button
                  onClick={() => setIsSetupModalOpen(true)}
                  title="Configure Tables"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)'
                  }}
                >
                  <Icons.SlidersHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Subtitle / Overview */}
            <div style={{ padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Floor {activeFloor}</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.75rem', fontWeight: 500 }}>
                  {tables.length} {tables.length === 1 ? 'table' : 'tables'} configured
                </span>
              </div>
              {tables.length > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                  💡 Click any Free table to assign it for Dine-In
                </div>
              )}
            </div>

            {/* Table Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', position: 'relative' }}>
              {loadingTables ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  Loading tables for Floor {activeFloor}...
                </div>
              ) : tables.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '350px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '2px dashed #cbd5e1',
                  margin: '1.5rem',
                  padding: '2rem'
                }}>
                  <Icons.Armchair size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem' }}>
                    No Tables Configured on Floor {activeFloor}
                  </h3>
                  <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.875rem', textAlign: 'center', maxWidth: '360px' }}>
                    Get started by setting the table count and seating capacities for Floor {activeFloor}.
                  </p>
                  <button
                    onClick={() => setIsSetupModalOpen(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.25)'
                    }}
                  >
                    <Icons.Plus size={16} /> Configure Floor {activeFloor} Tables
                  </button>
                </div>
              ) : (
                <FloorTableLayout
                  tables={tables}
                  selectedTableId={selectedTableId}
                  onSelectTable={handleSelectTable}
                  onStatusChange={handleTableStatusChange}
                />
              )}
            </div>

            {/* Floating Action Bar when a table is selected */}
            {selectedTableId && (() => {
              const currentTable = tables.find(t => t.id === selectedTableId);
              const isReserved = currentTable?.status === 'Reserved';
              const isOccupied = currentTable?.status === 'Occupied';
              const todayStr = new Date().toISOString().split('T')[0];
              const tableReservation = reservations.find(r => r.tableId === selectedTableId && r.date === todayStr && r.status === 'Reserved');

              return (
                <div style={{
                  position: 'absolute',
                  bottom: '1.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#0f172a',
                  borderRadius: '32px',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                  zIndex: 50,
                  maxWidth: '92%',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ color: 'white', fontSize: '0.875rem', paddingLeft: '0.75rem' }}>Selected:</span>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    color: '#0f172a'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        value={selectedTableName}
                        onChange={(e) => handleUpdateTableCapacity(selectedTableId, currentTable?.capacity || 4, e.target.value)}
                        style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', width: '90px' }}
                      />
                      <select
                        value={currentTable?.capacity || 4}
                        onChange={(e) => handleUpdateTableCapacity(selectedTableId, parseInt(e.target.value), selectedTableName)}
                        style={{ border: 'none', backgroundColor: '#f1f5f9', borderRadius: '4px', padding: '0.1rem 0.2rem', outline: 'none', fontWeight: 600, fontSize: '0.75rem', color: '#334155' }}
                      >
                        {[2, 4, 6, 8, 10, 12].map(cap => (
                          <option key={cap} value={cap}>{cap} Seats</option>
                        ))}
                      </select>
                    </div>
                    {isReserved && (
                      <span style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>
                        Reserved {tableReservation ? `(${tableReservation.customerName})` : ''}
                      </span>
                    )}
                    {isOccupied && (
                      <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>
                        Occupied
                      </span>
                    )}
                    <Icons.X
                      size={16}
                      style={{ cursor: 'pointer', color: '#64748b' }}
                      onClick={() => {
                        setSelectedTableId(null);
                        setSelectedTableName('');
                      }}
                    />
                  </div>

                  {/* Actions depending on table status */}
                  {!isReserved && !isOccupied && (
                    <button
                      onClick={() => openNewReservationModal(selectedTableId)}
                      style={{
                        backgroundColor: '#6366f1',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Icons.CalendarPlus size={16} /> Reserve
                    </button>
                  )}

                  {isReserved && (
                    <>
                      <button
                        onClick={async () => {
                          if (tableReservation) {
                            await handleSeatReservation(tableReservation);
                          } else {
                            await handleTableStatusChange(selectedTableId, 'Occupied');
                            setOrderType('Dine-In');
                            setViewMode('POS');
                          }
                        }}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 1rem',
                          borderRadius: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Icons.UserCheck size={16} /> Seat Guest
                      </button>
                      <button
                        onClick={async () => {
                          if (tableReservation) {
                            await handleCancelReservation(tableReservation);
                          } else {
                            await handleTableStatusChange(selectedTableId, 'Free');
                          }
                        }}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '0.5rem 0.9rem',
                          borderRadius: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Icons.XCircle size={16} /> Release Table
                      </button>
                    </>
                  )}

                  {isOccupied && (
                    <button
                      onClick={() => handleTableStatusChange(selectedTableId, 'Free')}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Icons.CheckCircle2 size={16} /> Mark Free
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setOrderType('Dine-In');
                      setViewMode('POS');
                    }}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Continue to POS <Icons.ArrowRight size={16} />
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {viewMode === 'Reservations' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem', overflow: 'hidden' }}>
            {/* Header & Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Table Reservations</h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Manage guest bookings. Today's bookings automatically reserve tables on the floor plan.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Filter Tabs */}
                <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '24px', padding: '0.2rem', gap: '0.2rem' }}>
                  {(['Today', 'Upcoming', 'All'] as const).map(tab => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    let count = 0;
                    if (tab === 'Today') count = reservations.filter(r => r.date === todayStr).length;
                    else if (tab === 'Upcoming') count = reservations.filter(r => r.date > todayStr).length;
                    else count = reservations.length;

                    const isActive = reservationFilter === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setReservationFilter(tab)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: '20px',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          backgroundColor: isActive ? 'white' : 'transparent',
                          color: isActive ? '#0f172a' : '#64748b',
                          boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {tab}
                        <span style={{
                          backgroundColor: isActive ? '#0284c7' : '#cbd5e1',
                          color: isActive ? 'white' : '#475569',
                          borderRadius: '10px',
                          padding: '1px 6px',
                          fontSize: '0.65rem',
                          fontWeight: 700
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* New Reservation Button */}
                <button
                  onClick={() => openNewReservationModal()}
                  style={{
                    backgroundColor: '#0284c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    padding: '0.55rem 1.25rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  <Icons.Plus size={16} /> New Reservation
                </button>
              </div>
            </div>

            {/* List / Grid of Reservations */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.25rem' }}>
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const filtered = reservations.filter(r => {
                  if (reservationFilter === 'Today') return r.date === todayStr;
                  if (reservationFilter === 'Upcoming') return r.date > todayStr;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{
                      height: '100%',
                      minHeight: '320px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      border: '2px dashed #cbd5e1',
                      padding: '2rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <Icons.CalendarDays size={28} color="#0284c7" />
                      </div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: 700 }}>
                        {reservationFilter === 'Today' ? 'No Reservations For Today' : reservationFilter === 'Upcoming' ? 'No Upcoming Reservations' : 'No Reservations Yet'}
                      </h3>
                      <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.875rem', maxWidth: '360px' }}>
                        Add a new reservation to book a table for guests and keep your dining room organized.
                      </p>
                      <button
                        onClick={() => openNewReservationModal()}
                        style={{
                          padding: '0.65rem 1.4rem',
                          backgroundColor: '#0284c7',
                          color: 'white',
                          border: 'none',
                          borderRadius: '24px',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                        }}
                      >
                        <Icons.Plus size={16} /> + New Reservation
                      </button>
                    </div>
                  );
                }

                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1rem'
                  }}>
                    {filtered.map(res => {
                      const isToday = res.date === todayStr;
                      return (
                        <div
                          key={res.id}
                          style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: res.status === 'Reserved' ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                            position: 'relative'
                          }}
                        >
                          {/* Card Header: Table & Status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{
                                backgroundColor: '#0f172a',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}>
                                <Icons.UtensilsCrossed size={12} />
                                {res.tableName}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                {res.guests} {res.guests === 1 ? 'Guest' : 'Guests'}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: res.status === 'Reserved' ? '#1e293b' : res.status === 'Seated' ? '#ecfdf5' : '#f1f5f9',
                              color: res.status === 'Reserved' ? '#ffffff' : res.status === 'Seated' ? '#059669' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              {res.status === 'Reserved' && <Icons.Clock size={10} />}
                              {res.status === 'Seated' && <Icons.Check size={10} />}
                              {res.status}
                            </span>
                          </div>

                          {/* Customer Details */}
                          <div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                              {res.customerName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                              <Icons.Phone size={12} />
                              {res.phone}
                            </div>
                          </div>

                          {/* Date & Time pill */}
                          <div style={{
                            backgroundColor: '#f8fafc',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: '#334155',
                            border: '1px solid #f1f5f9'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Icons.Calendar size={13} color="#0284c7" />
                              <span style={{ fontWeight: 700 }}>
                                {isToday ? 'Today' : res.date}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Icons.Clock size={13} color="#0284c7" />
                              <span style={{ fontWeight: 700 }}>{res.time}</span>
                            </div>
                          </div>

                          {/* Optional Notes */}
                          {res.notes && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', backgroundColor: '#fffbeb', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                              "{res.notes}"
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                            {res.status === 'Reserved' ? (
                              <>
                                <button
                                  onClick={() => handleSeatReservation(res)}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.4rem'
                                  }}
                                >
                                  <Icons.UserCheck size={13} /> Seat Guest
                                </button>
                                <button
                                  onClick={() => handleCancelReservation(res)}
                                  style={{
                                    padding: '0.5rem 0.75rem',
                                    backgroundColor: '#fee2e2',
                                    color: '#b91c1c',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : res.status === 'Seated' ? (
                              <button
                                onClick={() => {
                                  setSelectedTableId(res.tableId);
                                  setSelectedTableName(res.tableName);
                                  setOrderType('Dine-In');
                                  setViewMode('POS');
                                }}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  backgroundColor: '#0284c7',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem'
                                }}
                              >
                                View Table in POS <Icons.ArrowRight size={13} />
                              </button>
                            ) : (
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', padding: '0.25rem 0' }}>
                                Reservation Cancelled
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {viewMode === 'Deliveries' && (
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflowY: 'auto', padding: '1.25rem' }}>
            <DeliveryManagement />
          </div>
        )}
      </div>

      {/* Right Order Sidebar */}
      <div style={{ 
        width: '350px', 
        flexShrink: 0,
        backgroundColor: 'white', 
        borderRadius: '16px', 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        position: 'sticky',
        top: 0,
        maxHeight: 'calc(100vh - 120px)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.5rem 0' }}>Current Order</h2>
        
        {/* Order Type Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setOrderType('Dine-In')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Dine-In' ? 'white' : 'transparent', color: orderType === 'Dine-In' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Dine-In' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Dine-In
          </button>
          <button onClick={() => { setOrderType('Takeaway'); setSelectedTableId(null); setSelectedTableName(''); }} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Takeaway' ? 'white' : 'transparent', color: orderType === 'Takeaway' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Takeaway</button>
          <button onClick={() => { setOrderType('Delivery'); setSelectedTableId(null); setSelectedTableName(''); if (!deliveryCustomerName) setIsDeliveryModalOpen(true); }} style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Delivery' ? 'white' : 'transparent', color: orderType === 'Delivery' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Delivery' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Delivery</button>
        </div>
        
        {orderType === 'Dine-In' && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Selected Table:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: selectedTableName ? '#0ea5e9' : '#94a3b8' }}>
                {selectedTableName || 'None'}
              </span>
              {selectedTableName ? (
                <Icons.X
                  size={14}
                  style={{ cursor: 'pointer', color: '#64748b' }}
                  onClick={() => {
                    setSelectedTableId(null);
                    setSelectedTableName('');
                  }}
                />
              ) : (
                <button
                  onClick={() => setViewMode('Tables')}
                  style={{
                    border: 'none',
                    backgroundColor: '#e0f2fe',
                    color: '#0284c7',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    padding: '2px 6px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Choose
                </button>
              )}
            </div>
          </div>
        )}

        {orderType === 'Delivery' && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: deliveryCustomerName ? '0.4rem' : '0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Icons.Truck size={14} /> Delivery Details
              </span>
              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(true)}
                style={{
                  border: 'none',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {deliveryCustomerName ? 'Edit' : '+ Add Details *'}
              </button>
            </div>
            {deliveryCustomerName ? (
              <div style={{ fontSize: '0.78rem', color: '#1e293b', lineHeight: 1.35 }}>
                <div style={{ fontWeight: 700 }}>{deliveryCustomerName} ({deliveryCustomerPhone})</div>
                <div style={{ color: '#475569', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {deliveryAddress}{deliveryArea ? `, ${deliveryArea}` : ''}
                </div>
                <div style={{ color: '#15803d', fontSize: '0.7rem', marginTop: '2px', fontWeight: 600 }}>
                  Ready ~{deliveryPrepMinutes}m | Transit ~{deliveryDurationMinutes}m
                  {deliveryStaffId && ` | Driver: ${staffList.find(s => String(s.id) === deliveryStaffId)?.name || 'Assigned'}`}
                </div>
              </div>
            ) : (
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: '#e11d48', fontWeight: 600 }}>
                * Address & contact required before placing order
              </p>
            )}
          </div>
        )}

        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <Icons.ShoppingCart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Your order is empty</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            {cart.map(item => (
              <div key={item.dish.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{item.dish.name}</div>
                  <div style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.875rem' }}>₹{item.dish.price}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem' }}>
                  <button onClick={() => updateQuantity(item.dish.id, -1)} style={{ padding: '0.25rem', border: 'none', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Minus size={14} /></button>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.dish.id, 1)} style={{ padding: '0.25rem', border: 'none', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Plus size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            <span>Tax ({taxRate}%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              disabled={cart.length === 0}
              onClick={() => placeOrder('Parked')}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: cart.length === 0 ? '#f8fafc' : 'white', color: cart.length === 0 ? '#cbd5e1' : '#64748b', border: cart.length === 0 ? '1px solid #f1f5f9' : '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Icons.Clock size={18} />
              Park Order
            </button>
            <button 
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              style={{ flex: 1, padding: '0.75rem', backgroundColor: cart.length === 0 ? '#cbd5e1' : '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
              Place Order
            </button>
          </div>
        </div>
      </div>

      {/* Table Configuration Modal */}
      <TableSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSave={handleSaveTableConfig}
        currentFloor={activeFloor}
        existingTables={tables.map(t => ({ capacity: t.capacity }))}
      />

      {/* Reservation Modal */}
      {isReservationModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(2px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '460px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ backgroundColor: '#0284c7', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Icons.CalendarPlus size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>New Table Reservation</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Reserve a table for guest dining</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReservationModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <Icons.X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateReservation} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {resError && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Icons.AlertCircle size={16} />
                  {resError}
                </div>
              )}

              {/* Customer Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={resCustomerName}
                  onChange={e => setResCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={resPhone}
                  onChange={e => setResPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Select Table & Guest count */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Select Table *
                  </label>
                  <select
                    value={resTableId || ''}
                    onChange={e => setResTableId(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    {tables.length === 0 ? (
                      <option value="">No tables configured</option>
                    ) : (
                      tables.map(tbl => (
                        <option key={tbl.id} value={tbl.id}>
                          {tbl.tableName} ({tbl.capacity} Seats) - {tbl.status || 'Free'}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={resGuests}
                    onChange={e => setResGuests(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Reservation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={resDate}
                    onChange={e => setResDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={resTime}
                    onChange={e => setResTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Special Requests / Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional (e.g. Window seat, Birthday celebration)"
                  value={resNotes}
                  onChange={e => setResNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Notice Banner about today's sync */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.6rem 0.85rem',
                fontSize: '0.75rem',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Icons.Info size={16} color="#2563eb" />
                <span>
                  {resDate === new Date().toISOString().split('T')[0]
                    ? "Reserving for today will automatically set the selected table to 'Reserved' in the Tables option."
                    : "Reservation will be booked for " + resDate + "."}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsReservationModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: 'white',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Details Modal */}
      {isDeliveryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '520px',
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ backgroundColor: '#0284c7', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Icons.Truck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    Delivery Order Details
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Customer address, phone, assigned driver, and estimated times
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeliveryModalOpen(false)}
                style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex' }}
              >
                <Icons.X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!deliveryCustomerName.trim()) {
                  setDeliveryError('Please enter the customer name.');
                  return;
                }
                if (!deliveryCustomerPhone.trim()) {
                  setDeliveryError('Please enter the customer contact phone.');
                  return;
                }
                if (!deliveryAddress.trim()) {
                  setDeliveryError('Please enter the delivery address.');
                  return;
                }
                setDeliveryError('');
                setIsDeliveryModalOpen(false);
              }}
              style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {deliveryError && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.6rem 0.85rem',
                  color: '#b91c1c',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Icons.AlertCircle size={16} />
                  <span>{deliveryError}</span>
                </div>
              )}

              {/* Customer Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={deliveryCustomerName}
                    onChange={e => setDeliveryCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={deliveryCustomerPhone}
                    onChange={e => setDeliveryCustomerPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Delivery Address (Building / Flat / Street) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Flat 402, Sunshine Towers, MG Road"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Area, City, Pin */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 15"
                    value={deliveryArea}
                    onChange={e => setDeliveryArea(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={deliveryCity}
                    onChange={e => setDeliveryCity(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 560001"
                    value={deliveryPostalCode}
                    onChange={e => setDeliveryPostalCode(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Optional Delivery Instructions */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Special Delivery Instructions / Landmarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near HDFC Bank ATM, please call on arrival"
                  value={deliveryInstructions}
                  onChange={e => setDeliveryInstructions(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Assign Driver (Optional at placement) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Assign Delivery Person (Optional - can assign upon dispatch)
                </label>
                <select
                  value={deliveryStaffId}
                  onChange={e => setDeliveryStaffId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: 'white' }}
                >
                  <option value="">-- Assign Driver Later / Auto --</option>
                  {staffList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.jobRole ? `(${st.jobRole})` : ''} {st.phone ? `- ${st.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Est. Kitchen Prep:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {[15, 20, 30].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDeliveryPrepMinutes(m)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: deliveryPrepMinutes === m ? '#0284c7' : 'white',
                          color: deliveryPrepMinutes === m ? 'white' : '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Est. Transit Duration:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {[20, 30, 45].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDeliveryDurationMinutes(m)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: deliveryDurationMinutes === m ? '#0284c7' : 'white',
                          color: deliveryDurationMinutes === m ? 'white' : '#475569',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: 'white',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                  }}
                >
                  Save Delivery Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
