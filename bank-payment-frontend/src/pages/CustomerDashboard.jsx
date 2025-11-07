import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { customerPayments } from '../services/api';
import { toast } from 'react-toastify';

function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await customerPayments.getMyPayments();
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Fetch payments error:', error);
      toast.error('Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'badge-pending';
      case 'Verified': return 'badge-verified';
      case 'Submitted': return 'badge-submitted';
      case 'Completed': return 'badge-completed';
      case 'Rejected': return 'badge-rejected';
      default: return 'badge-pending';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--light-blue) 0%, var(--white) 100%)' }}>
      {/* Navigation Header */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span style={{ fontSize: '28px' }}>🏦</span>
            <span>SecureBank</span>
          </div>
          <div className="navbar-menu">
            <span style={{ fontSize: '16px', fontWeight: '500' }}>👤 {user?.fullName}</span>
            <button onClick={handleLogout} className="btn btn-danger">
              🚪 Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Welcome Section */}
        <div className="card mb-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ marginBottom: '8px' }}>Welcome back, {user?.fullName}! 👋</h1>
              <p className="text-muted">Account: {user?.username}</p>
            </div>
            <button
              onClick={() => navigate('/customer/create-payment')}
              className="btn btn-primary"
              style={{ fontSize: '18px' }}
            >
              💸 Create New Payment
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px' }}>
              {payments.length}
            </div>
            <div style={{ fontSize: '1rem', opacity: '0.9' }}>Total Payments</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, var(--success-green) 0%, #20c997 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px' }}>
              {payments.filter(p => p.status === 'Verified' || p.status === 'Submitted').length}
            </div>
            <div style={{ fontSize: '1rem', opacity: '0.9' }}>Verified</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, var(--warning-orange) 0%, #ffc107 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px' }}>
              {payments.filter(p => p.status === 'Pending').length}
            </div>
            <div style={{ fontSize: '1rem', opacity: '0.9' }}>Pending</div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0 }}>💳 Payment History</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner"></div>
              <p className="text-muted mt-2">Loading your payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>💰</div>
              <h3 style={{ marginBottom: '8px' }}>No payments yet</h3>
              <p className="text-muted mb-3">Get started by creating your first international payment</p>
              <button onClick={() => navigate('/customer/create-payment')} className="btn btn-primary">
                Create Payment
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>📅 Date</th>
                    <th>💵 Amount</th>
                    <th>🌍 Currency</th>
                    <th>👤 Payee</th>
                    <th>🏦 Bank</th>
                    <th>📊 Status</th>
                    <th>✈️ SWIFT</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '600' }}>{payment.amount.toFixed(2)}</td>
                      <td>{payment.currency}</td>
                      <td>{payment.payeeFullName}</td>
                      <td>{payment.payeeBankName}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>
                        {payment.status === 'Submitted' ? (
                          <span style={{ color: 'var(--success-green)', fontWeight: '600' }}>✅ Sent</span>
                        ) : (
                          <span style={{ color: 'var(--warning-orange)', fontWeight: '600' }}>⏳ Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: 'var(--light-blue)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--gray-text)'
        }}>
          🔒 All transactions are secured with bank-level encryption • Your data is protected
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
