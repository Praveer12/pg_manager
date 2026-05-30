import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatRelativeTime } from '../../utils/formatters';
import { STATUS_CONFIG } from '../../data/mockData';

export default function MaintenanceBoard() {
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setRequests(await storage.getAll(STORAGE_KEYS.MAINTENANCE));
    setRooms(await storage.getAll(STORAGE_KEYS.ROOMS));
    setGuests(await storage.getAll(STORAGE_KEYS.GUESTS));
  };

  const columns = [
    { key: 'new', title: 'New Requests', color: 'var(--info)' },
    { key: 'in_progress', title: 'In Progress', color: 'var(--warning)' },
    { key: 'resolved', title: 'Resolved', color: 'var(--success)' },
  ];

  const moveRequest = async (reqId, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'resolved') updates.resolvedDate = new Date().toISOString();
    await storage.update(STORAGE_KEYS.MAINTENANCE, reqId, updates);
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
          <h2>Maintenance Board</h2>
          <p className="subtitle">{requests.filter(r => r.status !== 'resolved').length} open requests</p>
        </div>
      </div>

      <div className="kanban-board">
        {columns.map((col) => {
          const colRequests = requests.filter(r => r.status === col.key);
          return (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header">
                <h4>
                  <span className="status-dot" style={{ background: col.color, boxShadow: `0 0 8px ${col.color}` }}></span>
                  {col.title}
                </h4>
                <span className="count">{colRequests.length}</span>
              </div>
              <div className="kanban-column-body">
                {colRequests.map((req) => {
                  const room = rooms.find(r => r.id === req.roomId);
                  const guest = guests.find(g => g.id === req.guestId);
                  const pc = priorityColors[req.priority] || priorityColors.medium;
                  return (
                    <div key={req.id} className="kanban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <span className="card-title">{req.title}</span>
                        <span className="badge" style={{ background: pc.bg, color: pc.color, fontSize: '0.65rem' }}>{pc.label}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', lineHeight: 1.5 }}>
                        {req.description?.slice(0, 80)}{req.description?.length > 80 ? '...' : ''}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
                        <span className="amenity-chip">🚪 Room {room?.number}</span>
                        <span className="amenity-chip">🏷️ {req.category}</span>
                      </div>
                      {req.assignedTo && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
                          👷 {req.assignedTo}
                        </div>
                      )}
                      <div className="card-meta">
                        <span>{formatRelativeTime(req.createdAt)}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {col.key === 'new' && (
                            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                              onClick={() => moveRequest(req.id, 'in_progress')}>▶ Start</button>
                          )}
                          {col.key === 'in_progress' && (
                            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem', color: 'var(--success)' }}
                              onClick={() => moveRequest(req.id, 'resolved')}>✅ Resolve</button>
                          )}
                          {col.key !== 'new' && col.key !== 'resolved' && (
                            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                              onClick={() => moveRequest(req.id, 'new')}>↩ Back</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {colRequests.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No requests
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
