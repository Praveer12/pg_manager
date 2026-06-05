import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatRelativeTime } from '../../utils/formatters';

export default function ActivityHistory() {
  const [activities, setActivities] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    const data = await storage.getAll(STORAGE_KEYS.ACTIVITIES);
    // Sort by newest first
    const sorted = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setActivities(sorted);
    setLoading(false);
  };

  // Helper to convert Markdown-style bold **text** to HTML bold tags
  const renderFormattedText = (text) => {
    if (!text) return '';
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
  };

  // Filters
  const filteredActivities = activities.filter((act) => {
    // Search filter
    if (searchQuery && !act.text?.toLowerCase().includes(searchQuery.toLowerCase()) && !act.details?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Type filter
    if (filterType === 'all') return true;
    if (filterType === 'payments' && act.type === 'payment') return true;
    if (filterType === 'guests' && (act.type === 'guest_checkin' || act.type === 'guest_checkout' || act.type === 'guest_reallocate')) return true;
    if (filterType === 'maintenance' && act.type === 'maintenance') return true;
    if (filterType === 'system' && (act.type === 'room_add' || act.type === 'room_edit' || act.type === 'room_status' || act.type === 'notice')) return true;
    
    return false;
  });

  // Group by date (Today, Yesterday, Older)
  const getGroupedActivities = () => {
    const today = [];
    const yesterday = [];
    const older = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;

    filteredActivities.forEach((act) => {
      const actTime = new Date(act.createdAt).getTime();
      if (actTime >= startOfToday) {
        today.push(act);
      } else if (actTime >= startOfYesterday) {
        yesterday.push(act);
      } else {
        older.push(act);
      }
    });

    return { today, yesterday, older };
  };

  const { today, yesterday, older } = getGroupedActivities();

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear your local activity history? This cannot be undone.')) {
      setLoading(true);
      // Clear from storage
      const data = await storage.getAll(STORAGE_KEYS.ACTIVITIES);
      for (const item of data) {
        await storage.delete(STORAGE_KEYS.ACTIVITIES, item.id);
      }
      setActivities([]);
      setLoading(false);
    }
  };

  const renderTimelineGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: 'var(--space-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <span>📅</span> {title}
        </h3>
        
        <div style={{ position: 'relative', paddingLeft: 'var(--space-xl)' }}>
          {/* Vertical Timeline connector line */}
          <div style={{
            position: 'absolute',
            top: '8px',
            bottom: '8px',
            left: '18px',
            width: '2px',
            background: 'linear-gradient(to bottom, rgba(124, 58, 237, 0.3), rgba(6, 182, 212, 0.05))',
            borderRadius: '1px'
          }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {items.map((act) => {
              // Color schemes for different type icons
              const colorSchemes = {
                payment: { bg: 'var(--success-bg)', border: 'var(--success)', glow: 'rgba(16, 185, 129, 0.15)' },
                guest_checkin: { bg: 'var(--info-bg)', border: 'var(--info)', glow: 'rgba(59, 130, 246, 0.15)' },
                guest_checkout: { bg: 'var(--warning-bg)', border: 'var(--warning)', glow: 'rgba(245, 158, 11, 0.15)' },
                guest_reallocate: { bg: 'var(--danger-bg)', border: 'var(--danger)', glow: 'rgba(239, 68, 68, 0.15)' },
                maintenance: { bg: 'rgba(124, 58, 237, 0.12)', border: 'var(--accent-primary-light)', glow: 'rgba(124, 58, 237, 0.15)' },
                room_add: { bg: 'rgba(6, 182, 212, 0.12)', border: 'var(--accent-secondary-light)', glow: 'rgba(6, 182, 212, 0.15)' },
                room_edit: { bg: 'var(--bg-tertiary)', border: 'var(--text-muted)', glow: 'rgba(148, 163, 184, 0.05)' },
                room_status: { bg: 'var(--bg-tertiary)', border: 'var(--text-muted)', glow: 'rgba(148, 163, 184, 0.05)' },
                notice: { bg: 'var(--warning-bg)', border: 'var(--warning)', glow: 'rgba(245, 158, 11, 0.15)' },
              };
              const cs = colorSchemes[act.type] || { bg: 'var(--bg-secondary)', border: 'var(--border-color)', glow: 'none' };
              
              return (
                <div key={act.id} className="glass-card-static" style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  display: 'flex',
                  gap: 'var(--space-md)',
                  alignItems: 'flex-start',
                  position: 'relative',
                  border: '1px solid var(--border-color)',
                  boxShadow: `0 4px 12px rgba(0, 0, 0, 0.05), ${cs.glow !== 'none' ? `0 0 15px ${cs.glow}` : '0 0 0 transparent'}`,
                  transition: 'all 0.3s ease',
                  animation: 'fadeIn 0.4s ease',
                }}>
                  {/* Floating timeline dot container */}
                  <div style={{
                    position: 'absolute',
                    left: '-29px',
                    top: '12px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: cs.bg,
                    border: `2px solid ${cs.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    boxShadow: `0 0 8px ${cs.border}`,
                    zIndex: 2
                  }}>
                    {act.icon}
                  </div>

                  {/* Body Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.92rem',
                      lineHeight: 1.45,
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {renderFormattedText(act.text)}
                    </div>
                    {act.details && (
                      <div style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-body)',
                        opacity: 0.85,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--bg-input)',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        width: 'fit-content',
                        marginTop: '6px'
                      }}>
                        ℹ️ {act.details}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                    fontWeight: 500
                  }}>
                    {formatRelativeTime(act.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Activity Audits & History</h2>
          <p className="subtitle">Real-time persistent audit logs of your property operations</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchActivities}>🔄 Refresh</button>
          <button className="btn btn-danger btn-sm" onClick={handleClearHistory} disabled={activities.length === 0}>🗑️ Clear Logs</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div className="search-bar" style={{ width: 280 }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search activity details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-chips">
          {[
            { key: 'all', label: 'All Operations' },
            { key: 'payments', label: '💰 Payments' },
            { key: 'guests', label: '👥 Guests' },
            { key: 'maintenance', label: '🔧 Maintenance' },
            { key: 'system', label: '🏠 System & Notice' }
          ].map(chip => (
            <button
              key={chip.key}
              className={`filter-chip ${filterType === chip.key ? 'active' : ''}`}
              onClick={() => setFilterType(chip.key)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Logs List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl) 0', color: 'var(--text-muted)' }}>
          🔄 Loading activities...
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-3xl) 0' }}>
          <div className="empty-icon">📋</div>
          <h3>No activities recorded</h3>
          <p>Important events like check-ins, check-outs, and payments will show up here automatically.</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-3xl) 0' }}>
          <div className="empty-icon">🔍</div>
          <h3>No matching records</h3>
          <p>Adjust your search filters to find older activities.</p>
        </div>
      ) : (
        <div>
          {renderTimelineGroup('Today', today)}
          {renderTimelineGroup('Yesterday', yesterday)}
          {renderTimelineGroup('Older Activities', older)}
        </div>
      )}
    </div>
  );
}
