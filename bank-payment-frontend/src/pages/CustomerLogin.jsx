import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function CustomerLogin() {
  const [formData, setFormData] = useState({
    username: '',
    accountNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const { loginCustomer } = useAuth();
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

    const result = await loginCustomer(
      formData.username,
      formData.accountNumber,
      formData.password
    );

    setLoading(false);

    if (result.success) {
      navigate('/customer/dashboard');
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
            background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%)',
            borderRadius: '50%',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <span style={{ fontSize: '40px', color: 'white' }}>🏦</span>
          </div>
          <h1 style={{ marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--gray-text)', fontSize: '16px' }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your account number"
              pattern="[0-9]{10,16}"
              autoComplete="off"
            />
            <small className="form-hint">10-16 digit account number</small>
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
              <>🔒 Sign In</>
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
          <p style={{ color: 'var(--gray-text)', fontSize: '14px', marginBottom: '12px' }}>
            Don't have an account?
          </p>
          <div style={{
            padding: '16px',
            background: 'var(--light-blue)',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            color: 'var(--dark-gray)',
            marginBottom: '16px'
          }}>
            <strong>🏦 Open an Account</strong>
            <p style={{ marginTop: '8px', marginBottom: 0, lineHeight: '1.5' }}>
              Visit your nearest bank branch or contact customer service to open a new account.
            </p>
          </div>

          <div style={{ marginTop: '20px' }}>
            <Link
              to="/employee/login"
              style={{
                color: 'var(--secondary-blue)',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              Employee Login →
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: 'var(--light-blue)',
          borderRadius: 'var(--radius-md)',
          fontSize: '14px',
          color: 'var(--gray-text)',
          textAlign: 'center'
        }}>
          🔒 Secure connection • Your data is encrypted
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

export default CustomerLogin;
