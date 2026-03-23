import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { policyAPI, claimsAPI } from '../services/api';
import { HiDocumentText, HiClipboardList, HiCurrencyRupee, HiShieldCheck, HiArrowRight, HiPlus } from 'react-icons/hi';
import { StatCard, PageHeader, Card, Badge } from '../components/UI';
import LoadingSpinner, { ErrorMessage } from '../components/UI';

export default function Dashboard() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [policiesRes, claimsRes] = await Promise.all([
        policyAPI.getUserPolicies(user.id),
        claimsAPI.getClaimsByUser(user.id),
      ]);
      setPolicies(policiesRes.data);
      setClaims(claimsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  const activePolicies = policies.filter((p) => p.status === 'ACTIVE');
  const totalPremium = activePolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
  const pendingClaims = claims.filter((c) => ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={`Welcome, ${user.name || 'Customer'}`}
        subtitle="Here&apos;s an overview of your insurance portfolio"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard icon={HiDocumentText} label="Active Policies" value={activePolicies.length} color="#6366f1" />
        <StatCard icon={HiClipboardList} label="Total Claims" value={claims.length} color="#06b6d4" />
        <StatCard icon={HiCurrencyRupee} label="Monthly Premium" value={`₹${totalPremium.toLocaleString()}`} color="#10b981" />
        <StatCard icon={HiShieldCheck} label="Pending Claims" value={pendingClaims.length} color="#f59e0b" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link to="/policies">
          <Card hoverable>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                  <HiPlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>Browse Policies</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Find and purchase insurance plans</p>
                </div>
              </div>
              <HiArrowRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </Card>
        </Link>
        <Link to="/my-claims">
          <Card hoverable>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #22d3ee)' }}>
                  <HiClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>File a Claim</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Submit and track your claims</p>
                </div>
              </div>
              <HiArrowRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Policies & Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Recent Policies</h3>
            <Link to="/my-policies" className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>View all</Link>
          </div>
          {policies.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>No policies yet</p>
          ) : (
            <div className="space-y-3">
              {policies.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{p.policyName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>₹{p.premiumAmount}/mo</p>
                  </div>
                  <Badge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Recent Claims</h3>
            <Link to="/my-claims" className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>View all</Link>
          </div>
          {claims.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>No claims yet</p>
          ) : (
            <div className="space-y-3">
              {claims.slice(0, 4).map((c) => (
                <div key={c.claimId} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Claim #{c.claimId}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>₹{c.claimAmount}</p>
                  </div>
                  <Badge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
