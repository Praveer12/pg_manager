import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
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
import ActivityHistory from '../components/owner/ActivityHistory';

// SVG Icon Components
const Icons = {
  dashboard: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  rooms: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  payments: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  guests: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  more: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
    </svg>
  ),
  agreements: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  maintenance: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  notices: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  reports: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  activities: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  settings: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  chevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

export default function OwnerPortal() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [paymentsBadge, setPaymentsBadge] = useState(0);
  const [maintenanceBadge, setMaintenanceBadge] = useState(0);
  const [property, setProperty] = useState(null);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) return;
      const payments = await storage.getAll(STORAGE_KEYS.PAYMENTS);
      const pending = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
      setPaymentsBadge(pending.length);

      const maintenance = await storage.getAll(STORAGE_KEYS.MAINTENANCE);
      const active = maintenance.filter(m => m.status !== 'resolved');
      setMaintenanceBadge(active.length);

      const properties = await storage.getAll(STORAGE_KEYS.PROPERTIES);
      if (properties.length > 0) setProperty(properties[0]);
    };
    fetchBadges();
  }, [user]);

  // Bottom tab items (primary 5)
  const bottomTabs = [
    { to: '/owner', icon: Icons.dashboard, label: 'Dashboard', end: true },
    { to: '/owner/rooms', icon: Icons.rooms, label: 'Rooms' },
    { to: '/owner/payments', icon: Icons.payments, label: 'Payments', badge: paymentsBadge > 0 ? paymentsBadge : null },
    { to: '/owner/guests', icon: Icons.guests, label: 'Guests' },
    { to: '#more', icon: Icons.more, label: 'More', isMore: true },
  ];

  // Sidebar nav items (desktop)
  const navItems = [
    { to: '/owner', icon: Icons.dashboard, label: 'Dashboard', end: true },
    { to: '/owner/rooms', icon: Icons.rooms, label: 'Rooms' },
    { to: '/owner/guests', icon: Icons.guests, label: 'Guests' },
    { to: '/owner/payments', icon: Icons.payments, label: 'Payments', badge: paymentsBadge > 0 ? paymentsBadge : null },
    { to: '/owner/agreements', icon: Icons.agreements, label: 'Agreements' },
    { to: '/owner/maintenance', icon: Icons.maintenance, label: 'Maintenance', badge: maintenanceBadge > 0 ? maintenanceBadge : null },
    { to: '/owner/notices', icon: Icons.notices, label: 'Notices' },
    { to: '/owner/reports', icon: Icons.reports, label: 'Reports' },
    { to: '/owner/activities', icon: Icons.activities, label: 'Activity History' },
  ];

  // More sheet items
  const moreItems = [
    { to: '/owner/agreements', icon: Icons.agreements, label: 'Agreements' },
    { to: '/owner/maintenance', icon: Icons.maintenance, label: 'Maintenance', badge: maintenanceBadge > 0 ? maintenanceBadge : null },
    { to: '/owner/notices', icon: Icons.notices, label: 'Notices' },
    { to: '/owner/reports', icon: Icons.reports, label: 'Reports' },
    { to: '/owner/activities', icon: Icons.activities, label: 'Activity History' },
    { to: '/owner/settings', icon: Icons.settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if a "more" route is active
  const moreRoutes = ['/owner/agreements', '/owner/maintenance', '/owner/notices', '/owner/reports', '/owner/settings', '/owner/activities'];
  const isMoreActive = moreRoutes.some(r => location.pathname.startsWith(r));

  return (
    <div className="app-layout">
      {/* Mobile overlay for sidebar */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* More Sheet Overlay */}
      {showMoreSheet && (
        <div className="mobile-overlay more-sheet-overlay" onClick={() => setShowMoreSheet(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className={`sidebar desktop-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🏢</div>
          {!sidebarCollapsed && <span className="logo-text">{property?.name || 'PG Manager'}</span>}
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
            >
              <span className="link-icon">{item.icon(false)}</span>
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
            <span className="navbar-title mobile-greeting">
              {property?.name || 'PG Manager'}
            </span>
          </div>
          <div className="navbar-right">
            <div className="navbar-search desktop-only">
              <span className="search-icon">{Icons.search()}</span>
              <input type="text" placeholder="Search rooms, guests..." />
            </div>
            <button className="notification-btn" onClick={() => alert('No new notifications')}>
              {Icons.bell()}
            </button>
            <div className="user-menu relative" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-info desktop-only">
                <div className="user-name">{user?.name || 'Owner'}</div>
                <div className="user-role">PG Owner</div>
              </div>
              <div className="user-avatar">{user?.name?.[0] || 'O'}</div>
              {showUserMenu && (
                <div className="dropdown-menu" style={{ top: '100%', right: 0, marginTop: '8px' }}>
                  <button className="dropdown-item" onClick={() => { setShowUserMenu(false); }}>
                    <span className="dropdown-item-icon">{Icons.guests()}</span> My Profile
                  </button>
                  <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/owner/settings'); }}>
                    <span className="dropdown-item-icon">{Icons.settings()}</span> Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                    <span className="dropdown-item-icon">{Icons.logout()}</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content has-bottom-nav">
          <Routes>
            <Route index element={<OwnerDashboard />} />
            <Route path="rooms" element={<RoomManager />} />
            <Route path="guests" element={<GuestManager />} />
            <Route path="payments" element={<PaymentTracker />} />
            <Route path="agreements" element={<AgreementManager />} />
            <Route path="maintenance" element={<MaintenanceBoard />} />
            <Route path="notices" element={<NoticeBoard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="activities" element={<ActivityHistory />} />
            <Route path="settings" element={<OwnerSettings />} />
            <Route path="*" element={<Navigate to="/owner" replace />} />
          </Routes>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-bottom-nav">
        {bottomTabs.map((tab) => {
          if (tab.isMore) {
            return (
              <button
                key="more"
                className={`bottom-tab ${isMoreActive || showMoreSheet ? 'active' : ''}`}
                onClick={() => setShowMoreSheet(!showMoreSheet)}
              >
                <span className="bottom-tab-icon">{tab.icon(isMoreActive || showMoreSheet)}</span>
                <span className="bottom-tab-label">{tab.label}</span>
              </button>
            );
          }
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
              onClick={() => setShowMoreSheet(false)}
            >
              <span className="bottom-tab-icon">
                {tab.icon(location.pathname === tab.to || (tab.end && location.pathname === tab.to))}
              </span>
              <span className="bottom-tab-label">{tab.label}</span>
              {tab.badge && <span className="bottom-tab-badge">{tab.badge}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* More Sheet */}
      <div className={`more-sheet ${showMoreSheet ? 'open' : ''}`}>
        <div className="more-sheet-handle"></div>
        <div className="more-sheet-header">
          <h3>More Options</h3>
        </div>
        <div className="more-sheet-body">
          {moreItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `more-sheet-item ${isActive ? 'active' : ''}`}
              onClick={() => setShowMoreSheet(false)}
            >
              <span className="more-sheet-item-icon">{item.icon()}</span>
              <span className="more-sheet-item-label">{item.label}</span>
              {item.badge && <span className="link-badge">{item.badge}</span>}
              <span className="more-sheet-item-arrow">{Icons.chevronRight()}</span>
            </NavLink>
          ))}
          <div className="more-sheet-divider"></div>
          <button className="more-sheet-item logout-item" onClick={handleLogout}>
            <span className="more-sheet-item-icon" style={{ color: 'var(--danger)' }}>{Icons.logout()}</span>
            <span className="more-sheet-item-label" style={{ color: 'var(--danger)' }}>Logout</span>
            <span className="more-sheet-item-arrow">{Icons.chevronRight()}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
