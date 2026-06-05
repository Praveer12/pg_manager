import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import storage, { STORAGE_KEYS } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import TenantDashboard from '../components/tenant/TenantDashboard';
import BrowsePGs from '../components/tenant/BrowsePGs';
import MyStay from '../components/tenant/MyStay';
import PaymentHistory from '../components/tenant/PaymentHistory';
import MaintenanceRequest from '../components/tenant/MaintenanceRequest';
import Notices from '../components/tenant/Notices';
import Profile from '../components/tenant/Profile';

// SVG Icon Components
const Icons = {
  home: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  browse: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  payments: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  maintenance: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  more: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
    </svg>
  ),
  myStay: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
    </svg>
  ),
  notices: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  profile: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  logout: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
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

export default function TenantPortal() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [noticesBadge, setNoticesBadge] = useState(0);
  const [property, setProperty] = useState(null);

  // Theme state: default to light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pgm_theme') || 'light';
  });

  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pgm_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const fetchBadges = async () => {
      const notices = await storage.getAll(STORAGE_KEYS.NOTICES);
      setNoticesBadge(notices.length);
      const properties = await storage.getAll(STORAGE_KEYS.PROPERTIES);
      if (properties.length > 0) setProperty(properties[0]);
    };
    fetchBadges();
  }, [user]);

  // Bottom tab items (primary 5)
  const bottomTabs = [
    { to: '/tenant', icon: Icons.home, label: 'Home', end: true },
    { to: '/tenant/browse', icon: Icons.browse, label: 'Browse' },
    { to: '/tenant/payments', icon: Icons.payments, label: 'Payments' },
    { to: '/tenant/maintenance', icon: Icons.maintenance, label: 'Requests' },
    { to: '#more', icon: Icons.more, label: 'More', isMore: true },
  ];

  // Desktop sidebar items
  const navItems = [
    { to: '/tenant', icon: Icons.home, label: 'Dashboard', end: true },
    { to: '/tenant/browse', icon: Icons.browse, label: 'Browse PGs' },
    { to: '/tenant/my-stay', icon: Icons.myStay, label: 'My Stay' },
    { to: '/tenant/payments', icon: Icons.payments, label: 'Payments' },
    { to: '/tenant/maintenance', icon: Icons.maintenance, label: 'Maintenance' },
    { to: '/tenant/notices', icon: Icons.notices, label: 'Notices', badge: noticesBadge > 0 ? noticesBadge : null },
    { to: '/tenant/profile', icon: Icons.profile, label: 'Profile' },
  ];

  // More sheet items
  const moreItems = [
    { to: '/tenant/my-stay', icon: Icons.myStay, label: 'My Stay' },
    { to: '/tenant/notices', icon: Icons.notices, label: 'Notices', badge: noticesBadge > 0 ? noticesBadge : null },
    { to: '/tenant/profile', icon: Icons.profile, label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if a "more" route is active
  const moreRoutes = ['/tenant/my-stay', '/tenant/notices', '/tenant/profile'];
  const isMoreActive = moreRoutes.some(r => location.pathname.startsWith(r));

  return (
    <div className="app-layout">
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

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
            {!sidebarCollapsed && <div className="sidebar-section-title">Menu</div>}
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

      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <header className="navbar">
          <div className="navbar-left">
            <span className="navbar-title mobile-greeting">
              {property?.name || 'PG Manager'}
            </span>
          </div>
          <div className="navbar-right">
            {/* Theme Toggle */}
            <button
              className="notification-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="notification-btn" onClick={() => alert('No new notifications')}>
              {Icons.bell()}
            </button>
            <div className="user-menu relative" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-info desktop-only">
                <div className="user-name">{user?.name || 'Tenant'}</div>
                <div className="user-role">Tenant</div>
              </div>
              <div className="user-avatar">{user?.name?.[0] || 'T'}</div>
              {showUserMenu && (
                <div className="dropdown-menu" style={{ top: '100%', right: 0, marginTop: '8px' }}>
                  <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate('/tenant/profile'); }}>
                    <span className="dropdown-item-icon">{Icons.profile()}</span> My Profile
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

        <div className="page-content has-bottom-nav">
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
