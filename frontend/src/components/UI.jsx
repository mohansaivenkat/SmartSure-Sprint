import { HiExclamationCircle, HiRefresh } from 'react-icons/hi';

export default function LoadingSpinner({ size = 'md' }) {
  const sizeMap = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className={`${sizeMap[size]} border-4 rounded-full animate-spin`}
        style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}
      />
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-danger)15' }}>
        <HiExclamationCircle className="w-8 h-8" style={{ color: 'var(--color-danger)' }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>Something went wrong</p>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:scale-105"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <HiRefresh className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-primary)10' }}>
        <Icon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
      </div>
      <p className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</p>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color, trend }) {
  return (
    <div
      className="p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-fade-in flex items-center gap-4"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold truncate" style={{ color: 'var(--color-text)' }}>{value}</p>
          {trend && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
              {trend}
            </span>
          )}
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      </div>
    </div>
  );
}

export function Badge({ status }) {
  const colors = {
    ACTIVE: { bg: '#10b98120', text: '#10b981' },
    CREATED: { bg: '#6366f120', text: '#6366f1' },
    EXPIRED: { bg: '#64748b20', text: '#64748b' },
    CANCELLED: { bg: '#ef444420', text: '#ef4444' },
    SUBMITTED: { bg: '#f59e0b20', text: '#f59e0b' },
    UNDER_REVIEW: { bg: '#6366f120', text: '#6366f1' },
    APPROVED: { bg: '#10b98120', text: '#10b981' },
    REJECTED: { bg: '#ef444420', text: '#ef4444' },
    CLOSED: { bg: '#64748b20', text: '#64748b' },
    DRAFT: { bg: '#94a3b820', text: '#94a3b8' },
    PENDING: { bg: '#f59e0b20', text: '#f59e0b' },
    SUCCESS: { bg: '#10b98120', text: '#10b981' },
    FAILED: { bg: '#ef444420', text: '#ef4444' },
  };
  const c = colors[status] || { bg: '#64748b20', text: '#64748b' };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text)' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '', onClick, hoverable = false }) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-300 ${hoverable ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg' : ''} ${className}`}
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', onClick, disabled, loading, className = '', type = 'button', size = 'md' }) {
  const sizeClasses = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  const variants = {
    primary: { backgroundColor: 'var(--color-primary)', color: '#fff' },
    danger: { backgroundColor: 'var(--color-danger)', color: '#fff' },
    success: { backgroundColor: 'var(--color-success)', color: '#fff' },
    outline: { backgroundColor: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--color-text-secondary)' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 ${sizeClasses[size]} font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
      style={variants[variant]}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative w-full ${sizeClasses[size]} rounded-2xl p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto`}
        style={{ backgroundColor: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</label>}
      <input
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2"
        style={{
          backgroundColor: 'var(--color-bg)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          color: 'var(--color-text)',
          '--tw-ring-color': 'var(--color-primary)',
        }}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</label>}
      <select
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2"
        style={{
          backgroundColor: 'var(--color-bg)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          color: 'var(--color-text)',
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</label>}
      <textarea
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 resize-none"
        style={{
          backgroundColor: 'var(--color-bg)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          color: 'var(--color-text)',
        }}
        rows={4}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}
export function ChartDonut({ data = [] }) {
  // Count by status
  const stats = data.reduce((acc, p) => {
    const s = p.status || 'UNKNOWN';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const total = data.length || 1;
  const colors = {
    ACTIVE: '#10b981',
    EXPIRED: '#64748b',
    CANCELLED: '#ef4444',
    SUBMITTED: '#f59e0b',
    UNDER_REVIEW: '#6366f1',
    APPROVED: '#10b981',
    REJECTED: '#ef4444',
  };

  let currentPercent = 0;
  const slices = Object.entries(stats).map(([status, count]) => {
    const percent = (count / total) * 100;
    const start = currentPercent;
    currentPercent += percent;
    return { status, count, start, percent, color: colors[status] || '#94a3b8' };
  });

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
      {slices.map((slice, i) => {
        const strokeDasharray = `${slice.percent} ${100 - slice.percent}`;
        const strokeDashoffset = -slice.start;
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={slice.color}
            strokeWidth="12"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        );
      })}
    </svg>
  );
}
