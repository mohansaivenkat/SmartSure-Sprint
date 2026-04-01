
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { policyAPI, paymentAPI } from '../services/api';
import { HiShieldCheck, HiClock, HiCurrencyRupee, HiDocumentText, HiSearch, HiCheckCircle } from 'react-icons/hi';
import { PageHeader, Card, Button } from '../components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

export default function Policies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [purchasing, setPurchasing] = useState(null);
  
  const [userPolicies, setUserPolicies] = useState([]);
  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await policyAPI.getAllPolicies();
      setPolicies(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load policies');
    } finally {
      setLoading(false);
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
    if (user?.id) fetchUserPolicies();
  }, [user?.id]);

  const handlePurchase = async (policy) => {
    setPurchasing(policy.id);
    try {
      // Step 1: Create Razorpay Order
      const userId = user?.id || user?.userId || user?._id;
      const policyId = policy?.id || policy?.policyId;
      const amount = Number(policy?.premiumAmount || policy?.amount || policy?.price);

      const paymentData = {
        userId,
        policyId,
        amount,
      };

      console.log('Sending payment data:', paymentData, { user, policy });

      if (!paymentData.userId || !paymentData.policyId || Number.isNaN(paymentData.amount) || paymentData.amount <= 0) {
        toast.error('Unable to initiate payment: invalid user/policy/amount. Please re-login and try again.');
        throw new Error('Invalid payment data: ensure logged in and selected policy amount is valid.');
      }
      const orderRes = await paymentAPI.createOrder(paymentData);
      console.log('Order response:', orderRes);

      const { orderId } = orderRes.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY, // Razorpay test key from env
        amount: Math.round(policy.premiumAmount * 100),
        currency: 'INR',
        name: 'SmartSure Insurance',
        description: `Purchase: ${policy.policyName}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Step 3: Verify Payment
            await paymentAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Step 4: Activate policy
            const purchasedPolicyRes = await policyAPI.purchasePolicy(policy.id);
            
            // Immediately update the local owned list to disable the button before redirect
            setUserPolicies(prev => [...prev, purchasedPolicyRes.data]);
            
            toast.success('Policy purchased successfully! Redirecting to your portfolio...');
            setTimeout(() => {
              navigate('/my-policies');
            }, 1500);
          } catch (err) {
            toast.error('Payment verified but policy activation failed. Contact support.');
          }
        },
        prefill: { email: user.email },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled');
          },
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback: direct purchase without payment
        const purchasedPolicyRes = await policyAPI.purchasePolicy(policy.id);
        setUserPolicies(prev => [...prev, purchasedPolicyRes.data]);
        toast.success('Policy purchased successfully! Redirecting...');
        setTimeout(() => navigate('/my-policies'), 1500);
      }
    } catch (err) {
      // If Payment service is down, allow direct purchase
      if (err.response?.status === 500 || err.code === 'ERR_NETWORK') {
        try {
          const purchasedPolicyRes = await policyAPI.purchasePolicy(policy.id);
          setUserPolicies(prev => [...prev, purchasedPolicyRes.data]);
          toast.success('Policy purchased successfully! Redirecting...');
          setTimeout(() => navigate('/my-policies'), 1500);
        } catch (purchaseErr) {
          const errorMsg = purchaseErr.response?.data?.message || 
                           (typeof purchaseErr.response?.data === 'string' ? purchaseErr.response.data : 'Failed to purchase policy');
          toast.error(String(errorMsg));
        }
      } else {
        const errorMsg = err.response?.data?.message || 
                         (typeof err.response?.data === 'string' ? err.response.data : 'Failed to initiate payment');
        toast.error(String(errorMsg));
      }
    } finally {
      setPurchasing(null);
    }
  };

  const filtered = policies.filter((p) => {
    const matchesSearch = p.policyName?.toLowerCase().includes(search.toLowerCase()) || 
                          p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || p.policyCategory === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPolicies = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchPolicies} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Insurance Policies"
        subtitle="Browse and purchase insurance plans that suit your needs"
      />

      {/* Advanced Search & Filter Panel */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 p-1.5 rounded-[2rem] flex flex-col lg:flex-row gap-3 items-stretch shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--color-border)] overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {/* Search Section */}
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
            className="w-full pl-14 pr-6 py-4 rounded-[1.75rem] text-sm outline-none transition-all focus:ring-[3px] ring-[var(--color-primary)] ring-opacity-10"
            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', border: '1px solid transparent' }}
          />
        </div>

        {/* Filter Section */}
        <div className="flex bg-[var(--color-bg)] rounded-[1.75rem] p-1.5 gap-1 overflow-x-auto hide-scrollbar">
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
                    backgroundColor: 'var(--color-primary)', 
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

      {filtered.length === 0 ? (
        <EmptyState icon={HiDocumentText} title="No Policies Found" description="Try adjusting your search or filters to find what you're looking for." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
          {currentPolicies.map((policy) => {
            const isHealth = policy.policyCategory === 'HEALTH';
            const isVehicle = policy.policyCategory === 'VEHICLE';
            const isLife = policy.policyCategory === 'LIFE';
            
            // Refined Palette: Cohesive and Professional
            const accentColor = isHealth ? '#059669' : isVehicle ? 'var(--color-primary)' : isLife ? '#7c3aed' : 'var(--color-primary)';
            const tintBg = isHealth ? '#ecfdf5' : isVehicle ? '#eef2ff' : isLife ? '#f5f3ff' : '#eef2ff';

            return (
              <Card key={policy.id} className="relative flex flex-col group transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-transparent hover:border-[var(--color-border)]" 
                style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
                
                {/* Visual Accent Layer */}
                <div className="absolute top-0 left-0 w-full h-1 opacity-[0.15] group-hover:opacity-100 transition-opacity" 
                     style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Category Chip */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border shadow-sm"
                         style={{ backgroundColor: tintBg, color: accentColor, borderColor: `${accentColor}20` }}>
                      {policy.policyCategory || 'Plan'}
                    </div>
                  </div>

                  {/* Icon & Title */}
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
                     style={{ color: 'var(--color-text-secondary)', minHeight: '4.5em' }}>
                    {policy.description}
                  </p>

                  {/* Core Value Stack */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Coverage</p>
                      <p className="text-sm font-black" style={{ color: 'var(--color-text)' }}>₹{(policy.coverageAmount/100000).toFixed(1)}L</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Duration</p>
                      <p className="text-sm font-black" style={{ color: 'var(--color-text)' }}>{policy.durationInMonths} Months</p>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t mb-6" style={{ borderColor: 'var(--color-border)' }} />

                    {/* Price & Purchase CTA */}
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-[10px] font-bold opacity-50 uppercase mb-0.5">Premium</p>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                            ₹{policy.premiumAmount?.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold opacity-50">/mo</span>
                        </div>
                      </div>

                      {userPolicies.some(up => up.policyId === policy.id && (up.status === 'ACTIVE' || up.status === 'PENDING_CANCELLATION' || up.status === 'CANCELLED')) ? (
                        <div className="px-5 py-2.5 text-xs font-bold shadow-sm flex items-center justify-center opacity-60 cursor-not-allowed"
                             style={{ borderRadius: '0.85rem', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                          <HiCheckCircle className="w-4 h-4 mr-1.5" />
                          Owned
                        </div>
                      ) : (
                        <Button
                          onClick={() => handlePurchase(policy)}
                          loading={purchasing === policy.id}
                          disabled={purchasing === policy.id}
                          className="px-5 py-2.5 text-xs font-bold shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
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

      {/* Redesigned Pagination */}
      {totalPages > 1 && (
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
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>of {totalPages}</span>
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
      )}
    </div>
  );
}