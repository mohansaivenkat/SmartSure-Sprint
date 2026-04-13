import React from 'react';
import { HiExclamationCircle, HiRefresh } from 'react-icons/hi';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
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
export default LoadingSpinner;

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
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

export function EmptyState({ icon: Icon, title, subtitle, description, action }: { icon?: any, title: string, subtitle?: string, description?: string, action?: React.ReactNode }) {
  const content = description || subtitle;
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in text-center px-4">
      {Icon && (
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--color-primary)10' }}>
          <Icon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
        </div>
      )}
      <p className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{title}</p>
      {content && (
        <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
          {content}
        </p>
      )}
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color, trend }: any) {
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

export function Badge({ status }: { status?: string }) {
  const colors: Record<string, { bg: string, text: string, border: string }> = {
    ACTIVE: { bg: '#10b98115', text: '#059669', border: '#10b98140' },
    CREATED: { bg: '#6366f115', text: '#4f46e5', border: '#6366f140' },
    EXPIRED: { bg: '#64748b15', text: '#475569', border: '#64748b40' },
    CANCELLED: { bg: '#ef444415', text: '#dc2626', border: '#ef444440' },
    SUBMITTED: { bg: '#f59e0b15', text: '#d97706', border: '#f59e0b40' },
    UNDER_REVIEW: { bg: '#6366f115', text: '#4f46e5', border: '#6366f140' },
    APPROVED: { bg: '#10b98115', text: '#059669', border: '#10b98140' },
    REJECTED: { bg: '#ef444415', text: '#dc2626', border: '#ef444440' },
    CLOSED: { bg: '#64748b15', text: '#475569', border: '#64748b40' },
    DRAFT: { bg: '#94a3b815', text: '#64748b', border: '#94a3b840' },
    PENDING: { bg: '#f59e0b15', text: '#d97706', border: '#f59e0b40' },
    SUCCESS: { bg: '#10b98115', text: '#059669', border: '#10b98140' },
    FAILED: { bg: '#ef444415', text: '#dc2626', border: '#ef444440' },
    PENDING_CANCELLATION: { bg: '#f59e0b15', text: '#d97706', border: '#f59e0b40' },
  };
  const c = colors[status as string] || { bg: '#64748b15', text: '#475569', border: '#64748b40' };
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-bold border"
      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}>
      {status?.replace(/_/g, ' ') || 'UNKNOWN'}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string, subtitle?: string, action?: React.ReactNode }) {
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

export function Card({ children, className = '', style, onClick, hoverable = false }: { children: React.ReactNode, className?: string, style?: React.CSSProperties, onClick?: () => void, hoverable?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-300 ${hoverable ? 'cursor-pointer hover:scale-[1.01] hover:shadow-xl' : 'shadow-sm'} ${className}`}
      style={{ backgroundColor: 'var(--color-surface)', ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', onClick, disabled, loading, className = '', type = 'button', size = 'md' }: any) {
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
      className={`inline-flex items-center justify-center gap-2 ${sizeClasses[size as keyof typeof sizeClasses]} font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
      style={variants[variant as keyof typeof variants]}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: any) {
  if (!isOpen) return null;
  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative w-full ${sizeClasses[size as keyof typeof sizeClasses]} rounded-2xl p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto`}
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

export function Input({ label, error, id, ...props }: any) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</label>}
      <input
        id={inputId}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          '--tw-ring-color': 'var(--color-primary)'
        } as React.CSSProperties}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, id, children, ...props }: any) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={selectId} className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</label>}
      <select
        id={selectId}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        } as React.CSSProperties}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, id, ...props }: any) {
  const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={areaId} className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</label>}
      <textarea
        id={areaId}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 resize-y min-h-[120px]"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          '--tw-ring-color': 'var(--color-primary)'
        } as React.CSSProperties}
        rows={6}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}

export function ChartDonut({ data = [] }: any) {
  const stats = data.reduce((acc: any, p: any) => {
    const s = p.status || 'UNKNOWN';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const total = data.length || 1;
  const colors: Record<string, string> = {
    ACTIVE: '#10b981',
    EXPIRED: '#64748b',
    CANCELLED: '#ef4444',
    SUBMITTED: '#f59e0b',
    UNDER_REVIEW: '#6366f1',
    APPROVED: '#10b981',
    REJECTED: '#ef4444',
  };

  let currentPercent = 0;
  const slices = Object.entries(stats).map(([status, count]: [string, any]) => {
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
