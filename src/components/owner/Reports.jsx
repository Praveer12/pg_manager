import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatCurrency } from '../../utils/formatters';

export default function Reports() {
  const [rooms, setRooms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [guests, setGuests] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
      setPayments(await storage.getAll(STORAGE_KEYS.PAYMENTS));
      setGuests(await storage.getAll(STORAGE_KEYS.GUESTS));
      setAgreements(await storage.getAll(STORAGE_KEYS.AGREEMENTS));
      setMaintenance(await storage.getAll(STORAGE_KEYS.MAINTENANCE));
    };
    fetchData();
  }, []);

  const totalRooms = rooms.length;
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
  
  // Calculate occupancy from actual guest data, not room.status
  let fullyOccupied = 0;
  let partiallyOccupied = 0;
  let vacantRooms = 0;
  
  rooms.forEach(r => {
    if (r.status === 'maintenance') return;
    const roomGuests = guests.filter(g => g.roomId === r.id && g.status === 'active');
    const capacity = r.type === 'Single' ? 1 : r.type === 'Double' ? 2 : r.type === 'Triple' ? 3 : 1;
    if (roomGuests.length === 0) vacantRooms++;
    else if (roomGuests.length >= capacity) fullyOccupied++;
    else partiallyOccupied++;
  });
  
  const occupiedRooms = fullyOccupied + partiallyOccupied;
  const availableRooms = totalRooms - maintenanceRooms;
  const occupancyRate = availableRooms > 0 ? Math.round((occupiedRooms / availableRooms) * 100) : 0;
  
  // Revenue from actual paid payments
  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const collectionRate = payments.length > 0 ? Math.round((paidPayments.length / payments.length) * 100) : 0;

  // Revenue by room type — from agreements of rooms with active guests
  const revenueByType = {};
  rooms.forEach(r => {
    const roomGuests = guests.filter(g => g.roomId === r.id && g.status === 'active');
    if (roomGuests.length > 0) {
      const agr = agreements.find(a => a.roomId === r.id && a.status === 'active');
      const rent = agr ? Number(agr.rent) : r.rent;
      revenueByType[r.type] = (revenueByType[r.type] || 0) + rent;
    }
  });

  // Monthly revenue trend — from actual paid payments grouped by month
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  
  const monthlyRevenue = [];
  for (let i = 4; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), currentMonthIndex - i, 1);
    const mName = monthNames[targetDate.getMonth()];
    const mYear = targetDate.getFullYear();
    const monthPayments = paidPayments.filter(p => {
      if (p.month && p.year) {
        const idx = fullMonthNames.indexOf(p.month);
        return idx === targetDate.getMonth() && Number(p.year) === mYear;
      }
      if (p.paidDate) {
        const pd = new Date(p.paidDate);
        return pd.getMonth() === targetDate.getMonth() && pd.getFullYear() === mYear;
      }
      return false;
    });
    monthlyRevenue.push({ month: mName, value: monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) });
  }
  const maxMonthly = Math.max(...monthlyRevenue.map(d => d.value), 1000);

  const maintenanceStats = {
    total: maintenance.length,
    resolved: maintenance.filter(m => m.status === 'resolved').length,
    pending: maintenance.filter(m => m.status !== 'resolved').length,
    resolutionRate: maintenance.length > 0 ? Math.round((maintenance.filter(m => m.status === 'resolved').length / maintenance.length) * 100) : 0,
  };

  const renderProgressCircle = (percentage, color, size = 100) => {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p className="subtitle">Property performance overview</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid grid-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: '💰', color: 'green', change: `${paidPayments.length} payments collected` },
          { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: '🏠', color: 'purple', change: `${occupiedRooms}/${totalRooms} rooms` },
          { label: 'Collection Rate', value: `${collectionRate}%`, icon: '📊', color: 'cyan', change: `${paidPayments.length} of ${payments.length}` },
          { label: 'Pending Dues', value: formatCurrency(pendingAmount), icon: '⏳', color: 'orange', change: `${pendingPayments.length} payments` },
        ].map((stat, i) => (
          <div key={i} className={`stat-card ${stat.color} animate-in animate-in-${i + 1}`}>
            <div className="stat-info">
              <h4>{stat.label}</h4>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-change">{stat.change}</div>
            </div>
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-xl">
        {/* Revenue Trend */}
        <div className="chart-container animate-in animate-in-3">
          <div className="chart-header">
            <h4>Monthly Revenue Trend</h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-md)', height: 220, padding: '0 var(--space-md)' }}>
            {monthlyRevenue.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatCurrency(d.value)}</span>
                <div style={{
                  width: '100%', maxWidth: 50,
                  height: `${(d.value / maxMonthly) * 180}px`,
                  background: i === monthlyRevenue.length - 1 ? 'var(--gradient-primary)' : 'rgba(124, 58, 237, 0.2)',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  transition: 'height 1s ease', minHeight: 20,
                }}></div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Circles */}
        <div className="chart-container animate-in animate-in-4">
          <div className="chart-header">
            <h4>Performance Metrics</h4>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: 'var(--space-lg) 0' }}>
            {[
              { label: 'Occupancy', value: occupancyRate, color: 'var(--success)' },
              { label: 'Collection', value: collectionRate, color: 'var(--accent-primary)' },
              { label: 'Maintenance', value: maintenanceStats.resolutionRate, color: 'var(--accent-secondary)' },
            ].map((metric, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                {renderProgressCircle(metric.value, metric.color)}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{metric.value}%</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Revenue by Room Type */}
        <div className="chart-container animate-in animate-in-5">
          <div className="chart-header">
            <h4>Revenue by Room Type</h4>
          </div>
          {Object.entries(revenueByType).map(([type, revenue], i) => {
            const colors = { Single: 'var(--accent-primary)', Double: 'var(--accent-secondary)', Triple: 'var(--warning)' };
            const totalTypeRevenue = Object.values(revenueByType).reduce((s, v) => s + v, 0);
            const percent = totalTypeRevenue > 0 ? Math.round((revenue / totalTypeRevenue) * 100) : 0;
            return (
              <div key={type} style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                  <span>{type}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(revenue)} ({percent}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percent}%`, background: colors[type] || 'var(--accent-primary)' }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="chart-container animate-in animate-in-6">
          <div className="chart-header">
            <h4>Property Summary</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {[
              ['Total Guests', guests.filter(g => g.status === 'active').length, '👥'],
              ['Active Agreements', agreements.filter(a => a.status === 'active').length, '📋'],
              ['Pending Maintenance', maintenanceStats.pending, '🔧'],
              ['Resolved Maintenance', maintenanceStats.resolved, '✅'],
              ['Average Rent', formatCurrency(rooms.length > 0 ? Math.round(rooms.reduce((s, r) => s + r.rent, 0) / rooms.length) : 0), '💵'],
              ['Total Deposit Held', formatCurrency(agreements.filter(a => a.status === 'active' && a.depositPaid).reduce((s, a) => s + (Number(a.deposit) || 0), 0)), '🏦'],
            ].map(([label, value, icon], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-sm)', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {icon} {label}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
