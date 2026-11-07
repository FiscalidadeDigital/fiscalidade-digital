'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
type ToastTone = Exclude<BadgeTone, 'neutral'> | 'neutral';

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'border border-fd-primary bg-fd-primary text-white hover:bg-fd-primary-hover focus-visible:ring-fd-focus',
  secondary:
    'border border-[var(--fd-border)] bg-white text-[var(--fd-text-primary)] hover:border-fd-accent hover:bg-[var(--fd-accent-soft)] focus-visible:ring-fd-focus',
  ghost:
    'border border-transparent bg-transparent text-[var(--fd-text-primary)] hover:bg-[var(--fd-surface-muted)] focus-visible:ring-fd-focus',
  danger:
    'border border-[var(--fd-danger)] bg-[var(--fd-danger)] text-white hover:brightness-95 focus-visible:ring-[var(--fd-danger)]',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 py-2 text-xs',
  md: 'min-h-11 px-4 py-2.5 text-sm',
  lg: 'min-h-11 px-5 py-3 text-sm',
};

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--fd-surface-muted)] text-[var(--fd-text-secondary)]',
  info: 'bg-[var(--fd-accent-soft)] text-fd-accent',
  success: 'bg-[var(--fd-success-soft)] text-fd-success',
  warning: 'bg-[var(--fd-warning-soft)] text-fd-warning',
  danger: 'bg-[var(--fd-danger-soft)] text-fd-danger',
};

