import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './shared/hooks/reduxHooks';
import { selectCurrentUser } from './features/auth/store/authSlice';
import GlobalErrorBoundary from './core/error-handling/GlobalErrorBoundary';
import ProtectedRoute from './core/guards/ProtectedRoute';

// Basic Layout
import MainLayout from './layouts/MainLayout';

import Home from './features/home/Home';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import Policies from './features/policies/Policies';
import Terms from './features/home/Terms';
import PolicyDetails from './features/policies/PolicyDetails';

import Dashboard from './features/dashboard/Dashboard';
import MyPolicies from './features/my-policies/MyPolicies';
import Claims from './features/claims/MyClaims';

import AdminDashboard from './features/admin/AdminDashboard';
import AdminPolicies from './features/admin/AdminPolicies';
import AdminSubscriptions from './features/admin/AdminSubscriptions';
import AdminClaims from './features/admin/AdminClaims';
import AdminReports from './features/admin/AdminReports';
import Profile from './features/profile/Profile';
import About from './features/home/About';
import Contact from './features/home/Contact';

export default function App() {
  const user = useAppSelector(selectCurrentUser);

  return (
    <GlobalErrorBoundary>
      <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--color-bg)' }}>
        <Routes>
            {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} /> : <Home />} />
            <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} /> : <Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/policies/:id" element={<PolicyDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Private Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-policies" element={<MyPolicies />} />
              <Route path="/claims" element={<Claims />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/policies" element={<AdminPolicies />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/admin/claims" element={<AdminClaims />} />
              <Route path="/admin/reports" element={<AdminReports />} />
            </Route>
            
            {/* Default */}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </div>
    </GlobalErrorBoundary>
  );
}
