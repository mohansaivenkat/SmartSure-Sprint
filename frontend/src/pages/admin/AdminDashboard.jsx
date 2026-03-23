import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { HiDocumentText, HiClipboardList, HiCurrencyRupee, HiTrendingUp, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { StatCard, PageHeader, Card } from '../../components/UI';
import LoadingSpinner, { ErrorMessage } from '../../components/UI';

export default function AdminDashboard() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getReports();
      setReports(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchReports} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System overview and key performance indicators"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 stagger-children">
        <StatCard icon={HiDocumentText} label="Total Policies" value={reports?.totalPolicies || 0} color="#6366f1" />
        <StatCard icon={HiClipboardList} label="Total Claims" value={reports?.totalClaims || 0} color="#06b6d4" />
        <StatCard icon={HiCheckCircle} label="Approved Claims" value={reports?.approvedClaims || 0} color="#10b981" />
        <StatCard icon={HiXCircle} label="Rejected Claims" value={reports?.rejectedClaims || 0} color="#ef4444" />
        <StatCard icon={HiCurrencyRupee} label="Total Revenue"
          value={`₹${(reports?.totalRevenue || 0).toLocaleString()}`} color="#f59e0b" />
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Claims Overview</h3>
          <div className="space-y-4">
            {[
              { label: 'Approved', value: reports?.approvedClaims || 0, total: reports?.totalClaims || 1, color: '#10b981' },
              { label: 'Rejected', value: reports?.rejectedClaims || 0, total: reports?.totalClaims || 1, color: '#ef4444' },
              { label: 'Pending', value: (reports?.totalClaims || 0) - (reports?.approvedClaims || 0) - (reports?.rejectedClaims || 0), total: reports?.totalClaims || 1, color: '#f59e0b' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{item.value}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min((item.value / item.total) * 100, 100)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Revenue Summary</h3>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, var(--color-primary)20, var(--color-accent)20)', border: '3px solid var(--color-primary)' }}>
                <div>
                  <HiTrendingUp className="w-8 h-8 mx-auto mb-1" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>₹{((reports?.totalRevenue || 0) / 1000).toFixed(1)}K</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Revenue Generated</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
