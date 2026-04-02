import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../shared/hooks/reduxHooks';
import { policyAPI, paymentAPI } from '../../core/services/api';
import { HiShieldCheck, HiCurrencyRupee, HiArrowLeft, HiCheckCircle } from 'react-icons/hi';
import { PageHeader, Card, Button, LoadingSpinner, ErrorMessage } from '../../shared/components/UI';
import toast from 'react-hot-toast';

/* ─── tiny animation variants ─────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay } },
});

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

/* ─── small shimmer pill ───────────────────────────────────────────── */
function CategoryBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15, ease: 'backOut' }}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] rounded-full border"
      style={{ color, background: bg, borderColor: `${color}30` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: color }}
      />
      {label}
    </motion.span>
  );
}

/* ─── animated stat card ───────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  color,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp(delay)}
      className="relative overflow-hidden rounded-2xl p-5 border group"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      {/* accent glow corner */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
        style={{ background: color }}
      />
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50"
        style={{ color: 'var(--color-text)' }}
      >
        {label}
      </p>
      <p className="text-2xl font-black leading-none" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1 opacity-50" style={{ color: 'var(--color-text-secondary)' }}>
          {sub}
        </p>
      )}
    </motion.div>
  );
}

/* ─── main component ───────────────────────────────────────────────── */
export default function PolicyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [userPolicies, setUserPolicies] = useState<any[]>([]);

  useEffect(() => {
    if (id) fetchPolicyDetails();
    if (user?.id) fetchUserPolicies();
  }, [id, user?.id]);

  const fetchPolicyDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await policyAPI.getPolicyById(id!);
      setPolicy(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load policy details');
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

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please login to purchase an insurance policy.');
      navigate('/login');
      return;
    }

    setPurchasing(true);
    try {
      const paymentData = {
        userId: user.id,
        policyId: policy.id,
        amount: Number(policy.premiumAmount),
      };

      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error('Invalid payment amount.');
      }

      const orderRes = await paymentAPI.createOrder(paymentData);
      const { orderId } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_xxxxxx',
        amount: Math.round(policy.premiumAmount * 100),
        currency: 'INR',
        name: 'SmartSure Insurance',
        description: `Purchase: ${policy.policyName}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            await paymentAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            const purchasedPolicyRes = await policyAPI.purchasePolicy(policy.id);
            setUserPolicies((prev) => [...prev, purchasedPolicyRes.data]);
            toast.success('Policy purchased successfully! Redirecting...');
            setTimeout(() => navigate('/my-policies'), 1500);
          } catch (err) {
            toast.error('Payment verified but policy activation failed.');
          }
        },
        prefill: { email: user.email },
        theme: { color: '#6366f1' },
      };

      if ((window as any).Razorpay) {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        const purchasedPolicyRes = await policyAPI.purchasePolicy(policy.id);
        setUserPolicies((prev) => [...prev, purchasedPolicyRes.data]);
        toast.success('Policy purchased successfully! Redirecting...');
        setTimeout(() => navigate('/my-policies'), 1500);
      }
    } catch (err: any) {
      if (err.response?.status === 500 || err.code === 'ERR_NETWORK') {
        try {
          const purchasedPolicyRes = await policyAPI.purchasePolicy(policy.id);
          setUserPolicies((prev) => [...prev, purchasedPolicyRes.data]);
          toast.success('Policy purchased successfully! Redirecting...');
          setTimeout(() => navigate('/my-policies'), 1500);
        } catch (purchaseErr: any) {
          toast.error(purchaseErr.response?.data?.message || 'Failed to purchase policy');
        }
      } else {
        toast.error(err.message || 'Failed to initiate payment');
      }
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <div className="mt-16"><LoadingSpinner /></div>;
  if (error) return <div className="mt-16"><ErrorMessage message={error} onRetry={fetchPolicyDetails} /></div>;
  if (!policy) return <div className="mt-16"><ErrorMessage message="Policy not found." /></div>;

  /* ── derived values ── */
  const isHealth = policy.policyCategory === 'HEALTH';
  const isVehicle = policy.policyCategory === 'VEHICLE';
  const isLife = policy.policyCategory === 'LIFE';

  const accentColor = isHealth
    ? '#059669'
    : isVehicle
    ? '#06b6d4'
    : isLife
    ? '#7c3aed'
    : '#6366f1';

  const tintBg = `${accentColor}15`;

  const isOwned = userPolicies.some(
    (up) => up.policyId === policy.id && (up.status === 'ACTIVE' || up.status === 'PENDING_CANCELLATION')
  );
  const isPending = userPolicies.find(
    (up) => up.policyId === policy.id && up.status === 'PENDING_CANCELLATION'
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

      {/* ── back button ── */}
      <motion.button
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--color-text)' }}
      >
        <HiArrowLeft className="w-4 h-4" />
        Back
      </motion.button>

      {/* ── hero banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border"
        style={{
          borderColor: `${accentColor}25`,
          background: `linear-gradient(135deg, ${accentColor}12 0%, ${accentColor}04 60%, transparent 100%)`,
        }}
      >
        {/* large blurred orb */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }}
        />

        {/* subtle grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">

            {/* left: icon + name */}
            <div className="flex items-start gap-5">
              <motion.div
                initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.15, ease: 'backOut' }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}10)`,
                  border: `1.5px solid ${accentColor}30`,
                  boxShadow: `0 8px 32px ${accentColor}25`,
                }}
              >
                <HiShieldCheck className="w-8 h-8" style={{ color: accentColor }} />
              </motion.div>

              <div className="pt-0.5 space-y-2">
                <CategoryBadge
                  label={policy.policyCategory || 'Plan'}
                  color={accentColor}
                  bg={tintBg}
                />
                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="text-2xl md:text-3xl font-black leading-tight tracking-tight"
                  style={{ color: 'var(--color-text)' }}
                >
                  {policy.policyName}
                </motion.h1>
              </div>
            </div>

            {/* right: premium pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.3, ease: 'backOut' }}
              className="flex flex-col items-center justify-center rounded-2xl px-8 py-5 border shrink-0"
              style={{
                borderColor: `${accentColor}30`,
                background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}06)`,
                boxShadow: `0 4px 24px ${accentColor}15`,
              }}
            >
              <p
                className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50"
                style={{ color: 'var(--color-text)' }}
              >
                Monthly Premium
              </p>
              <div className="flex items-end gap-0.5">
                <span
                  className="text-4xl font-black tracking-tighter leading-none"
                  style={{ color: accentColor }}
                >
                  ₹{policy.premiumAmount?.toLocaleString()}
                </span>
                <span
                  className="text-sm font-bold pb-1 opacity-50"
                  style={{ color: 'var(--color-text)' }}
                >
                  /mo
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── stat cards row ── */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-2 gap-4"
      >
        <StatCard
          label="Coverage Amount"
          value={`₹${((policy.coverageAmount || 0) / 100000).toFixed(1)}L`}
          sub="Sum Insured"
          color={accentColor}
          delay={0.35}
        />
        <StatCard
          label="Policy Duration"
          value={`${policy.durationInMonths}`}
          sub="Months"
          color={accentColor}
          delay={0.42}
        />
      </motion.div>

      {/* ── description card ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border p-8 space-y-4"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          boxShadow: '0 4px 20px var(--color-shadow)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-5 rounded-full"
            style={{ background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}40)` }}
          />
          <h2
            className="text-base font-black uppercase tracking-widest opacity-70"
            style={{ color: 'var(--color-text)' }}
          >
            About This Policy
          </h2>
        </div>
        <p
          className="text-base leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {policy.description}
        </p>
      </motion.div>

      {/* ── CTA footer ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="flex justify-end"
      >
        <AnimatePresence mode="wait">
          {isOwned ? (
            <motion.div
              key="owned"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border text-sm font-bold opacity-60 cursor-not-allowed"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <HiCheckCircle className="w-5 h-5" />
              {isPending ? 'Pending Cancellation' : 'You currently own this policy'}
            </motion.div>
          ) : (
            <motion.div key="buy" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handlePurchase}
                loading={purchasing}
                disabled={purchasing}
                className="relative overflow-hidden px-8 py-4 text-sm font-black tracking-wide rounded-2xl flex items-center gap-2 shadow-xl transition-shadow hover:shadow-2xl"
                style={{
                  backgroundColor: accentColor,
                  color: '#fff',
                  boxShadow: `0 8px 32px ${accentColor}45`,
                }}
              >
                {/* shimmer sweep */}
                <span
                  className="absolute inset-0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                  }}
                />
                <HiCurrencyRupee className="w-5 h-5" />
                Purchase Policy
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}