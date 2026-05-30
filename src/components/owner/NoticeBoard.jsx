import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'normal' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => setNotices(await storage.getAll(STORAGE_KEYS.NOTICES));

  const handlePost = async () => {
    if (!formData.title || !formData.content) return;
    await storage.add(STORAGE_KEYS.NOTICES, {
      ...formData, pinned: false,
    });
    setShowModal(false);
    setFormData({ title: '', content: '', priority: 'normal' });
    await refreshData();
  };

  const togglePin = async (noticeId) => {
    const notice = notices.find(n => n.id === noticeId);
    await storage.update(STORAGE_KEYS.NOTICES, noticeId, { pinned: !notice.pinned });
    await refreshData();
  };

  const deleteNotice = async (noticeId) => {
    if (confirm('Delete this notice?')) {
      await storage.delete(STORAGE_KEYS.NOTICES, noticeId);
      await refreshData();
    }
  };

  const sortedNotices = [...notices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Notice Board</h2>
          <p className="subtitle">{notices.length} notices • {notices.filter(n => n.pinned).length} pinned</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Notice</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {sortedNotices.map((notice) => (
          <div key={notice.id} className={`notice-card ${notice.pinned ? 'pinned' : ''}`}>
            <div className="notice-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                {notice.pinned && <span style={{ fontSize: '0.9rem' }}>📌</span>}
                <h4 style={{ fontSize: '1rem' }}>{notice.title}</h4>
                {notice.priority === 'high' && <span className="badge badge-danger">Important</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span className="notice-date">{formatRelativeTime(notice.createdAt)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => togglePin(notice.id)} title={notice.pinned ? 'Unpin' : 'Pin'}>
                  {notice.pinned ? '📌' : '📍'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteNotice(notice.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
              </div>
            </div>
            <div className="notice-body">{notice.content}</div>
          </div>
        ))}
      </div>

      {notices.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📢</div>
          <h3>No notices yet</h3>
          <p>Post a notice to keep your residents informed.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Post Notice</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post Notice</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Notice title" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea className="form-textarea" placeholder="Write your notice..." value={formData.content} onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))} style={{ minHeight: 120 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={formData.priority} onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}>
                  <option value="normal">Normal</option>
                  <option value="high">High (Important)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePost}>Post Notice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
