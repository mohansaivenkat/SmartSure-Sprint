import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/api';
import {
  HiDocumentText, HiClipboardList, HiCurrencyRupee,
  HiCheckCircle, HiXCircle, HiRefresh, HiTrendingUp,
  HiChartBar, HiChartPie, HiScale
} from 'react-icons/hi';
import { PageHeader, Card, Button, StatCard } from '../../components/UI';
import LoadingSpinner, { ErrorMessage } from '../../components/UI';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────── */
const STYLES = `
  .rep-root { font-family: var(--font-family); }
  .rep-root .serif { font-family: var(--font-family); font-weight: 800; }
  .rep-root .mono  { font-family: 'JetBrains Mono', monospace; }

  /* KPI card */
  .kpi-card {
    padding: 20px 22px;
    border-radius: 20px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    display: flex; flex-direction: column; gap: 10px;
    transition: transform .16s, box-shadow .16s;
    position: relative; overflow: hidden;
  }
  .kpi-card::before {
    content: '';
    position: absolute; top: -30px; right: -30px;
    width: 90px; height: 90px; border-radius: 50%;
    opacity: .07;
    transition: opacity .2s;
  }
  .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px var(--color-border); }
  .kpi-card:hover::before { opacity: .13; }

  /* Section panel */
  .rep-panel {
    border-radius: 20px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    overflow: hidden;
  }
  .rep-panel-header {
    padding: 18px 22px 14px;
    border-bottom: 1px solid var(--color-border);
    display: flex; align-items: center; gap: 8px;
  }

  /* Progress bar */
  .prog-track {
    width: 100%; height: 8px; border-radius: 99px;
    background: var(--color-bg, #f1f5f9);
    overflow: hidden;
  }
  .prog-fill {
    height: 100%; border-radius: 99px;
    transition: width 1.2s cubic-bezier(.4,0,.2,1);
  }

  /* Donut SVG ring */
  .donut-svg { transform: rotate(-90deg); }
  .donut-track { fill: none; }
  .donut-seg { fill: none; stroke-linecap: round; transition: stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1); }

  /* Gauge arc */
  .gauge-svg { overflow: visible; }

  /* Mini bar chart */
  .bar-col {
    flex: 1; display: flex; flex-direction: column-reverse; align-items: center; gap: 4px;
  }
  .bar-rect {
    width: 100%; border-radius: 6px 6px 0 0;
    transition: height 1s cubic-bezier(.4,0,.2,1);
  }

  /* Scrollbar */
  .slim-scroll::-webkit-scrollbar { width: 4px; }
  .slim-scroll::-webkit-scrollbar-track { background: transparent; }
  .slim-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

  .c-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: .12em; text-transform: uppercase;
    color: var(--color-text-secondary); opacity: .65;
  }

  /* Skel */
  .skel {
    border-radius: 10px;
    background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp .3s ease forwards; }

  /* Refresh btn */
  .ref-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 12px;
    border: 1.5px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: border-color .15s, color .15s;
  }
  .ref-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }

  /* Legend dot */
  .leg-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
`;

