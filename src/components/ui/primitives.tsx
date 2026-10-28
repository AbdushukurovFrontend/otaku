import { X } from 'lucide-react';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

/**
 * 90/10 palette: `primary` is the single indigo accent, `contrast` is the
 * monochrome slate-900 / white call-to-action, everything else is neutral.
 */
type Variant = 'primary' | 'contrast' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'subtle';
type Size = 'xs' | 'sm' | 'md' | 'lg';

export function btn(variant: Variant = 'secondary', size: Size = 'md', extra?: string) {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-card duration-150 active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100 select-none';
  const sizes: Record<Size, string> = {
    xs: 'h-7 px-2.5 text-[12px] rounded-lg gap-1.5',
    sm: 'h-8 px-3 text-[12.5px] rounded-[10px]',
    md: 'h-9 px-3.5 text-[13px] rounded-xl',
    lg: 'h-10 px-4 text-[13.5px] rounded-xl',
  };
  const variants: Record<Variant, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
    contrast: 'bg-contrast text-contrast-fg hover:bg-contrast-hover font-semibold',
    secondary: 'bg-panel text-fg border border-line hover:border-line-strong hover:bg-hover',
    outline: 'border border-line text-fg hover:bg-hover',
    ghost: 'text-fg-2 hover:text-fg hover:bg-hover',
    subtle: 'bg-chip text-fg hover:bg-hover',
    danger: 'text-rose-600 dark:text-rose-400 border border-line hover:bg-rose-500/10',
  };
  return cn(base, sizes[size], variants[variant], extra);
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ variant = 'secondary', size = 'md', className, type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={btn(variant, size, className)} {...props} />;
});

export function IconButton({
  label,
  className,
  children,
  active,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-fg-2 transition-card duration-150 hover:bg-hover hover:text-fg active:scale-95',
        active && 'bg-hover text-fg',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

export function Switch({
  checked,
  onChange,
  label,
  size = 'md',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  tone?: 'brand' | 'rose' | 'amber';
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative isolate shrink-0 overflow-hidden rounded-full bg-line-strong', size === 'md' ? 'h-6 w-10' : 'h-5 w-9')}
    >
      <span aria-hidden className={cn('absolute inset-0 rounded-full bg-indigo-600 opacity-0 transition-gpu duration-200', checked && 'opacity-100')} />
      <span
        className={cn(
          'absolute top-0.5 left-0.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transform-gpu transition-gpu duration-300 ease-spring',
          size === 'md' ? 'h-5 w-5' : 'h-4 w-4',
          checked && 'translate-x-4',
        )}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Popover                                                             */
/* ------------------------------------------------------------------ */

export function useDismiss<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  return ref;
}

export function Popover({
  trigger,
  children,
  align = 'end',
  className,
  panelClassName,
}: {
  trigger: (api: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end' | 'center';
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={cn(
            'popover absolute top-full z-50 mt-2 origin-top transform-gpu animate-pop-in rounded-2xl will-change-transform',
            align === 'end' && 'right-0',
            align === 'start' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            panelClassName,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  hint,
  danger,
  active,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  hint?: ReactNode;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors duration-100',
        danger ? 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-400' : 'text-fg hover:bg-hover',
        active && 'bg-hover',
      )}
    >
      {icon && <span className={cn('grid h-4 w-4 place-items-center', danger ? '' : 'text-fg-3')}>{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {hint !== undefined && <span className="text-[11.5px] tabular-nums text-fg-3">{hint}</span>}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

/** True while ModalHost plays the exit animation of the last modal. */
export const ModalClosingContext = createContext(false);

export function Modal({
  onClose,
  children,
  size = 'md',
  className,
  dismissable = true,
  label,
}: {
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  dismissable?: boolean;
  label: string;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, dismissable]);

  const closing = useContext(ModalClosingContext);
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className={cn('fixed inset-0 z-[70] overflow-y-auto', closing && 'pointer-events-none')}>
      <div
        className={cn('fixed inset-0 transform-gpu bg-[var(--scrim)] backdrop-blur-[3px]', closing ? 'animate-scrim-out' : 'animate-scrim-in')}
        onClick={() => dismissable && onClose()}
      />
      <div className="pointer-events-none relative flex min-h-full items-center justify-center p-3 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={cn(
            'popover pointer-events-auto relative w-full origin-center transform-gpu rounded-[22px] will-change-transform',
            closing ? 'animate-modal-out' : 'animate-modal-in',
            widths[size],
            className,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalHeader({ title, subtitle, icon, onClose }: { title: ReactNode; subtitle?: ReactNode; icon?: ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
      {icon && <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-sunken text-fg-2">{icon}</div>}
      <div className="min-w-0 flex-1">
        <h2 className="text-[15.5px] font-semibold tracking-tight text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-fg-3">{subtitle}</p>}
      </div>
      <IconButton label="Yopish" onClick={onClose} className="-mr-2 -mt-1 h-8 w-8">
        <X className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode; count?: number }[];
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cn('no-scrollbar flex items-center gap-0.5 overflow-x-auto rounded-xl border border-line-subtle bg-chip p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'relative isolate flex shrink-0 items-center gap-1.5 rounded-[9px] font-medium transition-card duration-150 active:scale-[0.97] [&_svg]:h-3.5 [&_svg]:w-3.5',
              size === 'md' ? 'h-7 px-3 text-[12.5px]' : 'h-6 px-2.5 text-[11.5px]',
              active ? 'text-fg' : 'text-fg-3 hover:text-fg',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'absolute inset-0 -z-10 rounded-[9px] bg-panel shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-line transition-gpu duration-200 dark:bg-zinc-700/60',
                active ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
              )}
            />
            {o.icon}
            {o.label}
            {o.count !== undefined && <span className="text-[11px] tabular-nums text-fg-3">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  children,
  active,
  onClick,
  icon,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-card duration-150 active:scale-95 [&_svg]:h-3.5 [&_svg]:w-3.5',
        active ? 'border-transparent bg-contrast text-contrast-fg' : 'border-line bg-panel text-fg-2 hover:border-line-strong hover:text-fg',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ className, children, hover }: { className?: string; children: ReactNode; hover?: boolean }) {
  return <div className={cn('glass rounded-[20px]', hover && 'glass-hover', className)}>{children}</div>;
}

/** Readability limit: long-form columns never stretch past ~56rem, even on 4K / ultra-wide. */
export function ReadingColumn({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-4xl', className)}>{children}</div>;
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between px-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">{children}</span>
      {action}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string; tone?: 'brand' | 'amber' | 'rose' }) {
  const pct = Math.max(2, Math.min(100, value));
  return (
    <div className={cn('relative h-1.5 overflow-hidden rounded-full bg-chip', className)}>
      <div
        className="absolute inset-0 animate-fill-in rounded-full bg-indigo-500 transition-gpu duration-700"
        style={{ transform: `translate3d(${pct - 100}%, 0, 0)` }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center rounded-[20px] px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-line bg-sunken text-fg-3">{icon}</div>
      <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[13px] text-fg-3">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Quiet monochrome pill used for meta information (kind, rank, status). */
export function MetaChip({ children, className, icon }: { children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-line-subtle bg-chip px-2.5 text-[11.5px] font-medium text-fg-2 [&_svg]:h-3 [&_svg]:w-3',
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
