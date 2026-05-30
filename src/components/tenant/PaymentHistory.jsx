import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { STATUS_CONFIG } from '../../data/mockData';

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [property, setProperty] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPaymentToPay, setSelectedPaymentToPay] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const guests = await storage.getAll(STORAGE_KEYS.GUESTS);
      const myGuest = guests.find(g => g.userId === user?.id || g.email === user?.email) || guests[0];
      if (myGuest) {
        const allPayments = await storage.getAll(STORAGE_KEYS.PAYMENTS);
        setPayments(allPayments.filter(p => p.guestId === myGuest.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        const properties = await storage.getAll(STORAGE_KEYS.PROPERTIES);
        setProperty(properties.find(p => p.id === myGuest.propertyId));
      }
      setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
    };
    fetchData();
  }, [user]);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  const filtered = payments.filter(p => filterStatus === 'all' || p.status === filterStatus);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payment History</h2>
          <p className="subtitle">Your rent payment records</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card green animate-in animate-in-1">
          <div className="stat-info">
            <h4>Total Paid</h4>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(totalPaid)}</div>
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
      </div>

      <div className="filter-chips" style={{ marginBottom: 'var(--space-lg)' }}>
        {['all', 'paid', 'pending', 'overdue'].map(s => (
          <button key={s} className={`filter-chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
            {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {filtered.map((payment, i) => {
          const sc = STATUS_CONFIG[payment.status];
          const room = rooms.find(r => r.id === payment.roomId);
          return (
            <div key={i} className="payment-card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: `var(--${sc?.color === 'success' ? 'success' : sc?.color === 'warning' ? 'warning' : 'danger'}-bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                {sc?.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{payment.month} {payment.year}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Room {room?.number} • Due: {formatDate(payment.dueDate)}
                  {payment.paidDate && ` • Paid: ${formatDate(payment.paidDate)}`}
                </div>
                {payment.method && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Via {payment.method}</div>}
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div className="payment-amount">{formatCurrency(payment.amount)}</div>
                <span className={`badge badge-${sc?.color}`}>{sc?.label}</span>
                {payment.status !== 'paid' && (
                  <button className="btn btn-primary btn-sm" style={{ marginTop: '4px' }} onClick={() => {
                    setSelectedPaymentToPay(payment);
                    setShowPayModal(true);
                  }}>
                    Pay Now
                  </button>
                )}
              </div>
              {payment.receiptNo && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'var(--space-sm)' }}>
                  #{payment.receiptNo}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <h3>No payments found</h3>
          <p>Your payment history will appear here.</p>
        </div>
      )}

      {showPayModal && selectedPaymentToPay && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pay Rent: {selectedPaymentToPay.month} {selectedPaymentToPay.year}</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                {formatCurrency(selectedPaymentToPay.amount)}
              </div>
              
              <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
                <h4 style={{ marginBottom: 'var(--space-md)' }}>Scan to Pay</h4>
                {property?.paymentDetails?.qrImage ? (
                  <img src={property.paymentDetails.qrImage} alt="Owner UPI QR" style={{ maxWidth: '200px', margin: '0 auto', display: 'block', borderRadius: 'var(--radius-sm)' }} />
                ) : (
                  <div style={{ padding: 'var(--space-xl)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                    No QR code uploaded by owner.
                  </div>
                )}
                
                <div style={{ marginTop: 'var(--space-lg)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>UPI ID:</span>
                    <span style={{ fontWeight: 600 }}>{property?.paymentDetails?.upiId || 'Not provided'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>UPI Phone Number:</span>
                    <span style={{ fontWeight: 600 }}>{property?.paymentDetails?.upiPhone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                * After paying, please contact the owner to mark this invoice as paid. In future updates, Razorpay integration will automate this process.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary w-full" onClick={() => setShowPayModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
