import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';
import { formatRelativeTime } from '../../utils/formatters';

export default function Notices() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const fetchNotices = async () => {
      const allNotices = await storage.getAll(STORAGE_KEYS.NOTICES);
      setNotices([...allNotices].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }));
    };
    fetchNotices();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Notices & Updates</h2>
          <p className="subtitle">{notices.length} notices from your PG</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {notices.map((notice, i) => (
          <div key={notice.id} className={`notice-card ${notice.pinned ? 'pinned' : ''} animate-in`} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="notice-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                {notice.pinned && <span>📌</span>}
                <h4 style={{ fontSize: '1.05rem' }}>{notice.title}</h4>
                {notice.priority === 'high' && <span className="badge badge-danger">Important</span>}
              </div>
              <span className="notice-date">{formatRelativeTime(notice.createdAt)}</span>
            </div>
            <div className="notice-body" style={{ whiteSpace: 'pre-wrap' }}>{notice.content}</div>
          </div>
        ))}
      </div>

      {notices.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📢</div>
          <h3>No notices yet</h3>
          <p>Notices from your PG owner will appear here.</p>
        </div>
      )}
    </div>
  );
}
