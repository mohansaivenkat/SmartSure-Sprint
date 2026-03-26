import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { policyAPI, paymentAPI } from '../services/api';
import { 
  HiDocumentText, 
  HiCalendar, 
  HiCurrencyRupee, 
  HiExclamationCircle, 
  HiCheckCircle,
  HiShieldCheck
} from 'react-icons/hi';
import { PageHeader, Card, Badge } from '../components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../components/UI';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MyPolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [paying, setPaying] = useState(null);

  const fetchPolicies = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await policyAPI.getUserPolicies(user.id);
      setPolicies(res.data);
    } catch (err) {
      console.error('MyPolicies fetch error:', err);
      setError(err.response?.data?.message || err.response?.data || 'Failed to load your policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user?.id) {
      fetchPolicies(); 
    }
  }, [user?.id]);

  const filtered = filter === 'ALL' ? policies : policies.filter((p) => p.status === filter);
  const statusFilters = ['ALL', 'ACTIVE', 'PENDING_CANCELLATION', 'EXPIRED', 'CANCELLED'];

  const handleRequestCancellation = async (policyId) => {
    if (!confirm('Are you sure you want to formally request cancellation for this policy?')) return;
    try {
      await policyAPI.requestCancellation(policyId);
      toast.success('Cancellation request submitted successfully!');
      fetchPolicies();
    } catch (err) {
      const msg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : 'Failed to submit cancellation request');
      toast.error(msg);
    }
  };

  const handlePayPremium = async (policy) => {
    setPaying(policy.id);
    try {
      const orderRes = await paymentAPI.createOrder({
        userId: user.id,
        policyId: policy.id,
        amount: policy.outstandingBalance,
      });

      const { orderId } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: Math.round(policy.outstandingBalance * 100),
        currency: 'INR',
        name: 'SmartSure Insurance',
        description: `Premium Payment: ${policy.policyName}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            await paymentAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            await policyAPI.payPremium(policy.id, policy.outstandingBalance);
            toast.success('Premium balance cleared successfully!');
            fetchPolicies();
          } catch (err) {
            toast.error('Payment verified but backend update failed. Contact support.');
          }
        },
        prefill: { email: user.email },
        theme: { color: '#6366f1' },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        await policyAPI.payPremium(policy.id, policy.outstandingBalance);
        toast.success('Premium balance cleared successfully!');
        fetchPolicies();
      }
    } catch (err) {
      if (err.response?.status === 500 || err.code === 'ERR_NETWORK') {
        try {
          await policyAPI.payPremium(policy.id, policy.outstandingBalance);
          toast.success('Premium balance cleared successfully!');
          fetchPolicies();
        } catch (paymentErr) {
          toast.error(paymentErr.response?.data?.message || 'Failed to process payment');
        }
      } else {
        toast.error(err.response?.data?.message || 'Failed to initiate payment');
      }
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchPolicies} />;

  // Helper to format filter labels nicely
  const formatFilterLabel = (str) => {
    if (str === 'ALL') return 'All Policies';
    return str.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="My Portfolio"
        subtitle="Manage your active coverage, payments, and policy lifecycles"
        action={
          <Link to="/policies"
            className="px-6 py-3 rounded-full text-sm font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
            + Explore New Policies
          </Link>
        }
      />

      {/* Advanced Status Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 p-1.5 rounded-full flex gap-1 items-center bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm overflow-x-auto hide-scrollbar"
      >
        {statusFilters.map((s) => {
          const count = s === 'ALL' ? policies.length : policies.filter((p) => p.status === s).length;
          const isActive = filter === s;
          
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${isActive ? '' : 'hover:opacity-70'}`}
              style={{ color: isActive ? '#fff' : 'var(--color-text-secondary)' }}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeStatusFilter"
                  className="absolute inset-0 shadow-md z-0"
                  style={{ 
                    backgroundColor: 'var(--color-primary)', 
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{formatFilterLabel(s)}</span>
              <span className={`relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] transition-colors duration-300`}
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-bg)', color: isActive ? '#fff' : 'var(--color-text)' }}>
                {count}
              </span>
            </button>
          )
        })}
      </motion.div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={HiShieldCheck}
          title="No Policies Found"
          description={filter === 'ALL' ? "You haven't purchased any policies yet. Secure your future today." : `You currently have no ${formatFilterLabel(filter).toLowerCase()} policies.`}
          action={
            <Link to="/policies" className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              Browse Available Plans
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {filtered.map((policy) => (
            <Card key={policy.id} className="relative flex flex-col group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border" 
                  style={{ borderColor: 'var(--color-border)', borderRadius: '1.25rem' }}>
              
              {/* Header: Icon & Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, var(--color-primary)15, var(--color-bg))' }}>
                  <HiDocumentText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                </div>
                <Badge status={policy.status} />
              </div>

              {/* Title */}
              <h3 className="text-base font-bold mb-5 leading-tight truncate" style={{ color: 'var(--color-text)' }}>
                {policy.policyName}
              </h3>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 opacity-60" style={{ color: 'var(--color-text-secondary)' }}>
                    <HiCurrencyRupee /> Premium
                  </p>
                  <p className="text-[13px] font-bold" style={{ color: 'var(--color-text)' }}>₹{policy.premiumAmount?.toLocaleString()}<span className="text-[10px] font-normal opacity-50">/mo</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 opacity-60" style={{ color: 'var(--color-text-secondary)' }}>
                    <HiCalendar /> Term
                  </p>
                  <p className="text-[13px] font-bold" style={{ color: 'var(--color-text)' }}>{policy.durationInMonths || 12}m</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-60" style={{ color: 'var(--color-text-secondary)' }}>Start Date</p>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>{policy.startDate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-60" style={{ color: 'var(--color-text-secondary)' }}>End Date</p>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>{policy.endDate || 'N/A'}</p>
                </div>
              </div>

              {/* Highlighted Payment/Status Box */}
              {['ACTIVE', 'PENDING_CANCELLATION'].includes(policy.status) ? (
                <div className="mt-auto mb-5 p-3.5 rounded-xl border flex flex-col justify-center" 
                     style={{ 
                       height: '84px',
                       backgroundColor: policy.outstandingBalance > 0 ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                       borderColor: policy.outstandingBalance > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'
                     }}>
                  
                  <div className="flex justify-between items-center mb-1.5 opacity-70">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Payment Due</span>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--color-text)' }}>{policy.nextDueDate || '—'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-1 text-[12px] font-black" style={{ color: policy.outstandingBalance > 0 ? '#d97706' : '#059669' }}>
                      {policy.outstandingBalance > 0 ? <HiExclamationCircle className="w-4 h-4" /> : <HiCheckCircle className="w-4 h-4" />}
                      {policy.outstandingBalance > 0 ? 'Outstanding' : 'Paid'}
                    </div>
                    <span className={`text-base font-black ${policy.outstandingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ₹{policy.outstandingBalance?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-auto h-[84px] mb-5" /> // Spacer to maintain card height consistency
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-auto">
                {policy.outstandingBalance > 0 && (
                  <button
                    onClick={() => handlePayPremium(policy)}
                    disabled={paying === policy.id}
                    className="w-full py-2.5 rounded-lg text-xs font-black text-white transition-all bg-amber-500 hover:bg-amber-600 shadow-sm flex items-center justify-center gap-2"
                  >
                    {paying === policy.id ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      <>Pay Premium: ₹{policy.outstandingBalance?.toLocaleString()}</>
                    )}
                  </button>
                )}
                
                {policy.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleRequestCancellation(policy.id)}
                    className="w-full py-2 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-red-100 text-red-500 bg-red-50 
                    hover:bg-red-500 hover:text-white"
                  >
                    Request Cancellation
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}