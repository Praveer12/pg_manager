import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatCurrency, formatDate, getDaysRemaining } from '../../utils/formatters';
import AgreementDocument from './AgreementDocument';

export default function AgreementManager() {
  const [agreements, setAgreements] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAgreementDoc, setShowAgreementDoc] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);

  const [createForm, setCreateForm] = useState({
    guestId: '',
    type: 'Monthly',
    customMonths: 3,
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setAgreements(await storage.getAll(STORAGE_KEYS.AGREEMENTS));
    setGuests(await storage.getAll(STORAGE_KEYS.GUESTS));
    setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
    setProperties(await storage.getAll(STORAGE_KEYS.PROPERTIES));
  };

  const filteredAgreements = agreements.filter(a => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'expiring') {
      const days = getDaysRemaining(a.endDate);
      return days !== null && days <= 30 && days > 0;
    }
    return a.status === filterStatus;
  });

  const renewAgreement = async (agr) => {
    const startDate = new Date(agr.endDate);
    let endDate = new Date(startDate);
    if (agr.type === 'Annual') endDate.setFullYear(endDate.getFullYear() + 1);
    else if (agr.type === 'Semi-Annual') endDate.setMonth(endDate.getMonth() + 6);
    else if (agr.type === 'Quarterly') endDate.setMonth(endDate.getMonth() + 3);
    else endDate.setMonth(endDate.getMonth() + 1);

    await storage.update(STORAGE_KEYS.AGREEMENTS, agr.id, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'active',
    });
    await refreshData();
  };

  const viewAgreementDoc = (agr) => {
    setSelectedAgreement(agr);
    setShowAgreementDoc(true);
  };

  const handleCreateAgreement = async () => {
    if (!createForm.guestId) return;

    const guest = guests.find(g => g.id === createForm.guestId);
    if (!guest) return;

    const room = rooms.find(r => r.id === guest.roomId);
    const startDate = new Date().toISOString().split('T')[0];
    let endDate = new Date();

    switch (createForm.type) {
      case 'Monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'Quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'Semi-Annual':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'Annual':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'Custom':
        endDate.setMonth(endDate.getMonth() + parseInt(createForm.customMonths || 1));
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    await storage.add(STORAGE_KEYS.AGREEMENTS, {
      guestId: guest.id,
      roomId: guest.roomId,
      propertyId: guest.propertyId || null,
      type: createForm.type,
      startDate: startDate,
      endDate: endDate.toISOString().split('T')[0],
      rent: room?.rent || 0,
      deposit: room?.deposit || 0,
      depositPaid: false,
      status: 'active',
      terms: `${createForm.type} agreement.`,
    });

    setShowCreateModal(false);
    setCreateForm({ guestId: '', type: 'Monthly', customMonths: 3 });
    await refreshData();
  };

  // Guests without agreements
  const guestsWithoutAgreement = guests.filter(g => {
    return g.status === 'active' && !agreements.some(a => a.guestId === g.id && a.status === 'active');
  });

  const statusCounts = {
    all: agreements.length,
    active: agreements.filter(a => {
      const d = getDaysRemaining(a.endDate);
      return a.status === 'active' && (d === null || d > 30);
    }).length,
    expiring: agreements.filter(a => {
      const d = getDaysRemaining(a.endDate);
      return d !== null && d <= 30 && d > 0;
    }).length,
    expired: agreements.filter(a => {
      const d = getDaysRemaining(a.endDate);
      return d !== null && d <= 0;
    }).length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Agreements</h2>
          <p className="subtitle">{agreements.length} total agreements</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Agreement</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-chips" style={{ marginBottom: 'var(--space-lg)' }}>
        {[
          { key: 'all', label: `All (${statusCounts.all})` },
          { key: 'active', label: `🟢 Active (${statusCounts.active})` },
          { key: 'expiring', label: `⚠️ Expiring Soon (${statusCounts.expiring})` },
          { key: 'expired', label: `🔴 Expired (${statusCounts.expired})` },
        ].map(s => (
          <button key={s.key} className={`filter-chip ${filterStatus === s.key ? 'active' : ''}`} onClick={() => setFilterStatus(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Agreement Cards */}
      <div className="grid-auto">
        {filteredAgreements.map((agr) => {
          const guest = guests.find(g => g.id === agr.guestId);
          const room = rooms.find(r => r.id === agr.roomId);
          const daysLeft = getDaysRemaining(agr.endDate);
          const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
          const isExpired = daysLeft !== null && daysLeft <= 0;

          return (
            <div key={agr.id} className="glass-card" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <div>
                  <h4 style={{ marginBottom: 2 }}>{guest?.name || 'Unknown'}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Room {room?.number} • {agr.type}</div>
                </div>
                <span className={`status-badge ${isExpired ? 'status-badge-danger' : isExpiring ? 'status-badge-warning' : 'status-badge-success'}`}>
                  <span className={`status-dot-indicator ${isExpired ? 'danger' : isExpiring ? 'warning' : 'success'}`}></span>
                  {isExpired ? 'Expired' : isExpiring ? `${daysLeft}d left` : 'Active'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Start Date</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatDate(agr.startDate)}</div>
                </div>
                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>End Date</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatDate(agr.endDate)}</div>
                </div>
                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rent</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatCurrency(agr.rent)}/mo</div>
                </div>
                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deposit</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {formatCurrency(agr.deposit)}
                    {agr.depositPaid && <span style={{ color: 'var(--success)', marginLeft: 4 }}>✓</span>}
                  </div>
                </div>
              </div>

              {daysLeft !== null && daysLeft > 0 && (
                <div className="progress-bar" style={{ marginBottom: 'var(--space-sm)' }}>
                  <div className="progress-fill" style={{
                    width: `${Math.max(0, Math.min(100, ((getDaysRemaining(agr.startDate) !== null ? -getDaysRemaining(agr.startDate) : 0) / Math.max(1, (getDaysRemaining(agr.startDate) !== null ? -getDaysRemaining(agr.startDate) : 0) + daysLeft)) * 100))}%`,
                    background: isExpiring ? 'var(--warning)' : 'var(--gradient-primary)',
                  }}></div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => viewAgreementDoc(agr)}>
                  📄 View Agreement
                </button>
                {(isExpiring || isExpired) && (
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => renewAgreement(agr)}>
                    🔄 Renew
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAgreements.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No agreements found</h3>
          <p>Create a new agreement or change the filter to view existing ones.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Agreement</button>
        </div>
      )}

      {/* Create Agreement Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Agreement</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Guest *</label>
                <select className="form-select" value={createForm.guestId} onChange={(e) => setCreateForm(p => ({ ...p, guestId: e.target.value }))}>
                  <option value="">Choose a guest...</option>
                  {guests.filter(g => g.status === 'active').map(g => {
                    const room = rooms.find(r => r.id === g.roomId);
                    return (
                      <option key={g.id} value={g.id}>
                        {g.name} — Room {room?.number || '?'}
                      </option>
                    );
                  })}
                </select>
                {guestsWithoutAgreement.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: 4 }}>
                    ⚠️ {guestsWithoutAgreement.length} guest(s) have no active agreement
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Agreement Type *</label>
                <div className="agreement-type-grid">
                  {[
                    { value: 'Monthly', label: 'Monthly', desc: '1 month', icon: '📅' },
                    { value: 'Quarterly', label: 'Quarterly', desc: '3 months', icon: '📆' },
                    { value: 'Semi-Annual', label: 'Half-Yearly', desc: '6 months', icon: '🗓️' },
                    { value: 'Annual', label: 'Yearly', desc: '12 months', icon: '📋' },
                    { value: 'Custom', label: 'Custom', desc: 'Select months', icon: '⚙️' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      className={`agreement-type-option ${createForm.type === opt.value ? 'selected' : ''}`}
                      onClick={() => setCreateForm(p => ({ ...p, type: opt.value }))}
                    >
                      <span className="agreement-type-icon">{opt.icon}</span>
                      <span className="agreement-type-label">{opt.label}</span>
                      <span className="agreement-type-desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {createForm.type === 'Custom' && (
                <div className="form-group">
                  <label className="form-label">Number of Months *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="60"
                    value={createForm.customMonths}
                    onChange={(e) => setCreateForm(p => ({ ...p, customMonths: e.target.value }))}
                    placeholder="Enter number of months"
                  />
                </div>
              )}

              {createForm.guestId && (
                <div style={{ padding: 'var(--space-md)', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Preview</div>
                  {(() => {
                    const g = guests.find(x => x.id === createForm.guestId);
                    const r = rooms.find(x => x.id === g?.roomId);
                    const months = createForm.type === 'Monthly' ? 1 : createForm.type === 'Quarterly' ? 3 : createForm.type === 'Semi-Annual' ? 6 : createForm.type === 'Annual' ? 12 : parseInt(createForm.customMonths || 1);
                    const end = new Date();
                    end.setMonth(end.getMonth() + months);
                    return (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div><strong>{g?.name}</strong> • Room {r?.number}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {formatCurrency(r?.rent || 0)}/mo • {months} month(s) • Ends {formatDate(end.toISOString())}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateAgreement} disabled={!createForm.guestId}>
                Create Agreement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Agreement Document */}
      {showAgreementDoc && selectedAgreement && (
        <AgreementDocument
          agreement={selectedAgreement}
          guest={guests.find(g => g.id === selectedAgreement.guestId)}
          room={rooms.find(r => r.id === selectedAgreement.roomId)}
          property={properties.find(p => p.id === selectedAgreement.propertyId)}
          onClose={() => { setShowAgreementDoc(false); setSelectedAgreement(null); }}
        />
      )}
    </div>
  );
}
