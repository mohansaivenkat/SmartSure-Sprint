import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HiShieldCheck, HiSun, HiMoon, HiMenu, HiX, HiLogout, HiUser, HiHome, HiDocumentText, HiClipboardList, HiChartBar } from 'react-icons/hi';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const customerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: HiHome },
    { to: '/policies', label: 'Policies', icon: HiDocumentText },
    { to: '/my-policies', label: 'My Policies', icon: HiClipboardList },
    { to: '/my-claims', label: 'My Claims', icon: HiClipboardList },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: HiChartBar },
    { to: '/admin/policies', label: 'Manage Policies', icon: HiDocumentText },
    { to: '/admin/claims', label: 'Review Claims', icon: HiClipboardList },
    { to: '/admin/reports', label: 'Reports', icon: HiChartBar },
  ];

  const links = isAdmin() ? adminLinks : customerLinks;

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 glass shadow-sm" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAdmin() ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
              <HiShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold hidden sm:block" style={{ color: 'var(--color-text)' }}>
              Smart<span style={{ color: 'var(--color-primary)' }}>Sure</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: isActive(link.to) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive(link.to) ? 'var(--color-primary)15' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.to)) e.target.style.backgroundColor = 'var(--color-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.to)) e.target.style.backgroundColor = 'transparent';
                }}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
              style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-hover)' }}
              id="theme-toggle"
              aria-label="Toggle theme"
            >
              {darkMode ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                  <HiUser className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{user.name || user.email}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{ color: 'var(--color-danger)' }}
                id="logout-button"
                aria-label="Logout"
              >
                <HiLogout className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden animate-fade-in" style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: isActive(link.to) ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive(link.to) ? 'var(--color-primary)15' : 'transparent',
                }}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium"
              style={{ color: 'var(--color-danger)' }}
            >
              <HiLogout className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
