import { useState, useEffect } from 'react';
import { useAppSelector } from '../../shared/hooks/reduxHooks';
import { selectCurrentUser } from '../auth/store/authSlice';
import { claimsAPI, policyAPI } from '../../core/services/api';
import {
  HiClipboardList,
  HiPlus,
  HiUpload,
  HiCurrencyRupee,
  HiEye,
  HiOutlineCloudUpload,
  HiOutlineDocumentText,
  HiIdentification,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi';
import { PageHeader, Card, Badge, Button, Modal, Input, Textarea, Select, LoadingSpinner, ErrorMessage, EmptyState } from '../../shared/components/UI';
import toast from 'react-hot-toast';

const PER_PAGE_OPTIONS = [5, 10, 20];

export default function MyClaims() {
  const user = useAppSelector(selectCurrentUser);
  const [claims, setClaims] = useState<any[]>([]);
  const [userPolicies, setUserPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showUpload, setShowUpload] = useState<string | number | null>(null);
  const [claimForm, setClaimForm] = useState({ policyId: '', claimAmount: '', description: '' });
  const [claimToRefile, setClaimToRefile] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  // ── Data fetching ──────────────────────────────────────────────────
  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [claimsRes, policiesRes] = await Promise.all([
        claimsAPI.getClaimsByUser(user.id),
        policyAPI.getUserPolicies(user.id),
      ]);
      setClaims(claimsRes.data);
      setUserPolicies(policiesRes.data.filter((p: any) => p.status === 'ACTIVE' && (p.outstandingBalance || 0) <= 0));
    } catch (err: any) {
      console.error('MyClaims fetch error:', err);
      setError(err.response?.data?.message || err.response?.data || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  // Reset to page 1 whenever perPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [perPage]);

  // ── Pagination helpers ─────────────────────────────────────────────
  const totalPages = Math.ceil(claims.length / perPage);
  const paginatedClaims = claims.slice((currentPage - 1) * perPage, currentPage * perPage);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const lo = Math.max(2, currentPage - 1);
      const hi = Math.min(totalPages - 1, currentPage + 1);
      if (lo > 2) pages.push('…');
      for (let i = lo; i <= hi; i++) pages.push(i);
      if (hi < totalPages - 1) pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  };

  // ── Handlers ───────────────────────────────────────────────────────
  const handleSubmitClaim = async () => {
    if (!claimForm.policyId) {
      toast.error('Please select a policy');
      return;
    }
    if (!claimForm.claimAmount || Number(claimForm.claimAmount) <= 0) {
      toast.error('Please enter a valid claim amount');
      return;
    }
    if (!claimForm.description) {
      toast.error('Please provide a description');
      return;
    }
    setSubmitting(true);
    try {
      await claimsAPI.initiateClaim({
        policyId: Number(claimForm.policyId),
        userId: user?.id,
        claimAmount: Number(claimForm.claimAmount),
        description: claimForm.description,
      });
      toast.success('Claim submitted successfully!');
      setShowNewClaim(false);
      setClaimForm({ policyId: '', claimAmount: '', description: '' });
      setCurrentPage(1);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDoc = async () => {
    if (!file || !showUpload) { toast.error('Please select a file'); return; }
    setSubmitting(true);
    try {
      await claimsAPI.uploadDocument(showUpload, file);
      toast.success('Document uploaded successfully!');
      setShowUpload(null);
      setFile(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartRefile = (claim: any) => {
    if (!claim) return;

    setClaimToRefile(claim.claimId);
    setShowNewClaim(true);
    setClaimForm({
      policyId: String(claim.policyId),
      claimAmount: '',
      description: `Previous admin remark: ${claim.adminRemark || 'Not provided'}.\nPlease explain your updated evidence or issue clearly and upload supporting docs.`,
    });
  };

  const handleRefreshClaims = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      toast.success('Claims refreshed successfully');
    } catch {
      toast.error('Unable to refresh claims');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadDoc = async (claimId: number | string) => {
    try {
      const res = await claimsAPI.downloadDocument(claimId);
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

  // ── Guards ─────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Claim Center"
        subtitle="Submit, track, and manage your insurance reimbursement claims"
        action={
          <Button
            onClick={() => setShowNewClaim(true)}
            className="rounded-full px-6 py-2.5 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 font-bold"
          >
            <HiPlus className="w-5 h-5 mr-1" />
            File a Claim
          </Button>
        }
      />

      {claims.length === 0 ? (
        <EmptyState
          icon={HiClipboardList}
          title="No Claims on Record"
          description="You haven't submitted any claims yet. If you have an incident to report, file a claim to get started."
          action={
            <Button onClick={() => setShowNewClaim(true)} className="mt-2 rounded-full px-6 py-3 font-bold shadow-md">
              <HiPlus className="w-5 h-5 mr-1" /> File a New Claim
            </Button>
          }
        />
      ) : (
        <>
          {/* ── Claims List ── */}
          <div className="flex flex-col gap-4">
            {paginatedClaims.map((claim) => (
              <div
                key={claim.claimId}
                className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-5 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md bg-surface"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner mt-0.5"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <HiOutlineDocumentText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Claim #{claim.claimId}
                    </p>
                    <p className="text-xs font-medium flex items-center gap-1 opacity-70 mt-0.5 text-text-secondary">
                      <HiIdentification className="w-3.5 h-3.5" /> Policy #{claim.policyId}
                    </p>
                    <p className="text-sm mt-1.5 font-medium truncate text-text-secondary">
                      {claim.description}
                    </p>
                    {claim.adminRemark && (
                      <div className="mt-2 p-2 rounded-lg bg-bg border-l-4 border-primary/40">
                        <p className="text-[10px] font-black uppercase text-primary/70 mb-0.5">Admin Note</p>
                        <p className="text-xs italic opacity-80" style={{ color: 'var(--color-text)' }}>
                          "{claim.adminRemark}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle/Bottom Flex Container for Mobile */}
                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 sm:border-t-0">
                  {/* Amount */}
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary opacity-60">
                      Amount
                    </p>
                    <p className="text-lg font-black tracking-tight flex items-center sm:justify-end gap-0.5 text-text">
                      <HiCurrencyRupee className="w-4 h-4 text-primary" />
                      {claim.claimAmount?.toLocaleString()}
                    </p>
                  </div>

                  {/* Badge */}
                  <div className="shrink-0">
                    <Badge status={claim.status} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 sm:pt-0 sm:ml-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowUpload(claim.claimId)}
                    disabled={claim.hasDocument || (claim.status !== 'SUBMITTED' && claim.status !== 'UNDER_REVIEW')}
                    className="flex-1 sm:flex-none rounded-xl font-bold border-dashed hover:border-solid text-xs py-2 disabled:opacity-50 disabled:grayscale"
                    style={{ 
                      borderColor: claim.hasDocument || (claim.status !== 'SUBMITTED' && claim.status !== 'UNDER_REVIEW') ? 'var(--color-border)' : 'var(--color-primary)', 
                      color: claim.hasDocument || (claim.status !== 'SUBMITTED' && claim.status !== 'UNDER_REVIEW') ? 'var(--color-text-secondary)' : 'var(--color-primary)' 
                    }}
                    title={claim.hasDocument ? 'Document already uploaded' : (claim.status !== 'SUBMITTED' && claim.status !== 'UNDER_REVIEW') ? 'Claim is already processed' : 'Upload supporting documents'}
                  >
                    <HiUpload className="w-3.5 h-3.5 mr-1" /> 
                    {claim.hasDocument ? 'Uploaded' : 'Upload'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadDoc(claim.claimId)}
                    className="flex-1 sm:flex-none rounded-xl font-bold text-xs py-2 bg-surface"
                  >
                    <HiEye className="w-3.5 h-3.5 mr-1 text-text-secondary" /> View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination Bar ── */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 px-6 py-5 rounded-2xl shadow-sm bg-surface"
          >
            <div className="flex items-center justify-between w-full sm:w-auto gap-8">
              {/* Per page */}
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
                <span>Show</span>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="rounded-lg px-2 py-1 bg-bg text-text outline-none focus:ring-1 focus:ring-primary shadow-sm"
                >
                  {PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="hidden xs:inline">per page</span>
              </div>

              {/* Info (Mobile) */}
              <p className="text-xs sm:hidden font-medium text-text-secondary">
                <span className="text-text font-bold">{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, claims.length)}</span> of <span className="text-text font-bold">{claims.length}</span>
              </p>
            </div>

            {/* Info (Desktop) */}
            <p className="hidden sm:block text-xs font-medium text-text-secondary">
              Showing <span className="text-text font-bold">{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, claims.length)}</span> of <span className="text-text font-bold">{claims.length}</span> claims
            </p>

            {/* Page buttons */}
            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-10 disabled:cursor-not-allowed hover:enabled:bg-primary/10 text-text-secondary"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((pg, idx) =>
                  pg === '…' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs font-bold text-text-secondary">
                      …
                    </span>
                  ) : (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg as number)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                        pg === currentPage
                          ? 'bg-primary text-white shadow-md'
                          : 'text-text-secondary hover:bg-primary/10'
                      }`}
                    >
                      {pg}
                    </button>
                  )
                )}
              </div>

              {/* Next */}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-10 disabled:cursor-not-allowed hover:enabled:bg-primary/10 text-text-secondary"
              >
                <HiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── New Claim Modal ── */}
      <Modal isOpen={showNewClaim} onClose={() => setShowNewClaim(false)} title="File a New Claim">
        <div className="space-y-5 px-1 py-2">
          {userPolicies.length === 0 ? (
            <div className="p-4 rounded-xl text-sm text-center border text-amber-600 bg-amber-50 border-amber-200">
              You do not have any active policies eligible for a claim.
            </div>
          ) : (
            <>
              <Select
                label="Select Active Policy"
                value={claimForm.policyId}
                onChange={(e: any) => setClaimForm((prev) => ({ ...prev, policyId: e.target.value }))}
                className="w-full"
              >
                <option value="">Choose a policy to claim against...</option>
                {userPolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.policyName} (Policy ID: {p.id})
                  </option>
                ))}
              </Select>

              <Input
                label="Claim Amount (₹)"
                type="number"
                value={claimForm.claimAmount}
                onChange={(e: any) => setClaimForm((prev) => ({ ...prev, claimAmount: e.target.value }))}
                placeholder="e.g. 50000"
              />

              <Textarea
                label="Incident Description"
                value={claimForm.description}
                onChange={(e: any) => setClaimForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Please describe the reason for your claim in detail..."
                rows={4}
              />
            </>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t mt-6" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="ghost" className="rounded-xl" onClick={() => setShowNewClaim(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitClaim}
              loading={submitting}
              disabled={userPolicies.length === 0}
              className="rounded-xl shadow-md"
            >
              Submit Claim
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Upload Document Modal ── */}
      <Modal
        isOpen={!!showUpload}
        onClose={() => { setShowUpload(null); setFile(null); }}
        title="Upload Supporting Document"
      >
        <div className="space-y-5 py-2">
          <div
            className="text-sm p-4 rounded-xl flex items-start gap-3"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            <HiOutlineDocumentText className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Please upload clear, legible documents to support{' '}
              <strong style={{ color: 'var(--color-text)' }}>Claim #{showUpload}</strong>.
              Accepted formats are JPG, JPEG, and PDF.
            </p>
          </div>

          <div
            className={`group border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${file ? 'bg-opacity-10' : 'hover:bg-opacity-50'}`}
            style={{
              borderColor: file ? 'var(--color-success)' : 'var(--color-border)',
              backgroundColor: file ? 'var(--color-success)10' : 'transparent',
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {file ? (
              <div className="flex flex-col items-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-success)', color: 'white' }}
                >
                  <HiOutlineDocumentText className="w-7 h-7" />
                </div>
                <p className="text-base font-bold truncate max-w-xs" style={{ color: 'var(--color-text)' }}>
                  {file.name}
                </p>
                <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-success)' }}>
                  File ready to upload
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  <HiOutlineCloudUpload className="w-7 h-7" style={{ color: 'var(--color-primary)' }} />
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                  Click to browse files
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Maximum file size: 5MB
                </p>
              </div>
            )}

            <input
              id="file-upload"
              type="file"
              accept=".jpg,.jpeg,.pdf"
              className="hidden"
              onChange={(e) => {
                 if (e.target.files && e.target.files[0]) {
                   setFile(e.target.files[0]);
                 }
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-4" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="ghost" className="rounded-xl" onClick={() => { setShowUpload(null); setFile(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUploadDoc} loading={submitting} disabled={!file} className="rounded-xl shadow-md">
              Confirm Upload
            </Button>
          </div>
        </div>
      </Modal>
      <div className="tab-spacer mob-only" />
    </div>
  );
}
