import { useState, useEffect, useRef } from 'react';
import storage, { STORAGE_KEYS } from '../../utils/storage';

export default function OwnerSettings() {
  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState({
    upiPhone: '',
    upiId: '',
    qrImage: null,
  });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProps = async () => {
      const properties = await storage.getAll(STORAGE_KEYS.PROPERTIES);
      if (properties.length > 0) {
        setProperty(properties[0]);
        const pd = properties[0].paymentDetails || {};
        setFormData({
          upiPhone: pd.upiPhone || '',
          upiId: pd.upiId || '',
          qrImage: pd.qrImage || null,
        });
      }
    };
    fetchProps();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({
          ...prev,
          qrImage: ev.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!property) return;
    
    await storage.update(STORAGE_KEYS.PROPERTIES, property.id, {
      paymentDetails: {
        upiPhone: formData.upiPhone,
        upiId: formData.upiId,
        qrImage: formData.qrImage,
      }
    });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payment Settings</h2>
          <p className="subtitle">Configure how tenants pay you</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          💾 Save Settings
        </button>
      </div>

      {saved && (
        <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: 'var(--space-md)', animation: 'fadeInUp 0.3s ease' }}>
          ✅ Payment settings updated successfully!
        </div>
      )}

      <div className="grid-2">
        {/* Payment Details Form */}
        <div className="glass-card-static animate-in animate-in-1">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>UPI Details</h4>
          <div className="form-group">
            <label className="form-label">UPI Phone Number</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 9876543210" 
              value={formData.upiPhone}
              onChange={(e) => setFormData(p => ({ ...p, upiPhone: e.target.value }))} 
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Tenants will see this number to make manual UPI payments.
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">UPI ID / VPA</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. owner@okaxis" 
              value={formData.upiId}
              onChange={(e) => setFormData(p => ({ ...p, upiId: e.target.value }))} 
            />
          </div>
        </div>

        {/* QR Code Upload */}
        <div className="glass-card-static animate-in animate-in-2">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>Payment QR Code</h4>
          <div className="form-group">
            <label className="form-label">Upload QR Code Image</label>
            <div className="image-uploader" onClick={() => fileInputRef.current?.click()} style={{ minHeight: 200 }}>
              {formData.qrImage ? (
                <img src={formData.qrImage} alt="Payment QR" style={{ maxHeight: 180, objectFit: 'contain' }} />
              ) : (
                <>
                  <div className="upload-icon">📱</div>
                  <div className="upload-text">
                    <span>Click to upload</span> your UPI QR Code
                  </div>
                  <div className="upload-hint">PNG, JPG up to 2MB</div>
                </>
              )}
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
            </div>
            {formData.qrImage && (
              <button 
                className="btn btn-ghost btn-sm" 
                style={{ color: 'var(--danger)', marginTop: 'var(--space-sm)' }}
                onClick={() => setFormData(p => ({ ...p, qrImage: null }))}
              >
                🗑️ Remove QR Code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