const toastTones: Record<ToastTone, string> = {
  neutral: 'border-[var(--fd-border)]',
  info: 'border-fd-accent',
  success: 'border-fd-success',
  warning: 'border-fd-warning',
  danger: 'border-fd-danger',
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

/**
 * Adds the header text to each data cell after a route or list update. The
 * responsive table stylesheet can then present the same semantic table as a
 * labelled card list on narrow screens without duplicating business data.
 */
export function ResponsiveTableLabels() {
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;

    const annotateTables = () => {
      document
        .querySelectorAll<HTMLTableElement>('.fd-theme-scope table')
        .forEach((table) => {
          if (!table.dataset.fdResponsiveTable) {
            table.dataset.fdResponsiveTable = 'true';
          }

          const headers = Array.from(
            table.querySelectorAll<HTMLTableCellElement>('thead th'),
          ).map((header) => header.textContent?.trim() ?? '');

          if (!headers.length) {
            return;
          }

          table
            .querySelectorAll<HTMLTableRowElement>('tbody tr')
            .forEach((row) => {
              const cells = Array.from(row.children).filter(
                (cell): cell is HTMLTableCellElement =>
                  cell instanceof HTMLTableCellElement,
              );

              cells.forEach((cell, index) => {
                if (cell.colSpan !== 1 || !headers[index]) {
                  return;
                }

                if (cell.dataset.label !== headers[index]) {
                  cell.dataset.label = headers[index];
                }
              });
            });
        });
    };

    const scheduleAnnotation = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(annotateTables);
    };

    annotateTables();

    const observer = new MutationObserver(scheduleAnnotation);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="fd-page-header">
      <div className="min-w-0">
        {eyebrow ? <p className="fd-page-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? (
          <p className="fd-page-description">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

type PanelProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({
  title,
  description,
  actions,
  children,
  className = '',
}: PanelProps) {
  return (
    <section className={`fd-panel ${className}`}>
      {title || description || actions ? (
        <div className="fd-panel-header">
          <div>
            {title ? (
              <h2 className="text-base font-semibold text-[var(--fd-text-primary)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-[var(--fd-text-secondary)]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  context,
}: {
  label: string;
  value: ReactNode;
  context?: string;
}) {
  return (
    <article className="fd-stat-card">
      <p className="fd-stat-label">{label}</p>
      <p className="fd-stat-value">{value}</p>
      {context ? (
        <p className="mt-2 text-xs text-[var(--fd-text-muted)]">{context}</p>
      ) : null}
    </article>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="fd-empty-state">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-[var(--fd-text-primary)]">
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-sm leading-6">{description}</p>
        ) : null}
        {action ? (
          <div className="mt-4 flex justify-center">{action}</div>
        ) : null}
      </div>
    </div>
  );
}

export function Button({
  className,
  children,
  disabled,
  loading = false,
  size = 'md',
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      type={type}
      disabled={disabled || loading}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-fd-field font-semibold transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export function Badge({
  children,
  className,
  tone = 'neutral',
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={classNames(
        'inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({
  className,
  label = 'A carregar',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      aria-label={label}
      role="status"
      className={classNames(
        'fd-skeleton block rounded-fd-field bg-[var(--fd-surface-muted)]',
        className,
      )}
    />
  );
}

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  ariaLabel?: string;
  role?: 'dialog' | 'alertdialog';
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let bodyLockCount = 0;
let bodyOverflow = '';
let bodyPaddingRight = '';
let dialogSequence = 0;
const openDialogStack: string[] = [];

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    bodyOverflow = document.body.style.overflow;
    bodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);

  if (bodyLockCount === 0) {
    document.body.style.overflow = bodyOverflow;
    document.body.style.paddingRight = bodyPaddingRight;
  }
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter(
    (element) =>
      element.getAttribute('aria-hidden') !== 'true' &&
      element.tabIndex >= 0 &&
      !element.hasAttribute('disabled'),
  );
}

/**
 * Accessible modal primitive. It uses a portal, keeps focus inside the
 * dialog, closes with Escape, restores focus to its opener, and locks the
 * document scroll while it is open.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  closeOnBackdrop = true,
  closeOnEscape = true,
  ariaLabel = 'Diálogo',
  role = 'dialog',
}: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogIdRef = useRef(`fd-dialog-${++dialogSequence}`);
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);
  const closeOnBackdropRef = useRef(closeOnBackdrop);
  const titleIdRef = useRef(`fd-dialog-title-${dialogSequence}`);
  const descriptionIdRef = useRef(`fd-dialog-description-${dialogSequence}`);

  onCloseRef.current = onClose;
  closeOnEscapeRef.current = closeOnEscape;
  closeOnBackdropRef.current = closeOnBackdrop;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !mounted || typeof document === 'undefined') {
      return undefined;
    }

    const dialogId = dialogIdRef.current;
    const opener = document.activeElement;
    openerRef.current = opener instanceof HTMLElement ? opener : null;
    openDialogStack.push(dialogId);
    lockBodyScroll();

    const focusDialog = () => {
      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const autofocusTarget = dialog.querySelector<HTMLElement>(
        '[data-autofocus="true"]',
      );
      const target = autofocusTarget || getFocusableElements(dialog)[0] || dialog;
      target.focus({ preventScroll: true });
    };

    const focusTimer = window.setTimeout(focusDialog, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      const isTopmostDialog =
        openDialogStack[openDialogStack.length - 1] === dialogId;

      if (!isTopmostDialog) {
        return;
      }

      if (event.key === 'Escape' && closeOnEscapeRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        dialogRef.current?.focus({ preventScroll: true });
        return;
      }

      const activeElement = document.activeElement;
      if (!dialogRef.current?.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus({
          preventScroll: true,
        });
        return;
      }

      if (event.shiftKey && (activeElement === firstElement || activeElement === dialogRef.current)) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      const stackIndex = openDialogStack.lastIndexOf(dialogId);
      if (stackIndex >= 0) {
        openDialogStack.splice(stackIndex, 1);
      }
      unlockBodyScroll();

      if (openerRef.current?.isConnected) {
        openerRef.current.focus({ preventScroll: true });
      }
    };
  }, [mounted, open]);

  if (!open || !mounted) {
    return null;
  }

  const titleId = title ? titleIdRef.current : undefined;
  const descriptionId = description ? descriptionIdRef.current : undefined;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[rgba(16,36,71,0.58)] backdrop-blur-[2px]"
        onMouseDown={() => {
          const isTopmostDialog =
            openDialogStack[openDialogStack.length - 1] === dialogIdRef.current;
          if (isTopmostDialog && closeOnBackdropRef.current) {
            onCloseRef.current();
          }
        }}
      />
      <div
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={titleId}
        aria-modal="true"
        className={classNames(
          'relative z-10 max-h-full w-full max-w-lg overflow-y-auto rounded-fd-card-large border border-[var(--fd-border)] bg-white shadow-2xl outline-none',
          className,
        )}
        role={role}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--fd-border)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title ? (
              <h2
                id={titleId}
                className="text-fd-h3 font-semibold leading-tight text-[var(--fd-text-primary)]"
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-6 text-[var(--fd-text-secondary)]"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Fechar diálogo"
            className="-mr-1 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-fd-field text-xl leading-none text-[var(--fd-text-secondary)] transition-colors hover:bg-[var(--fd-surface-muted)] hover:text-[var(--fd-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-focus focus-visible:ring-offset-2"
            onClick={() => onCloseRef.current()}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {children ? <div className="px-5 py-5 sm:px-6">{children}</div> : null}
        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--fd-border)] bg-[var(--fd-surface-subtle)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

type ConfirmDialogProps = Omit<
  DialogProps,
  'children' | 'footer' | 'role' | 'title'
> & {
  title: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * Standard confirmation dialog for destructive or irreversible actions.
 * The owning page remains responsible for the action and loading state.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onClose,
  onConfirm,
  ...dialogProps
}: ConfirmDialogProps) {
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      {...dialogProps}
      closeOnBackdrop={loading ? false : dialogProps.closeOnBackdrop}
      closeOnEscape={loading ? false : dialogProps.closeOnEscape}
      onClose={handleClose}
      role="alertdialog"
      title={title}
      description={description}
      footer={
        <>
          <Button disabled={loading} onClick={handleClose} variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            data-autofocus="true"
            loading={loading}
            onClick={() => void onConfirm()}
            variant={destructive ? 'danger' : 'primary'}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastItem = ToastInput & {
  id: string;
  tone: ToastTone;
  duration: number;
};

type ToastContextValue = {
  dismiss: (id: string) => void;
  show: (toast: ToastInput) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);
let toastSequence = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    ({ duration = 5000, tone = 'info', ...toast }: ToastInput) => {
      toastSequence += 1;
      const id = `fd-toast-${Date.now()}-${toastSequence}`;
      const item: ToastItem = { ...toast, duration, id, tone };

      setToasts((current) => [...current, item].slice(-4));

      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ dismiss, show }), [dismiss, show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-atomic="false"
        aria-label="Notificações"
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-4 z-[120] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 sm:right-5"
        role="region"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            aria-live={toast.tone === 'danger' ? 'assertive' : 'polite'}
            className={classNames(
              'pointer-events-auto flex items-start gap-3 rounded-fd-card border-l-4 bg-white p-4 shadow-fd',
              toastTones[toast.tone],
            )}
            role={toast.tone === 'danger' ? 'alert' : 'status'}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--fd-text-primary)]">
                {toast.title}
              </p>
              {toast.description ? (
                <p className="mt-1 text-sm leading-5 text-[var(--fd-text-secondary)]">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              aria-label={`Fechar notificação: ${toast.title}`}
              className="-mr-1 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-fd-field text-lg leading-none text-[var(--fd-text-secondary)] transition-colors hover:bg-[var(--fd-surface-muted)] hover:text-[var(--fd-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-focus"
              onClick={() => dismiss(toast.id)}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de ToastProvider.');
  }

  return context;
}
