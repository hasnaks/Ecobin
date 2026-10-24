'use client';
import { useAuth } from '@/lib/auth';
import { useGql } from '@/lib/useGql';
import { Empty, ErrorBox, PageHeader, Spinner } from '@/components/ui';

interface Entry {
  rank: number;
  userId: string;
  name: string;
  points: number;
  totalWasteKg: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { data, error, loading } = useGql<{ leaderboard: Entry[] }>(
    '{ leaderboard { rank userId name points totalWasteKg } }',
    {},
    20000,
  );
  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="Top 10 recyclers by EcoPoints" />
      <ErrorBox message={error} />
      <div className="card overflow-hidden p-0">
        {data?.leaderboard.length ? (
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Name</th>
                <th className="hidden px-5 py-3 sm:table-cell">Waste recycled</th>
                <th className="px-5 py-3 text-right">EcoPoints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.leaderboard.map((e) => (
                <tr key={e.userId} className={e.userId === user?.id ? 'bg-emerald-500/10' : ''}>
                  <td className="px-5 py-3.5 text-lg font-bold">{MEDALS[e.rank - 1] || `#${e.rank}`}</td>
                  <td className="px-5 py-3.5 font-medium text-white">
                    {e.name}
                    {e.userId === user?.id && <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">YOU</span>}
                  </td>
                  <td className="hidden px-5 py-3.5 text-slate-400 sm:table-cell">{e.totalWasteKg} kg</td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-400">{e.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty text="No entries yet." />
        )}
      </div>
    </>
  );
}
