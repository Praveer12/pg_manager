import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatRelativeTime } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { STATUS_CONFIG } from '../../data/mockData';

export default function MaintenanceRequest() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guest, setGuest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ category: 'Plumbing', title: '', description: '', priority: 'medium' });

  useEffect(() => {
    const fetchData = async () => {
      const guests = await storage.getAll(STORAGE_KEYS.GUESTS);
      const myGuest = guests.find(g => g.userId === user?.id || g.email === user?.email) || guests[0];
      setGuest(myGuest);
      if (myGuest) {
        const allMaintenance = await storage.getAll(STORAGE_KEYS.MAINTENANCE);
        setRequests(allMaintenance.filter(m => m.guestId === myGuest.id));
      }
      setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
    };
    fetchData();
  }, [user]);

  const refreshData = async () => {
    if (guest) {
      const allMaintenance = await storage.getAll(STORAGE_KEYS.MAINTENANCE);
      setRequests(allMaintenance.filter(m => m.guestId === guest.id));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) return;
    await storage.add(STORAGE_KEYS.MAINTENANCE, {
      ...formData, guestId: guest.id, roomId: guest.roomId, propertyId: 'prop_001',
      status: 'new', images: [], assignedTo: null,
    });
    setShowModal(false);
    setFormData({ category: 'Plumbing', title: '', description: '', priority: 'medium' });
    await refreshData();
  };

  const priorityColors = {
    high: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: '🔴 High' },
    medium: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: '🟡 Medium' },
    low: { bg: 'var(--info-bg)', color: 'var(--info)', label: '🔵 Low' },
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Maintenance Requests</h2>
          <p className="subtitle">{requests.filter(r => r.status !== 'resolved').length} open requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Request</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {requests.map((req, i) => {
          const sc = STATUS_CONFIG[req.status];
          const pc = priorityColors[req.priority] || priorityColors.medium;
          return (
            <div key={i} className="glass-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
                <div>
                  <h4 style={{ marginBottom: '4px' }}>{req.title}</h4>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: pc.bg, color: pc.color, fontSize: '0.65rem' }}>{pc.label}</span>
                    <span className="amenity-chip">🏷️ {req.category}</span>
                  </div>
                </div>
                <span className={`badge badge-${sc?.color}`}>{sc?.icon} {sc?.label}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 'var(--space-sm) 0' }}>
                {req.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Submitted {formatRelativeTime(req.createdAt)}</span>
                {req.assignedTo && <span>👷 {req.assignedTo}</span>}
              </div>
              {/* Status Timeline */}
              <div style={{ display: 'flex', gap: 'var(--space-lg)', marginTop: 'var(--space-md)', padding: 'var(--space-sm) 0', borderTop: '1px solid var(--border-color)' }}>
                {['new', 'in_progress', 'resolved'].map((status, si) => {
                  const isActive = status === req.status;
                  const isPast = ['new', 'in_progress', 'resolved'].indexOf(req.status) > si;
                  return (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: isPast || isActive ? (isActive ? 'var(--accent-primary)' : 'var(--success)') : 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', color: 'white',
                      }}>
                        {isPast ? '✓' : isActive ? '●' : ''}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isActive ? 600 : 400 }}>
                        {STATUS_CONFIG[status]?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {requests.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔧</div>
          <h3>No maintenance requests</h3>
          <p>Everything looks good! Submit a request if you need something fixed.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Request</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Maintenance Request</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}>
                    <option>Plumbing</option><option>Electrical</option><option>Furniture</option>
                    <option>AC/Cooling</option><option>Cleaning</option><option>Internet/WiFi</option>
                    <option>Pest Control</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={formData.priority} onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Brief summary of the issue" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" placeholder="Describe the issue in detail..." value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
