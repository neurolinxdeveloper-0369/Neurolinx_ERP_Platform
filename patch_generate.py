import os

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'

with open('orders_part1.txt', 'r') as f:
    part1 = f.read()

part1 = part1.replace(
    "const [orderType, setOrderType] = useState<'Table' | 'Reservation'>('Table');",
    "const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway'>('Dine-In');\n  const [viewMode, setViewMode] = useState<'POS' | 'Tables' | 'Reservations'>('POS');"
)

part1 = part1.replace("${orderType === 'Table' && selectedTable", "${orderType === 'Dine-In' && selectedTable")
part1 = part1.replace("if (orderType === 'Table') {", "if (orderType === 'Dine-In') {")

part2 = """return (
    <div style={{ display: 'flex', height: '100%', gap: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Checkout Modal */}
      {showCheckout && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Checkout - Rs. {total.toFixed(2)}</h2>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <Icons.UtensilsCrossed size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: 0, color: '#334155' }}>No Dishes Found</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Add dishes in the Menu Management module to start taking orders.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {filteredDishes.map(dish => (
                  <div key={dish.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ height: '140px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{dish.name}</h3>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '1.125rem' }}>₹{dish.price}</span>
                      <button 
                        disabled={!dish.isAvailable}
                        onClick={() => addToCart(dish)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: dish.isAvailable ? '#f0f9ff' : '#f1f5f9', color: dish.isAvailable ? '#0284c7' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: dish.isAvailable ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                        Add to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === 'Tables' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', alignContent: 'start', paddingRight: '0.5rem' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
              <div key={num} onClick={() => { setViewMode('POS'); setOrderType('Dine-In'); setSelectedTable(`Table ${num}`); }} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <Icons.Armchair size={32} color={num % 3 === 0 ? '#ef4444' : '#10b981'} style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontWeight: 700, color: '#1e293b' }}>Table {num}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{num % 3 === 0 ? 'Occupied' : 'Available'}</span>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'Reservations' && (
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.CalendarDays size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No Reservations Today</h2>
            <p style={{ color: '#64748b', margin: 0 }}>Upcoming reservations will appear here.</p>
            <button style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              + New Reservation
            </button>
          </div>
        )}
      </div>

      {/* Right Order Sidebar */}
      <div style={{ width: '350px', backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: '0 0 1.5rem 0' }}>Current Order</h2>
        
        {/* Order Type Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '0.25rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setOrderType('Dine-In')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Dine-In' ? 'white' : 'transparent', color: orderType === 'Dine-In' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Dine-In' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Dine-In
          </button>
          <button 
            onClick={() => setOrderType('Takeaway')}
            style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', backgroundColor: orderType === 'Takeaway' ? 'white' : 'transparent', color: orderType === 'Takeaway' ? '#1e293b' : '#64748b', boxShadow: orderType === 'Takeaway' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Takeaway
          </button>
        </div>
        
        {orderType === 'Dine-In' && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Selected Table:</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0ea5e9' }}>{selectedTable || 'None'}</span>
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
    </div>
  );
}
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(part1 + part2)
print("Wrote Orders.tsx successfully!")
