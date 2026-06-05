import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { STATUS_CONFIG } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

export default function OwnerDashboard() {
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
      setGuests(await storage.getAll(STORAGE_KEYS.GUESTS));
      setPayments(await storage.getAll(STORAGE_KEYS.PAYMENTS));
      setMaintenance(await storage.getAll(STORAGE_KEYS.MAINTENANCE));
      setAgreements(await storage.getAll(STORAGE_KEYS.AGREEMENTS));
    };
    fetchData();
  }, []);

  const totalRooms = rooms.length;
  // Determine maintenance rooms by checking actual maintenance requests, not stale room.status
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
  
  let fullyOccupied = 0;
  let completelyVacant = 0;
  let partiallyOccupied = 0;
  let totalBeds = 0;
  let occupiedBeds = 0;

  rooms.forEach(r => {
    if (r.status === 'maintenance') return;
    const roomGuests = guests.filter(g => g.roomId === r.id && g.status === 'active');
    const capacity = r.type === 'Single' ? 1 : r.type === 'Double' ? 2 : r.type === 'Triple' ? 3 : 1;
    
    totalBeds += capacity;
    occupiedBeds += Math.min(roomGuests.length, capacity);
    
    if (roomGuests.length === 0) completelyVacant++;
    else if (roomGuests.length >= capacity) fullyOccupied++;
    else partiallyOccupied++;
  });

  const occupiedRooms = fullyOccupied;
  const vacantRooms = completelyVacant;
  // Occupancy rate based on beds occupied vs total beds (more accurate than room-level)
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const monthlyRevenue = agreements.filter(a => a.status === 'active').reduce((sum, a) => sum + (Number(a.rent) || 0), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const activeMaintenanceCount = maintenance.filter(m => m.status !== 'resolved').length;

  const expiringAgreements = agreements.filter(a => {
    if (a.status === 'expired') return false;
    const endDate = new Date(a.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    return daysLeft <= 30 && daysLeft > 0;
  });

  // Donut chart data
  const donutSegments = [
    { label: 'Occupied', value: occupiedRooms, color: '#f87171' },
    { label: 'Partial', value: partiallyOccupied, color: '#60a5fa' },
    { label: 'Vacant', value: vacantRooms, color: '#34d399' },
    { label: 'Maint.', value: maintenanceRooms, color: '#f59e0b' },
  ];

  const renderDonut = () => {
    const total = donutSegments.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;
    let cumulativePercent = 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;

    return (
      <svg width="180" height="180" viewBox="0 0 200 200">
        {donutSegments.map((seg, i) => {
          const percent = seg.value / total;
          const strokeDasharray = `${percent * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativePercent * circumference;
          cumulativePercent += percent;
          return (
            <circle key={i} cx="100" cy="100" r={radius} fill="none"
              stroke={seg.color} strokeWidth="20"
              strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
              style={{ transition: 'all 1s ease' }}
            />
          );
        })}
        <text x="100" y="92" textAnchor="middle" fill="var(--text-primary)" fontSize="28" fontWeight="800" fontFamily="var(--font-heading)">
          {occupancyRate}%
        </text>
        <text x="100" y="115" textAnchor="middle" fill="var(--text-muted)" fontSize="12">
          Occupancy
        </text>
      </svg>
    );
  };

  // Revenue bar chart — use actual paid payment data grouped by month
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentMonthIndex = now.getMonth(); // 0-based
  const paidPayments = payments.filter(p => p.status === 'paid');
  
  // Build last 5 months of revenue from actual payment data
  const monthlyData = [];
  for (let i = 4; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), currentMonthIndex - i, 1);
    const mName = monthNames[targetDate.getMonth()];
    const mYear = targetDate.getFullYear();
    const monthPayments = paidPayments.filter(p => {
      // Match by payment month field or by paidDate
      if (p.month && p.year) {
        const payMonthIdx = monthNames.indexOf(p.month.slice(0, 3));
        // Also try full month names
        const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const payMonthIdxFull = fullMonths.indexOf(p.month);
        const idx = payMonthIdx >= 0 ? payMonthIdx : payMonthIdxFull;
        return idx === targetDate.getMonth() && Number(p.year) === mYear;
      }
      if (p.paidDate) {
        const pd = new Date(p.paidDate);
        return pd.getMonth() === targetDate.getMonth() && pd.getFullYear() === mYear;
      }
      return false;
    });
    monthlyData.push({ month: mName, revenue: monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) });
  }
  
  // Calculate month-over-month trend
  const currentMonthRevenue = monthlyData[monthlyData.length - 1]?.revenue || 0;
  const prevMonthRevenue = monthlyData[monthlyData.length - 2]?.revenue || 0;
  const revenueTrend = prevMonthRevenue > 0 ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0;
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1000);

  // Activity feed (Dynamic)
  const recentActivities = [];
  if (payments.length > 0) {
    const p = payments[payments.length - 1];
    recentActivities.push({ icon: '💰', iconBg: 'var(--success-bg)', text: `Payment of <strong>${formatCurrency(p.amount)}</strong> recorded`, time: 'Recently' });
  }
  if (maintenance.length > 0) {
    const m = maintenance[maintenance.length - 1];
    recentActivities.push({ icon: '🔧', iconBg: 'var(--warning-bg)', text: `Maintenance request: <strong>${m.title}</strong>`, time: 'Recently' });
  }
  if (guests.length > 0) {
    const g = guests[guests.length - 1];
    recentActivities.push({ icon: '👥', iconBg: 'var(--info-bg)', text: `New guest added: <strong>${g.name}</strong>`, time: 'Recently' });
  }

  const handleExport = () => {
    const csvRows = [
      ['Room Number', 'Type', 'Floor', 'Status', 'Rent', 'Deposit'],
      ...rooms.map(r => [r.number, r.type, r.floor, r.status, r.rent, r.deposit])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "property_rooms_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="subtitle">Welcome back! Here's your property overview.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>📥 Export</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/owner/rooms')}>+ Add Room</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card purple animate-in animate-in-1">
          <div className="stat-info">
            <h4>Total Rooms</h4>
            <div className="stat-value">{totalRooms}</div>
            <div className="stat-change up">↑ {occupiedRooms + partiallyOccupied} rented</div>
          </div>
          <div className="stat-icon purple">🚪</div>
        </div>
        <div className="stat-card cyan animate-in animate-in-2">
          <div className="stat-info">
            <h4>Vacant Rooms</h4>
            <div className="stat-value">{vacantRooms}</div>
            <div className="stat-change">{vacantRooms > 0 ? '🔵 Available' : '✅ All Full'}</div>
          </div>
          <div className="stat-icon cyan">🏠</div>
        </div>
        <div className="stat-card green animate-in animate-in-3">
          <div className="stat-info">
            <h4>Monthly Revenue</h4>
            <div className="stat-value">{formatCurrency(monthlyRevenue)}</div>
            <div className={`stat-change ${revenueTrend >= 0 ? 'up' : 'down'}`}>{revenueTrend >= 0 ? '↑' : '↓'} {Math.abs(revenueTrend)}% from last month</div>
          </div>
          <div className="stat-icon green">💰</div>
        </div>
        <div className="stat-card orange animate-in animate-in-4">
          <div className="stat-info">
            <h4>Pending Dues</h4>
            <div className="stat-value">{formatCurrency(pendingAmount)}</div>
            <div className="stat-change down">{pendingPayments.length} payments pending</div>
          </div>
          <div className="stat-icon orange">⏳</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2 mb-xl">
        {/* Occupancy Donut */}
        <div className="chart-container animate-in animate-in-2">
          <div className="chart-header">
            <h4>Occupancy</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
            {renderDonut()}
            <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', justifyContent: 'center' }}>
              {donutSegments.map((seg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color }}></div>
                  <span style={{ color: 'var(--text-muted)' }}>{seg.label}</span>
                  <span style={{ fontWeight: 600 }}>{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Bar Chart */}
        <div className="chart-container animate-in animate-in-3">
          <div className="chart-header">
            <h4>Revenue Trend</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 5 months</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-md)', height: 200, padding: '0 var(--space-md)' }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatCurrency(d.revenue)}</span>
                <div style={{
                  width: '100%', maxWidth: 60,
                  height: `${(d.revenue / maxRevenue) * 160}px`,
                  background: i === monthlyData.length - 1 ? 'var(--gradient-primary)' : 'rgba(124, 58, 237, 0.2)',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  transition: 'height 1s ease',
                  minHeight: 20,
                }}></div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2 mb-xl">
        {/* Recent Activity */}
        <div className="glass-card-static animate-in animate-in-4">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>Recent Activity</h4>
          <div className="activity-feed">
            {recentActivities.length > 0 ? recentActivities.map((activity, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon" style={{ background: activity.iconBg }}>
                  {activity.icon}
                </div>
                <div className="activity-content">
                  <div className="activity-text" dangerouslySetInnerHTML={{ __html: activity.text }}></div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent activity to show yet.</p>
            )}
          </div>
        </div>

        {/* Quick Overview */}
        <div className="glass-card-static animate-in animate-in-5">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>Quick Overview</h4>
          
          {/* Expiring Agreements */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-sm)' }}>
              ⚠️ Expiring Agreements ({expiringAgreements.length})
            </div>
            {expiringAgreements.length > 0 ? expiringAgreements.map((agr, i) => {
              const guest = guests.find(g => g.id === agr.guestId);
              const room = rooms.find(r => r.id === agr.roomId);
              const daysLeft = Math.ceil((new Date(agr.endDate) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={i} className="payment-card" style={{ marginBottom: '6px' }}>
                  <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                    {guest?.name?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{guest?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room {room?.number} • {daysLeft} days left</div>
                  </div>
                  <span className="badge badge-warning">Expiring</span>
                </div>
              );
            }) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No agreements expiring soon ✅</p>
            )}
          </div>

          {/* Maintenance Requests */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 'var(--space-sm)' }}>
              🔧 Open Maintenance ({activeMaintenanceCount})
            </div>
            {maintenance.filter(m => m.status !== 'resolved').slice(0, 3).map((m, i) => {
              const room = rooms.find(r => r.id === m.roomId);
              return (
                <div key={i} className="payment-card" style={{ marginBottom: '6px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: m.priority === 'high' ? 'var(--danger-bg)' : 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                    {m.priority === 'high' ? '🔴' : '🟡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room {room?.number} • {m.category}</div>
                  </div>
                  <span className={`badge badge-${STATUS_CONFIG[m.status]?.color || 'neutral'}`}>
                    {STATUS_CONFIG[m.status]?.label || m.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Room Overview Grid */}
      <div className="glass-card-static animate-in animate-in-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <h4>Room Overview</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{totalRooms} rooms total</span>
        </div>
        <div className="grid-auto-sm" style={{ gap: 'var(--space-sm)' }}>
          {rooms.map((room) => {
            const roomGuests = guests.filter(g => g.roomId === room.id && g.status === 'active');
            const capacity = room.type === 'Single' ? 1 : room.type === 'Double' ? 2 : room.type === 'Triple' ? 3 : 1;
            const isFull = roomGuests.length >= capacity;
            
            let scKey = 'vacant';
            if (room.status === 'maintenance') scKey = 'maintenance';
            else if (isFull) scKey = 'occupied';
            else if (roomGuests.length > 0) scKey = 'partial';

            const statusColors = {
              occupied: { bg: 'var(--danger-bg)', border: 'var(--danger)', text: 'var(--danger)' },
              vacant: { bg: 'var(--success-bg)', border: 'var(--success)', text: 'var(--success)' },
              maintenance: { bg: 'var(--warning-bg)', border: 'var(--warning)', text: 'var(--warning)' },
              partial: { bg: 'var(--info-bg)', border: 'var(--info)', text: 'var(--info)' },
            };
            const sc = statusColors[scKey];
            return (
              <div key={room.id} style={{
                background: sc.bg, border: `1px solid ${sc.border}30`,
                borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
                textAlign: 'center', cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: sc.text }}>{room.number}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{room.type}</div>
                
                {/* Miniature Bed Occupancy Icons */}
                <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginTop: '6px' }}>
                  {Array.from({ length: capacity }).map((_, idx) => {
                    const occupant = roomGuests[idx];
                    const isOccupied = !!occupant;
                    const bedColor = isOccupied ? '#ef4444' : '#10b981';
                    return (
                      <svg key={idx} width="11" height="11" viewBox="0 0 24 24" fill={bedColor} title={occupant ? occupant.name : 'Vacant'}>
                        <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
                      </svg>
                    );
                  })}
                </div>
                
                {roomGuests.length > 0 && <div style={{ fontSize: '0.65rem', marginTop: 4, color: 'var(--text-secondary)' }} className="truncate">{roomGuests.map(g => g.name?.split(' ')[0]).join(', ')}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
