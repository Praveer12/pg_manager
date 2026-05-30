import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [role, setRole] = useState('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    setTimeout(() => {
      const result = login(email, password, role);
      if (result.success) {
        navigate(role === 'owner' ? '/owner' : '/tenant');
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 500);
  };

  const fillDemo = (demoRole) => {
    setRole(demoRole);
    if (demoRole === 'owner') {
      setEmail('owner@pgmanager.com');
      setPassword('owner123');
    } else {
      setEmail('tenant@pgmanager.com');
      setPassword('tenant123');
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
            <h2>Welcome Back</h2>
            <p>Sign in to your PG Manager account</p>
          </div>

          <div className="auth-toggle">
            <button 
              className={role === 'owner' ? 'active' : ''}
              onClick={() => setRole('owner')}
            >
              🏢 PG Owner
            </button>
            <button 
              className={role === 'tenant' ? 'active' : ''}
              onClick={() => setRole('tenant')}
            >
              🧑 Tenant
            </button>
          </div>

          {error && (
            <div style={{ 
              background: 'var(--danger-bg)', 
              color: 'var(--danger)', 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '0.85rem',
              marginBottom: 'var(--space-md)'
            }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <label className="form-checkbox">
                <input type="checkbox" defaultChecked />
                Remember me
              </label>
              <a href="#" style={{ color: 'var(--accent-primary-light)' }}>Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Signing in...</>
              ) : (
                `Sign in as ${role === 'owner' ? 'Owner' : 'Tenant'}`
              )}
            </button>
          </form>

          <div className="auth-divider">or try demo accounts</div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary w-full" onClick={() => fillDemo('owner')}>
              🏢 Demo Owner
            </button>
            <button className="btn btn-secondary w-full" onClick={() => fillDemo('tenant')}>
              🧑 Demo Tenant
            </button>
          </div>

          <div className="auth-footer">
            Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
}
