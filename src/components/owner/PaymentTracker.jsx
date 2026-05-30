import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatCurrency, formatDate, generateReceiptNumber } from '../../utils/formatters';
import { STATUS_CONFIG } from '../../data/mockData';

export default function PaymentTracker() {
  const [payments, setPayments] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [formData, setFormData] = useState({
    guestId: '', amount: '', month: '', year: 2025, method: 'UPI', notes: '',
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setPayments(await storage.getAll(STORAGE_KEYS.PAYMENTS));
    setGuests(await storage.getAll(STORAGE_KEYS.GUESTS));
    setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
  };

  const totalCollected = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments
    .filter(p => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (searchQuery) {
        const guest = guests.find(g => g.id === p.guestId);
        return guest?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleRecordPayment = async () => {
    if (!formData.guestId || !formData.amount) return;
    const guest = guests.find(g => g.id === formData.guestId);
    
    await storage.add(STORAGE_KEYS.PAYMENTS, {
      guestId: formData.guestId, roomId: guest?.roomId,
      propertyId: 'prop_001', amount: Number(formData.amount),
      month: formData.month, year: formData.year,
      dueDate: new Date().toISOString(), paidDate: new Date().toISOString(),
      method: formData.method, status: 'paid',
      receiptNo: generateReceiptNumber(), notes: formData.notes,
    });

    setShowModal(false);
    setFormData({ guestId: '', amount: '', month: '', year: 2025, method: 'UPI', notes: '' });
    await refreshData();
  };

  const markAsPaid = async (payment) => {
    await storage.update(STORAGE_KEYS.PAYMENTS, payment.id, {
      status: 'paid', paidDate: new Date().toISOString(),
      method: 'Cash', receiptNo: generateReceiptNumber(),
    });
    await refreshData();
  };

  const viewReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payment Tracker</h2>
          <p className="subtitle">Track and manage rent payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Payment</button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card green animate-in animate-in-1">
          <div className="stat-info">
            <h4>Collected</h4>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(totalCollected)}</div>
          </div>
          <div className="stat-icon green">✅</div>
        </div>
        <div className="stat-card orange animate-in animate-in-2">
          <div className="stat-info">
            <h4>Pending</h4>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{formatCurrency(totalPending)}</div>
          </div>
          <div className="stat-icon orange">⏳</div>
        </div>
        <div className="stat-card purple animate-in animate-in-3">
          <div className="stat-info">
            <h4>Overdue</h4>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{formatCurrency(totalOverdue)}</div>
          </div>
          <div className="stat-icon purple" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>❌</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ width: 280 }}>
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by guest name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="filter-chips">
          {['all', 'paid', 'pending', 'overdue'].map(s => (
            <button key={s} className={`filter-chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Room</th>
              <th>Amount</th>
              <th>Month</th>
              <th>Due Date</th>
              <th>Paid Date</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => {
              const guest = guests.find(g => g.id === payment.guestId);
              const room = rooms.find(r => r.id === payment.roomId);
              const sc = STATUS_CONFIG[payment.status];
              return (
                <tr key={payment.id}>
                  <td className="cell-primary">{guest?.name || '—'}</td>
                  <td>Room {room?.number || '—'}</td>
                  <td className="cell-primary">{formatCurrency(payment.amount)}</td>
                  <td>{payment.month} {payment.year}</td>
                  <td>{formatDate(payment.dueDate)}</td>
                  <td>{payment.paidDate ? formatDate(payment.paidDate) : '—'}</td>
                  <td>{payment.method || '—'}</td>
                  <td><span className={`badge badge-${sc?.color}`}>{sc?.icon} {sc?.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {payment.status !== 'paid' && (
                        <button className="btn btn-success btn-sm" onClick={() => markAsPaid(payment)}>✅ Paid</button>
                      )}
                      {payment.status === 'paid' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => viewReceipt(payment)}>🧾 Receipt</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredPayments.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No payments found</h3>
            <p>Record a payment or adjust your filters.</p>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Guest *</label>
                <select className="form-select" value={formData.guestId} onChange={(e) => {
                  const guest = guests.find(g => g.id === e.target.value);
                  const room = rooms.find(r => r.id === guest?.roomId);
                  setFormData(p => ({ ...p, guestId: e.target.value, amount: room?.rent || '' }));
                }}>
                  <option value="">Select guest</option>
                  {guests.filter(g => g.status === 'active').map(g => {
                    const room = rooms.find(r => r.id === g.roomId);
                    return <option key={g.id} value={g.id}>{g.name} (Room {room?.number})</option>;
                  })}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-input" value={formData.amount} onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={formData.method} onChange={(e) => setFormData(p => ({ ...p, method: e.target.value }))}>
                    <option>UPI</option><option>Cash</option><option>Bank Transfer</option><option>Cheque</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select className="form-select" value={formData.month} onChange={(e) => setFormData(p => ({ ...p, month: e.target.value }))}>
                    <option value="">Select month</option>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input type="number" className="form-input" value={formData.year} onChange={(e) => setFormData(p => ({ ...p, year: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" placeholder="Any notes..." value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} style={{ minHeight: 60 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRecordPayment}>Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment Receipt</h3>
              <button className="modal-close" onClick={() => setShowReceiptModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)' }}>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🏠</div>
                <h3>PG Manager</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment Receipt</p>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)', padding: 'var(--space-md) 0', margin: 'var(--space-md) 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  ['Receipt No', selectedPayment.receiptNo || '—'],
                  ['Guest', guests.find(g => g.id === selectedPayment.guestId)?.name || '—'],
                  ['Room', `Room ${rooms.find(r => r.id === selectedPayment.roomId)?.number || '—'}`],
                  ['Month', `${selectedPayment.month} ${selectedPayment.year}`],
                  ['Amount', formatCurrency(selectedPayment.amount)],
                  ['Method', selectedPayment.method],
                  ['Paid Date', formatDate(selectedPayment.paidDate)],
                ].map(([label, value], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 600 }}>✅ Payment Confirmed</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
