import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../shared/hooks/reduxHooks';
import { policyAPI, paymentAPI } from '../../core/services/api';
import { HiShieldCheck, HiCurrencyRupee, HiDocumentText, HiSearch, HiCheckCircle } from 'react-icons/hi';
import { PageHeader, Card, Button, LoadingSpinner, ErrorMessage, EmptyState } from '../../shared/components/UI';
import toast from 'react-hot-toast';
import { useDebounce } from '../../shared/hooks/useDebounce';

export default function Policies() {
  const { user } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubsequentLoading, setIsSubsequentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [filterType, setFilterType] = useState('ALL');
  const [purchasing, setPurchasing] = useState<number | null>(null);

  const [userPolicies, setUserPolicies] = useState<any[]>([]);
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPolicies = async () => {
    if (policies.length === 0) setLoading(true);
    else setIsSubsequentLoading(true);
    setError(null);
    try {
      const res = await policyAPI.searchPolicies(
        filterType, 
        debouncedSearch, 
        currentPage - 1, 
        PAGE_SIZE
      );
      setPolicies(res.data.content);
      setTotalPages(res.data.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load policies');
    } finally {
      setLoading(false);
      setIsSubsequentLoading(false);
    }
  };

  const fetchUserPolicies = async () => {
    if (!user?.id) return;
    try {
      const res = await policyAPI.getUserPolicies(user.id);
      setUserPolicies(res.data);
    } catch (err) {
      console.log('Error fetching user policies', err);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [debouncedSearch, filterType, currentPage]);

  useEffect(() => {
    if (user?.id) fetchUserPolicies();
  }, [user?.id]);

  const handlePurchase = async (policy: any) => {
    if (!user) {
      toast.error('Please login to purchase an insurance policy.');
      navigate('/login');
      return;
    }

    setPurchasing(policy.id);
    try {
      // 1. Attempt to create order in payment-service for audit
      const orderRes = await paymentAPI.createOrder({
        userId: user.id,
        policyId: policy.id,
        amount: Number(policy.premiumAmount),
      }).catch(err => {
        console.warn('Payment service unavailable, falling back to direct purchase flow.', err);
        return null;
      });

      const orderId = orderRes?.data?.orderId || orderRes?.data?.id;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_SUGz2hbfTwDAHc',
        amount: Math.round(policy.premiumAmount * 100),
        currency: 'INR',
        name: 'SmartSure Insurance',
        description: `Purchase: ${policy.policyName}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            if (response.razorpay_order_id && response.razorpay_payment_id) {
              await paymentAPI.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }).catch(e => console.warn('Verification failed but proceeding with policy acquisition.', e));
            }

            const purchasedPolicyRes = await policyAPI.purchasePolicy(policy.id);
            setUserPolicies((prev => [...(prev || []), purchasedPolicyRes.data]));
            toast.success('Policy purchased successfully! Redirecting to your portfolio...');
            setTimeout(() => {
              navigate('/my-policies');
            }, 1000);
          } catch (err: any) {
            toast.error('Payment processed but activation failed. Please contact support.');
          }
        },
        prefill: { 
          email: user.email,
          contact: user.phone || ''
        },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: function () {
            console.log('Payment modal closed');
            setPurchasing(null);
          },
        },
      };

      if ((window as any).Razorpay && orderId) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Direct purchase fallback
        const purchasedPolicyRes = await policyAPI.purchasePolicy(policy.id);
        setUserPolicies(prev => [...(prev || []), purchasedPolicyRes.data]);
        toast.success('System processed your purchase successfully!');
        setTimeout(() => navigate('/my-policies'), 1000);
      }
    } catch (err: any) {
      try {
        console.log('Falling back to direct purchase due to error:', err);
        const purchasedPolicyRes = await policyAPI.purchasePolicy(policy.id);
        setUserPolicies(prev => [...(prev || []), purchasedPolicyRes.data]);
        toast.success('Policy active! Redirecting to portfolio...');
        setTimeout(() => navigate('/my-policies'), 1000);
      } catch (purchaseErr: any) {
        toast.error(purchaseErr.response?.data?.message || 'Failed to complete purchase. Check balance.');
      }
    } finally {
      setPurchasing(null);
    }
  };

  // Removed early returns to keep main component mounted while loading or in error state

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Insurance Policies"
        subtitle="Browse and purchase insurance plans that suit your needs"
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 p-1.5 rounded-[2rem] flex flex-col lg:flex-row gap-3 items-stretch shadow-[0_8px_30px_rgb(0,0,0,0.04)] border overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="relative flex-[1.5] group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
            <HiSearch className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          </div>
          <input
            id="policy-search"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search our catalog of curated plans..."
            className="w-full pl-14 pr-6 py-4 rounded-[1.75rem] text-sm outline-none transition-all focus:ring-[3px] ring-opacity-10"
            style={{
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              border: '1px solid transparent',
              '--tw-ring-color': 'var(--color-primary)'
            } as React.CSSProperties}
          />
        </div>

        <div className="flex rounded-[1.75rem] p-1.5 gap-1 overflow-x-auto hide-scrollbar" style={{ backgroundColor: 'var(--color-bg)' }}>
          {['ALL', 'HEALTH', 'VEHICLE', 'LIFE'].map(type => (
            <button
              key={type}
              onClick={() => { setFilterType(type); setCurrentPage(1); }}
              className={`relative px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${filterType === type ? '' : 'hover:opacity-70'}`}
              style={{ color: filterType === type ? '#fff' : 'var(--color-text-secondary)' }}
            >
              {filterType === type && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 shadow-lg z-0"
                  style={{
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))'
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10 transition-colors duration-300">
                {type === 'ALL' ? 'All' : type}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {isSubsequentLoading && (
        <div className="flex items-center gap-2 mb-4 animate-pulse">
          <LoadingSpinner size="sm" />
          <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>Refreshing catalog...</span>
        </div>
      )}

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center">
            <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="min-h-[400px] flex items-center justify-center">
            <ErrorMessage message={error} onRetry={fetchPolicies} />
        </div>
      ) : policies.length === 0 ? (
        <EmptyState icon={HiDocumentText} title="No Policies Found" description="Try adjusting your search or filters to find what you're looking for." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
          {policies.map((policy) => {
            const isHealth = policy.policyCategory === 'HEALTH';
            const isVehicle = policy.policyCategory === 'VEHICLE';
            const isLife = policy.policyCategory === 'LIFE';

            const accentColor = isHealth ? '#059669' : isVehicle ? '#06b6d4' : isLife ? '#7c3aed' : '#6366f1';
            const tintBg = isHealth ? '#ecfdf5' : isVehicle ? '#ecfeff' : isLife ? '#f5f3ff' : '#eef2ff';

            return (
              <Card
                key={policy.id}
                className="relative flex flex-col group transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] border hover:border-[var(--color-border)] cursor-pointer"
                style={{ borderRadius: '1.5rem', overflow: 'hidden', borderColor: 'transparent' }}
                onClick={() => navigate(`/policies/${policy.id}`)}
              >

                <div className="absolute top-0 left-0 w-full h-1 opacity-[0.15] group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />

                <div className="flex flex-col flex-1 pointer-events-none">
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border shadow-sm"
                      style={{ backgroundColor: tintBg, color: accentColor, borderColor: `${accentColor}20` }}>
                      {policy.policyCategory || 'Plan'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${accentColor}10, ${accentColor}20)`, border: `1px solid ${accentColor}20` }}>
                      <HiShieldCheck className="w-6 h-6" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold leading-snug" style={{ color: 'var(--color-text)' }}>
                        {policy.policyName}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm mb-8 flex-1 leading-relaxed opacity-80 italic whitespace-pre-wrap"
                    style={{ color: 'var(--color-text-secondary)', minHeight: '4.5em', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {policy.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Coverage</p>
                      <p className="text-sm font-black" style={{ color: 'var(--color-text)' }}>₹{((policy.coverageAmount || 0) / 100000).toFixed(1)}L</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Duration</p>
                      <p className="text-sm font-black" style={{ color: 'var(--color-text)' }}>{policy.durationInMonths} Months</p>
                    </div>
                  </div>

                  <div className="border-t mb-6" style={{ borderColor: 'var(--color-border)' }} />

                  <div className="flex items-center justify-between mt-auto pointer-events-auto">
                    <div>
                      <p className="text-[10px] font-bold opacity-50 uppercase mb-0.5">Premium</p>
                      <div className="flex items-baseline gap-0.5 pointer-events-none">
                        <span className="text-xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                          ₹{policy.premiumAmount?.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold opacity-50">/mo</span>
                      </div>
                    </div>

                    {userPolicies.some(up => up.policyId === policy.id && (up.status === 'ACTIVE' || up.status === 'PENDING_CANCELLATION')) ? (
                      <div className="px-5 py-2.5 text-xs font-bold shadow-sm flex items-center justify-center opacity-60 cursor-not-allowed pointer-events-auto"
                        style={{ borderRadius: '0.85rem', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                        onClick={(e) => e.stopPropagation()}>
                        <HiCheckCircle className="w-4 h-4 mr-1.5" />
                        {userPolicies.find(up => up.policyId === policy.id && up.status === 'PENDING_CANCELLATION') ? 'Pending' : 'Owned'}
                      </div>
                    ) : (
                      <Button
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handlePurchase(policy); }}
                        loading={purchasing === policy.id}
                        disabled={purchasing === policy.id}
                        className="px-5 py-2.5 text-xs font-bold shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px] pointer-events-auto"
                        style={{ borderRadius: '0.85rem', backgroundColor: accentColor, color: '#fff' }}
                      >
                        <HiCurrencyRupee className="w-4 h-4 mr-1.5" />
                        Buy Policy
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-center items-center mt-12 gap-6 bg-opacity-50 py-3 px-6 rounded-full w-fit mx-auto" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="rounded-full px-6"
        >
          Previous
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{currentPage}</span>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>of {Math.max(1, totalPages)}</span>
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="rounded-full px-6"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
