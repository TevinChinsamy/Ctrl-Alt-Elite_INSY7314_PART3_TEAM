import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function EmployeeLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const { loginEmployee } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await loginEmployee(formData.username, formData.password);

    setLoading(false);

    if (result.success) {
      navigate('/employee/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, #b8860b 100%)',
            borderRadius: '50%',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <span style={{ fontSize: '40px', color: 'white' }}>👔</span>
          </div>
          <h1 style={{ marginBottom: '8px' }}>Employee Portal</h1>
          <p style={{ color: 'var(--gray-text)', fontSize: '16px' }}>
            Login to verify and process international payments
          </p>
        </div>

        {/* Warning Notice */}
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          border: '1px solid #ffc107',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <strong style={{ color: '#856404', display: 'block', marginBottom: '4px' }}>
              Employee Access Only
            </strong>
            <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
              This portal is for authorized bank staff only
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Employee Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter employee username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
            style={{ marginTop: '8px' }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                Signing in...
              </>
            ) : (
              <>🔐 Sign In to Portal</>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border-gray)',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--gray-text)', marginBottom: '12px' }}>
            Are you a customer?
          </p>
          <Link
            to="/customer/login"
            className="btn btn-secondary w-full"
          >
            Go to Customer Portal
          </Link>
        </div>

        {/* Info Notice */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: 'var(--light-blue)',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          color: 'var(--gray-text)',
          textAlign: 'center'
        }}>
          ℹ️ Employees are pre-registered. Contact IT support for assistance.
        </div>

        {/* Security Notice */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--light-gray)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          color: 'var(--gray-text)',
          textAlign: 'center'
        }}>
          🔒 Secure employee connection • All actions are logged
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default EmployeeLogin;
