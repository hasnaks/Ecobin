'use client';
import Link from 'next/link';
import { AlertTriangle, Leaf, Scale, Trash2, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Bin, timeAgo, WasteLog } from '@/lib/api';
import { useGql } from '@/lib/useGql';
import { Empty, ErrorBox, FillBar, PageHeader, Spinner, Stat, TypeChip } from '@/components/ui';

const Q = `{
  bins { id name location wasteType fillLevel status }
  myWasteLogs(limit: 5) { id wasteType weightKg correct pointsEarned createdAt bin { name } }
  leaderboard { rank userId name points }
}`;

export default function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading } = useGql<{
    bins: Bin[];
    myWasteLogs: WasteLog[];
    leaderboard: { rank: number; userId: string; name: string; points: number }[];
  }>(Q, {}, 15000);

  if (loading) return <Spinner />;
  const myRank = data?.leaderboard.find((l) => l.userId === user?.id)?.rank;
  const fullBins = data?.bins.filter((b) => b.status === 'FULL').length ?? 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your impact at a glance"
        action={
          <Link href="/dispose" className="btn-primary">
            Dispose waste
          </Link>
        }
      />
      <ErrorBox message={error} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="EcoPoints" value={user?.points} icon={<Leaf size={20} />} />
        <Stat label="Waste recycled" value={`${user?.totalWasteKg ?? 0} kg`} icon={<Scale size={20} />} />
        <Stat label="Leaderboard rank" value={myRank ? `#${myRank}` : '-'} hint={myRank ? 'Top 10' : 'Outside top 10'} icon={<TrendingUp size={20} />} />
        <Stat label="Full bins" value={fullBins} hint="Need emptying" icon={<Trash2 size={20} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-white">Bin fill levels</h2>
          <div className="space-y-4">
            {data?.bins.map((b) => (
              <div key={b.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    {b.name} <TypeChip type={b.wasteType} />
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    {b.status === 'FULL' && <AlertTriangle size={14} className="text-rose-400" />}
                    {b.fillLevel}%
                  </span>
                </div>
                <FillBar level={b.fillLevel} type={b.wasteType} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-3 font-semibold text-white">Recent activity</h2>
            {data?.myWasteLogs.length ? (
              <ul className="divide-y divide-white/5">
                {data.myWasteLogs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <TypeChip type={l.wasteType} />
                      <p className="mt-1 text-xs text-slate-400">
                        {l.weightKg} kg in {l.bin?.name} · {timeAgo(l.createdAt)}
                      </p>
                    </div>
                    <span className={`font-bold ${l.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {l.correct ? `+${l.pointsEarned}` : 'Wrong bin'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="No disposals yet. Start recycling!" />
            )}
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">Top recyclers</h2>
              <Link href="/leaderboard" className="text-xs font-semibold text-emerald-400 hover:underline">
                View all
              </Link>
            </div>
            <ul className="space-y-2">
              {data?.leaderboard.slice(0, 3).map((l) => (
                <li key={l.userId} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="mr-2 font-bold text-slate-400">#{l.rank}</span>
                    {l.name}
                  </span>
                  <span className="font-semibold text-emerald-400">{l.points} pts</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
