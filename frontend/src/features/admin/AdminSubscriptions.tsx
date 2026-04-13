import { useState, useEffect } from 'react';
import { adminAPI } from '../../core/services/api';
import {
  HiDocumentText, HiCheckCircle, HiRefresh,
  HiSearch, HiUser, HiChevronRight, HiMail, HiPhone, HiExclamation,
  HiShieldCheck
} from 'react-icons/hi';
import { Badge } from '../../shared/components/UI';
import LoadingSpinner from '../../shared/components/UI';
import toast from 'react-hot-toast';
import { useDebounce } from '../../shared/hooks/useDebounce';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  hasPendingPolicy?: boolean;
  hasActivePolicy?: boolean;
  policyCount?: number;
}

interface UserPolicy {
  id: number;
  userId: number;
  policyName: string;
  status: string;
  nextDueDate: string;
  outstandingBalance: number;
}

/* ─────────────────────────────────────────────────────────────
   Inline styles injected once — no external CSS file needed
───────────────────────────────────────────────────────────── */
const STYLES = `
  .sub-root { font-family: var(--font-family); }

  .sub-root .serif { font-family: var(--font-family); font-weight: 800; }
  .sub-root .mono  { font-family: 'JetBrains Mono', monospace; }

  /* Sidebar card */
  .user-card {
    position: relative;
    padding: 16px 18px;
    border-radius: 14px;
    cursor: pointer;
    transition: all .2s cubic-bezier(.4,0,.2,1);
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .user-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--color-primary)0A, transparent 60%);
    opacity: 0;
    transition: opacity .2s;
  }
  .user-card:hover { border-color: var(--color-primary); transform: translateX(3px); }
  .user-card:hover::before { opacity: 1; }
  .user-card.active {
    border-color: var(--color-primary);
    background: linear-gradient(135deg, var(--color-primary)12, var(--color-surface));
    box-shadow: 0 4px 24px var(--color-primary)22, inset 0 0 0 1px var(--color-primary)30;
    transform: translateX(3px);
  }
  .user-card.active::before { opacity: 1; }

  /* Pulse dot */
  .pulse-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: #fbbf24;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6);
    animation: pulse-ring 1.4s ease-out infinite;
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6); }
    70%  { box-shadow: 0 0 0 10px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  /* Search input */
  .sub-search {
    width: 100%;
    padding: 10px 14px 10px 38px;
    border-radius: 12px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 13px;
    font-family: var(--font-family);
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }
  .sub-search:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary)18;
  }

  /* Stat chip */
  .stat-chip {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 18px 24px;
    border-radius: 18px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    gap: 4px;
    transition: transform .15s;
  }
  .stat-chip:hover { transform: translateY(-2px); }

  /* Table */
  .sub-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
  .sub-table thead th {
    padding: 12px 16px;
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-weight: 600;
    font-size: 11px;
    letter-spacing: .08em;
    text-transform: uppercase;
    border-bottom: 1.5px solid var(--color-border);
  }
  .sub-table thead th:first-child { border-radius: 12px 0 0 0; }
  .sub-table thead th:last-child { border-radius: 0 12px 0 0; }
  .sub-table tbody tr { transition: background .12s; }
  .sub-table tbody tr:hover td { background: var(--color-primary)06; }
  .sub-table tbody td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    color: var(--color-text);
    background: var(--color-surface);
  }
  .sub-table tbody tr:last-child td { border-bottom: none; }
  .sub-table tbody tr.pending-row td { background: #fef3c708; }

  @media (max-width: 768px) {
    .sub-table thead { display: none; }
    .sub-table tbody, .sub-table tr, .sub-table td { display: block; width: 100%; }
    .sub-table tr { 
      padding: 16px; 
      border-bottom: 2px solid var(--color-border); 
      background: var(--color-surface);
      margin-bottom: 12px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    .sub-table td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--color-border)40;
    }
    .sub-table td:last-child { border-bottom: none; }
    .sub-table td::before {
      content: attr(data-label);
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--color-text-secondary);
      opacity: .6;
      flex-shrink: 0;
      margin-right: 12px;
    }
    .sub-table td > span {
      text-align: right;
      max-width: fit-content;
      display: inline-flex !important;
    }
  }

  .sub-layout {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 24px;
    align-items: start;
    max-width: 100%;
  }
  @media (max-width: 1280px) {
    .sub-layout { grid-template-columns: 300px 1fr; gap: 16px; }
  }
  @media (max-width: 1100px) {
    .sub-layout { grid-template-columns: 1fr; }
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }
  @media (max-width: 640px) {
    .stat-grid { grid-template-columns: 1fr; gap: 12px; }
  }

  /* Action button */
  .cancel-btn {
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    transition: all .15s;
  }
  .cancel-btn.active {
    background: #ef4444;
    color: #fff;
    box-shadow: 0 4px 14px #ef444440;
  }
  .cancel-btn.active:hover { background: #dc2626; transform: scale(1.04); }
  .cancel-btn.active:active { transform: scale(.97); }
  .cancel-btn.blocked {
    background: var(--color-border);
    color: var(--color-text-secondary);
    cursor: not-allowed;
    opacity: .6;
  }

  /* Avatar ring */
  .avatar-ring {
    width: 64px; height: 64px;
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    box-shadow: 0 8px 24px var(--color-primary)40;
    flex-shrink: 0;
  }

  /* Section divider label */
  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    opacity: .7;
    margin-bottom: 6px;
  }

  /* Scrollbar */
  .slim-scroll::-webkit-scrollbar { width: 4px; }
  .slim-scroll::-webkit-scrollbar-track { background: transparent; }
  .slim-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

  /* Fade-in */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .3s ease forwards; }

  /* Tooltip */
  .debt-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    white-space: normal;
    width: 140px;
    background: #dc2626;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 8px 10px;
    border-radius: 8px;
    box-shadow: 0 4px 14px #dc262640;
    opacity: 0;
    pointer-events: none;
    transition: opacity .15s;
    text-align: center;
    z-index: 10;
  }
  .debt-wrap:hover .debt-tooltip { opacity: 1; }
  .debt-tooltip::after {
    content: '';
    position: absolute;
    top: 100%; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #dc2626;
  }

  /* Root adjustments */
  .sub-root {
    box-sizing: border-box;
    overflow-x: hidden;
  }
  * { box-sizing: border-box; }
`;

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function AdminSubscriptions() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUserPolicies, setSelectedUserPolicies] = useState<UserPolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // Global subscriptions (Master Ledger)
  const [globalPolicies, setGlobalPolicies] = useState<UserPolicy[]>([]);
  const [globalPoliciesPage, setGlobalPoliciesPage] = useState(1);
  const [totalGlobalPoliciesPages, setTotalGlobalPoliciesPages] = useState(1);
  const [totalGlobalPolicies, setTotalGlobalPolicies] = useState(0);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const fetchData = async (page = 1) => {
    setLoading(true); setError(null);
    try {
      const res = await adminAPI.getFilteredUsers(page - 1, 5, debouncedSearch, statusFilter, 'ALL');
      setUsers(Array.isArray(res.data.content) ? res.data.content : []);
      setTotalPages(res.data.totalPages || 1);
      setTotalUsers(res.data.totalElements || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to sync users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPolicies = async (userId: number) => {
    setLoadingPolicies(true);
    try {
      const res = await adminAPI.getUserPolicies(userId);
      setSelectedUserPolicies(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      toast.error('Failed to load user policies.');
      setSelectedUserPolicies([]);
    } finally { setLoadingPolicies(false); }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, debouncedSearch, statusFilter]);

  const fetchGlobalPolicies = async (page = 1) => {
    setLoadingGlobal(true);
    try {
      const res = await adminAPI.getAllUserPoliciesPaginated(page - 1, 10);
      setGlobalPolicies(res.data.content || []);
      setTotalGlobalPoliciesPages(res.data.totalPages || 1);
      setTotalGlobalPolicies(res.data.totalElements || 0);
      setGlobalPoliciesPage(page);
    } catch (err) {
      console.error("Failed to fetch global policies", err);
    } finally {
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    if (!selectedUserId) {
      fetchGlobalPolicies(globalPoliciesPage);
    }
  }, [selectedUserId, globalPoliciesPage]);

  const handleUserSelect = (userId: number) => {
    setSelectedUserId(userId);
    fetchUserPolicies(userId);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  const totalOutstanding = selectedUserPolicies.reduce((s, p) => s + (p.outstandingBalance || 0), 0);
  const pendingCount = selectedUserPolicies.filter(p => p.status === 'PENDING_CANCELLATION').length;

  const handleApprove = async (policyId: number) => {
    setApprovingId(policyId);
    try {
      await adminAPI.approveCancellation(policyId);
      toast.success('Policy cancelled successfully');

      // Optimistically update the UI to avoid waiting for a backend response delay
      setSelectedUserPolicies(prev => prev.map(p => p.id === policyId ? { ...p, status: 'CANCELLED' } : p));

      // Optimistically update the sidebar to remove pending badge
      setUsers(prev => prev.map(u => {
        if (u.id === selectedUserId) {
          const userPendingCount = selectedUserPolicies.filter(p => p.status === 'PENDING_CANCELLATION').length;
          // If this was the last pending one, clear the flag
          return { ...u, hasPendingPolicy: userPendingCount > 1 };
        }
        return u;
      }));

      if (selectedUserId) fetchUserPolicies(selectedUserId);
      fetchData(currentPage);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading && !users.length) return <LoadingSpinner />;

  return (
    <>
      <style>{STYLES}</style>
      <div className="sub-root" style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 className="serif" style={{ fontSize: 38, letterSpacing: '-.03em', color: 'var(--color-primary)', marginBottom: 2 }}>
            Portfolio
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 32, fontWeight: 500 }}>
            Managing <span style={{ color: 'var(--color-text)', fontWeight: 800 }}>{totalUsers}</span> active users across your network
          </p>

          {error && (
            <div className="fade-up" style={{ padding: '16px 20px', borderRadius: 12, backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontSize: 13, marginBottom: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <HiExclamation className="w-5 h-5" /> {error}
              <button onClick={() => fetchData(currentPage)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
            </div>
          )}
        </div>

        {/* ── Top Stats Row ── */}
        <div className="stat-grid">
          {[
            { label: 'Total Customers', value: totalUsers, color: 'var(--color-text)' },
          ].map(s => (
            <div key={s.label} className="stat-chip">
              <span className="mono" style={{ fontSize: 28, fontWeight: 600, color: s.color }}>
                {s.value}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', opacity: .7 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Main Layout ── */}
        <div className="sub-layout">

          {/* ── LEFT: Customer Sidebar ── */}
          <div style={{
            borderRadius: 20,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'min(80vh, 1000px)',
          }}>
            {/* Sidebar Header */}
            <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
              <p className="section-label" style={{ marginBottom: 10 }}>Customers</p>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 16, padding: '0 2px' }}>
                {['ALL', 'PENDING', 'ACTIVE'].map(status => {
                  let badgeValue = status === 'PENDING' ? 'PENDING_CANCELLATION' : status;
                  return (
                    <button
                      key={status}
                      onClick={() => { setStatusFilter(badgeValue); setCurrentPage(1); }}
                      style={{
                        flex: 1, padding: '6px 2px', borderRadius: 8, fontSize: '9px', fontWeight: 700,
                        letterSpacing: '.02em', border: '1.5px solid var(--color-border)',
                        background: statusFilter === badgeValue ? 'var(--color-primary)12' : 'var(--color-surface)',
                        color: statusFilter === badgeValue ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        borderColor: statusFilter === badgeValue ? 'var(--color-primary)' : 'var(--color-border)',
                        cursor: 'pointer', transition: 'all .15s', textTransform: 'uppercase'
                      }}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <HiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', opacity: .5, width: 14, height: 14 }} />
                <input
                  className="sub-search"
                  placeholder="Search by customer name..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* List */}
            <div className="slim-scroll" style={{ overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {users.map((u, i) => (
                <div
                  key={u.id}
                  className={`user-card${selectedUserId === u.id ? ' active' : ''}`}
                  onClick={() => handleUserSelect(u.id)}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-secondary)' }}>
                        #{u.id} {u.email && `• ${u.email}`}
                      </p>
                      {(u as any).policyCount > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', paddingBottom: 2 }}>
                          {(u as any).hasPendingPolicy ? (
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '.08em',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                              <div className="pulse-dot" /> PENDING
                            </span>
                          ) : (u as any).hasActivePolicy ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-primary)15', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} /> Active
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                      <HiChevronRight style={{
                        width: 14, height: 14,
                        color: 'var(--color-primary)',
                        opacity: selectedUserId === u.id ? 1 : 0,
                        transform: selectedUserId === u.id ? 'translateX(0)' : 'translateX(-4px)',
                        transition: 'all .15s',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: 'var(--color-text-secondary)', opacity: .5, fontStyle: 'italic' }}>
                  No customers found
                </p>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ padding: '12px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-bg)' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ background: 'none', border: 'none', color: currentPage === 1 ? '#ccc' : 'var(--color-primary)', fontWeight: 700, fontSize: 10, cursor: currentPage === 1 ? 'default' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  Prev
                </button>
                <span className="mono" style={{ fontSize: 10, color: 'var(--color-text-secondary)', opacity: .6 }}>{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ background: 'none', border: 'none', color: currentPage === totalPages ? '#ccc' : 'var(--color-primary)', fontWeight: 700, fontSize: 10, cursor: currentPage === totalPages ? 'default' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: Detail Panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!selectedUser ? (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* ── Dashboard Header ── */}
                <div style={{
                  padding: '24px 28px',
                  borderRadius: 20,
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="avatar-ring" style={{ width: 48, height: 48, borderRadius: 14 }}>
                      <HiShieldCheck style={{ width: 24, height: 24, color: '#fff' }} />
                    </div>
                    <div>
                      <h2 className="serif" style={{ fontSize: 24, color: 'var(--color-text)', margin: '0 0 4px' }}>Global Subscriptions</h2>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>Viewing all active policy lifecycles system-wide</p>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchGlobalPolicies(globalPoliciesPage)}
                    disabled={loadingGlobal}
                    className="ref-btn"
                  >
                    <HiRefresh className={loadingGlobal ? 'spin' : ''} style={{ width: 14, height: 14 }} />
                    Sync Ledger
                  </button>
                </div>

                {/* ── Global Subscriptions Table ── */}
                <div className="rep-panel">
                  <div className="rep-panel-header">
                    <HiDocumentText style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>Master Subscriptions Ledger</span>
                    <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-secondary)', opacity: .5 }}>{totalGlobalPolicies} Records</span>
                  </div>

                  <div style={{ overflowX: 'auto', minHeight: 300 }}>
                    <table className="sub-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Sub ID</th>
                          <th style={{ textAlign: 'left' }}>User ID</th>
                          <th style={{ textAlign: 'left' }}>Policy Name</th>
                          <th style={{ textAlign: 'left' }}>Status</th>
                          <th style={{ textAlign: 'right', paddingRight: 24 }}>Outstanding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingGlobal ? (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px 0' }}><HiRefresh className="spin inline text-indigo-500 w-5 h-5" /> Syncing...</td></tr>
                        ) : globalPolicies.map(p => (
                          <tr key={p.id}>
                            <td><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>#{p.id}</span></td>
                            <td><span className="mono" style={{ fontSize: 11, opacity: .7 }}>USR-{p.userId}</span></td>
                            <td><span style={{ fontWeight: 700, fontSize: 13 }}>{p.policyName}</span></td>
                            <td><Badge status={p.status} /></td>
                            <td style={{ textAlign: 'right', paddingRight: 24 }}>
                              <span className="mono" style={{ fontWeight: 700, color: p.outstandingBalance > 0 ? '#ef4444' : '#22c55e' }}>
                                ₹{p.outstandingBalance?.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {!loadingGlobal && globalPolicies.length === 0 && (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px 0', opacity: .4 }}>No active subscriptions found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Global Subscriptions Pagination */}
                  {totalGlobalPoliciesPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 15, padding: '16px 22px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                      <button 
                        onClick={() => setGlobalPoliciesPage(p => Math.max(1, p - 1))}
                        disabled={globalPoliciesPage === 1}
                        style={{ background: 'none', border: 'none', color: globalPoliciesPage === 1 ? '#ccc' : 'var(--color-primary)', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                      >
                        ← Prev
                      </button>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 700 }}>{globalPoliciesPage} / {totalGlobalPoliciesPages}</span>
                      <button 
                        onClick={() => setGlobalPoliciesPage(p => Math.min(totalGlobalPoliciesPages, p + 1))}
                        disabled={globalPoliciesPage === totalGlobalPoliciesPages}
                        style={{ background: 'none', border: 'none', color: globalPoliciesPage === totalGlobalPoliciesPages ? '#ccc' : 'var(--color-primary)', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="fade-up">

                {/* ── Profile Card ── */}
                <div style={{
                  padding: '24px 28px',
                  borderRadius: 20,
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 20,
                  marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div className="avatar-ring">
                      <HiUser style={{ width: 30, height: 30, color: '#fff' }} />
                    </div>
                    <div>
                      <h2 className="serif" style={{ fontSize: 26, color: 'var(--color-text)', margin: '0 0 6px' }}>{selectedUser.name}</h2>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <HiMail style={{ width: 13, height: 13 }} /> {selectedUser.email}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <HiPhone style={{ width: 13, height: 13 }} /> {selectedUser.phone || 'No phone registered'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { label: 'Outstanding', value: `₹${totalOutstanding.toLocaleString()}`, red: totalOutstanding > 0 },
                      { label: 'Pending Requests', value: pendingCount, amber: pendingCount > 0 },
                    ].map(ms => (
                      <div key={ms.label} style={{
                        textAlign: 'right', padding: '10px 18px', borderRadius: 14,
                        border: '1.5px solid var(--color-border)', background: 'var(--color-surface)',
                      }}>
                        <p className="mono" style={{ fontSize: 22, fontWeight: 600, margin: 0, color: ms.red ? '#ef4444' : ms.amber ? '#f59e0b' : 'var(--color-text)' }}>
                          {ms.value}
                        </p>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', opacity: .6, margin: '3px 0 0' }}>
                          {ms.label}
                        </p>
                      </div>
                    ))}
                    <button
                      onClick={() => fetchData(currentPage)}
                      title="Refresh"
                      style={{
                        width: 44, height: 44, borderRadius: 12, border: '1.5px solid var(--color-border)',
                        background: 'var(--color-surface)', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)',
                        alignSelf: 'center', transition: 'all .15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    >
                      <HiRefresh style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>

                {/* ── Policy Table ── */}
                <div style={{
                  borderRadius: 20,
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  overflow: 'hidden',
                  marginBottom: 20,
                }}>
                  <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HiDocumentText style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', letterSpacing: '.02em' }}>Policy Portfolio</span>
                    <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-secondary)', opacity: .5 }}>
                      {selectedUserPolicies.length} {selectedUserPolicies.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto', minHeight: 180 }}>
                    <table className="sub-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Policy</th>
                          <th style={{ textAlign: 'left' }}>Status</th>
                          <th style={{ textAlign: 'left' }}>Next Billing</th>
                          <th style={{ textAlign: 'center' }}>Balance</th>
                          <th style={{ textAlign: 'right', paddingRight: 24 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingPolicies ? (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}><HiRefresh className="animate-spin inline text-indigo-500 w-5 h-5" /> Fetching policies...</td></tr>
                        ) : selectedUserPolicies.map(p => {
                          const isPending = p.status === 'PENDING_CANCELLATION';
                          const hasDebt = (p.outstandingBalance || 0) > 0;
                          return (
                            <tr key={p.id} className={isPending ? 'pending-row' : ''}>
                              <td data-label="Policy">
                                <p style={{ fontWeight: 700, margin: 0, fontSize: 13 }}>{p.policyName}</p>
                                <p className="mono" style={{ fontSize: 10, margin: '3px 0 0', opacity: .45 }}>#{p.id}</p>
                              </td>
                              <td data-label="Status"><Badge status={p.status} /></td>
                              <td data-label="Next Billing">
                                <span style={{ fontSize: 12, fontWeight: 500 }}>{p.nextDueDate || '—'}</span>
                              </td>
                              <td data-label="Balance" style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                  <span className="mono" style={{ fontWeight: 600, fontSize: 13, color: hasDebt ? '#ef4444' : '#22c55e' }}>
                                    ₹{(p.outstandingBalance || 0).toLocaleString()}
                                  </span>
                                  {hasDebt && (
                                    <div className="debt-wrap" style={{ position: 'relative', display: 'inline-flex' }}>
                                      <HiExclamation style={{ width: 15, height: 15, color: '#ef4444' }} />
                                      <div className="debt-tooltip">Cancellation blocked — balance must be ₹0</div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td data-label="Action" style={{ textAlign: 'right', paddingRight: 20 }}>
                                {isPending ? (
                                  <button
                                    className={`cancel-btn ${hasDebt ? 'blocked' : 'active'}`}
                                    onClick={() => handleApprove(p.id)}
                                    disabled={hasDebt || approvingId === p.id}
                                  >
                                    {approvingId === p.id
                                      ? <HiRefresh style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
                                      : 'Authorize'}
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', opacity: .35 }}>
                                    Clean
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {!loadingPolicies && selectedUserPolicies.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)', opacity: .4, fontStyle: 'italic', fontSize: 13 }}>
                              No policies found for this customer.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Bottom Info Row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div style={{ padding: '18px 20px', borderRadius: 16, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)' }}>
                    <p className="section-label" style={{ marginBottom: 8 }}>Audit Policy</p>
                    <p style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--color-text-secondary)', margin: 0 }}>
                      All cancellation requests for <strong style={{ color: 'var(--color-text)' }}>{selectedUser.name}</strong> are
                      validated against the <span className="mono" style={{ fontSize: 11, background: 'var(--color-border)', padding: '1px 5px', borderRadius: 4 }}>outstandingBalance</span> ledger.
                      Approve buttons are locked while any balance exceeds ₹0.
                    </p>
                  </div>
                  <div style={{ padding: '18px 20px', borderRadius: 16, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HiCheckCircle style={{ width: 24, height: 24, color: '#16a34a' }} />
                    </div>
                    <div>
                      <p className="section-label" style={{ marginBottom: 4 }}>Compliance Status</p>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#16a34a', margin: 0 }}>Operational Integrity Verified</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}