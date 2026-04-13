import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './shared/hooks/reduxHooks';
import { selectCurrentUser } from './features/auth/store/authSlice';
import ProtectedRoute from './core/guards/ProtectedRoute';
import { LoadingSpinner } from './shared/components/UI';
import MainLayout from './layouts/MainLayout';

// Lazy Loaded Features
const Home = lazy(() => import('./features/home/Home'));
const Login = lazy(() => import('./features/auth/Login'));
const Register = lazy(() => import('./features/auth/Register'));
const ForgotPassword = lazy(() => import('./features/auth/ForgotPassword'));
const Policies = lazy(() => import('./features/policies/Policies'));
const Terms = lazy(() => import('./features/home/Terms'));
const PolicyDetails = lazy(() => import('./features/policies/PolicyDetails'));
const About = lazy(() => import('./features/home/About'));
const Contact = lazy(() => import('./features/home/Contact'));

const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const MyPolicies = lazy(() => import('./features/my-policies/MyPolicies'));
const Claims = lazy(() => import('./features/claims/MyClaims'));
const Profile = lazy(() => import('./features/profile/Profile'));

const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));
const AdminPolicies = lazy(() => import('./features/admin/AdminPolicies'));
const AdminSubscriptions = lazy(() => import('./features/admin/AdminSubscriptions'));
const AdminClaims = lazy(() => import('./features/admin/AdminClaims'));
const AdminReports = lazy(() => import('./features/admin/AdminReports'));

export default function AppRoutes() {
  const user = useAppSelector(selectCurrentUser);

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
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
    </Suspense>
  );
}
