import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  HiShieldCheck, HiSun, HiMoon, HiMenu, HiX, HiLogout,
  HiUser, HiHome, HiDocumentText, HiClipboardList, HiChartBar, HiPhone
} from 'react-icons/hi';
import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const STYLES = `
  .nav-root * { box-sizing: border-box; }
  .nav-root { font-family: var(--font-family); }

  /* ── Top bar ── */
  .nav-bar {
    position: sticky; top: 0; z-index: 50;
    height: 60px;
    display: flex; align-items: center;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .nav-inner {
    width: 100%; max-width: 1280px; margin: 0 auto;
    padding: 0 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }

  /* Logo */
  .nav-logo {
    display: flex; align-items: center; gap: 9px;
    text-decoration: none; flex-shrink: 0;
  }
  .nav-logo-icon {
    width: 36px; height: 36px; border-radius: 11px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    transition: transform .2s;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary), transparent 65%);
  }
  .nav-logo:hover .nav-logo-icon { transform: scale(1.08) rotate(-4deg); }
  .nav-logo-text {
    font-family: var(--font-family); font-weight: 800;
    font-size: 20px; color: var(--color-text);
    letter-spacing: -.01em;
  }
  .nav-logo-text span { color: var(--color-primary); }

  /* Desktop nav links */
  .nav-links {
    display: flex; align-items: center; gap: 2px;
    flex: 1; justify-content: center;
  }
  .nav-link {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 13px; border-radius: 11px;
    font-size: 13px; font-weight: 600;
    text-decoration: none;
    transition: all .15s;
    white-space: nowrap;
    color: var(--color-text-secondary);
    font-family: var(--font-family);
  }
  .nav-link:hover { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary), transparent 92%); }
  .nav-link.active {
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary), transparent 85%);
  }

  /* Right cluster */
  .nav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  /* Icon button */
  .nav-icon-btn {
    width: 38px; height: 38px; border-radius: 11px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .15s;
    flex-shrink: 0;
  }
  .nav-icon-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

  /* User chip */
  .nav-user {
    display: flex; align-items: center; gap: 9px;
    padding: 5px 12px 5px 6px;
    border-radius: 99px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    cursor: default;
  }
  .nav-user-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  /* Logout button */
  .nav-logout {
    width: 36px; height: 36px; border-radius: 10px;
    border: 1.5px solid transparent;
    background: transparent; cursor: pointer;
    color: var(--color-danger, #ef4444);
    display: flex; align-items: center; justify-content: center;
    transition: all .15s;
  }
  .nav-logout:hover { background: color-mix(in srgb, #ef4444, transparent 88%); border-color: color-mix(in srgb, #ef4444, transparent 80%); }

  /* ── Mobile overlay drawer ── */
  .mob-overlay {
    position: fixed; inset: 0; z-index: 60;
    background: rgba(0,0,0,.45);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: fadeIn .18s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .mob-drawer {
    position: fixed; top: 0; right: 0; bottom: 0;
    width: min(300px, 85vw); z-index: 61;
    background: var(--color-surface);
    border-left: 1.5px solid var(--color-border);
    display: flex; flex-direction: column;
    animation: slideIn .22s cubic-bezier(.4,0,.2,1);
    overflow-y: auto;
  }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

  .mob-drawer-head {
    padding: 18px 20px;
    border-bottom: 1px solid var(--color-border);
    display: flex; align-items: center; justify-content: space-between;
  }

  .mob-drawer-links {
    padding: 14px 14px;
    display: flex; flex-direction: column; gap: 4px;
    flex: 1;
  }

  .mob-link {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-radius: 13px;
    text-decoration: none; font-size: 14px; font-weight: 600;
    color: var(--color-text-secondary);
    transition: all .14s;
    font-family: var(--font-family);
  }
  .mob-link:hover { background: color-mix(in srgb, var(--color-primary), transparent 92%); color: var(--color-primary); }
  .mob-link.active { background: color-mix(in srgb, var(--color-primary), transparent 85%); color: var(--color-primary); }
  .mob-link-icon {
    width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--color-border);
    transition: background .14s;
  }
  .mob-link.active .mob-link-icon { background: color-mix(in srgb, var(--color-primary), transparent 80%); }

  .mob-drawer-foot {
    padding: 16px 14px;
    border-top: 1px solid var(--color-border);
    display: flex; flex-direction: column; gap: 10px;
  }

  /* ── Bottom tab bar ── */
  .tab-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    height: 68px;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    display: flex; align-items: center;
    padding: 0 8px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .tab-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; padding: 6px 4px;
    border-radius: 12px; border: none; background: none; cursor: pointer;
    text-decoration: none; color: var(--color-text-secondary);
    transition: all .14s;
    min-height: 52px;
    font-family: var(--font-family);
  }
  .tab-item.active { color: var(--color-primary); }

  .tab-icon-wrap {
    width: 32px; height: 32px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    transition: background .14s, transform .14s;
  }
  .tab-item.active .tab-icon-wrap {
    background: color-mix(in srgb, var(--color-primary), transparent 85%);
    transform: translateY(-1px);
  }

  .tab-label { font-size: 10px; font-weight: 700; letter-spacing: .02em; line-height: 1; }

  /* Bottom spacer */
  .tab-spacer { height: 68px; }

  /* ── Responsive show/hide ── */
  @media (min-width: 769px) {
    .mob-only { display: none !important; }
  }
  @media (max-width: 768px) {
    .desk-only { display: none !important; }
    .nav-links  { display: none !important; }
    .nav-inner  { padding: 0 16px; }
    .nav-logo-text { font-size: 18px; }
  }
  @media (max-width: 380px) {
    .nav-logo-icon { width: 32px; height: 32px; }
    .nav-logo-text { font-size: 16px; }
  }
`;

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Trap focus & close on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawerOpen]);

  // Links for LOGGED OUT users
  const publicLinks = [
    { to: '/',        label: 'Home',    icon: HiHome },
    { to: '/about',   label: 'About',   icon: HiShieldCheck },
    { to: '/contact', label: 'Contact', icon: HiPhone },
    { to: '/terms',   label: 'Terms',   icon: HiDocumentText },
  ];

  // Links for CUSTOMERS
  const customerLinks = [
    { to: '/dashboard',   label: 'Dashboard',   icon: HiHome },
    { to: '/policies',    label: 'Policies',     icon: HiDocumentText },
    { to: '/my-policies', label: 'Purchased',  icon: HiClipboardList },
    { to: '/my-claims',   label: 'Claims',    icon: HiClipboardList },
    { to: '/profile',     label: 'Profile',   icon: HiUser },
  ];

  // Links for ADMINS
  const adminLinks = [
    { to: '/admin/dashboard',     label: 'Dashboard',    icon: HiChartBar },
    { to: '/admin/policies',      label: 'Policies',     icon: HiDocumentText },
    { to: '/admin/subscriptions', label: 'Subscriptions',icon: HiClipboardList },
    { to: '/admin/claims',        label: 'Claims',        icon: HiClipboardList },
    { to: '/admin/reports',       label: 'Reports',       icon: HiChartBar },
  ];

  // Determine which links to show
  let links = [];
  if (!user) {
    links = publicLinks;
  } else if (isAdmin()) {
    links = adminLinks;
  } else {
    links = customerLinks;
  }

  // Determine logo path
  const logoPath = user ? (isAdmin() ? '/admin/dashboard' : '/dashboard') : '/';

  return (
    <>
      <style>{STYLES}</style>

      {/* ── Top Nav Bar ── */}
      <nav className="nav-root nav-bar">
        <div className="nav-inner">

          {/* Logo */}
          <Link className="nav-logo" to={logoPath}>
            <div className="nav-logo-icon">
              <HiShieldCheck style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <span className="nav-logo-text">
              Smart<span>Sure</span>
            </span>
          </Link>

          {/* Desktop centre links */}
          <div className="nav-links">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link${isActive(link.to) ? ' active' : ''}`}
              >
                <link.icon style={{ width: 15, height: 15, flexShrink: 0 }} />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="nav-right">
            {/* Theme toggle */}
            <button className="nav-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {darkMode ? <HiSun style={{ width: 17, height: 17 }} /> : <HiMoon style={{ width: 17, height: 17 }} />}
            </button>

            {user ? (
              /* Logged In: user chip + logout */
              <div className="desk-only" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="nav-user">
                  <div className="nav-user-avatar">
                    <HiUser style={{ width: 14, height: 14, color: '#fff' }} />
                  </div>
                  <div style={{ lineHeight: 1.3 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', margin: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || user.email}
                    </p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0, opacity: .65, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {user.role}
                    </p>
                  </div>
                </div>
                <button className="nav-logout" onClick={handleLogout} title="Logout" aria-label="Logout">
                  <HiLogout style={{ width: 17, height: 17 }} />
                </button>
              </div>
            ) : (
              /* Logged Out: Login/Register buttons */
              <div className="desk-only" style={{ display: 'flex', gap: 8 }}>
                <Link to="/login" className="nav-link" style={{ border: '1.5px solid var(--color-border)', padding: '6px 16px' }}>
                  Login
                </Link>
                <Link to="/register" className="nav-link" style={{ background: 'var(--color-primary)', color: 'white', padding: '6px 16px' }}>
                  Register
                </Link>
              </div>
            )}

            {/* Mobile: hamburger (now always shows if desk links are hidden) */}
            <button className="mob-only nav-icon-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <HiMenu style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {drawerOpen && (
        <div className="mob-only">
          <div className="mob-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="mob-drawer" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="mob-drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {user ? (
                  <>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HiUser style={{ width: 17, height: 17, color: '#fff' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', margin: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</p>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', opacity: .55, margin: '2px 0 0' }}>{user.role}</p>
                    </div>
                  </>
                ) : (
                  <span className="nav-logo-text">Smart<span>Sure</span></span>
                )}
              </div>
              <button onClick={() => setDrawerOpen(false)} className="nav-icon-btn" aria-label="Close menu"><HiX style={{ width: 16, height: 16 }} /></button>
            </div>

            <div className="mob-drawer-links">
              {links.map(link => (
                <Link key={link.to} to={link.to} className={`mob-link${isActive(link.to) ? ' active' : ''}`} onClick={() => setDrawerOpen(false)}>
                  <div className="mob-link-icon"><link.icon style={{ width: 17, height: 17 }} /></div>
                  {link.label}
                </Link>
              ))}
              {!user && (
                <>
                  <Link to="/login" className="mob-link" onClick={() => setDrawerOpen(false)}>
                    <div className="mob-link-icon"><HiLogout style={{ width: 17, height: 17 }} /></div>
                    Login
                  </Link>
                  <Link to="/register" className="mob-link" onClick={() => setDrawerOpen(false)}>
                    <div className="mob-link-icon"><HiShieldCheck style={{ width: 17, height: 17 }} /></div>
                    Register
                  </Link>
                </>
              )}
            </div>

            <div className="mob-drawer-foot">
              <button onClick={toggleTheme} className="mob-link" style={{ width: '100%', border: '1.5px solid var(--color-border)', background: 'var(--color-surface)' }}>
                {darkMode ? <HiSun style={{ width: 18, height: 18 }} /> : <HiMoon style={{ width: 18, height: 18 }} />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              {user && (
                <button onClick={handleLogout} className="mob-link" style={{ width: '100%', border: '1.5px solid color-mix(in srgb, var(--color-danger), transparent 75%)', background: 'color-mix(in srgb, var(--color-danger), transparent 95%)', color: 'var(--color-danger)' }}>
                  <HiLogout style={{ width: 18, height: 18 }} /> Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Tab Bar (mobile only, only for users) ── */}
      {user && (
        <div className="mob-only tab-bar">
          {links.slice(0, 5).map(link => (
            <Link key={link.to} to={link.to} className={`tab-item${isActive(link.to) ? ' active' : ''}`}>
              <div className="tab-icon-wrap"><link.icon style={{ width: 20, height: 20 }} /></div>
              <span className="tab-label">{link.label.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}