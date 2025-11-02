import { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, action, children, className = '' }: CardProps) {
  return (
    <section className={`glass-card w-full p-6 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white/90">{title}</h3>
          {action && <div className="text-sm text-slate-200">{action}</div>}
        </header>
      )}
      <div className="text-sm text-slate-200">{children}</div>
    </section>
  );
}
