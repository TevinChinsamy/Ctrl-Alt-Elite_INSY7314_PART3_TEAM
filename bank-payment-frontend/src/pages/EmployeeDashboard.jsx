import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { employeePortal } from '../services/api';
import { toast } from 'react-toastify';

function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [verifiedPayments, setVerifiedPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'verified'
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [pendingRes, verifiedRes] = await Promise.all([
        employeePortal.getPendingPayments(),
        employeePortal.getVerifiedPayments(),
      ]);
      setPendingPayments(pendingRes.data.payments || []);
      setVerifiedPayments(verifiedRes.data.payments || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    setVerifying(paymentId);
    try {
      await employeePortal.verifyPayment(paymentId);
      toast.success('Payment verified successfully!');
      await fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify payment');
    } finally {
      setVerifying(null);
    }
  };

  const handleSubmitToSwift = async () => {
    if (verifiedPayments.length === 0) {
      toast.warning('No verified payments to submit');
      return;
    }

    if (!window.confirm(`Submit ${verifiedPayments.length} payment(s) to SWIFT?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await employeePortal.submitToSwift();
      toast.success(response.data.message);
      await fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit to SWIFT');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/employee/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--light-blue) 0%, var(--white) 100%)' }}>
      {/* Navigation Header */}
      <nav style={{
        background: 'linear-gradient(135deg, var(--accent-gold) 0%, #b8860b 100%)',
        padding: '20px 0',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '32px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px' }}>👔</span>
              <h1 style={{ margin: 0, fontSize: '28px', color: 'white' }}>Employee Portal</h1>
            </div>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>Welcome, {user?.fullName}</p>
            <small style={{ opacity: 0.8 }}>{user?.role}</small>
          </div>
          <button onClick={handleLogout} className="btn btn-danger">
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--warning-orange) 0%, #ffc107 100%)',
            color: 'white',
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Pending Review</h3>
              <span style={{ fontSize: '32px' }}>⏳</span>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '4px' }}>
              {pendingPayments.length}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Awaiting verification</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, var(--success-green) 0%, #20c997 100%)',
            color: 'white',
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Verified</h3>
              <span style={{ fontSize: '32px' }}>✅</span>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '4px' }}>
              {verifiedPayments.length}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Ready for SWIFT</div>
          </div>
        </div>

        {/* Submit to SWIFT Banner */}
        {verifiedPayments.length > 0 && (
          <div className="card" style={{
            marginBottom: '32px',
            background: 'linear-gradient(135deg, #d4edda 0%, #c3f9d3 100%)',
            border: '2px solid var(--success-green)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#155724', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📤</span> Ready for SWIFT Submission
                </h3>
                <p style={{ margin: 0, color: '#155724', fontSize: '16px' }}>
                  <strong>{verifiedPayments.length}</strong> payment{verifiedPayments.length !== 1 ? 's' : ''} verified and ready to submit
                </p>
              </div>
              <button
                onClick={handleSubmitToSwift}
                disabled={submitting}
                className="btn btn-success"
                style={{ fontSize: '18px', padding: '14px 32px' }}
              >
                {submitting ? (
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
                    Submitting to SWIFT...
                  </>
                ) : (
                  <>📤 Submit to SWIFT</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '14px 28px',
              backgroundColor: activeTab === 'pending' ? 'var(--primary-blue)' : 'var(--white)',
              color: activeTab === 'pending' ? 'white' : 'var(--dark-text)',
              border: activeTab === 'pending' ? 'none' : '2px solid var(--border-gray)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'var(--transition)',
              boxShadow: activeTab === 'pending' ? 'var(--shadow-md)' : 'none'
            }}
          >
            ⏳ Pending ({pendingPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            style={{
              padding: '14px 28px',
              backgroundColor: activeTab === 'verified' ? 'var(--primary-blue)' : 'var(--white)',
              color: activeTab === 'verified' ? 'white' : 'var(--dark-text)',
              border: activeTab === 'verified' ? 'none' : '2px solid var(--border-gray)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'var(--transition)',
              boxShadow: activeTab === 'verified' ? 'var(--shadow-md)' : 'none'
            }}
          >
            ✅ Verified ({verifiedPayments.length})
          </button>
        </div>

        {/* Payments Table */}
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner"></div>
              <p className="text-muted mt-2">Loading payments...</p>
            </div>
          ) : activeTab === 'pending' ? (
            // Pending Payments
            pendingPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ marginBottom: '8px' }}>No Pending Payments</h3>
                <p className="text-muted">All payments have been verified. Great job!</p>
              </div>
            ) : (
              <>
                <div className="card-header">
                  <h2 style={{ margin: 0 }}>⏳ Pending Payments - Awaiting Verification</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>📅 Date</th>
                        <th>👤 Customer</th>
                        <th>💵 Amount</th>
                        <th>🌍 Currency</th>
                        <th>👥 Payee Details</th>
                        <th>🏦 SWIFT Code</th>
                        <th style={{ textAlign: 'center' }}>⚙️ Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayments.map((payment) => (
                        <tr key={payment._id}>
                          <td>{new Date(payment.createdAt).toLocaleString()}</td>
                          <td style={{ fontWeight: '600' }}>{payment.customerUsername}</td>
                          <td style={{ fontWeight: '700', color: 'var(--primary-blue)' }}>
                            {payment.amount.toFixed(2)}
                          </td>
                          <td>{payment.currency}</td>
                          <td>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {payment.payeeFullName}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--gray-text)' }}>
                              Acc: {payment.payeeAccountNumber}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--gray-text)' }}>
                              {payment.payeeBankName}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '600' }}>
                            {payment.swiftCode}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleVerifyPayment(payment._id)}
                              disabled={verifying === payment._id}
                              className="btn btn-success"
                              style={{ fontSize: '14px', padding: '10px 20px' }}
                            >
                              {verifying === payment._id ? (
                                <>
                                  <span style={{
                                    display: 'inline-block',
                                    width: '14px',
                                    height: '14px',
                                    border: '2px solid white',
                                    borderTop: '2px solid transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                  }}></span>
                                  Verifying...
                                </>
                              ) : (
                                <>✅ Verify</>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          ) : (
            // Verified Payments
            verifiedPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
                <h3 style={{ marginBottom: '8px' }}>No Verified Payments</h3>
                <p className="text-muted">Verified payments will appear here, ready for SWIFT submission.</p>
              </div>
            ) : (
              <>
                <div className="card-header" style={{ background: 'linear-gradient(135deg, #d4edda 0%, #c3f9d3 100%)' }}>
                  <h2 style={{ margin: 0, color: '#155724' }}>✅ Verified Payments - Ready for SWIFT</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>✅ Verified Date</th>
                        <th>👤 Customer</th>
                        <th>💵 Amount</th>
                        <th>🌍 Currency</th>
                        <th>👥 Payee Details</th>
                        <th>🏦 SWIFT Code</th>
                        <th>👔 Verified By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiedPayments.map((payment) => (
                        <tr key={payment._id} style={{ backgroundColor: '#f8fff9' }}>
                          <td>{new Date(payment.verifiedAt).toLocaleString()}</td>
                          <td style={{ fontWeight: '600' }}>{payment.customerUsername}</td>
                          <td style={{ fontWeight: '700', color: 'var(--success-green)' }}>
                            {payment.amount.toFixed(2)}
                          </td>
                          <td>{payment.currency}</td>
                          <td>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              {payment.payeeFullName}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--gray-text)' }}>
                              Acc: {payment.payeeAccountNumber}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '600' }}>
                            {payment.swiftCode}
                          </td>
                          <td>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-blue)' }}>
                              {payment.verifiedByUsername}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--success-green)', fontWeight: '600' }}>
                              ✅ VERIFIED
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}
        </div>

        {/* Security Notice */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: 'var(--light-gray)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--gray-text)'
        }}>
          🔒 All employee actions are logged and audited • Secure banking operations
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinner {
          width: 40px;
          height: 40px;
          margin: 0 auto;
          border: 4px solid var(--border-gray);
          border-top: 4px solid var(--primary-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .card-header {
          padding: 20px 24px;
          border-bottom: 2px solid var(--border-gray);
          background: var(--light-blue);
        }
      `}</style>
    </div>
  );
}

export default EmployeeDashboard;
