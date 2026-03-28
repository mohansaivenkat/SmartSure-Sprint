import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Policies from './pages/Policies';
import MyPolicies from './pages/MyPolicies';
import MyClaims from './pages/MyClaims';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPolicies from './pages/admin/AdminPolicies';
import AdminClaims from './pages/admin/AdminClaims';
import AdminReports from './pages/admin/AdminReports';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} /> : <Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />

        {/* Private Routes (Common) */}
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}><Profile /></ProtectedRoute>} />

        {/* Customer Routes */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Dashboard /></ProtectedRoute>} />
        <Route path="/policies" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Policies /></ProtectedRoute>} />
        <Route path="/my-policies" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyPolicies /></ProtectedRoute>} />
        <Route path="/my-claims" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><MyClaims /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/policies" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPolicies /></ProtectedRoute>} />
        <Route path="/admin/claims" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminClaims /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/subscriptions" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminSubscriptions /></ProtectedRoute>} />

        {/* Default */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {user && <div className="mob-only tab-spacer" style={{ height: '68px' }} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
