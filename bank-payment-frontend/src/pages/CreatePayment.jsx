import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerPayments } from '../services/api';
import { toast } from 'react-toastify';
import validator from '../utils/validators';

function CreatePayment() {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    provider: 'SWIFT',
    payeeAccountNumber: '',
    payeeFullName: '',
    payeeBankName: '',
    swiftCode: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const validation = validator.validatePaymentForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await customerPayments.create({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        provider: formData.provider,
        payeeAccountNumber: formData.payeeAccountNumber,
        payeeFullName: formData.payeeFullName,
        payeeBankName: formData.payeeBankName,
        swiftCode: formData.swiftCode.toUpperCase(),
      });

      toast.success('Payment created successfully! Awaiting verification.');
      navigate('/customer/dashboard');
    } catch (error) {
      // Enhanced error handling for rate limits
      const message = error.userMessage || error.response?.data?.message || 'Failed to create payment';

      if (error.response?.status === 429) {
        toast.warning(message, { autoClose: 8000 });
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--light-blue) 0%, var(--white) 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Back Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Main Card */}
        <div className="card">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '70px',
              height: '70px',
              background: 'linear-gradient(135deg, var(--success-green) 0%, #20c997 100%)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)'
            }}>
              <span style={{ fontSize: '36px', color: 'white' }}>💸</span>
            </div>
            <h1 style={{ marginBottom: '8px' }}>Create International Payment</h1>
            <p style={{ color: 'var(--gray-text)', fontSize: '16px' }}>
              Enter payment details below. Your payment will be verified by our staff before being submitted to SWIFT.
            </p>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit}>
            {/* Payment Details Section */}
            <div style={{
              marginBottom: '32px',
              paddingBottom: '24px',
              borderBottom: '2px solid var(--border-gray)'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💵</span> Payment Details
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0.01"
                    max="999999999.99"
                    step="0.01"
                    className="form-input"
                    placeholder="1000.00"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="form-select"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Provider</label>
                <select
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="SWIFT">SWIFT</option>
                  <option value="SEPA">SEPA</option>
                  <option value="Wire Transfer">Wire Transfer</option>
                </select>
              </div>
            </div>

            {/* Payee Information Section */}
            <div style={{
              marginBottom: '32px',
              paddingBottom: '24px',
              borderBottom: '2px solid var(--border-gray)'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👤</span> Payee Information
              </h3>

              <div className="form-group">
                <label className="form-label">Payee Account Name</label>
                <input
                  type="text"
                  name="payeeFullName"
                  value={formData.payeeFullName}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z\s'\-]{2,100}"
                  maxLength="100"
                  className="form-input"
                  placeholder="John Doe"
                />
                <small className="form-hint">Letters, spaces, hyphens, and apostrophes only (2-100 characters)</small>
              </div>

              <div className="form-group">
                <label className="form-label">Payee Account Number</label>
                <input
                  type="text"
                  name="payeeAccountNumber"
                  value={formData.payeeAccountNumber}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10,16}"
                  minLength="10"
                  maxLength="16"
                  className="form-input"
                  placeholder="1234567890123456"
                />
                <small className="form-hint">10-16 digits only (no spaces or special characters)</small>
              </div>

              <div className="form-group">
                <label className="form-label">Payee Bank Name</label>
                <input
                  type="text"
                  name="payeeBankName"
                  value={formData.payeeBankName}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z\s&'\-]{2,100}"
                  maxLength="100"
                  className="form-input"
                  placeholder="International Bank & Trust"
                />
                <small className="form-hint">Letters, spaces, ampersands, hyphens, and apostrophes (2-100 characters)</small>
              </div>

              <div className="form-group">
                <label className="form-label">SWIFT/BIC Code</label>
                <input
                  type="text"
                  name="swiftCode"
                  value={formData.swiftCode}
                  onChange={handleChange}
                  required
                  pattern="[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?"
                  maxLength="11"
                  className="form-input"
                  placeholder="ABCDEF2A or ABCDEF2AXXX"
                  style={{ textTransform: 'uppercase' }}
                />
                <small className="form-hint">8 or 11 characters (e.g., CHASUS33 or CHASUS33XXX)</small>
              </div>
            </div>

            {/* Payment Summary */}
            <div style={{
              background: 'linear-gradient(135deg, var(--light-blue) 0%, var(--white) 100%)',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '24px',
              border: '2px solid var(--border-gray)'
            }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📊</span> Payment Summary
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-text)' }}>Amount:</span>
                  <strong>{formData.amount || '0.00'} {formData.currency}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-text)' }}>Provider:</span>
                  <strong>{formData.provider}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-text)' }}>Payee:</span>
                  <strong>{formData.payeeFullName || 'Not entered'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-text)' }}>Bank:</span>
                  <strong>{formData.payeeBankName || 'Not entered'}</strong>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-success w-full"
              style={{ fontSize: '18px', padding: '14px' }}
            >
              {loading ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '18px',
                    height: '18px',
                    border: '2px solid white',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></span>
                  Creating Payment...
                </>
              ) : (
                <>💳 Submit Payment</>
              )}
            </button>

            <p style={{ marginTop: '16px', textAlign: 'center', color: 'var(--gray-text)', fontSize: '14px' }}>
              ✅ Your payment will be verified by bank staff before being submitted to SWIFT
            </p>
          </form>
        </div>

        {/* Security Notice */}
        <div style={{
          marginTop: '24px',
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default CreatePayment;
