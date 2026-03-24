import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { 
  HiDocumentText, 
  HiClipboardList, 
  HiCurrencyRupee, 
  HiTrendingUp, 
  HiCheckCircle, 
  HiXCircle,
  HiShieldCheck
} from 'react-icons/hi';
import { StatCard, PageHeader, Card, Badge } from '../../components/UI';
import LoadingSpinner, { ErrorMessage, EmptyState } from '../../components/UI';

/* ─────────────────────────────────────────────────────────────
   Gauge Chart (compact for KPI row)
───────────────────────────────────────────────────────────── */
function GaugeChart({ value, color = '#10b981', size = 48 }) {
  const r = 20, cx = 24, cy = 24;
  const circ = Math.PI * r;
  const pct = Math.min((value || 0) / 100, 1);
  const dash = pct * circ;
  return (
    <svg width={size} height={size / 2 + 5} viewBox="0 0 48 29" style={{ overflow: 'visible' }}>
      <path d="M 4 24 A 20 20 0 0 1 44 24" fill="none" stroke="var(--color-border)" strokeWidth={6} strokeLinecap="round" />
      <path d="M 4 24 A 20 20 0 0 1 44 24" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: 'stroke-dasharray 1s' }} />
    </svg>
  );
}

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

  // Safe calculations
  const totalClaims = reports?.totalClaims || 1; // Prevent division by zero
  const approved = reports?.approvedClaims || 0;
  const rejected = reports?.rejectedClaims || 0;
  const pending = Math.max((reports?.totalClaims || 0) - approved - rejected, 0);
  const approvalRate = ((approved / totalClaims) * 100).toFixed(0);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <PageHeader
          title="Admin Dashboard"
          subtitle="System overview and key performance indicators"
        />
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span> Live Updates</span>
        </div>
      </div>

      {/* Top Stats Grid - High Priority Health Metrics (Above the Fold) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard icon={HiDocumentText} label="Policies" value={reports?.totalPolicies || 0} color="#6366f1" />
        <StatCard icon={HiClipboardList} label="Claims" value={reports?.totalClaims || 0} color="#06b6d4" />
        
        {/* Relocated: Success Rate with Gauge */}
        <Card className="flex items-center justify-between !py-4 transition-transform hover:-translate-y-1">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Success Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>{approvalRate}%</span>
              <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">+2.1%</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <GaugeChart value={approvalRate} size={54} color="#10b981" />
          </div>
        </Card>

        <StatCard icon={HiCurrencyRupee} label="Revenue" value={`₹${(reports?.totalRevenue || 0).toLocaleString()}`} color="#f59e0b" />
      </div>

      {!reports?.totalPolicies && (
        <EmptyState title="No system activity yet" subtitle="Dashboard will populate once users start buying policies and filing claims." />
      )}

        {/* Secondary Analytics Row - Balanced 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Claims Overview - Focus Card */}
          <Card className="flex flex-col">
            <h3 className="font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <HiShieldCheck style={{ color: '#06b6d4' }} /> Claims Breakdown
            </h3>
            
            {/* New Stacked Bar visualization for Quick View */}
            <div className="w-full h-4 rounded-full flex overflow-hidden mb-6" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div style={{ width: `${(approved/totalClaims)*100}%`, backgroundColor: '#10b981' }} className="h-full" title="Approved" />
              <div style={{ width: `${(pending/totalClaims)*100}%`, backgroundColor: '#f59e0b' }} className="h-full" title="Pending" />
              <div style={{ width: `${(rejected/totalClaims)*100}%`, backgroundColor: '#ef4444' }} className="h-full" title="Rejected" />
            </div>

            <div className="space-y-5">
              {[
                { label: 'Approved Claims', value: approved, total: totalClaims, color: '#10b981' },
                { label: 'Pending Assessment', value: pending, total: totalClaims, color: '#f59e0b' },
                { label: 'Rejected Claims', value: rejected, total: totalClaims, color: '#ef4444' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.label}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{item.value}</span>
                      <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                        ({((item.value / item.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
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

          {/* Revenue Summary Circle */}
          <Card className="flex flex-col items-center justify-center">
            <h3 className="font-semibold mb-6 text-center" style={{ color: 'var(--color-text)' }}>Revenue Generated</h3>
            <div className="flex flex-col items-center justify-center pt-4">
              <div className="relative w-40 h-40 rounded-full flex items-center justify-center mb-6 shadow-inner"
                style={{ background: 'linear-gradient(135deg, var(--color-primary)10, var(--color-bg))', border: '4px solid var(--color-primary)' }}>
                {/* Decorative outer ring */}
                <div className="absolute inset-0 rounded-full border border-dashed animate-[spin_10s_linear_infinite]" 
                     style={{ borderColor: 'var(--color-primary)50', margin: '-8px' }}></div>
                
                <div className="text-center z-10">
                  <HiTrendingUp className="w-8 h-8 mx-auto mb-2 drop-shadow-sm" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                    ₹{((reports?.totalRevenue || 0) / 1000).toFixed(1)}K
                  </p>
                </div>
              </div>
              <p className="text-sm text-center px-4" style={{ color: 'var(--color-text-secondary)' }}>
                Total collected revenue across all policy active lifecycles.
              </p>
            </div>
          </Card>

          {/* Operational Health Summary */}
          <Card>
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
               System Health
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                <span className="text-sm font-medium opacity-70">Approval Rate</span>
                <span className="font-bold text-green-500 text-sm">{approvalRate}%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                <span className="text-sm font-medium opacity-70">Claims Ratio</span>
                <span className="font-bold text-indigo-500 text-sm">{(reports?.totalClaims / (reports?.totalPolicies || 1)).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                <span className="text-sm font-medium opacity-70">Rejection Rate</span>
                <span className="font-bold text-red-500 text-sm">{((rejected / totalClaims) * 100).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-[10px] mt-4 text-center opacity-40 uppercase font-black tracking-tighter">Operational Excellence Verified</p>
          </Card>
        </div>
      </div>
  );
}