import React, { memo } from 'react';

export const GlassCard = memo(({ children, className = '', accent = '' }) => {
  const border =
    accent === 'teal'
      ? 'glass-card-teal'
      : accent === 'purple'
      ? 'glass-card-purple'
      : 'glass-card';
  return (
    <div className={`${border} p-4 ${className}`}>
      {children}
    </div>
  );
});

export const TealButton = memo(({ children, onClick, disabled, className = '', type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`btn-teal flex items-center justify-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
));

export const PurpleButton = memo(({ children, onClick, disabled, className = '', type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`btn-purple flex items-center justify-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
));

export const GhostButton = memo(({ children, onClick, className = '', type = 'button', active = false }) => (
  <button
    type={type}
    onClick={onClick}
    className={`btn-ghost flex items-center gap-2 ${active ? 'border-teal text-teal' : 'text-muted'} ${className}`}
  >
    {children}
  </button>
));

export const Chip = memo(({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border
      ${active
        ? 'bg-teal border-teal text-bg'
        : 'bg-transparent border-white/10 text-muted hover:border-teal/40 hover:text-white'
      }`}
  >
    {label}
  </button>
));

export const MacroBar = memo(({ label, value, max, color }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors = {
    teal: 'bg-teal',
    purple: 'bg-purple',
    gold: 'bg-gold',
    red: 'bg-red-400',
  };
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted">{label}</span>
        <span className="tab-num text-white">{value}<span className="text-muted">/{max}g</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colors[color] || 'bg-teal'}`}
          style={{ width: `${pct}%`, willChange: 'width' }}
        />
      </div>
    </div>
  );
});

export function CircularProgress({ value, max, size = 80, strokeWidth = 6, children, color = '#2dd4bf' }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ willChange: 'transform' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.5s ease', willChange: 'stroke-dashoffset' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <svg className="animate-spin text-teal" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function ErrorMsg({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-3">
      <span className="flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} className="text-red-400 hover:text-red-300 font-bold">×</button>}
    </div>
  );
}

export function Badge({ children, color = 'teal' }) {
  const colors = {
    teal: 'bg-teal/10 text-teal border-teal/20',
    purple: 'bg-purple/10 text-purple border-purple/20',
    gold: 'bg-gold/10 text-gold border-gold/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    muted: 'bg-white/5 text-muted border-white/10',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Divider({ className = '' }) {
  return <div className={`border-t border-white/5 ${className}`} />;
}

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-muted text-sm">{this.state.error?.message || 'Something went wrong'}</p>
          <button className="btn-ghost mt-3 text-sm" onClick={() => this.setState({ hasError: false })}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
