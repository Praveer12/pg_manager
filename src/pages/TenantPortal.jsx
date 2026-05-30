import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import storage, { STORAGE_KEYS } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import TenantDashboard from '../components/tenant/TenantDashboard';
import BrowsePGs from '../components/tenant/BrowsePGs';
import MyStay from '../components/tenant/MyStay';
import PaymentHistory from '../components/tenant/PaymentHistory';
import MaintenanceRequest from '../components/tenant/MaintenanceRequest';
import Notices from '../components/tenant/Notices';
import Profile from '../components/tenant/Profile';

export default function TenantPortal() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [noticesBadge, setNoticesBadge] = useState(0);

  useEffect(() => {
    const fetchBadges = async () => {
      const notices = await storage.getAll(STORAGE_KEYS.NOTICES);
      setNoticesBadge(notices.length);
    };
    fetchBadges();
  }, [user]);

  const navItems = [
    { to: '/tenant', icon: '🏠', label: 'Dashboard', end: true },
    { to: '/tenant/browse', icon: '🔍', label: 'Browse PGs' },
    { to: '/tenant/my-stay', icon: '🛏️', label: 'My Stay' },
    { to: '/tenant/payments', icon: '💳', label: 'Payments' },
    { to: '/tenant/maintenance', icon: '🔧', label: 'Maintenance' },
    { to: '/tenant/notices', icon: '📢', label: 'Notices', badge: noticesBadge > 0 ? noticesBadge : null },
    { to: '/tenant/profile', icon: '👤', label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-layout">
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🏠</div>
          {!sidebarCollapsed && <span className="logo-text">PG Manager</span>}
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            {!sidebarCollapsed && <div className="sidebar-section-title">Menu</div>}
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

      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <header className="navbar">
          <div className="navbar-left">
            <button className="btn btn-ghost btn-icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none' }} id="tenant-mobile-menu-btn">☰</button>
            <style>{`@media(max-width:768px){#tenant-mobile-menu-btn{display:flex!important}}`}</style>
            <span className="navbar-title">Tenant Portal</span>
          </div>
          <div className="navbar-right">
            <button className="notification-btn" onClick={() => alert('No new notifications')}>
              🔔
            </button>
            <div className="user-menu relative" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-info">
                <div className="user-name">{user?.name || 'Tenant'}</div>
                <div className="user-role">Tenant</div>
              </div>
              <div className="user-avatar">{user?.name?.[0] || 'T'}</div>
              {showUserMenu && (
                <div className="dropdown-menu" style={{ top: '100%', right: 0, marginTop: '8px' }}>
                  <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/tenant/profile'); }}>👤 My Profile</button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>🚪 Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route index element={<TenantDashboard />} />
            <Route path="browse" element={<BrowsePGs />} />
            <Route path="my-stay" element={<MyStay />} />
            <Route path="payments" element={<PaymentHistory />} />
            <Route path="maintenance" element={<MaintenanceRequest />} />
            <Route path="notices" element={<Notices />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/tenant" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
