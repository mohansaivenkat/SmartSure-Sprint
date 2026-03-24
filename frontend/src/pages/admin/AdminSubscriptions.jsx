import { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../../services/api';
import {
  HiDocumentText, HiCurrencyRupee, HiCheckCircle, HiRefresh,
  HiSearch, HiUser, HiChevronRight, HiMail, HiPhone, HiExclamation
} from 'react-icons/hi';
import { PageHeader, Badge, Button, Card } from '../../components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../../components/UI';
import toast from 'react-hot-toast';

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
    padding: 14px 16px;
    border-radius: 14px;
    cursor: pointer;
    transition: all .2s cubic-bezier(.4,0,.2,1);
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    overflow: hidden;
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
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #f59e0b;
    box-shadow: 0 0 0 0 #f59e0b66;
    animation: pulse-ring 1.4s ease-out infinite;
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 #f59e0b66; }
    70%  { box-shadow: 0 0 0 8px transparent; }
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
    .sub-table tr { padding: 16px; border-bottom: 1.5px solid var(--color-border); position: relative; }
    .sub-table td { border-bottom: none; padding: 4px 0; display: flex; justify-content: space-between; align-items: center; }
    .sub-table td::before {
      content: attr(data-label);
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--color-text-secondary);
      opacity: .6;
    }
  }

  /* Layout */
  .sub-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
  @media (max-width: 1024px) {
    .sub-layout { grid-template-columns: 1fr; }
  }

  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
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
    white-space: nowrap;
    background: #dc2626;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 6px 10px;
    border-radius: 8px;
    box-shadow: 0 4px 14px #dc262640;
    opacity: 0;
    pointer-events: none;
    transition: opacity .15s;
  }
  .debt-wrap:hover .debt-tooltip { opacity: 1; }
  .debt-tooltip::after {
    content: '';
    position: absolute;
    top: 100%; left: 50%; transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #dc2626;
  }
`;

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function AdminSubscriptions() {
  const [policies, setPolicies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [policiesRes, usersRes] = await Promise.all([
        adminAPI.getAllUserPolicies(),
        adminAPI.getUsers(),
      ]);
      setPolicies(Array.isArray(policiesRes.data) ? policiesRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data.filter(u => u.role === 'CUSTOMER') : []);
    } catch {
      setError('Failed to sync master data from services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const userStats = useMemo(() => {
    return users.reduce((acc, user) => {
      const up = policies.filter(p => p.userId === user.id);
      acc[user.id] = { count: up.length, hasPending: up.some(p => p.status === 'PENDING_CANCELLATION') };
      return acc;
    }, {});
  }, [users, policies]);

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return (u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.includes(s))
      && (!showPendingOnly || userStats[u.id]?.hasPending);
  });

  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedUserPolicies = policies.filter(p => p.userId === selectedUserId);

  const totalOutstanding = selectedUserPolicies.reduce((s, p) => s + (p.outstandingBalance || 0), 0);
  const pendingCount = selectedUserPolicies.filter(p => p.status === 'PENDING_CANCELLATION').length;

  const handleApprove = async (policyId) => {
    setApprovingId(policyId);
    try {
      await adminAPI.approveCancellation(policyId);
      toast.success('Policy cancelled successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading && !policies.length) return <LoadingSpinner />;

  return (
    <>
      <style>{STYLES}</style>
      <div className="sub-root" style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 32 }}>
          <p className="section-label" style={{ marginBottom: 8 }}>Admin Console</p>
          <h1 className="serif" style={{ fontSize: 36, color: 'var(--color-text)', lineHeight: 1.15, margin: 0 }}>
            Subscription Management
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, maxWidth: 520 }}>
            Audit insurance portfolios, review cancellation requests, and enforce ledger compliance across all customer accounts.
          </p>
        </div>

        {/* ── Top Stats Row ── */}
        <div className="stat-grid">
          {[
            { label: 'Total Customers', value: users.length, mono: true },
            { label: 'Active Policies', value: policies.length, mono: true },
            {
              label: 'Pending Requests',
              value: users.filter(u => userStats[u.id]?.hasPending).length,
              accent: '#f59e0b',
              mono: true,
            },
          ].map(s => (
            <div key={s.label} className="stat-chip">
              <span className="mono" style={{ fontSize: 28, fontWeight: 600, color: s.accent || 'var(--color-text)' }}>
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
              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <HiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', opacity: .5, width: 14, height: 14 }} />
                <input
                  className="sub-search"
                  placeholder="Search by name or email…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              {/* Pending filter pill */}
              <button
                onClick={() => setShowPendingOnly(!showPendingOnly)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 10,
                  fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                  border: showPendingOnly ? '1.5px solid #f59e0b' : '1.5px solid var(--color-border)',
                  background: showPendingOnly ? '#fef3c7' : 'transparent',
                  color: showPendingOnly ? '#92400e' : 'var(--color-text-secondary)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all .15s',
                }}
              >
                {showPendingOnly && <HiExclamation style={{ width: 13, height: 13 }} />}
                {showPendingOnly ? 'Pending Only' : 'All Customers'}
              </button>
            </div>

            {/* List */}
            <div className="slim-scroll" style={{ overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {filteredUsers.map((u, i) => (
                <div
                  key={u.id}
                  className={`user-card${selectedUserId === u.id ? ' active' : ''}`}
                  onClick={() => setSelectedUserId(u.id)}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <p className="mono" style={{ fontSize: 10, color: 'var(--color-text-secondary)', opacity: .6, margin: 0 }}>#{u.id}</p>
                        {u.phone && <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', opacity: .5 }}>• {u.phone}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                      {userStats[u.id]?.hasPending && <div className="pulse-dot" />}
                      <HiChevronRight style={{
                        width: 14, height: 14,
                        color: 'var(--color-primary)',
                        opacity: selectedUserId === u.id ? 1 : 0,
                        transform: selectedUserId === u.id ? 'translateX(0)' : 'translateX(-4px)',
                        transition: 'all .15s',
                      }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: 'var(--color-border)', color: 'var(--color-text-secondary)',
                      letterSpacing: '.04em', textTransform: 'uppercase',
                    }}>
                      {userStats[u.id]?.count} {userStats[u.id]?.count === 1 ? 'Policy' : 'Policies'}
                    </span>
                    {userStats[u.id]?.hasPending && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                        background: '#fef3c7', color: '#92400e', letterSpacing: '.04em', textTransform: 'uppercase',
                      }}>
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: 'var(--color-text-secondary)', opacity: .5, fontStyle: 'italic' }}>
                  No customers match criteria
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT: Detail Panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!selectedUser ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 480, borderRadius: 20, border: '1.5px dashed var(--color-border)',
                background: 'var(--color-surface)', gap: 12,
              }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: .4 }}>
                  <HiUser style={{ width: 28, height: 28, color: 'var(--color-text)' }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)', margin: 0 }}>Select a customer</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, opacity: .6, textAlign: 'center', maxWidth: 280 }}>
                  Choose from the list to view their policy portfolio and manage cancellation requests.
                </p>
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
                      onClick={fetchData}
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

                  <div style={{ overflowX: 'auto' }}>
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
                        {selectedUserPolicies.map(p => {
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
                        {selectedUserPolicies.length === 0 && (
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