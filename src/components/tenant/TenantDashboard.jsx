import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatCurrency, formatDate, getDaysRemaining, formatRelativeTime } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { STATUS_CONFIG } from '../../data/mockData';

export default function TenantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [room, setRoom] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const guests = await storage.getAll(STORAGE_KEYS.GUESTS);
      const myGuest = guests.find(g => g.userId === user?.id || g.email === user?.email) || guests[0];
      setGuest(myGuest);

      if (myGuest) {
        const rooms = await storage.getAll(STORAGE_KEYS.ROOMS);
        setRoom(rooms.find(r => r.id === myGuest.roomId));

        const agreements = await storage.getAll(STORAGE_KEYS.AGREEMENTS);
        setAgreement(agreements.find(a => a.guestId === myGuest.id));

        const allPayments = await storage.getAll(STORAGE_KEYS.PAYMENTS);
        setPayments(allPayments.filter(p => p.guestId === myGuest.id));

        const allMaintenance = await storage.getAll(STORAGE_KEYS.MAINTENANCE);
        setMaintenance(allMaintenance.filter(m => m.guestId === myGuest.id));
      }

      const allNotices = await storage.getAll(STORAGE_KEYS.NOTICES);
      setNotices(allNotices.slice(0, 3));
    };
    fetchData();
  }, [user]);

  const nextPayment = payments.find(p => p.status === 'pending' || p.status === 'overdue');
  const daysUntilDue = nextPayment ? getDaysRemaining(nextPayment.dueDate) : null;
  const agreementDaysLeft = agreement ? getDaysRemaining(agreement.endDate) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome, {user?.name?.split(' ')[0] || guest?.name?.split(' ')[0] || 'Tenant'} 👋</h2>
          <p className="subtitle">Here's your stay overview</p>
        </div>
      </div>

      {/* Top Cards */}
      <div className="stats-grid grid-3">
        <div className="stat-card purple animate-in animate-in-1">
          <div className="stat-info">
            <h4>My Room</h4>
            <div className="stat-value">Room {room?.number || '—'}</div>
            <div className="stat-change">{room?.type || '—'} • Floor {room?.floor || '—'}</div>
          </div>
          <div className="stat-icon purple">🚪</div>
        </div>
        <div className="stat-card green animate-in animate-in-2">
          <div className="stat-info">
            <h4>Monthly Rent</h4>
            <div className="stat-value">{room ? formatCurrency(room.rent) : '—'}</div>
            <div className="stat-change">Due on 5th every month</div>
          </div>
          <div className="stat-icon green">💰</div>
        </div>
        <div 
          className={`stat-card ${daysUntilDue !== null && daysUntilDue < 5 ? 'orange' : 'cyan'} animate-in animate-in-3`}
          style={{ cursor: nextPayment ? 'pointer' : 'default' }}
          onClick={() => nextPayment && navigate('/tenant/payments')}
        >
          <div className="stat-info">
            <h4>Next Payment</h4>
            <div className="stat-value">{nextPayment ? formatCurrency(nextPayment.amount) : '✅ Paid'}</div>
            <div className="stat-change" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {nextPayment ? `${nextPayment.month} • ${daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue!'}` : 'All caught up'}
              {nextPayment && <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>Pay Now ➔</span>}
            </div>
          </div>
          <div className={`stat-icon ${daysUntilDue !== null && daysUntilDue < 5 ? 'orange' : 'cyan'}`}>📅</div>
        </div>
      </div>

      <div className="grid-2 mb-xl">
        {/* Stay Details */}
        <div className="glass-card-static animate-in animate-in-3">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>📋 Stay Details</h4>
          {agreement ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {[
                ['Agreement Type', agreement.type],
                ['Start Date', formatDate(agreement.startDate)],
                ['End Date', formatDate(agreement.endDate)],
                ['Days Remaining', agreementDaysLeft > 0 ? `${agreementDaysLeft} days` : 'Expired'],
                ['Security Deposit', `${formatCurrency(agreement.deposit)} ${agreement.depositPaid ? '✅' : '⏳'}`],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm)', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{value}</span>
                </div>
              ))}
              {agreementDaysLeft !== null && (
                <div style={{ marginTop: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Agreement Progress</span>
                    <span>{agreementDaysLeft > 0 ? `${agreementDaysLeft}d left` : 'Expired'}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${Math.max(0, Math.min(100, 100 - (agreementDaysLeft / 365) * 100))}%`,
                      background: agreementDaysLeft <= 30 ? 'var(--warning)' : 'var(--gradient-primary)',
                    }}></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active agreement found.</p>
          )}
        </div>

        {/* Recent Payments */}
        <div className="glass-card-static animate-in animate-in-4">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>💳 Recent Payments</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {payments.slice(0, 5).map((payment, i) => {
              const sc = STATUS_CONFIG[payment.status];
              return (
                <div key={i} className="payment-card">
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: `var(--${sc?.color === 'success' ? 'success' : sc?.color === 'warning' ? 'warning' : 'danger'}-bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                    {sc?.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{payment.month} {payment.year}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {payment.paidDate ? `Paid on ${formatDate(payment.paidDate)}` : 'Unpaid'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="payment-amount" style={{ fontSize: '1rem' }}>{formatCurrency(payment.amount)}</div>
                    <span className={`badge badge-${sc?.color}`} style={{ fontSize: '0.65rem' }}>{sc?.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Maintenance Requests */}
        <div className="glass-card-static animate-in animate-in-5">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>🔧 My Maintenance Requests</h4>
          {maintenance.length > 0 ? maintenance.map((req, i) => {
            const sc = STATUS_CONFIG[req.status];
            return (
              <div key={i} className="payment-card" style={{ marginBottom: '6px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.category} • {formatRelativeTime(req.createdAt)}</div>
                </div>
                <span className={`badge badge-${sc?.color}`}>{sc?.label}</span>
              </div>
            );
          }) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No maintenance requests. Everything looks good! 🎉</p>
          )}
        </div>

        {/* Notices */}
        <div className="glass-card-static animate-in animate-in-6">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>📢 Latest Notices</h4>
          {notices.map((notice, i) => (
            <div key={i} style={{ padding: 'var(--space-sm)', borderBottom: i < notices.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                {notice.pinned && <span style={{ fontSize: '0.75rem' }}>📌</span>}
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{notice.title}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {notice.content?.slice(0, 100)}{notice.content?.length > 100 ? '...' : ''}
              </p>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatRelativeTime(notice.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
