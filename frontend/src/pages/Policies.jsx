import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { policyAPI, paymentAPI } from '../services/api';
import { HiShieldCheck, HiClock, HiCurrencyRupee, HiDocumentText, HiSearch } from 'react-icons/hi';
import { PageHeader, Card, Button } from '../components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../components/UI';
import toast from 'react-hot-toast';

export default function Policies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [purchasing, setPurchasing] = useState(null);
  
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

  useEffect(() => { fetchPolicies(); }, []);

  const handlePurchase = async (policy) => {
    setPurchasing(policy.id);
    try {
      // Step 1: Create Razorpay Order
      const orderRes = await paymentAPI.createOrder({
        userId: user.id,
        policyId: policy.id,
        amount: policy.premiumAmount,
      });

      const { orderId } = orderRes.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        key: 'rzp_test_yourkeyhere', // Razorpay test key
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
            await policyAPI.purchasePolicy(policy.id);
            toast.success('Policy purchased successfully!');
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
        await policyAPI.purchasePolicy(policy.id);
        toast.success('Policy purchased successfully!');
      }
    } catch (err) {
      // If Payment service is down, allow direct purchase
      if (err.response?.status === 500 || err.code === 'ERR_NETWORK') {
        try {
          await policyAPI.purchasePolicy(policy.id);
          toast.success('Policy purchased successfully!');
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

  const filtered = policies.filter((p) =>
    p.policyName?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Search */}
      <div className="relative mb-6">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          id="policy-search"
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search policies..."
          className="w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={HiDocumentText} title="No Policies Found" description="No policies match your search criteria" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {currentPolicies.map((policy) => (
            <Card key={policy.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}>
                  <HiShieldCheck className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>{policy.policyName}</h3>
              <p className="text-sm mb-4 flex-1" style={{ color: 'var(--color-text-secondary)' }}>{policy.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <div className="flex items-center gap-1 mb-1">
                    <HiCurrencyRupee className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Premium</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>₹{policy.premiumAmount?.toLocaleString()}/mo</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <div className="flex items-center gap-1 mb-1">
                    <HiShieldCheck className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Coverage</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>₹{policy.coverageAmount?.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <HiClock className="w-4 h-4" />
                <span>{policy.durationInMonths} months duration</span>
              </div>

              <Button
                onClick={() => handlePurchase(policy)}
                loading={purchasing === policy.id}
                disabled={purchasing === policy.id}
                className="w-full"
              >
                <HiCurrencyRupee className="w-4 h-4" />
                Purchase Policy
              </Button>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
