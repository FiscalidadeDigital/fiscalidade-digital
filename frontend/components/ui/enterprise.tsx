import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

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
