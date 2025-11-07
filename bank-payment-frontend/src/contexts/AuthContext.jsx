import { createContext, useContext, useState, useEffect } from 'react';
import { customerAuth, employeeAuth } from '../services/api';
import { toast } from 'react-toastify';
import secureStorage from '../utils/secureStorage';
import sanitizer from '../utils/sanitizer';
import tokenRefresh from '../utils/tokenRefresh';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'customer' or 'employee'

  // Load user from secure storage on mount
  useEffect(() => {
    const storedToken = secureStorage.getToken();
    const storedUser = secureStorage.getUser();
    const storedUserType = secureStorage.getUserType();

    if (storedToken && storedUser) {
      // Check if token is expired
      if (tokenRefresh.isTokenExpired(storedToken)) {
        // Token expired, clear storage and don't auto-login
        secureStorage.clearAuth();
        setLoading(false);
        return;
      }

      // Sanitize user data to prevent XSS
      const sanitizedUser = sanitizer.sanitizeUserData(storedUser);
      setToken(storedToken);
      setUser(sanitizedUser);
      setUserType(storedUserType);

      // Start token refresh monitoring
      tokenRefresh.start(
        // onTokenExpiring callback
        () => {
          toast.warning('Your session will expire in 5 minutes. Please save your work.', {
            autoClose: 10000,
          });
        },
        // onTokenExpired callback
        () => {
          toast.error('Your session has expired. Please login again.');
          // Clear everything
          setToken(null);
          setUser(null);
          setUserType(null);
          tokenRefresh.stop();
          secureStorage.clearAuth();
        }
      );
    }
    setLoading(false);

    // Cleanup on unmount
    return () => {
      tokenRefresh.stop();
    };
  }, []);

  const loginCustomer = async (username, accountNumber, password) => {
    try {
      const response = await customerAuth.login({ username, accountNumber, password });
      const { token, username: userName, fullName } = response.data;

      // Sanitize user data
      const userData = sanitizer.sanitizeUserData({ username: userName, fullName });

      // Save to state
      setToken(token);
      setUser(userData);
      setUserType('customer');

      // Save to secure storage with encryption and expiration
      secureStorage.setToken(token, 2 * 60 * 60 * 1000); // 2 hours
      secureStorage.setUser(userData);
      secureStorage.setUserType('customer');

      // Start token refresh monitoring after login
      tokenRefresh.start(
        () => {
          toast.warning('Your session will expire in 5 minutes. Please save your work.', {
            autoClose: 10000,
          });
        },
        () => {
          toast.error('Your session has expired. Please login again.');
          setToken(null);
          setUser(null);
          setUserType(null);
          tokenRefresh.stop();
          secureStorage.clearAuth();
          window.location.href = '/customer/login';
        }
      );

      toast.success(`Welcome back, ${sanitizer.escapeHTML(fullName)}!`);
      return { success: true };
    } catch (error) {
      const message = error.userMessage || error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const registerCustomer = async (formData) => {
    try {
      const response = await customerAuth.register(formData);
      toast.success(response.data.message || 'Registration successful! Please login.');
      return { success: true };
    } catch (error) {
      const message = error.userMessage || error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const loginEmployee = async (username, password) => {
    try {
      const response = await employeeAuth.login({ username, password });
      const { token, username: userName, fullName, role } = response.data;

      // Sanitize user data
      const userData = sanitizer.sanitizeUserData({ username: userName, fullName, role });

      // Save to state
      setToken(token);
      setUser(userData);
      setUserType('employee');

      // Save to secure storage with encryption and expiration
      secureStorage.setToken(token, 2 * 60 * 60 * 1000); // 2 hours
      secureStorage.setUser(userData);
      secureStorage.setUserType('employee');

      // Start token refresh monitoring after login
      tokenRefresh.start(
        () => {
          toast.warning('Your session will expire in 5 minutes. Please save your work.', {
            autoClose: 10000,
          });
        },
        () => {
          toast.error('Your session has expired. Please login again.');
          setToken(null);
          setUser(null);
          setUserType(null);
          tokenRefresh.stop();
          secureStorage.clearAuth();
          window.location.href = '/employee/login';
        }
      );

      toast.success(`Welcome, ${sanitizer.escapeHTML(fullName)}!`);
      return { success: true };
    } catch (error) {
      const message = error.userMessage || error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserType(null);

    // Stop token refresh
    tokenRefresh.stop();

    // Clear secure storage
    secureStorage.clearAuth();

    toast.info('Logged out successfully');
  };

  const value = {
    user,
    token,
    userType,
    loading,
    loginCustomer,
    registerCustomer,
    loginEmployee,
    logout,
    isAuthenticated: !!token,
    isCustomer: userType === 'customer',
    isEmployee: userType === 'employee',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
