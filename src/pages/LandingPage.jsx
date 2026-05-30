import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoOwner = () => {
    login('owner@pgmanager.com', 'owner123', 'owner');
    navigate('/owner');
  };

  const handleDemoTenant = () => {
    login('tenant@pgmanager.com', 'tenant123', 'tenant');
    navigate('/tenant');
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="landing-logo-icon">🏠</div>
          <span className="landing-logo-text">StaySafe PG</span>
        </div>
        <div className="landing-nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-glow landing-glow-1"></div>
          <div className="landing-glow landing-glow-2"></div>
          <div className="landing-glow landing-glow-3"></div>
        </div>

        <div className="landing-hero-content">
          <h1 className="landing-title">
            Manage Your PG Accommodation<br />
            <span className="landing-title-animated">
              <span className="text-gradient">Simple.</span>{' '}
              <span className="text-gradient">Smart.</span>{' '}
              <span className="landing-seamless">Seamless.</span>
            </span>
          </h1>
          <p className="landing-subtitle">
            Whether you are a PG owner looking to streamline room allocations, rent collections and agreements, or a tenant looking for a premium stay experience.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="landing-portals">
          <div className="portal-card portal-card-owner">
            <div className="portal-card-icon owner-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3 className="portal-card-title">PG Owner Portal</h3>
            <p className="portal-card-desc">
              Add properties, allocate single/sharing rooms, track tenant agreements, upload photos, and view real-time income analytics.
            </p>
            <button className="btn portal-btn portal-btn-owner" onClick={() => navigate('/login')}>
              Go to Owner Dashboard
            </button>
            <button className="portal-demo-link" onClick={handleDemoOwner}>
              🔑 Demo: Auto-logs in as Owner
            </button>
          </div>

          <div className="portal-card portal-card-tenant">
            <div className="portal-card-icon tenant-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="portal-card-title">Tenant Portal</h3>
            <p className="portal-card-desc">
              Browse premium PG rooms, make rent payments, view lease agreement duration details, and see active roommates.
            </p>
            <button className="btn portal-btn portal-btn-tenant" onClick={() => navigate('/login')}>
              Go to Tenant Portal
            </button>
            <button className="portal-demo-link" onClick={handleDemoTenant}>
              🔑 Demo: Auto-logs in as Aarav (Tenant)
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="landing-stats-bar">
          <div className="landing-stat-item">
            <span className="landing-stat-value text-gradient">250+</span>
            <span className="landing-stat-label">Rooms Managed</span>
          </div>
          <div className="landing-stat-divider"></div>
          <div className="landing-stat-item">
            <span className="landing-stat-value text-gradient">98%</span>
            <span className="landing-stat-label">Occupancy Rate</span>
          </div>
          <div className="landing-stat-divider"></div>
          <div className="landing-stat-item">
            <span className="landing-stat-value-accent">Instant</span>
            <span className="landing-stat-label">Rent Receipts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
