import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

function CustomerRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    accountNumber: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const { registerCustomer } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!isPasswordValid) {
      setError('Password does not meet security requirements. Please ensure all requirements are met.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const result = await registerCustomer({
      fullName: formData.fullName,
      idNumber: formData.idNumber,
      accountNumber: formData.accountNumber,
      username: formData.username,
      password: formData.password,
    });

    setLoading(false);

    if (result.success) {
      navigate('/customer/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '550px', width: '100%' }}>
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
          <h1 style={{ marginBottom: '8px' }}>Create Your Account</h1>
          <p style={{ color: 'var(--gray-text)', fontSize: '16px' }}>
            Join SecureBank for international payments
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #f5c6cb',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <div style={{
            marginBottom: '24px',
            paddingBottom: '24px',
            borderBottom: '2px solid var(--border-gray)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--primary-blue)' }}>
              👤 Personal Information
            </h3>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="John Smith"
                autoComplete="name"
              />
              <small className="form-hint">Enter your full legal name</small>
            </div>

            <div className="form-group">
              <label className="form-label">ID Number</label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                required
                pattern="[0-9]{13}"
                className="form-input"
                placeholder="9001015009087"
                autoComplete="off"
              />
              <small className="form-hint">13-digit ID number</small>
            </div>
          </div>

          {/* Account Information Section */}
          <div style={{
            marginBottom: '24px',
            paddingBottom: '24px',
            borderBottom: '2px solid var(--border-gray)'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--primary-blue)' }}>
              🏦 Account Information
            </h3>

            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                pattern="[0-9]{10,16}"
                className="form-input"
                placeholder="1234567890123"
                autoComplete="off"
              />
              <small className="form-hint">10-16 digit account number</small>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                pattern="[a-zA-Z0-9_]{3,50}"
                className="form-input"
                placeholder="johnsmith"
                autoComplete="username"
              />
              <small className="form-hint">3-50 characters, letters, numbers, and underscores only</small>
            </div>
          </div>

          {/* Security Information Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--primary-blue)' }}>
              🔒 Security
            </h3>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter secure password"
                autoComplete="new-password"
              />
              <PasswordStrengthIndicator
                password={formData.password}
                onValidationChange={setIsPasswordValid}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Re-enter password"
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Submit Button */}
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
                Creating Account...
              </>
            ) : (
              <>✨ Create Account</>
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
            Already have an account?
          </p>
          <Link
            to="/customer/login"
            className="btn btn-secondary w-full"
          >
            Sign In
          </Link>
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
          🔒 Your information is encrypted and secure
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

export default CustomerRegister;
