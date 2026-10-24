import { WASTE_META } from '@/lib/api';
import { ReactNode } from 'react';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1.5 text-3xl font-bold text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {icon && <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">{icon}</div>}
    </div>
  );
}

export function TypeChip({ type }: { type: string }) {
  const m = WASTE_META[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${m?.chip || 'bg-white/10 text-slate-300'}`}>
      <span>{m?.emoji}</span>
      {m?.label || type}
    </span>
  );
}

export function FillBar({ level, type }: { level: number; type: string }) {
  const color = level >= 85 ? 'bg-rose-500' : level >= 60 ? 'bg-amber-400' : WASTE_META[type]?.bar || 'bg-emerald-500';
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${Math.min(100, level)}%` }}
      />
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{message}</div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-400" />
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-slate-500">{text}</p>;
}
