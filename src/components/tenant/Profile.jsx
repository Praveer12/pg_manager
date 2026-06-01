import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../utils/formatters';
import storage, { STORAGE_KEYS } from '../../utils/storage';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [property, setProperty] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    occupation: user?.occupation || '',
    company: user?.company || '',
    // Owner specific
    pgName: '',
    pgCity: '',
    pgAddress: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (user?.role === 'owner') {
        const properties = await storage.getAll(STORAGE_KEYS.PROPERTIES);
        const ownerProp = properties.find(p => p.ownerId === user.id) || properties[0];
        if (ownerProp) {
          setProperty(ownerProp);
          setFormData(prev => ({
            ...prev,
            pgName: ownerProp.name || '',
            pgCity: ownerProp.city || '',
            pgAddress: ownerProp.address || '',
          }));
        }
      }
    };
    if (user?.id) {
      fetchProperty();
    }
  }, [user?.id]);

  const handleSave = async () => {
    // Capture form values locally first to prevent race condition state resets
    const { name, email, phone, pgName, pgCity, pgAddress, occupation, company } = formData;

    // Update User Profile
    await updateProfile({
      name,
      email,
      phone,
      occupation: user?.role === 'tenant' ? occupation : '',
      company: user?.role === 'tenant' ? company : '',
    });

    // Update Property if user is Owner
    if (user?.role === 'owner') {
      if (property) {
        const updatedProp = await storage.update(STORAGE_KEYS.PROPERTIES, property.id, {
          name: pgName,
          city: pgCity,
          address: pgAddress,
        });
        if (updatedProp) setProperty(updatedProp);
      } else {
        // Create new property if none exists
        const defaultProp = {
          ownerId: user.id,
          name: pgName,
          city: pgCity,
          address: pgAddress,
          totalRooms: 12,
          amenities: ['wifi', 'ac', 'parking', 'laundry', 'kitchen', 'security', 'cctv'],
          rules: ['No smoking inside rooms', 'Visitor hours: 9 AM - 9 PM'],
          rating: 4.5,
          images: [],
          paymentDetails: {
            upiPhone: phone,
            upiId: '',
            qrImage: null,
          }
        };
        const created = await storage.add(STORAGE_KEYS.PROPERTIES, defaultProp);
        if (created) setProperty(created);
      }
      
      // Log System Activity
      await storage.logActivity('⚙️', 'system', 'Owner Profile and Property details updated');
    }

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
              ...(user?.role === 'owner' && property ? [
                ['PG Name', property.name],
                ['PG Location', property.city],
              ] : [])
            ].map(([l, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: 500 }} className="truncate">{v}</span>
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
            {user?.role === 'tenant' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">PG / Property Name</label>
                  <input className="form-input" value={formData.pgName} disabled={!editing}
                    onChange={(e) => setFormData(p => ({ ...p, pgName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">PG City / Location</label>
                  <input className="form-input" value={formData.pgCity} disabled={!editing}
                    onChange={(e) => setFormData(p => ({ ...p, pgCity: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">PG Address</label>
                  <input className="form-input" value={formData.pgAddress} disabled={!editing}
                    onChange={(e) => setFormData(p => ({ ...p, pgAddress: e.target.value }))} />
                </div>
              </>
            )}
          </div>

          {editing && (
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-secondary w-full" onClick={() => {
                setEditing(false);
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  occupation: user?.occupation || '',
                  company: user?.company || '',
                  pgName: property?.name || '',
                  pgCity: property?.city || '',
                  pgAddress: property?.address || '',
                });
              }}>Cancel</button>
              <button className="btn btn-primary w-full" onClick={handleSave}>Save Changes</button>
            </div>
          )}

          {/* Change Password Section */}
          <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>🔒 Security</h4>
            <button className="btn btn-outline w-full" onClick={() => alert('Change password feature coming soon')}>Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}
