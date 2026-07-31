import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

function Select({ className, label, error, options = [], placeholder = 'Select...', value, onChange, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className={cn('erp-input appearance-none cursor-pointer', error && 'border-destructive', className)}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Textarea({ className, label, error, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>}
      <textarea
        className={cn('erp-input min-h-[100px] resize-y py-2.5', error && 'border-destructive', className)}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Modal({ open, onClose, title, description, children, className }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-elevated animate-scale-in', className)}>
        {(title || description) && (
          <div className="p-6 pb-4 border-b border-border">
            {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Dropdown({ trigger, items = [], align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen(v => !v)}>{trigger}</div>
      {open && (
        <div className={cn('absolute z-50 mt-2 min-w-[160px] bg-popover border border-border rounded-lg shadow-elevated animate-scale-in py-1', align === 'right' ? 'right-0' : 'left-0')}>
          {items.map((item, i) => (
            item.separator
              ? <div key={i} className="h-px bg-border my-1" />
              : <button key={i} onClick={() => { item.onClick?.(); setOpen(false); }}
                  className={cn('w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors', item.danger && 'text-destructive hover:bg-destructive/10')}>
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Tooltip({ children, content, side = 'top' }) {
  const [show, setShow] = useState(false);
  const positions = { top: 'bottom-full mb-2 left-1/2 -translate-x-1/2', bottom: 'top-full mt-2 left-1/2 -translate-x-1/2', left: 'right-full mr-2 top-1/2 -translate-y-1/2', right: 'left-full ml-2 top-1/2 -translate-y-1/2' };
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={cn('absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md whitespace-nowrap pointer-events-none', positions[side])}>
          {content}
        </div>
      )}
    </div>
  );
}

function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <svg className={cn('animate-spin text-primary', sizes[size], className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue', loading }) {
  const colors = {
    blue: { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary' },
    green: { bg: 'bg-success/10', text: 'text-success', icon: 'text-success' },
    amber: { bg: 'bg-warning/10', text: 'text-warning', icon: 'text-warning' },
    red: { bg: 'bg-destructive/10', text: 'text-destructive', icon: 'text-destructive' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-500', icon: 'text-violet-500' },
  };
  const c = colors[color] || colors.blue;

  if (loading) return (
    <div className="stat-card">
      <div className="skeleton h-4 w-24 mb-4" />
      <div className="skeleton h-8 w-16 mb-2" />
      <div className="skeleton h-3 w-32" />
    </div>
  );

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1 font-display">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trendValue !== undefined && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend === 'up' ? 'text-success' : 'text-destructive')}>
              <span>{trend === 'up' ? '↑' : '↓'} {trendValue}%</span>
              <span className="text-muted-foreground font-normal">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-xl', c.bg)}>
            <Icon className={cn('w-5 h-5', c.icon)} />
          </div>
        )}
      </div>
    </div>
  );
}

export { Select, Textarea, Modal, Dropdown, Tooltip, Spinner, LoadingPage, StatCard };
