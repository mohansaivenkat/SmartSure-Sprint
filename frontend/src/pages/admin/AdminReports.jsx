import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { HiDocumentText, HiClipboardList, HiCurrencyRupee, HiCheckCircle, HiXCircle, HiRefresh } from 'react-icons/hi';
import { PageHeader, Card, Button, StatCard } from '../../components/UI';
import LoadingSpinner, { ErrorMessage } from '../../components/UI';
import toast from 'react-hot-toast';

export default function AdminReports() {
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
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchReports} />;

  const claimApprovalRate = reports?.totalClaims
    ? ((reports.approvedClaims / reports.totalClaims) * 100).toFixed(1)
    : 0;

  const claimRejectionRate = reports?.totalClaims
    ? ((reports.rejectedClaims / reports.totalClaims) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Comprehensive system analytics and insights"
        action={
          <Button variant="outline" onClick={() => { fetchReports(); toast.success('Reports refreshed!'); }}>
            <HiRefresh className="w-4 h-4" /> Refresh
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 stagger-children">
        <StatCard icon={HiDocumentText} label="Total Policies Sold" value={reports?.totalPolicies || 0} color="#6366f1" />
        <StatCard icon={HiClipboardList} label="Total Claims" value={reports?.totalClaims || 0} color="#06b6d4" />
        <StatCard icon={HiCheckCircle} label="Approved Claims" value={reports?.approvedClaims || 0} color="#10b981" trend={`${claimApprovalRate}%`} />
        <StatCard icon={HiXCircle} label="Rejected Claims" value={reports?.rejectedClaims || 0} color="#ef4444" trend={`${claimRejectionRate}%`} />
        <StatCard icon={HiCurrencyRupee} label="Total Revenue" value={`₹${(reports?.totalRevenue || 0).toLocaleString()}`} color="#f59e0b" />
      </div>

      {/* Detailed Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Claims Breakdown */}
        <Card>
          <h3 className="font-semibold mb-5" style={{ color: 'var(--color-text)' }}>Claims Breakdown</h3>
          <div className="space-y-5">
            {[
              { label: 'Approved', value: reports?.approvedClaims || 0, color: '#10b981', icon: HiCheckCircle },
              { label: 'Rejected', value: reports?.rejectedClaims || 0, color: '#ef4444', icon: HiXCircle },
              { label: 'Pending', value: Math.max(0, (reports?.totalClaims || 0) - (reports?.approvedClaims || 0) - (reports?.rejectedClaims || 0)), color: '#f59e0b', icon: HiClipboardList },
            ].map((item) => {
              const pct = reports?.totalClaims ? (item.value / reports.totalClaims) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{item.value}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ backgroundColor: 'var(--color-bg)' }}>
                    <div
                      className="h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Revenue Summary */}
        <Card>
          <h3 className="font-semibold mb-5" style={{ color: 'var(--color-text)' }}>Revenue Summary</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #6366f110, #06b6d410)' }}>
              <div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Revenue</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>₹{(reports?.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <HiCurrencyRupee className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Avg Revenue per Policy</p>
                <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  ₹{reports?.totalPolicies ? Math.round(reports.totalRevenue / reports.totalPolicies).toLocaleString() : 0}
                </p>
              </div>
              <HiDocumentText className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Claims to Policy Ratio</p>
                <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {reports?.totalPolicies ? ((reports.totalClaims / reports.totalPolicies) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <HiClipboardList className="w-8 h-8" style={{ color: 'var(--color-warning)' }} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
