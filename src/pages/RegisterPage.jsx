import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('tenant');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    // Owner specific
    pgName: '', pgAddress: '', pgCity: '',
    // Tenant specific
    occupation: '', company: '',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        setError('Please fill all required fields');
        return;
      }
    }
    if (step === 2) {
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: role,
        occupation: formData.occupation,
        company: formData.company,
      });

      if (result.success) {
        navigate(role === 'owner' ? '/owner' : '/tenant');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred during registration.');
    }
  };

  return (
    <div className="auth-page">
      <div className="floating-shapes">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-mark">🏠</div>
            <h2>Create Account</h2>
            <p>Get started with PG Manager</p>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Step {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="auth-form animate-in">
                <div className="auth-toggle">
                  <button type="button" className={role === 'owner' ? 'active' : ''} onClick={() => setRole('owner')}>🏢 PG Owner</button>
                  <button type="button" className={role === 'tenant' ? 'active' : ''} onClick={() => setRole('tenant')}>🧑 Tenant</button>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" placeholder="Enter your full name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" placeholder="Enter your email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input type="tel" className="form-input" placeholder="10-digit mobile number" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} required />
                </div>
                <button type="button" className="btn btn-primary btn-lg w-full" onClick={nextStep}>Continue →</button>
              </div>
            )}

            {step === 2 && (
              <div className="auth-form animate-in">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" placeholder="Min. 6 characters" value={formData.password} onChange={(e) => updateField('password', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input type="password" className="form-input" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} required />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button type="button" className="btn btn-secondary btn-lg w-full" onClick={() => setStep(1)}>← Back</button>
                  <button type="button" className="btn btn-primary btn-lg w-full" onClick={nextStep}>Continue →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="auth-form animate-in">
                {role === 'tenant' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Occupation</label>
                      <select className="form-select" value={formData.occupation} onChange={(e) => updateField('occupation', e.target.value)}>
                        <option value="">Select occupation</option>
                        <option value="Student">Student</option>
                        <option value="Software Engineer">Software Engineer</option>
                        <option value="Working Professional">Working Professional</option>
                        <option value="Freelancer">Freelancer</option>
                        <option value="Business">Business</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company / Institute</label>
                      <input type="text" className="form-input" placeholder="Where do you work/study?" value={formData.company} onChange={(e) => updateField('company', e.target.value)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">PG Name</label>
                      <input type="text" className="form-input" placeholder="Your PG property name" value={formData.pgName} onChange={(e) => updateField('pgName', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PG City</label>
                      <input type="text" className="form-input" placeholder="City" value={formData.pgCity} onChange={(e) => updateField('pgCity', e.target.value)} />
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button type="button" className="btn btn-secondary btn-lg w-full" onClick={() => setStep(2)}>← Back</button>
                  <button type="submit" className="btn btn-primary btn-lg w-full">Create Account ✨</button>
                </div>
              </div>
            )}
          </form>

          <div className="auth-footer">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}
