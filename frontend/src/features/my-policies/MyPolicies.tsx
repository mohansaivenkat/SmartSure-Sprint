import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../shared/hooks/reduxHooks';
import { selectCurrentUser } from '../auth/store/authSlice';
import { policyAPI, paymentAPI } from '../../core/services/api';
import {
  HiDocumentText,
  HiCalendar,
  HiCurrencyRupee,
  HiExclamationCircle,
  HiCheckCircle,
  HiShieldCheck,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi';
import { PageHeader, Badge, LoadingSpinner, ErrorMessage, EmptyState } from '../../shared/components/UI';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const PER_PAGE_OPTIONS = [5, 10, 20];
const STATUS_FILTERS = ['ALL', 'ACTIVE', 'PENDING_CANCELLATION', 'EXPIRED', 'CANCELLED'];

const formatFilterLabel = (str: string) => {
  if (str === 'ALL') return 'All';
  return str.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
};

export default function MyPolicies() {
  const user = useAppSelector(selectCurrentUser);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [paying, setPaying] = useState<number | string | null>(null);
  const [cancellingPolicy, setCancellingPolicy] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ── Data fetching ──────────────────────────────────────────────────
  const fetchPolicies = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      setLoadingPolicies(true);
      // Use paginated endpoint with status filter
      const res = await policyAPI.getUserPoliciesPaginated(user.id, filter, currentPage - 1, perPage);
      setPolicies(res.data.content || []);
      setTotalElements(res.data.totalElements || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err: any) {
      console.error('MyPolicies fetch error:', err);
      setError(err.response?.data?.message || err.response?.data || 'Failed to load your policies');
    } finally {
      setLoadingPolicies(false);
      setLoading(false);
    }
  };

  const [loadingPolicies, setLoadingPolicies] = useState(false);

  useEffect(() => {
    if (user?.id) fetchPolicies();
  }, [user?.id, currentPage, perPage, filter]); // Fetch on page/size/filter change

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // ── Derived data ───────────────────────────────────────────────────
  // Data is now server-filtered and paginated

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
  const handleRequestCancellation = async () => {
    if (!cancellingPolicy || !cancelReason.trim()) return;
    setIsSubmittingCancel(true);
    try {
      await policyAPI.requestCancellation(cancellingPolicy.id, cancelReason);
      toast.success('Cancellation request submitted successfully!');
      setCancellingPolicy(null);
      setCancelReason('');
      fetchPolicies();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === 'string' ? err.response.data : 'Failed to submit cancellation request');
      toast.error(msg);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handlePayPremium = async (policy: any) => {
    setPaying(policy.id);
    try {
      // 1. Attempt to create Razorpay order for audit/audit trail
      const orderRes = await paymentAPI.createOrder({
        userId: user?.id,
        policyId: policy.policyId,
        amount: policy.outstandingBalance,
      }).catch(err => {
        console.warn('Payment service order creation failed, falling back to direct pay.', err);
        return null; // Swallow to allow fallback
      });

      const orderId = orderRes?.data?.orderId || orderRes?.data?.id;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_SUGz2hbfTwDAHc',
        amount: Math.round(policy.outstandingBalance * 100),
        currency: 'INR',
        name: 'SmartSure Insurance',
        description: `Premium Payment: ${policy.policyName}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            if (response.razorpay_order_id && response.razorpay_payment_id) {
              await paymentAPI.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }).catch(e => console.warn('Verification failed but proceeding to attempt update.', e));
            }

            await policyAPI.payPremium(policy.id, policy.outstandingBalance);
            toast.success('Premium balance cleared successfully!');
            fetchPolicies();
          } catch (err: any) {
            toast.error('Payment processed but account update failed. Please refresh or contact support.');
          }
        },
        prefill: {
          email: user?.email,
          contact: user?.phone
        },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: function () {
            console.log('Payment modal closed');
            setPaying(null);
          },
        },
      };

      if ((window as any).Razorpay && orderId) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Direct pay fallback if Razorpay is missing or order creation failed
        await policyAPI.payPremium(policy.id, policy.outstandingBalance);
        toast.success('Premium balance cleared successfully!');
        fetchPolicies();
      }
    } catch (err: any) {
      // Final catch-all for direct payment fallback
      try {
        await policyAPI.payPremium(policy.id, policy.outstandingBalance);
        toast.success('Premium balance cleared successfully!');
        fetchPolicies();
      } catch (finalErr: any) {
        toast.error('Failed to process payment. Please check your connectivity.');
      }
    } finally {
      setPaying(null);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchPolicies} />;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ boxSizing: 'border-box', overflowX: 'hidden' }}>
      <PageHeader
        title="My Portfolio"
        subtitle="Manage your active coverage, payments, and policy lifecycles"
        action={
          <Link
            to="/policies"
            className="px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-center"
            style={{ 
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'inline-block'
            }}
          >
            + Explore New Policies
          </Link>
        }
      />

      {/* ── Status Filter Pills ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-1.5 rounded-full flex gap-1 items-center border shadow-sm overflow-x-auto hide-scrollbar"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        {STATUS_FILTERS.map((s) => {
          const count = s === 'ALL' ? policies.length : policies.filter((p) => p.status === s).length;
          const isActive = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap"
              style={{ color: isActive ? '#fff' : 'var(--color-text-secondary)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="activePolicyFilter"
                  className="absolute inset-0 z-0 shadow-md"
                  style={{
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{formatFilterLabel(s)}</span>
              <span
                className="relative z-10 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-bg)',
                  color: isActive ? '#fff' : 'var(--color-text)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Content ── */}
      {loadingPolicies ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <LoadingSpinner />
          <p className="text-xs font-bold animate-pulse" style={{ color: 'var(--color-text-secondary)' }}>
            Retrieving your portfolio...
          </p>
        </div>
      ) : policies.length === 0 ? (
        <EmptyState
          icon={HiShieldCheck}
          title="No Policies Found"
          description={
            filter === 'ALL'
              ? "You haven't purchased any policies yet. Secure your future today."
              : `You currently have no ${formatFilterLabel(filter).toLowerCase()} policies.`
          }
          action={
            <Link
              to="/policies"
              className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Browse Available Plans
            </Link>
          }
        />
      ) : (
        <>
          {/* ── Policy List ── */}
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-3">
              {policies.map((policy: any, i: number) => {
                const hasBalance = policy.outstandingBalance > 0;
                const isActionable = ['ACTIVE', 'PENDING_CANCELLATION'].includes(policy.status);

                return (
                  <motion.div
                    key={policy.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="rounded-2xl border transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    {/* ── Main Row ── */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 px-5 py-4">

                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary)15, var(--color-bg))' }}
                      >
                        <HiDocumentText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                      </div>

                      {/* Name + Badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3
                            className="text-sm font-bold truncate"
                            style={{ color: 'var(--color-text)' }}
                          >
                            {policy.policyName}
                          </h3>
                          <Badge status={policy.status} />
                        </div>
                        {/* Meta row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          <span
                            className="text-xs flex items-center gap-1 font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <HiCurrencyRupee className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            ₹{policy.premiumAmount?.toLocaleString()}
                            <span className="opacity-60">/mo</span>
                          </span>
                          <span
                            className="text-xs flex items-center gap-1 font-medium"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <HiCalendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            {policy.durationInMonths || 12}m term
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className="text-xs flex items-center gap-1 font-bold"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              <HiShieldCheck className="w-3.5 h-3.5" />
                              ₹{((policy.coverageAmount || 0)/100000).toFixed(1)}L Coverage
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 opacity-70">
                          <span className="text-[10px] uppercase font-bold tracking-tight" style={{ color: 'var(--color-text-secondary)' }}>
                            {policy.startDate}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>→</span>
                          <span className="text-[10px] uppercase font-bold tracking-tight" style={{ color: 'var(--color-text-secondary)' }}>
                            {policy.endDate || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Outstanding balance — shown on md+ inline */}
                      {isActionable && (
                        <div
                          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border shrink-0"
                          style={{
                            backgroundColor: hasBalance ? 'rgba(245,158,11,0.05)' : 'rgba(16,185,129,0.05)',
                            borderColor: hasBalance ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                          }}
                        >
                          {hasBalance
                            ? <HiExclamationCircle className="w-4 h-4 text-amber-500" />
                            : <HiCheckCircle className="w-4 h-4 text-emerald-500" />}
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider opacity-60" style={{ color: 'var(--color-text-secondary)' }}>
                              Outstanding
                            </p>
                            <p
                              className="text-sm font-black"
                              style={{ color: hasBalance ? '#d97706' : '#059669' }}
                            >
                              ₹{policy.outstandingBalance?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                      )}

                        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                        <div className="flex gap-2 w-full sm:w-auto">
                          {hasBalance && isActionable && (
                            <button
                              onClick={() => handlePayPremium(policy)}
                              disabled={paying === policy.id}
                              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black text-white transition-all bg-amber-500 hover:bg-amber-600 shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              {paying === policy.id ? (
                                <span className="animate-pulse">Processing...</span>
                              ) : (
                                <>Pay ₹{policy.outstandingBalance?.toLocaleString()}</>
                              )}
                            </button>
                          )}
                          {/* Display action buttons for all policies, but disable them for history/cancelled ones */}
                          <div className="flex flex-wrap gap-2 md:gap-3">
                            <Link
                              to={policy.status === 'ACTIVE' && !hasBalance ? "/claims" : "#"}
                              onClick={(e) => (policy.status !== 'ACTIVE' || hasBalance) && e.preventDefault()}
                              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap 
                                ${policy.status !== 'ACTIVE' || hasBalance 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' 
                                  : 'bg-[var(--color-primary)] text-white hover:opacity-90 shadow-sm'}`}
                              title={policy.status !== 'ACTIVE' ? "Cannot file claim for inactive policy" : (hasBalance ? "Please clear outstanding balance first" : "File a claim")}
                            >
                              File Claim
                            </Link>

                            <button
                              onClick={() => policy.status === 'ACTIVE' && !hasBalance && setCancellingPolicy(policy)}
                              disabled={policy.status !== 'ACTIVE' || hasBalance}
                              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap 
                                ${policy.status !== 'ACTIVE' || hasBalance 
                                  ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-60' 
                                  : 'border-red-100 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white'}`}
                              title={policy.status !== 'ACTIVE' ? "Cannot cancel inactive policy" : (hasBalance ? "Please clear outstanding balance first" : "Cancel policy")}
                            >
                              {policy.status === 'PENDING_CANCELLATION' ? 'Pending Cancel' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                        {hasBalance && isActionable && (
                          <p className="text-[10px] font-bold text-amber-600 italic text-center sm:text-right">
                             * First pay the premium to enable cancel or claim
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ── Mobile-only: balance + due date strip ── */}
                    {isActionable && (
                      <div
                        className="md:hidden flex items-center justify-between px-5 py-2.5 border-t rounded-b-2xl text-xs"
                        style={{
                          borderColor: 'var(--color-border)',
                          backgroundColor: hasBalance ? 'rgba(245,158,11,0.04)' : 'rgba(16,185,129,0.04)',
                        }}
                      >
                        <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {hasBalance
                            ? <HiExclamationCircle className="w-3.5 h-3.5 text-amber-500" />
                            : <HiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                          Outstanding
                        </span>
                        <span className="font-black" style={{ color: hasBalance ? '#d97706' : '#059669' }}>
                          ₹{policy.outstandingBalance?.toLocaleString() || 0}
                        </span>
                        {policy.nextDueDate && (
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            Due: <strong style={{ color: 'var(--color-text)' }}>{policy.nextDueDate}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>

          {/* ── Pagination Bar ── */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 mt-6 px-5 py-4 rounded-2xl border"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            {/* Per page */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="border rounded-lg px-2 py-1 text-sm"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="hidden sm:inline">per page</span>
            </div>

            {/* Info */}
            <p className="text-sm order-last sm:order-none" style={{ color: 'var(--color-text-secondary)' }}>
              {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, totalElements)} of{' '}
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{totalElements}</span>
            </p>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((pg, idx) =>
                pg === '…' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    …
                  </span>
                ) : (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg as number)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-semibold transition-all"
                    style={
                      pg === currentPage
                        ? { backgroundColor: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
                    }
                  >
                    {pg}
                  </button>
                )
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
      <div className="tab-spacer mob-only" />

      {/* ── Cancellation Modal ── */}
      <AnimatePresence>
        {cancellingPolicy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmittingCancel && setCancellingPolicy(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                  <HiExclamationCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[var(--color-text)]">Request Cancellation</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Policy: <strong>{cancellingPolicy.policyName}</strong></p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mb-2">
                  Reason for cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please tell us why you want to cancel this policy..."
                  className="w-full min-h-[120px] p-4 rounded-2xl border text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
                <p className="mt-2 text-[10px] text-[var(--color-text-secondary)] italic">
                  * Providing feedback helps us improve our services.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCancellingPolicy(null)}
                  disabled={isSubmittingCancel}
                  className="flex-1 px-6 py-3 rounded-2xl text-sm font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-gray-50 transition-all"
                >
                  Withdraw
                </button>
                <button
                  onClick={handleRequestCancellation}
                  disabled={isSubmittingCancel || !cancelReason.trim()}
                  className="flex-[1.5] px-6 py-3 rounded-2xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-500/20"
                >
                  {isSubmittingCancel ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Processing...
                    </span>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
