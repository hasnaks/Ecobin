'use client';
import { useState } from 'react';
import { timeAgo, Tx, WasteLog } from '@/lib/api';
import { useGql } from '@/lib/useGql';
import { Empty, ErrorBox, PageHeader, Spinner, TypeChip } from '@/components/ui';

const Q = `{
  myTransactions { id type points description code createdAt }
  myWasteLogs(limit: 50) { id wasteType weightKg correct pointsEarned createdAt bin { name location } }
}`;

export default function HistoryPage() {
  const { data, error, loading } = useGql<{ myTransactions: Tx[]; myWasteLogs: WasteLog[] }>(Q);
  const [tab, setTab] = useState<'points' | 'disposals'>('points');
  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="History" subtitle="Your EcoPoints transactions and waste disposals" />
      <ErrorBox message={error} />
      <div className="mb-4 inline-flex rounded-xl border border-white/5 bg-white/5 p-1 text-sm font-semibold">
        {(['points', 'disposals'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 capitalize transition ${tab === t ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t === 'points' ? 'Transactions' : 'Disposals'}
          </button>
        ))}
      </div>
      <div className="card p-0">
        {tab === 'points' ? (
          data?.myTransactions.length ? (
            <ul className="divide-y divide-white/5">
              {data.myTransactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-5 py-4 text-sm">
                  <div>
                    <p className="font-medium text-white">{t.description}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(t.createdAt).toLocaleString()}
                      {t.code && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 font-mono">{t.code}</span>}
                    </p>
                  </div>
                  <span className={`font-bold ${t.points >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.points > 0 ? '+' : ''}
                    {t.points}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No transactions yet." />
          )
        ) : data?.myWasteLogs.length ? (
          <ul className="divide-y divide-white/5">
            {data.myWasteLogs.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-5 py-4 text-sm">
                <div>
                  <TypeChip type={l.wasteType} />
                  <p className="mt-1 text-xs text-slate-400">
                    {l.weightKg} kg · {l.bin?.name} ({l.bin?.location}) · {timeAgo(l.createdAt)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${l.correct ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                  {l.correct ? `+${l.pointsEarned} pts` : 'Wrong bin'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No disposals yet." />
        )}
      </div>
    </>
  );
}
