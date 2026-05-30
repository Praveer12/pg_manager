import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import storage, { STORAGE_KEYS } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import OwnerDashboard from '../components/owner/OwnerDashboard';
import RoomManager from '../components/owner/RoomManager';
import GuestManager from '../components/owner/GuestManager';
import PaymentTracker from '../components/owner/PaymentTracker';
import AgreementManager from '../components/owner/AgreementManager';
import MaintenanceBoard from '../components/owner/MaintenanceBoard';
import NoticeBoard from '../components/owner/NoticeBoard';
import Reports from '../components/owner/Reports';
import OwnerSettings from '../components/owner/OwnerSettings';

export default function OwnerPortal() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [paymentsBadge, setPaymentsBadge] = useState(0);
  const [maintenanceBadge, setMaintenanceBadge] = useState(0);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) return;
      const payments = await storage.getAll(STORAGE_KEYS.PAYMENTS);
      const pending = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
      setPaymentsBadge(pending.length);

      const maintenance = await storage.getAll(STORAGE_KEYS.MAINTENANCE);
      const active = maintenance.filter(m => m.status !== 'resolved');
      setMaintenanceBadge(active.length);
    };
    fetchBadges();
  }, [user]);

  const navItems = [
    { to: '/owner', icon: '📊', label: 'Dashboard', end: true },
    { to: '/owner/rooms', icon: '🚪', label: 'Rooms' },
    { to: '/owner/guests', icon: '👥', label: 'Guests' },
    { to: '/owner/payments', icon: '💰', label: 'Payments', badge: paymentsBadge > 0 ? paymentsBadge : null },
    { to: '/owner/agreements', icon: '📋', label: 'Agreements' },
    { to: '/owner/maintenance', icon: '🔧', label: 'Maintenance', badge: maintenanceBadge > 0 ? maintenanceBadge : null },
    { to: '/owner/notices', icon: '📢', label: 'Notices' },
    { to: '/owner/reports', icon: '📈', label: 'Reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🏠</div>
          {!sidebarCollapsed && <span className="logo-text">PG Manager</span>}
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            {!sidebarCollapsed && <div className="sidebar-section-title">Main Menu</div>}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="link-icon">{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
              {!sidebarCollapsed && item.badge && <span className="link-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Navbar */}
        <header className="navbar">
          <div className="navbar-left">
            <button className="btn btn-ghost btn-icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none' }}
              id="mobile-menu-btn"
            >☰</button>
            <style>{`@media(max-width:768px){#mobile-menu-btn{display:flex!important}}`}</style>
            <span className="navbar-title">Owner Portal</span>
          </div>
          <div className="navbar-right">
            <div className="navbar-search">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search rooms, guests..." />
            </div>
            <button className="notification-btn" onClick={() => alert('No new notifications')}>
              🔔
            </button>
            <div className="user-menu relative" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-info">
                <div className="user-name">{user?.name || 'Owner'}</div>
                <div className="user-role">PG Owner</div>
              </div>
              <div className="user-avatar">{user?.name?.[0] || 'O'}</div>
              {showUserMenu && (
                <div className="dropdown-menu" style={{ top: '100%', right: 0, marginTop: '8px' }}>
                  <button className="dropdown-item" onClick={() => { setShowUserMenu(false); }}>
                    👤 My Profile
                  </button>
                  <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/owner/settings'); }}>
                    ⚙️ Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Routes>
            <Route index element={<OwnerDashboard />} />
            <Route path="rooms" element={<RoomManager />} />
            <Route path="guests" element={<GuestManager />} />
            <Route path="payments" element={<PaymentTracker />} />
            <Route path="agreements" element={<AgreementManager />} />
            <Route path="maintenance" element={<MaintenanceBoard />} />
            <Route path="notices" element={<NoticeBoard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<OwnerSettings />} />
            <Route path="*" element={<Navigate to="/owner" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