/* ─────────────────────────────────────────────────────────────
   Donut Chart
───────────────────────────────────────────────────────────── */
function DonutChart({ segments, size = 160, stroke = 26 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;

  let offset = 0;
  const slices = segments.map(s => {
    const dash = (s.pct / 100) * circ;
    const gap = circ - dash;
    const slice = { ...s, dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <svg width={size} height={size} className="donut-svg">
      <circle cx={cx} cy={cy} r={r} className="donut-track" stroke="var(--color-border)" strokeWidth={stroke} />
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          className="donut-seg"
          stroke={s.color}
          strokeWidth={stroke - 4}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          style={{ opacity: s.pct === 0 ? 0 : 1 }}
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Gauge Chart (semi-circle)
───────────────────────────────────────────────────────────── */
function GaugeChart({ value, max = 100, color = '#6366f1', size = 160 }) {
  const r = 64; // increased from 58 for more internal space
  const cx = size / 2, cy = size / 2 + 18; // adjusted center
  const circ = Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;

  return (
    <svg width={size} height={size / 2 + 30} className="gauge-svg" viewBox={`0 0 ${size} ${size / 2 + 50}`}>
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="var(--color-border)" strokeWidth={18} strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={16} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Bar Chart (simple, inline SVG)
───────────────────────────────────────────────────────────── */
function BarChart({ bars, height = 90 }) {
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  const W = 340, H = height, pad = 18;
  const bw = Math.floor((W - pad * (bars.length + 1)) / bars.length);

  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} width="100%" style={{ overflow: 'visible' }}>
      {bars.map((b, i) => {
        const bh = Math.max(4, (b.value / maxVal) * H);
        const x = pad + i * (bw + pad);
        const y = H - bh;
        return (
          <g key={i}>
            <rect x={0} y={0} width={W} height={H} fill="none" />
            <rect
              x={x} y={y} width={bw} height={bh}
              rx={5} fill={b.color}
              style={{ opacity: .85, transition: 'height 1s cubic-bezier(.4,0,.2,1)', transformOrigin: `${x + bw / 2}px ${H}px` }}
            />
            <text x={x + bw / 2} y={H + 14} textAnchor="middle" fontSize={8.5} fontWeight={700}
              fontFamily="var(--font-family)" fill="var(--color-text-secondary)" opacity={.6}>
              {b.label}
            </text>
            <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize={9} fontWeight={700}
              fontFamily="JetBrains Mono, monospace" fill={b.color}>
              {b.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await adminAPI.getReports();
      setReports(res.data);
      if (quiet) toast.success('Reports refreshed!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchReports} />;

  /* ── Derived values ── */
  const total      = reports?.totalClaims    || 0;
  const approved   = reports?.approvedClaims || 0;
  const rejected   = reports?.rejectedClaims || 0;
  const pending    = Math.max(0, total - approved - rejected);
  const policies   = reports?.totalPolicies  || 0;
  const revenue    = reports?.totalRevenue   || 0;

  const approvalRate  = total ? +((approved / total) * 100).toFixed(1) : 0;
  const rejectionRate = total ? +((rejected / total) * 100).toFixed(1) : 0;
  const avgRevenue    = policies ? Math.round(revenue / policies) : 0;
  const claimRatio    = policies ? +((total / policies) * 100).toFixed(1) : 0;

  const claimsBreakdown = [
    { label: 'Approved', value: approved, color: '#10b981', pct: total ? (approved / total) * 100 : 0 },
    { label: 'Rejected', value: rejected, color: '#ef4444', pct: total ? (rejected / total) * 100 : 0 },
    { label: 'Pending',  value: pending,  color: '#f59e0b', pct: total ? (pending  / total) * 100 : 0 },
  ];

  const kpis = [
    { label: 'Total Policies', value: policies,  color: '#6366f1', icon: HiDocumentText,  mono: true },
    { label: 'Total Claims',   value: total,     color: '#06b6d4', icon: HiClipboardList, mono: true },
    { label: 'Approved',       value: approved,  color: '#10b981', icon: HiCheckCircle,   badge: `${approvalRate}%` },
    { label: 'Rejected',       value: rejected,  color: '#ef4444', icon: HiXCircle,       badge: `${rejectionRate}%` },
    { label: 'Total Revenue',  value: `₹${revenue.toLocaleString()}`, color: '#f59e0b', icon: HiCurrencyRupee },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="rep-root fade-up" style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="c-label" style={{ marginBottom: 8 }}>Admin Console</p>
            <h1 className="serif" style={{ fontSize: 36, color: 'var(--color-text)', lineHeight: 1.15, margin: 0 }}>
              Reports &amp; Analytics
            </h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8, maxWidth: 480 }}>
              Comprehensive system analytics — policy volume, claim outcomes, and revenue performance at a glance.
            </p>
          </div>
          <button className="ref-btn" onClick={() => fetchReports(true)} disabled={refreshing}>
            <HiRefresh style={{ width: 14, height: 14, ...(refreshing ? { animation: 'spin 1s linear infinite' } : {}) }} />
            Refresh
          </button>
        </div>

        {/* ── KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          {kpis.map(k => (
            <div key={k.label} className="kpi-card" style={{ '--kpi-color': k.color }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <k.icon style={{ width: 18, height: 18, color: k.color }} />
                </div>
                {k.badge && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: `${k.color}18`, color: k.color, letterSpacing: '.04em' }}>
                    {k.badge}
                  </span>
                )}
              </div>
              <div>
                <p className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text)', margin: 0, lineHeight: 1 }}>
                  {k.value}
                </p>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', margin: '5px 0 0', opacity: .7, letterSpacing: '.02em' }}>
                  {k.label}
                </p>
              </div>
              {/* bg circle accent */}
              <div style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: '50%', background: k.color, opacity: .07, pointerEvents: 'none' }} />
            </div>
          ))}
        </div>

        {/* ── Row 1: Donut + Progress bars ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>

          {/* Claims Donut */}
          <div className="rep-panel">
            <div className="rep-panel-header">
              <HiChartPie style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>Claims Distribution</span>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <DonutChart segments={claimsBreakdown} size={150} stroke={28} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{total}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', opacity: .55, marginTop: 3 }}>Total</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                {claimsBreakdown.map(s => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div className="leg-dot" style={{ background: s.color }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{s.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{s.value}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: `${s.color}15`, color: s.color }}>
                          {s.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="prog-track">
                      <div className="prog-fill" style={{ width: `${Math.min(s.pct, 100)}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Approval Rate Gauge */}
          <div className="rep-panel">
            <div className="rep-panel-header">
              <HiScale style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>Approval Rate Gauge</span>
            </div>
            <div style={{ padding: '18px 28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', width: 200 }}>
                <GaugeChart value={approvalRate} max={100} color="#10b981" size={200} />
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                  <p className="mono" style={{ fontSize: 25, fontWeight: 700, color: '#10b981', margin: 2, lineHeight: 1 }}>{approvalRate}%</p>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', opacity: .55, marginTop: 4 }}>Approval Rate</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', marginTop: 8 }}>
                {[
                  { label: 'Approved', value: `${approvalRate}%`, color: '#10b981' },
                  { label: 'Rejected', value: `${rejectionRate}%`, color: '#ef4444' },
                ].map(m => (
                  <div key={m.label} style={{ padding: '12px 14px', borderRadius: 14, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', textAlign: 'center' }}>
                    <p className="mono" style={{ fontSize: 18, fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', opacity: .6, margin: '4px 0 0' }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Bar Chart + Revenue ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>

          {/* Claims Volume Bar Chart */}
          <div className="rep-panel">
            <div className="rep-panel-header">
              <HiChartBar style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>Claims Volume Breakdown</span>
            </div>
            <div style={{ padding: '20px 24px 16px' }}>
              <BarChart
                height={110}
                bars={[
                  { label: 'Total Claims', value: total,    color: '#06b6d4' },
                  { label: 'Approved',     value: approved, color: '#10b981' },
                  { label: 'Rejected',     value: rejected, color: '#ef4444' },
                  { label: 'Pending',      value: pending,  color: '#f59e0b' },
                ]}
              />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                {[
                  { label: 'Total', color: '#06b6d4' },
                  { label: 'Approved', color: '#10b981' },
                  { label: 'Rejected', color: '#ef4444' },
                  { label: 'Pending', color: '#f59e0b' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div className="leg-dot" style={{ background: l.color, width: 7, height: 7 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', opacity: .7 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="rep-panel">
            <div className="rep-panel-header">
              <HiCurrencyRupee style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>Revenue Summary</span>
            </div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Hero revenue */}
              <div style={{ padding: '18px 20px', borderRadius: 16, background: 'linear-gradient(135deg, var(--color-primary)10, var(--color-accent, #06b6d4)10)', border: '1.5px solid var(--color-primary)20', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="c-label" style={{ marginBottom: 6 }}>Total Revenue</p>
                  <p className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', margin: 0, lineHeight: 1 }}>
                    ₹{revenue.toLocaleString()}
                  </p>
                </div>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--color-primary)18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiCurrencyRupee style={{ width: 24, height: 24, color: 'var(--color-primary)' }} />
                </div>
              </div>

              {[
                { label: 'Avg Revenue per Policy', value: `₹${avgRevenue.toLocaleString()}`, icon: HiDocumentText, color: '#6366f1' },
                { label: 'Claims-to-Policy Ratio', value: `${claimRatio}%`, icon: HiClipboardList, color: '#f59e0b' },
                { label: 'Total Policies Sold', value: policies, icon: HiTrendingUp, color: '#10b981' },
              ].map(r => (
                <div key={r.label} style={{
                  padding: '13px 16px', borderRadius: 14,
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${r.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <r.icon style={{ width: 15, height: 15, color: r.color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{r.label}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Efficiency Scorecard ── */}
        <div className="rep-panel">
          <div className="rep-panel-header">
            <HiTrendingUp style={{ width: 15, height: 15, color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>Operational Efficiency Scorecard</span>
          </div>
          <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              {
                label: 'Approval Rate',
                value: approvalRate,
                suffix: '%',
                color: '#10b981',
                desc: 'Of all claims processed',
                bar: approvalRate,
              },
              {
                label: 'Rejection Rate',
                value: rejectionRate,
                suffix: '%',
                color: '#ef4444',
                desc: 'Claims turned away',
                bar: rejectionRate,
              },
              {
                label: 'Pending Rate',
                value: total ? +((pending / total) * 100).toFixed(1) : 0,
                suffix: '%',
                color: '#f59e0b',
                desc: 'Awaiting decision',
                bar: total ? (pending / total) * 100 : 0,
              },
              {
                label: 'Claim Density',
                value: claimRatio,
                suffix: '%',
                color: '#6366f1',
                desc: 'Claims per policy issued',
                bar: Math.min(claimRatio, 100),
              },
            ].map(m => (
              <div key={m.label} style={{ padding: '16px 18px', borderRadius: 16, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p className="c-label" style={{ margin: 0 }}>{m.label}</p>
                <p className="mono" style={{ fontSize: 28, fontWeight: 700, color: m.color, margin: 0, lineHeight: 1 }}>
                  {m.value}<span style={{ fontSize: 14, opacity: .7 }}>{m.suffix}</span>
                </p>
                <div className="prog-track" style={{ height: 6 }}>
                  <div className="prog-fill" style={{ width: `${Math.min(m.bar, 100)}%`, background: m.color }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', opacity: .55, margin: 0 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}