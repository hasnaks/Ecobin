'use client';
import { useState } from 'react';
import { Gift, Ticket } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { gql, Reward, Tx } from '@/lib/api';
import { useGql } from '@/lib/useGql';
import { ErrorBox, PageHeader, Spinner } from '@/components/ui';

export default function RewardsPage() {
  const { user, refresh } = useAuth();
  const { data, error, loading, reload } = useGql<{ rewards: Reward[] }>('{ rewards { id name description cost stock } }');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState('');

  async function redeem(r: Reward) {
    setErr('');
    setMsg('');
    setBusyId(r.id);
    try {
      const d = await gql<{ redeemReward: Tx }>(
        'mutation($id:ID!){ redeemReward(rewardId:$id){ id code description } }',
        { id: r.id },
      );
      setMsg(`Redeemed "${r.name}"! Your voucher code: ${d.redeemReward.code}`);
      await Promise.all([refresh(), reload()]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusyId('');
    }
  }

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Rewards" subtitle={`You have ${user?.points ?? 0} EcoPoints to spend`} />
      <ErrorBox message={error || err} />
      {msg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
          <Ticket size={18} /> {msg}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.rewards.map((r) => {
          const affordable = (user?.points ?? 0) >= r.cost;
          return (
            <div key={r.id} className="card flex flex-col">
              <div className="mb-3 w-fit rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <Gift size={22} />
              </div>
              <h3 className="font-semibold text-white">{r.name}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-400">{r.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-emerald-400">{r.cost} pts</p>
                  <p className="text-xs text-slate-400">{r.stock > 0 ? `${r.stock} left` : 'Out of stock'}</p>
                </div>
                <button className="btn-primary" disabled={!affordable || r.stock <= 0 || busyId === r.id} onClick={() => redeem(r)}>
                  {busyId === r.id ? '...' : affordable ? 'Redeem' : 'Not enough'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
