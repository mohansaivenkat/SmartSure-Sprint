import { useState, useEffect, useMemo } from 'react';
import { adminAPI, claimsAPI } from '../../core/services/api';
import {
  HiClipboardList, HiSearch, HiCheckCircle, HiEye,
  HiDownload, HiUser, HiChevronRight, HiRefresh, HiClock,
  HiArrowRight
} from 'react-icons/hi';
import { Badge, Button, Modal, Textarea } from '../../shared/components/UI';
import toast from 'react-hot-toast';
import { useDebounce } from '../../shared/hooks/useDebounce';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  hasPendingPolicy?: boolean;
  hasActivePolicy?: boolean;
  policyCount?: number;
  hasSubmittedClaim?: boolean;
  hasReviewingClaim?: boolean;
}

interface Claim {
  claimId: string | number;
  userId: string | number;
  claimAmount: number;
  status: string;
  description?: string;
  message?: string;
}

interface StatusOption {
  id: string;
  label: string;
  color: string;
}


/* ─────────────────────────────────────────────────────────────
   Styles — matches the AdminSubscriptions visual language
───────────────────────────────────────────────────────────── */
const STYLES = `
  .claims-root { font-family: var(--font-family); }
  .claims-root .serif { font-family: var(--font-family); font-weight: 800; }
  .claims-root .mono  { font-family: 'JetBrains Mono', monospace; }

  /* Sidebar user cards */
  .c-user-card {
    position: relative;
    padding: 16px 18px;
    border-radius: 14px;
    cursor: pointer;
    transition: all .18s cubic-bezier(.4,0,.2,1);
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .c-user-card::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--color-primary)0A, transparent 60%);
    opacity: 0; transition: opacity .18s;
  }
  .c-user-card:hover { border-color: var(--color-primary); transform: translateX(3px); }
  .c-user-card:hover::before { opacity: 1; }
  .c-user-card.active {
    border-color: var(--color-primary);
    background: linear-gradient(135deg, var(--color-primary)12, var(--color-surface));
    box-shadow: 0 4px 20px var(--color-primary)20, inset 0 0 0 1px var(--color-primary)28;
    transform: translateX(3px);
  }
  .c-user-card.active::before { opacity: 1; }
  
  /* Pulse dot for SUBMITTED */
  .pulse-dot-submitted {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #ef4444; /* Red for attention */
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
    animation: pulse-ring 1.4s ease-out infinite;
  }
  
  /* Blinking text for SUBMITTED status */
  .blink-text {
    animation: blinker 1.5s linear infinite;
    font-weight: 800;
  }
  @keyframes blinker {
    50% { opacity: 0.2; }
  }

  /* Static dot for UNDER_REVIEW */
  .dot-reviewing {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #f59e0b; /* Amber */
  }

  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
    70%  { box-shadow: 0 0 0 8px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  /* Search */
  .c-search {
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
  .c-search:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary)18;
  }

  /* Stat chips */
  .c-stat {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 16px 20px;
    border-radius: 18px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    gap: 3px;
    transition: transform .15s;
  }
  .c-stat:hover { transform: translateY(-2px); }

  /* Table */
  .c-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
  .c-table thead th {
    padding: 12px 18px;
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-weight: 600;
    font-size: 10.5px;
    letter-spacing: .08em;
    text-transform: uppercase;
    border-bottom: 1.5px solid var(--color-border);
  }
  .c-table tbody tr { transition: background .1s; }
  .c-table tbody tr:hover td { background: var(--color-primary)05; }
  .c-table tbody td {
    padding: 14px 18px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
    background: var(--color-surface);
    color: var(--color-text);
  }
  .c-table tbody tr:last-child td { border-bottom: none; }

  @media (max-width: 768px) {
    .c-table thead { display: none; }
    .c-table tbody, .c-table tr, .c-table td { display: block; width: 100%; }
    .c-table tr { 
      padding: 16px; 
      border-bottom: 2px solid var(--color-border); 
      background: var(--color-surface);
      margin-bottom: 12px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
      position: relative;
    }
    .c-table td { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 10px 0;
      border-bottom: 1px solid var(--color-border)40;
    }
    .c-table td:last-child { border-bottom: none; }
    .c-table td::before {
      content: attr(data-label);
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--color-text-secondary);
      opacity: .6;
    }
  }

  /* Action icon buttons */
  .c-action-btn {
    width: 34px; height: 34px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    transition: all .15s;
    position: relative;
  }
  .c-action-btn:hover { transform: scale(1.1); }
  .c-action-btn:active { transform: scale(.95); }

  /* Tooltip on action */
  .c-action-btn[data-tip]:hover::after {
    content: attr(data-tip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%; transform: translateX(-50%);
    white-space: nowrap;
    background: #1e293b;
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    pointer-events: none;
    font-family: var(--font-family);
  }

  /* Scrollbar */
  .slim-scroll::-webkit-scrollbar { width: 4px; }
  .slim-scroll::-webkit-scrollbar-track { background: transparent; }
  .slim-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

  .c-layout {
    display: grid;
    grid-template-columns: 310px 1fr;
    gap: 22px;
    align-items: start;
  }
  @media (max-width: 1100px) {
    .c-layout { grid-template-columns: 1fr; }
  }

  .c-stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }
  @media (max-width: 768px) {
    .c-stat-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .c-stat-grid { grid-template-columns: 1fr; }
  }

  /* Section label */
  .c-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--color-text-secondary); opacity: .65;
  }

  /* Skeleton pulse */
  .skel {
    border-radius: 8px;
    background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Pagination */
  .c-page-btn {
    padding: 6px 14px; border-radius: 9px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: 11px; font-weight: 700;
    cursor: pointer; transition: all .12s;
    font-family: var(--font-family);
  }
  .c-page-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
  .c-page-btn:disabled { opacity: .35; cursor: not-allowed; }

  /* Root adjustments */
  .claims-root {
    box-sizing: border-box;
    overflow-x: hidden;
  }
  * { box-sizing: border-box; }

  /* Status option cards in modal */
  .status-option {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1.5px solid var(--color-border);
    background: transparent;
    cursor: pointer;
    transition: all .15s;
    font-family: var(--font-family);
    width: 100%;
  }

  /* Avatar */
  .c-avatar {
    width: 58px; height: 58px; border-radius: 18px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
    box-shadow: 0 6px 20px var(--color-primary)35;
  }

  /* Detail modal grid */
  .detail-cell {
    padding: 14px 16px;
    border-radius: 14px;
    background: var(--color-bg, #f8fafc);
    border: 1px solid var(--color-border);
  }

  /* Fade up */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .25s ease forwards; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
`;

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function AdminClaims() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [globalClaims, setGlobalClaims] = useState<Claim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [isSubsequentLoadingClaims, setIsSubsequentLoadingClaims] = useState(false);
  const [errorClaims, setErrorClaims] = useState<string | null>(null);

  const [searchUser, setSearchUser] = useState('');
  const debouncedSearchUser = useDebounce(searchUser, 500);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const PAGE_SIZE_USERS = 5;
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const [totalUsersPages, setTotalUsersPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const PAGE_SIZE_CLAIMS = 5;
  const [currentClaimsPage, setCurrentClaimsPage] = useState(1);
  const [totalClaimsPages, setTotalClaimsPages] = useState(1);

  const [globalClaimsPage, setGlobalClaimsPage] = useState(1);
  const [totalGlobalClaimsPages, setTotalGlobalClaimsPages] = useState(1);
  const [totalGlobalClaims, setTotalGlobalClaims] = useState(0);

  const [showReview, setShowReview] = useState<string | number | null>(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewRemark, setReviewRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showDetail, setShowDetail] = useState<string | number | null>(null);
  const [claimDetail, setClaimDetail] = useState<Claim | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearchUser, currentUsersPage, statusFilter]);

  useEffect(() => {
    if (!selectedUser) {
      fetchGlobalClaims(globalClaimsPage);
    }
  }, [globalClaimsPage, selectedUser]);

  const fetchUsers = async (background = false) => {
    if (!background) setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const res = await adminAPI.getFilteredUsers(currentUsersPage - 1, PAGE_SIZE_USERS, debouncedSearchUser, 'ALL', statusFilter);
      setUsers(Array.isArray(res.data.content) ? res.data.content : []);
      setTotalUsersPages(res.data.totalPages || 1);
      setTotalUsers(res.data.totalElements || 0);
    } catch (err: any) {
      setErrorUsers(err.response?.data?.message || 'Failed to load users');
    } finally { setLoadingUsers(false); }
  };

  const fetchGlobalClaims = async (page = 1) => {
    try {
      const res = await adminAPI.getAllClaimsPaginated(page - 1, PAGE_SIZE_CLAIMS, '');
      setGlobalClaims(res.data.content || []);
      setTotalGlobalClaimsPages(res.data.totalPages || 1);
      setTotalGlobalClaims(res.data.totalElements || 0);
    } catch (err: any) {
      console.error('Failed to get paginated global claims', err);
    }
  };

  const fetchClaims = async (userId: string | number, page = 1) => {
    if (page === 1) setLoadingClaims(true);
    else setIsSubsequentLoadingClaims(true);
    setErrorClaims(null);
    try {
      const res = await claimsAPI.getClaimsByUserPaginated(userId, page - 1, PAGE_SIZE_CLAIMS, '');
      setClaims(res.data.content);
      setTotalClaimsPages(res.data.totalPages || 1);
      setCurrentClaimsPage(page);
    } catch (err: any) {
      setErrorClaims(err.response?.data?.message || 'Failed to load claims');
      setClaims([]);
    } finally { 
      setLoadingClaims(false); 
      setIsSubsequentLoadingClaims(false);
    }
  };

  const handleUserSelect = (user: User) => { setSelectedUser(user); fetchClaims(user.id, 1); };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };


  const handleReview = async () => {
    if (!showReview || !reviewStatus) { toast.error('Please select a status'); return; }
    if ((reviewStatus === 'APPROVED' || reviewStatus === 'REJECTED') && !reviewRemark.trim()) {
      toast.error('Please provide a remark for approval/rejection');
      return;
    }
    setSubmitting(true);
    try {
      await adminAPI.reviewClaim(showReview, { status: reviewStatus, remark: reviewRemark });
      toast.success('Claim status updated!');
      setShowReview(null); setReviewStatus(''); setReviewRemark('');

      if (selectedUser) fetchClaims(selectedUser.id, currentClaimsPage);
      else fetchGlobalClaims(globalClaimsPage);
      
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to review claim');
    } finally { setSubmitting(false); }
  };

  const handleViewDetail = async (claimId: string | number) => {
    setShowDetail(claimId); setLoadingDetail(true);
    const local = claims.find(c => c.claimId === claimId) || globalClaims.find(c => c.claimId === claimId);
    try {
      const res = await adminAPI.getClaimStatus(claimId);
      setClaimDetail({ ...(local as Claim), ...res.data });
    } catch {
      toast.error('Using existing claim details. Failed to fetch full logs.');
      setClaimDetail(local || null);
    } finally { setLoadingDetail(false); }
  };

  const handleDownloadDoc = async (claimId: string | number) => {
    try {
      const res = await adminAPI.downloadClaimDocument(claimId);
      const ct = res.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: ct });
      const url = globalThis.URL.createObjectURL(blob);
      if (ct.startsWith('image/')) { globalThis.open(url, '_blank'); }
      else {
        const a = document.createElement('a');
        a.href = url; a.download = `claim-${claimId}-document`; a.click();
      }
    } catch (err: any) { toast.error('No document found for this claim'); }
  };

  const getValidStatusOptions = (s?: string): StatusOption[] => {
    switch (s) {
      case 'SUBMITTED': return [{ id: 'UNDER_REVIEW', label: 'Start Review', color: '#6366f1' }];
      case 'UNDER_REVIEW': return [{ id: 'APPROVED', label: 'Approve Claim', color: '#10b981' }, { id: 'REJECTED', label: 'Reject Claim', color: '#ef4444' }];
      case 'APPROVED':
      case 'REJECTED': return [{ id: 'CLOSED', label: 'Mark as Closed', color: '#64748b' }];
      case 'CLOSED': return [{ id: 'UNDER_REVIEW', label: 'Reopen Claim', color: '#f59e0b' }];
      default: return [];
    }
  };

  const currentUsers = users;

  const currentReviewingClaim = claims.find(c => c.claimId === showReview) || globalClaims.find(c => c.claimId === showReview);
  const statusOptions = getValidStatusOptions(currentReviewingClaim?.status);

  return (
    <>
      <style>{STYLES}</style>
      <div className="claims-root" style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 32 }}>
          <p className="c-label" style={{ marginBottom: 8 }}>Admin Console</p>
          <h1 className="serif" style={{ fontSize: 36, color: 'var(--color-text)', lineHeight: 1.15, margin: 0 }}>
            Claims Management
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, maxWidth: 520 }}>
            Review and process insurance claims across all registered customers. Audit status transitions and download supporting documentation.
          </p>
        </div>

        {/* ── Top Stats Row ── */}
        <div className="c-stat-grid">
          {[
            { label: 'Total Claims Recorded', value: totalGlobalClaims, mono: true },
            { label: 'Registered Customers', value: totalUsers, mono: true },
          ].map(s => (
            <div key={s.label} className="c-stat">
              <span className="mono" style={{ fontSize: 26, fontWeight: 600, color: 'var(--color-text)' }}>
                {s.value}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', opacity: .65 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Main Layout ── */}
        <div className="c-layout">

          {/* ── LEFT: Customer Sidebar ── */}
          <div style={{
            borderRadius: 20, border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', maxHeight: '80vh',
          }}>
            {/* Header */}
            <div style={{ padding: '18px 14px 13px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p className="c-label">Customers</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { fetchUsers(); }}
                    title="Refresh"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', opacity: .5, padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'opacity .15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                  >
                    <HiRefresh style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12, padding: '0 2px' }}>
                {['ALL', 'SUBMITTED', 'UNDER_REVIEW'].map(status => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setCurrentUsersPage(1); }}
                    style={{
                      flex: 1, padding: '6px 2px', borderRadius: 8, fontSize: '9px', fontWeight: 700,
                      letterSpacing: '.02em', border: '1.5px solid var(--color-border)',
                      background: statusFilter === status ? 'var(--color-primary)12' : 'var(--color-surface)',
                      color: statusFilter === status ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      borderColor: statusFilter === status ? 'var(--color-primary)' : 'var(--color-border)',
                      cursor: 'pointer', transition: 'all .15s', textTransform: 'uppercase'
                    }}
                  >
                    {status === 'UNDER_REVIEW' ? 'Reviewing' : status}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <HiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', opacity: .45, width: 14, height: 14 }} />
                <input
                  className="c-search"
                  placeholder="Search by customer name..."
                  value={searchUser}
                  onChange={e => { setSearchUser(e.target.value); setCurrentUsersPage(1); }}
                />
              </div>
            </div>

            {/* List */}
            <div className="slim-scroll" style={{ overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
              {loadingUsers ? (
                [1, 2, 3, 4, 5, 8].map(i => (
                  <div key={i} style={{ padding: '14px 14px', borderRadius: 14, border: '1.5px solid var(--color-border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="skel" style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="skel" style={{ height: 11, width: '65%' }} />
                      <div className="skel" style={{ height: 9, width: '40%' }} />
                    </div>
                  </div>
                ))
              ) : errorUsers ? (
                <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#ef4444' }}>{errorUsers}</p>
              ) : currentUsers.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, color: 'var(--color-text-secondary)', opacity: .45, fontStyle: 'italic' }}>No customers found</p>
              ) : currentUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => handleUserSelect(u)}
                  style={{
                    padding: '12px', borderRadius: 12, cursor: 'pointer',
                    background: selectedUser?.id === u.id ? 'var(--color-primary)08' : 'transparent',
                    border: `1.5px solid ${selectedUser?.id === u.id ? 'var(--color-primary)' : 'transparent'}`,
                    display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'all .15s'
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, () => handleUserSelect(u))}
                >
                  <div className="c-avatar" style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-border)' }}>
                    <HiUser style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                    <p style={{ margin: 0, fontSize: 10, color: 'var(--color-text-secondary)' }}>{u.email}</p>
                    
                    {u.policyCount !== undefined && u.policyCount > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', paddingBottom: 2 }}>
                        {u.hasPendingPolicy ? (
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
                        ) : u.hasActivePolicy ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-primary)15', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} /> Active
                          </span>
                        ) : null}
                      </div>
                    )}

                    {u.hasSubmittedClaim || u.hasReviewingClaim ? (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                        {u.hasSubmittedClaim ? (
                          <span className="blink-text" style={{ 
                            display: 'flex', alignItems: 'center', gap: 6, 
                            background: 'rgba(239, 68, 68, 0.15)', 
                            color: '#ef4444', 
                            padding: '4px 10px', 
                            borderRadius: 6, 
                            fontSize: 10, 
                            fontWeight: 800, 
                            textTransform: 'uppercase', 
                            letterSpacing: '.08em',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}>
                            <div className="pulse-dot-submitted" /> SUBMITTED
                          </span>
                        ) : u.hasReviewingClaim ? (
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
                            <div className="dot-reviewing" /> REVIEWING
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8, marginTop: 10 }}>
                    <HiChevronRight style={{
                      width: 14, height: 14,
                      color: 'var(--color-primary)',
                      opacity: selectedUser?.id === u.id ? 1 : 0,
                      transform: selectedUser?.id === u.id ? 'translateX(0)' : 'translateX(-4px)',
                      transition: 'all .15s',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button className="c-page-btn" onClick={() => setCurrentUsersPage(p => Math.max(1, p - 1))} disabled={currentUsersPage === 1}>← Prev</button>
              <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)', opacity: .6 }}>{currentUsersPage} / {Math.max(1, totalUsersPages)}</span>
              <button className="c-page-btn" onClick={() => setCurrentUsersPage(p => Math.min(totalUsersPages, p + 1))} disabled={currentUsersPage === totalUsersPages || totalUsersPages === 0}>Next →</button>
            </div>
          </div>

          {/* ── RIGHT: Claims Panel ── */}
          <div>
            {!selectedUser ? (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* ── All Claims Header ── */}
                <div style={{
                  padding: '22px 26px',
                  borderRadius: 20,
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="c-avatar" style={{ background: 'linear-gradient(135deg, var(--color-accent), #8b5cf6)' }}>
                      <HiClipboardList style={{ width: 26, height: 26, color: '#fff' }} />
                    </div>
                    <div>
                      <h2 className="serif" style={{ fontSize: 24, color: 'var(--color-text)', margin: '0 0 5px' }}>Global Claims Audit</h2>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>Viewing all active claims across the system</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { fetchGlobalClaims(globalClaimsPage); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '9px 16px', borderRadius: 12,
                      border: '1.5px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-secondary)',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'var(--font-family)',
                    }}
                  >
                    <HiRefresh style={{ width: 14, height: 14 }} />
                    Sync Worldwide
                  </button>
                </div>

                <div style={{ borderRadius: 20, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HiClipboardList style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>Master Claims Ledger</span>
                      <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-secondary)', opacity: .5 }}>{totalGlobalClaims} Total Records</span>
                    </div>
                    <div style={{ overflowX: 'auto', minHeight: 280 }}>
                      <table className="c-table">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left' }}>Claim ID</th>
                            <th style={{ textAlign: 'left' }}>User ID</th>
                            <th style={{ textAlign: 'left' }}>Amount</th>
                            <th style={{ textAlign: 'left' }}>Status</th>
                            <th style={{ textAlign: 'right', paddingRight: 22 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {globalClaims.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px 0', opacity: .4 }}>No claims found.</td></tr>
                          ) : globalClaims.map(claim => (
                            <tr key={claim.claimId} className={claim.status === 'SUBMITTED' ? 'fade-up' : ''} style={claim.status === 'SUBMITTED' ? { backgroundColor: 'var(--color-primary)05' } : {}}>
                              <td><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>#{claim.claimId}</span></td>
                              <td><span className="mono" style={{ fontSize: 11, opacity: .7 }}>USR-{claim.userId}</span></td>
                              <td><span className="mono" style={{ fontWeight: 700 }}>₹{claim.claimAmount?.toLocaleString()}</span></td>
                              <td>
                                <div className={claim.status === 'SUBMITTED' ? 'blink-text' : ''}>
                                  <Badge status={claim.status} />
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', paddingRight: 18 }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <button onClick={() => handleViewDetail(claim.claimId)} className="c-action-btn" style={{ color: 'var(--color-accent)', background: 'var(--color-accent)12' }}>
                                    <HiEye style={{ width: 16, height: 16 }} />
                                  </button>
                                  <button onClick={() => setShowReview(claim.claimId)} className="c-action-btn" style={{ color: 'var(--color-primary)', background: 'var(--color-primary)12' }}>
                                    <HiCheckCircle style={{ width: 16, height: 16 }} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Global Claims Pagination */}
                    {totalGlobalClaimsPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 15, padding: '16px 22px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg, #f8fafc)' }}>
                        <button 
                          className="c-page-btn"
                          disabled={globalClaimsPage === 1}
                          onClick={() => setGlobalClaimsPage(p => Math.max(1, p - 1))}
                        >
                          ← Prev
                        </button>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)', opacity: .7, fontWeight: 700 }}>{globalClaimsPage} / {totalGlobalClaimsPages}</span>
                        <button 
                          className="c-page-btn"
                          disabled={globalClaimsPage === totalGlobalClaimsPages}
                          onClick={() => setGlobalClaimsPage(p => Math.min(totalGlobalClaimsPages, p + 1))}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ) : (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── Profile Header ── */}
                <div style={{
                  padding: '22px 26px',
                  borderRadius: 20,
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="c-avatar">
                      <HiUser />
                    </div>
                    <div>
                      <h2 className="serif" style={{ fontSize: 24, color: 'var(--color-text)', margin: '0 0 5px' }}>{selectedUser.name}</h2>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{selectedUser.email} • {selectedUser.phone}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setSelectedUser(null)}
                      style={{
                        padding: '9px 16px', borderRadius: 12,
                        border: '1.5px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'var(--font-family)',
                      }}
                    >
                      ← Back to All
                    </button>
                    <button
                      onClick={() => fetchClaims(selectedUser.id)}
                      disabled={loadingClaims}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '9px 16px', borderRadius: 12,
                        border: '1.5px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-secondary)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'var(--font-family)',
                        transition: 'border-color .15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    >
                      <HiRefresh style={{ width: 14, height: 14, ...(loadingClaims ? { animation: 'spin 1s linear infinite' } : {}) }} />
                      Sync
                    </button>
                  </div>
                </div>

                {/* ── Claims Table ── */}
                <div style={{ borderRadius: 20, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HiClipboardList style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>Claim Records</span>
                    {!loadingClaims && (
                      <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-secondary)', opacity: .45 }}>
                        {totalClaimsPages > 1 ? `Page ${currentClaimsPage} of ${totalClaimsPages}` : `${claims.length} records`}
                        {isSubsequentLoadingClaims && <span style={{ marginLeft: 8, color: 'var(--color-primary)' }}>• Updating...</span>}
                      </span>
                    )}
                  </div>

                  {loadingClaims ? (
                    <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div className="skel" style={{ height: 13, flex: 1 }} />
                          <div className="skel" style={{ height: 13, width: 80 }} />
                          <div className="skel" style={{ height: 22, width: 90, borderRadius: 20 }} />
                          <div className="skel" style={{ height: 30, width: 110, borderRadius: 10 }} />
                        </div>
                      ))}
                    </div>
                  ) : errorClaims ? (
                    <p style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444', fontSize: 13 }}>{errorClaims}</p>
                  ) : claims.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-secondary)', opacity: .4, fontStyle: 'italic', fontSize: 13 }}>
                      No claims found for this customer.
                    </p>
                  ) : (
                    <>
                      <div style={{ overflowX: 'auto' }}>
                      <table className="c-table">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left' }}>Claim ID</th>
                            <th style={{ textAlign: 'left' }}>Amount</th>
                            <th style={{ textAlign: 'left' }}>Status</th>
                            <th style={{ textAlign: 'right', paddingRight: 22 }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {claims.map(claim => (
                            <tr key={claim.claimId}>
                              <td data-label="Claim ID">
                                <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>#{claim.claimId}</span>
                              </td>
                              <td data-label="Amount">
                                <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>₹{claim.claimAmount?.toLocaleString()}</span>
                              </td>
                              <td data-label="Status">
                                <div className={claim.status === 'SUBMITTED' ? 'blink-text' : ''}>
                                  <Badge status={claim.status} />
                                </div>
                              </td>
                              <td data-label="Actions" style={{ textAlign: 'right', paddingRight: 18 }}>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                  <button
                                    className="c-action-btn"
                                    data-tip="Update Status"
                                    onClick={() => setShowReview(claim.claimId)}
                                    style={{ color: 'var(--color-primary)', background: 'var(--color-primary)12' }}
                                  >
                                    <HiCheckCircle style={{ width: 16, height: 16 }} />
                                  </button>
                                  <button
                                    className="c-action-btn"
                                    data-tip="View Detail"
                                    onClick={() => handleViewDetail(claim.claimId)}
                                    style={{ color: 'var(--color-accent)', background: 'var(--color-accent)12' }}
                                  >
                                    <HiEye style={{ width: 16, height: 16 }} />
                                  </button>
                                  <button
                                    className="c-action-btn"
                                    data-tip="Download Doc"
                                    onClick={() => handleDownloadDoc(claim.claimId)}
                                    style={{ color: 'var(--color-success, #10b981)', background: 'var(--color-success, #10b981)12' }}
                                  >
                                    <HiDownload style={{ width: 16, height: 16 }} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                      {/* Claims Pagination */}
                      {totalClaimsPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 15, padding: '20px 0', borderTop: '1px solid var(--color-border)', marginTop: 10 }}>
                          <button 
                            className="c-page-btn"
                            disabled={currentClaimsPage === 1}
                            onClick={() => fetchClaims(selectedUser.id, currentClaimsPage - 1)}
                          >
                            ← Prev
                          </button>
                          <span className="mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)', opacity: .7, fontWeight: 700 }}>{currentClaimsPage} / {totalClaimsPages}</span>
                          <button 
                            className="c-page-btn"
                            disabled={currentClaimsPage === totalClaimsPages}
                            onClick={() => fetchClaims(selectedUser.id, currentClaimsPage + 1)}
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Review Modal ── */}
      <Modal
        isOpen={!!showReview}
        onClose={() => { setShowReview(null); setReviewStatus(''); }}
        title={`Status Review — Claim #${showReview}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', opacity: .6 }}>Current</span>
            <Badge status={currentReviewingClaim?.status} />
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>Choose the next step in the pipeline:</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {statusOptions.length > 0 ? statusOptions.map(s => (
              <button
                key={s.id}
                className="status-option"
                onClick={() => setReviewStatus(s.id)}
                style={{
                  borderColor: reviewStatus === s.id ? s.color : 'var(--color-border)',
                  background: reviewStatus === s.id ? `${s.color}12` : 'transparent',
                  color: reviewStatus === s.id ? s.color : 'var(--color-text)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-family)' }}>{s.label}</span>
                </div>
                <HiArrowRight style={{ width: 14, height: 14, opacity: reviewStatus === s.id ? 1 : 0, transform: reviewStatus === s.id ? 'translateX(0)' : 'translateX(-4px)', transition: 'all .12s' }} />
              </button>
            )) : (
              <div style={{ padding: '24px', textAlign: 'center', borderRadius: 14, border: '1.5px dashed var(--color-border)' }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>No further actions available.</p>
              </div>
            )}
          </div>

          {(reviewStatus === 'APPROVED' || reviewStatus === 'REJECTED') && (
            <div className="fade-up">
              <Textarea
                label="Admin Remark *"
                value={reviewRemark}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewRemark(e.target.value)}
                placeholder="Explain the reason for this decision (this will be sent to the customer)..."
                rows={3}
              />
            </div>
          )}

          {currentReviewingClaim?.status === 'CLOSED' && (
            <p style={{ fontSize: 10, textAlign: 'center', fontStyle: 'italic', color: 'var(--color-text-secondary)', opacity: .55, margin: 0 }}>
              Reopening a closed claim will move it back to "Under Review".
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--color-border)', marginTop: 4 }}>
            <Button variant="ghost" onClick={() => { setShowReview(null); setReviewStatus(''); setReviewRemark(''); }}>Cancel</Button>
            <Button onClick={handleReview} loading={submitting} disabled={!reviewStatus}>Update Status</Button>
          </div>
        </div>
      </Modal>

      {/* ── Detail Modal ── */}
      <Modal
        isOpen={!!showDetail}
        onClose={() => { setShowDetail(null); setClaimDetail(null); }}
        title={`Claim Log — #${showDetail}`}
      >
        {loadingDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            {[1, 2, 3].map(i => <div key={i} className="skel" style={{ height: 60, borderRadius: 14 }} />)}
          </div>
        ) : claimDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="detail-cell">
                <p className="c-label" style={{ marginBottom: 6 }}>Claim Amount</p>
                <p className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>₹{claimDetail.claimAmount?.toLocaleString()}</p>
              </div>
              <div className="detail-cell">
                <p className="c-label" style={{ marginBottom: 6 }}>Status</p>
                <Badge status={claimDetail.status || 'UNKNOWN'} />
              </div>
            </div>

            <div className="detail-cell">
              <p className="c-label" style={{ marginBottom: 6 }}>System Message</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', margin: 0, lineHeight: 1.6 }}>
                {claimDetail.message || 'No system message available.'}
              </p>
            </div>

            <div className="detail-cell">
              <p className="c-label" style={{ marginBottom: 6 }}>User Description</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.65 }}>
                {claimDetail.description || 'No description provided.'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--color-text-secondary)', opacity: .5 }}>
                <HiClock style={{ width: 11, height: 11 }} /> Last synced
              </span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--color-text-secondary)', opacity: .5 }}>{new Date().toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#ef4444', fontSize: 13 }}>Failed to load claim detail.</p>
        )}
      </Modal>
    </>
  );
}