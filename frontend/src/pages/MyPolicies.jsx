import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { policyAPI } from '../services/api';
import { HiDocumentText, HiCalendar, HiCurrencyRupee } from 'react-icons/hi';
import { PageHeader, Card, Badge } from '../components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../components/UI';
import { Link } from 'react-router-dom';

export default function MyPolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await policyAPI.getUserPolicies(user.id);
      setPolicies(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolicies(); }, []);

  const filtered = filter === 'ALL' ? policies : policies.filter((p) => p.status === filter);
  const statusFilters = ['ALL', 'ACTIVE', 'EXPIRED', 'CANCELLED'];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchPolicies} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="My Policies"
        subtitle="View and manage your purchased insurance policies"
        action={
          <Link to="/policies"
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            Browse Policies
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: filter === s ? 'var(--color-primary)' : 'var(--color-surface)',
              color: filter === s ? '#fff' : 'var(--color-text-secondary)',
              border: `1px solid ${filter === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            {s === 'ALL' ? `All (${policies.length})` : `${s} (${policies.filter((p) => p.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={HiDocumentText}
          title="No Policies Found"
          description={filter === 'ALL' ? "You haven't purchased any policies yet" : `No ${filter} policies`}
          action={
            <Link to="/policies" className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              Browse Policies
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {filtered.map((policy) => (
            <Card key={policy.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)15' }}>
                  <HiDocumentText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                </div>
                <Badge status={policy.status} />
              </div>

              <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--color-text)' }}>{policy.policyName}</h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <HiCurrencyRupee className="w-4 h-4" />
                    Premium
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>₹{policy.premiumAmount?.toLocaleString()}/mo</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <HiCalendar className="w-4 h-4" />
                    Start Date
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{policy.startDate || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <HiCalendar className="w-4 h-4" />
                    End Date
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{policy.endDate || 'N/A'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
