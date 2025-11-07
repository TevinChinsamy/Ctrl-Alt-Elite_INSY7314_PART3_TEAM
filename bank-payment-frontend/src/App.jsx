import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CustomerLogin from './pages/CustomerLogin';
// CustomerRegister removed - customers are created by bank staff only
import CustomerDashboard from './pages/CustomerDashboard';
import CreatePayment from './pages/CreatePayment';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeDashboard from './pages/EmployeeDashboard';

// Protected Route Component
function ProtectedRoute({ children, requireCustomer, requireEmployee }) {
  const { isAuthenticated, loading, isCustomer, isEmployee } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) {
    // Redirect to appropriate login based on route
    return requireEmployee ? <Navigate to="/employee/login" /> : <Navigate to="/customer/login" />;
  }

  // Check role-based access
  if (requireCustomer && !isCustomer) {
    return <Navigate to="/employee/dashboard" />;
  }
  if (requireEmployee && !isEmployee) {
    return <Navigate to="/customer/dashboard" />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Default Route */}
      <Route path="/" element={<Navigate to="/customer/login" />} />

      {/* Customer Routes */}
      <Route path="/customer/login" element={<CustomerLogin />} />
      {/* Registration route removed - customers are created by bank staff only */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute requireCustomer>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/create-payment"
        element={
          <ProtectedRoute requireCustomer>
            <CreatePayment />
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route path="/employee/login" element={<EmployeeLogin />} />
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute requireEmployee>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
