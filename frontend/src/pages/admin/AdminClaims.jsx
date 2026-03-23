import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { HiClipboardList, HiSearch, HiCheckCircle, HiXCircle, HiEye, HiDownload, HiUser, HiChevronRight, HiRefresh, HiClock, HiArrowRight } from 'react-icons/hi';
import { PageHeader, Card, Badge, Button, Modal, Input } from '../../components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../../components/UI';
import toast from 'react-hot-toast';

export default function AdminClaims() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [errorClaims, setErrorClaims] = useState(null);

  const [searchUser, setSearchUser] = useState('');
  
  const PAGE_SIZE_USERS = 8;
  const [currentUsersPage, setCurrentUsersPage] = useState(1);

  
  const [showReview, setShowReview] = useState(null); // claimId
  const [reviewStatus, setReviewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showDetail, setShowDetail] = useState(null);
  const [claimDetail, setClaimDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const res = await adminAPI.getUsers();
      const customerUsers = Array.isArray(res.data) ? res.data.filter(u => u.role === 'CUSTOMER') : [];
      setUsers(customerUsers);
    } catch (err) {
      setErrorUsers(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchClaims = async (userId) => {
    setLoadingClaims(true);
    setErrorClaims(null);
    try {
      const res = await adminAPI.getClaimsByUser(userId);
      const claimsData = Array.isArray(res.data) ? res.data : [];
      setClaims(claimsData);
    } catch (err) {
      setErrorClaims(err.response?.data?.message || 'Failed to load claims');
      setClaims([]);
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchClaims(user.id);
  };

  const handleReview = async () => {
    if (!reviewStatus) { toast.error('Please select a status'); return; }
    setSubmitting(true);
    try {
      await adminAPI.reviewClaim(showReview, { status: reviewStatus });
      toast.success('Claim status update triggered!');
      setShowReview(null);
      setReviewStatus('');
      
      // Refresh after a delay for async processing
      setTimeout(() => {
        if (selectedUser) fetchClaims(selectedUser.id);
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review claim');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (claimId) => {
    setShowDetail(claimId);
    setLoadingDetail(true);
    
    // Always fallback to what we already know from the claims list
    const localClaimData = claims.find(c => c.claimId === claimId) || {};
    
    try {
      const res = await adminAPI.getClaimStatus(claimId);
      console.log("DEBUG: Claim log detail response:", res.data);
      setClaimDetail({ ...localClaimData, ...res.data });
    } catch (err) {
      console.error("Log Detail fetch failed:", err);
      toast.error("Using existing claim details. Failed to fetch full logs.");
      setClaimDetail(localClaimData);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDownloadDoc = async (claimId) => {
    try {
      const res = await adminAPI.downloadClaimDocument(claimId);
      const contentType = res.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      if (contentType.startsWith('image/')) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `claim-${claimId}-document`;
        link.click();
      }
    } catch {
      toast.error('No document found for this claim');
    }
  };

  const safeSearch = searchUser.trim().toLowerCase();
  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(safeSearch) || 
    (u.email || '').toLowerCase().includes(safeSearch) ||
    (u.id || '').toString().includes(safeSearch)
  );

  const totalUsersPages = Math.ceil(filteredUsers.length / PAGE_SIZE_USERS);
  const currentUsers = filteredUsers.slice((currentUsersPage - 1) * PAGE_SIZE_USERS, currentUsersPage * PAGE_SIZE_USERS);


  const getValidStatusOptions = (currentStatus) => {
    if (!currentStatus) return [];
    
    switch (currentStatus) {
      case 'SUBMITTED':
        return [{ id: 'UNDER_REVIEW', label: 'Start Review', color: '#6366f1' }];
      case 'UNDER_REVIEW':
        return [
          { id: 'APPROVED', label: 'Approve Claim', color: '#10b981' },
          { id: 'REJECTED', label: 'Reject Claim', color: '#ef4444' }
        ];
      case 'APPROVED':
      case 'REJECTED':
        return [{ id: 'CLOSED', label: 'Mark as Closed', color: '#64748b' }];
      case 'CLOSED':
        return [{ id: 'UNDER_REVIEW', label: 'Reopen Claim', color: '#f59e0b' }];
      default:
        return [];
    }
  };

  const currentReviewingClaim = claims.find(c => c.claimId === showReview);
  const statusOptions = getValidStatusOptions(currentReviewingClaim?.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Insurance Claims Management"
        subtitle="Review and process claims from all registered customers"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Users List */}
        <div className="lg:col-span-1 border-r border-transparent lg:border-border pr-0 lg:pr-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
              <HiUser className="w-4 h-4" /> Registered Customers
            </h3>
            <button onClick={fetchUsers} className="p-1 hover:rotate-180 transition-all duration-500" title="Refresh List">
              <HiRefresh className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="relative mb-6">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', '--tw-ring-color': 'var(--color-primary)' }}
              value={searchUser}
              onChange={(e) => { setSearchUser(e.target.value); setCurrentUsersPage(1); }}
            />
          </div>

          {loadingUsers ? (
            <div className="space-y-3 pr-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 animate-pulse flex justify-between items-center">
                   <div className="flex-1 space-y-2">
                     <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                     <div className="h-3 bg-gray-100 dark:bg-gray-800/50 rounded w-1/3"></div>
                   </div>
                   <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                </div>
              ))}
            </div>
          ) : errorUsers ? (
            <p className="text-xs text-danger p-4 text-center">{errorUsers}</p>
          ) : (
            <div className="space-y-4 pr-2">
              <div className="space-y-2">
                {currentUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedUser?.id === user.id ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'}`}
                    style={{ backgroundColor: selectedUser?.id === user.id ? 'var(--color-primary)15' : 'var(--color-surface)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold truncate max-w-[150px]" style={{ color: 'var(--color-text)' }}>{user.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>ID: #{user.id}</p>
                      </div>
                      <HiChevronRight className={`w-4 h-4 transition-transform ${selectedUser?.id === user.id ? 'translate-x-1 text-primary' : 'text-gray-400'}`} 
                        style={{ color: selectedUser?.id === user.id ? 'var(--color-primary)' : '' }} />
                    </div>
                  </div>
                ))}
              </div>
              
              {totalUsersPages > 1 && (
                <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                   <Button 
                    variant="outline" size="sm" 
                    onClick={() => setCurrentUsersPage(p => Math.max(1, p - 1))} 
                    disabled={currentUsersPage === 1}
                   >
                     Prev
                   </Button>
                   <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                     {currentUsersPage} / {totalUsersPages}
                   </span>
                   <Button 
                    variant="outline" size="sm" 
                    onClick={() => setCurrentUsersPage(p => Math.min(totalUsersPages, p + 1))} 
                    disabled={currentUsersPage === totalUsersPages}
                   >
                     Next
                   </Button>
                </div>
              )}

              {filteredUsers.length === 0 && (
                <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>No customers found</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Claims for Selected User */}
        <div className="lg:col-span-2">
          {!selectedUser ? (
            <EmptyState
              icon={HiUser}
              title="Select a Customer"
              description="Choose a customer from the list on the left to view and process their claims."
            />
          ) : (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Claims for {selectedUser.name}</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{selectedUser.email} • {selectedUser.phone || 'No phone'}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchClaims(selectedUser.id)} loading={loadingClaims}>
                  <HiRefresh className="w-4 h-4" /> Refresh Claims
                </Button>
              </div>

              {loadingClaims ? (
                <LoadingSpinner />
              ) : errorClaims ? (
                <ErrorMessage message={errorClaims} onRetry={() => fetchClaims(selectedUser.id)} />
              ) : !Array.isArray(claims) || claims.length === 0 ? (
                <EmptyState
                  icon={HiClipboardList}
                  title="No Claims Found"
                  description="This customer hasn't submitted any insurance claims yet."
                />
              ) : (
                <div className="overflow-x-auto rounded-2xl border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                        {['Claim ID', 'Amount', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="text-left px-5 py-4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((claim) => (
                        <tr key={claim.claimId} className="border-b transition-colors hover:bg-gray-50/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--color-border)' }}>
                          <td className="px-5 py-4 font-medium" style={{ color: 'var(--color-text)' }}>#{claim.claimId}</td>
                          <td className="px-5 py-4 font-bold" style={{ color: 'var(--color-text)' }}>₹{claim.claimAmount?.toLocaleString()}</td>
                          <td className="px-5 py-4"><Badge status={claim.status} /></td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => setShowReview(claim.claimId)} className="p-2 rounded-lg transition-transform hover:scale-110"
                                style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-primary)10' }}
                                title="Update Status">
                                <HiCheckCircle className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleViewDetail(claim.claimId)} className="p-2 rounded-lg transition-transform hover:scale-110"
                                style={{ color: 'var(--color-accent)', backgroundColor: 'var(--color-accent)10' }}
                                title="View Claim Log/Detail">
                                <HiEye className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDownloadDoc(claim.claimId)} className="p-2 rounded-lg transition-transform hover:scale-110"
                                style={{ color: 'var(--color-success)', backgroundColor: 'var(--color-success)10' }}
                                title="Download Document">
                                <HiDownload className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal 
        isOpen={!!showReview} 
        onClose={() => { setShowReview(null); setReviewStatus(''); }} 
        title={`Status Review: Claim #${showReview}`}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-bg)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Current Status:</span>
            <Badge status={currentReviewingClaim?.status} />
          </div>

          <p className="text-sm px-1" style={{ color: 'var(--color-text-secondary)' }}>
            Choose the next logical step in the pipeline:
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            {statusOptions.length > 0 ? (
              statusOptions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setReviewStatus(s.id)}
                  className="flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all border-2 group"
                  style={{
                    borderColor: reviewStatus === s.id ? s.color : 'var(--color-border)',
                    backgroundColor: reviewStatus === s.id ? `${s.color}15` : 'transparent',
                    color: reviewStatus === s.id ? s.color : 'var(--color-text)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </div>
                  <HiArrowRight className={`w-4 h-4 transition-transform ${reviewStatus === s.id ? 'translate-x-1' : 'opacity-0'}`} />
                </button>
              ))
            ) : (
                <div className="p-6 text-center rounded-2xl border border-dashed border-gray-300">
                   <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No further actions available for this status.</p>
                </div>
            )}
          </div>

          {currentReviewingClaim?.status === 'CLOSED' && (
             <p className="text-[10px] text-center italic" style={{ color: 'var(--color-text-secondary)' }}>
                Reopening a closed claim will move it back to 'Under Review'.
             </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="ghost" onClick={() => { setShowReview(null); setReviewStatus(''); }}>Cancel</Button>
            <Button onClick={handleReview} loading={submitting} disabled={!reviewStatus}>Update Status</Button>
          </div>
        </div>
      </Modal>

      {/* Claim Log Detail Modal */}
      <Modal isOpen={!!showDetail} onClose={() => { setShowDetail(null); setClaimDetail(null); }} title={`Claim Log #${showDetail}`}>
        {loadingDetail ? (
          <LoadingSpinner size="sm" />
        ) : claimDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Claim Amount</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>₹{claimDetail.claimAmount?.toLocaleString()}</p>
               </div>
               <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>Status</p>
                  <Badge status={claimDetail.status || 'UNKNOWN'} />
               </div>
            </div>
            
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-bg)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>Internal System Message</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {claimDetail.message || 'No system message available.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-bg)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>User Description</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {claimDetail.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] pt-2 px-1" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="flex items-center gap-1">
                <HiClock className="w-3 h-3" /> Last Synced
              </div>
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <ErrorMessage message="Failed to load claim detail" />
        )}
      </Modal>
    </div>
  );
}
