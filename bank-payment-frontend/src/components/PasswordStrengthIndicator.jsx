import { useState, useEffect } from 'react';

/**
 * Password Strength Indicator Component
 * Provides real-time feedback on password requirements
 * Implements strong password policy: 8-10 chars min, uppercase, lowercase, numbers, symbols
 */
function PasswordStrengthIndicator({ password, onValidationChange }) {
  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const [strength, setStrength] = useState(0);

  useEffect(() => {
    const newChecks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&#^()_+=\-\[\]{}|\\:;<>,.~`]/.test(password),
    };

    setChecks(newChecks);

    // Calculate strength (0-5)
    const strengthScore = Object.values(newChecks).filter(Boolean).length;
    setStrength(strengthScore);

    // Notify parent component if all requirements are met
    const isValid = Object.values(newChecks).every(check => check === true);
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [password, onValidationChange]);

  const getStrengthColor = () => {
    if (strength === 0) return '#e0e0e0';
    if (strength <= 2) return '#dc3545'; // Red - Weak
    if (strength <= 3) return '#ffc107'; // Orange - Fair
    if (strength === 4) return '#28a745'; // Green - Good
    return '#20c997'; // Teal - Strong
  };

  const getStrengthText = () => {
    if (strength === 0) return 'No password';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength === 4) return 'Good';
    return 'Strong';
  };

  const CheckItem = ({ checked, text }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: checked ? '#28a745' : '#6c757d',
      transition: 'color 0.2s ease'
    }}>
      <span style={{ fontSize: '16px' }}>
        {checked ? '✅' : '⚪'}
      </span>
      <span>{text}</span>
    </div>
  );

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      {/* Strength Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <span>Password Strength:</span>
          <span style={{ color: getStrengthColor() }}>
            {getStrengthText()}
          </span>
        </div>
        <div style={{
          height: '8px',
          background: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${(strength / 5) * 100}%`,
            background: getStrengthColor(),
            transition: 'all 0.3s ease',
            borderRadius: '4px'
          }} />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <CheckItem
          checked={checks.length}
          text="At least 8 characters"
        />
        <CheckItem
          checked={checks.uppercase}
          text="One uppercase letter (A-Z)"
        />
        <CheckItem
          checked={checks.lowercase}
          text="One lowercase letter (a-z)"
        />
        <CheckItem
          checked={checks.number}
          text="One number (0-9)"
        />
        <CheckItem
          checked={checks.special}
          text="One special character (@$!%*?&#, etc.)"
        />
      </div>

      {/* Security Tip */}
      {password.length > 0 && strength < 5 && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: '#fff3cd',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#856404',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>💡</span>
          <span>Complete all requirements for a secure password</span>
        </div>
      )}

      {strength === 5 && (
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: '#d4edda',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#155724',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✓</span>
          <span>Excellent! Your password meets all security requirements</span>
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthIndicator;
