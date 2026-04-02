import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../shared/hooks/reduxHooks';
import { selectCurrentUser } from '../auth/store/authSlice';
import { policyAPI, claimsAPI } from '../../core/services/api';
import { HiDocumentText, HiClipboardList, HiCurrencyRupee, HiShieldCheck, HiArrowRight, HiPlus, HiLightningBolt } from 'react-icons/hi';
import { StatCard, PageHeader, Card, Badge, LoadingSpinner, ErrorMessage } from '../../shared/components/UI';

export default function Dashboard() {
  const user = useAppSelector(selectCurrentUser);
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const [policiesRes, claimsRes] = await Promise.all([
        policyAPI.getUserPolicies(user.id),
        claimsAPI.getClaimsByUser(user.id),
      ]);
      setPolicies(policiesRes.data);
      setClaims(claimsRes.data);
    } catch (err: any) {
      console.error('Dashboard error:', err);
      setError(err.response?.data?.message || err.response?.data || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user?.id) {
      fetchData(); 
    }
  }, [user?.id]);

  // Stats Logic
  const activePolicies = policies.filter((p) => p.status === 'ACTIVE');
  const totalPremium = activePolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
  const pendingClaims = claims.filter(c => ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status));

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title={`Welcome back, ${(user?.name || 'User').split(' ')[0]}`}
        subtitle="Here's a synchronized overview of your insurance portfolio"
      />

      {/* 1. TOP LEVEL KPI GRID (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard 
          icon={HiDocumentText} 
          label="Active Policies" 
          value={activePolicies.length} 
          color="var(--color-primary)" 
        />
        <StatCard 
          icon={HiCurrencyRupee} 
          label="Monthly Premium" 
          value={`₹${totalPremium.toLocaleString()}`} 
          color="var(--color-success)" 
        />
        <StatCard 
          icon={HiClipboardList} 
          label="Total Claims" 
          value={claims.length} 
          color="var(--color-accent)" 
        />
        <StatCard 
          icon={HiShieldCheck} 
          label="Pending Claims" 
          value={pendingClaims.length} 
          color="var(--color-warning)" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 2. PRIMARY VIEW: Active Subscriptions Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Active Subscriptions</h3>
              <Link to="/my-policies" className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>View All Policies</Link>
            </div>
            
            {activePolicies.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No active subscriptions found</p>
                <Link to="/policies">
                  <button className="mt-4 px-6 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ backgroundColor: 'var(--color-primary)' }}>
                    Purchase Insurance
                  </button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-0">
                      <th className="pb-4 text-xs font-bold uppercase tracking-wider text-text-secondary opacity-60">Plan Details</th>
                      <th className="pb-4 text-xs font-bold uppercase tracking-wider text-text-secondary opacity-60">Premium</th>
                      <th className="pb-4 text-xs font-bold uppercase tracking-wider text-right text-text-secondary opacity-60">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0">
                    {activePolicies.slice(0, 5).map((p) => (
                      <tr key={p.id} className="group hover:bg-[var(--color-bg)] transition-colors">
                        <td className="py-4">
                          <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{p.policyName}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>ID: #{p.id.toString().slice(-6)}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>₹{p.premiumAmount.toLocaleString()}</p>
                          <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>per month</p>
                        </td>
                        <td className="py-4 text-right">
                          <Badge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Recent Claims Section */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Recent Claim Activity</h3>
              <Link to="/my-claims" className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Claims History</Link>
            </div>
            {claims.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>No claim records yet</p>
            ) : (
              <div className="space-y-4">
                {claims.slice(0, 3).map((c) => (
                  <div key={c.claimId} className="flex items-center justify-between p-4 rounded-2xl shadow-sm" style={{ backgroundColor: 'var(--color-bg)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
                        <HiClipboardList className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Claim #{c.claimId}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>₹{c.claimAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 3. SIDEBAR: Quick Actions Vertical Stack (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--color-text-secondary)' }}>Quick Actions</h3>
            <div className="space-y-3">
              <QuickActionLink to="/policies" icon={HiPlus} label="Purchase New Policy" />
              <QuickActionLink to="/my-claims" icon={HiClipboardList} label="File a New Claim" />
              <QuickActionLink to="/my-policies" icon={HiDocumentText} label="Manage Subscriptions" />
            </div>
          </Card>
        </div>

      </div>
      <div className="tab-spacer mob-only" />
    </div>
  );
}

// Side-Nav Helper Component
function QuickActionLink({ to, icon: Icon, label }: { to: string, icon: import('react').ElementType, label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-4 rounded-xl transition-all hover:translate-x-1 hover:shadow-sm" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center p-1" style={{ backgroundColor: 'var(--color-surface)' }}>
        <Icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
      </div>
      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{label}</span>
      <HiArrowRight className="ml-auto w-4 h-4 opacity-30" />
    </Link>
  );
}
