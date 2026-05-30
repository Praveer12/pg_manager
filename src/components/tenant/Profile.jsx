import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../utils/formatters';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    occupation: user?.occupation || '',
    company: user?.company || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile(formData);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My Profile</h2>
          <p className="subtitle">Manage your personal information</p>
        </div>
        <button className="btn btn-primary" onClick={() => editing ? handleSave() : setEditing(true)}>
          {editing ? '💾 Save Changes' : '✏️ Edit Profile'}
        </button>
      </div>

      {saved && (
        <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: 'var(--space-md)', animation: 'fadeInUp 0.3s ease' }}>
          ✅ Profile updated successfully!
        </div>
      )}

      <div className="grid-2">
        {/* Avatar & Basic Info */}
        <div className="glass-card-static animate-in animate-in-1" style={{ textAlign: 'center' }}>
          <div className="guest-avatar" style={{ width: 100, height: 100, fontSize: '2.5rem', margin: '0 auto var(--space-lg)' }}>
            {getInitials(user?.name)}
          </div>
          <h3>{user?.name || 'User'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{user?.email}</p>
          <span className="badge badge-purple" style={{ marginTop: 'var(--space-sm)' }}>
            {user?.role === 'owner' ? '🏢 PG Owner' : '🧑 Tenant'}
          </span>

          <div style={{ marginTop: 'var(--space-xl)', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>Account Details</h4>
            {[
              ['Member Since', new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })],
              ['Account Type', user?.role === 'owner' ? 'PG Owner' : 'Tenant'],
              ['Status', '🟢 Active'],
            ].map(([l, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        <div className="glass-card-static animate-in animate-in-2">
          <h4 style={{ marginBottom: 'var(--space-lg)' }}>Personal Information</h4>
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={formData.name} disabled={!editing}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={formData.email} disabled={!editing}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={formData.phone} disabled={!editing}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Occupation</label>
              <input className="form-input" value={formData.occupation} disabled={!editing}
                onChange={(e) => setFormData(p => ({ ...p, occupation: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Company / Institute</label>
              <input className="form-input" value={formData.company} disabled={!editing}
                onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))} />
            </div>
          </div>

          {editing && (
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-secondary w-full" onClick={() => {
                setEditing(false);
                setFormData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', occupation: user?.occupation || '', company: user?.company || '' });
              }}>Cancel</button>
              <button className="btn btn-primary w-full" onClick={handleSave}>Save Changes</button>
            </div>
          )}

          {/* Change Password Section */}
          <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>🔒 Security</h4>
            <button className="btn btn-outline w-full">Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
