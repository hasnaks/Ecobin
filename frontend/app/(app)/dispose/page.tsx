'use client';
import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Bin, gql, WASTE_META, WASTE_TYPES, WasteLog } from '@/lib/api';
import { useGql } from '@/lib/useGql';
import { ErrorBox, FillBar, PageHeader, Spinner } from '@/components/ui';

interface Classification {
  item: string;
  found: boolean;
  wasteType: string;
  binColor: string;
  tip: string;
}

export default function DisposePage() {
  const { refresh } = useAuth();
  const { data, loading, reload } = useGql<{ bins: Bin[] }>(
    '{ bins { id name location wasteType capacityKg fillLevel status } }',
  );
  const [item, setItem] = useState('');
  const [cls, setCls] = useState<Classification | null>(null);
  const [type, setType] = useState('PLASTIC');
  const [binId, setBinId] = useState('');
  const [weight, setWeight] = useState('0.5');
  const [error, setError] = useState('');
  const [result, setResult] = useState<WasteLog | null>(null);
  const [busy, setBusy] = useState(false);

  const bins = data?.bins || [];
  const selectedBin = bins.find((b) => b.id === binId);

  // auto-pick the first available bin that matches the chosen waste type
  useEffect(() => {
    const match = bins.find((b) => b.wasteType === type && b.status === 'OK');
    setBinId(match?.id || bins[0]?.id || '');
  }, [type, bins.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function classify(e: FormEvent) {
    e.preventDefault();
    if (!item.trim()) return;
    setError('');
    try {
      const d = await gql<{ classifyWaste: Classification }>(
        'query($i:String!){ classifyWaste(item:$i){ item found wasteType binColor tip } }',
        { i: item },
      );
      setCls(d.classifyWaste);
      if (d.classifyWaste.found) setType(d.classifyWaste.wasteType);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function dispose(e: FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const d = await gql<{ disposeWaste: WasteLog }>(
        `mutation($b:ID!,$t:String!,$w:Float!){ disposeWaste(binId:$b,wasteType:$t,weightKg:$w){
          id wasteType weightKg correct pointsEarned createdAt bin { name } } }`,
        { b: binId, t: type, w: parseFloat(weight) },
      );
      setResult(d.disposeWaste);
      await Promise.all([refresh(), reload()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;
  const mismatch = selectedBin && selectedBin.wasteType !== type;

  return (
    <>
      <PageHeader title="Dispose Waste" subtitle="Identify your waste, choose the right bin and earn EcoPoints" />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Segregation guide */}
        <div className="card">
          <h2 className="mb-1 font-semibold text-white">1. What are you throwing away?</h2>
          <p className="mb-4 text-sm text-slate-400">Type an item (e.g. “banana peel”, “glass jar”, “old charger”).</p>
          <form onSubmit={classify} className="flex gap-2">
            <input className="input" placeholder="Item name" value={item} onChange={(e) => setItem(e.target.value)} />
            <button className="btn-primary" aria-label="Identify">
              <Search size={16} />
            </button>
          </form>
          {cls && (
            <div className={`mt-4 rounded-xl border p-4 text-sm ${cls.found ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-amber-500/25 bg-amber-500/10'}`}>
              {cls.found ? (
                <>
                  <p className="font-semibold text-white">
                    {WASTE_META[cls.wasteType]?.emoji} {WASTE_META[cls.wasteType]?.label} waste → {cls.binColor} bin
                  </p>
                  <p className="mt-1 text-slate-300">{cls.tip}</p>
                </>
              ) : (
                <p className="text-amber-300">{cls.tip}</p>
              )}
            </div>
          )}
          <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick guide</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {WASTE_TYPES.map((t) => (
              <div key={t} className="rounded-xl bg-white/5 p-3 text-center text-xs">
                <div className="text-xl">{WASTE_META[t].emoji}</div>
                <div className="mt-1 font-semibold text-slate-200">{WASTE_META[t].label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Disposal form */}
        <div className="card">
          <h2 className="mb-4 font-semibold text-white">2. Dispose in a smart bin</h2>
          <ErrorBox message={error} />
          <form onSubmit={dispose} className="space-y-4">
            <div>
              <label className="label">Waste type</label>
              <div className="grid grid-cols-3 gap-2">
                {WASTE_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                      type === t ? `border-transparent bg-emerald-500/10 ring-2 ${WASTE_META[t].ring}` : 'border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {WASTE_META[t].emoji} {WASTE_META[t].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Bin</label>
              <select className="input" value={binId} onChange={(e) => setBinId(e.target.value)}>
                {bins.map((b) => (
                  <option key={b.id} value={b.id} disabled={b.status === 'FULL'}>
                    {b.name} · {b.location} · {WASTE_META[b.wasteType]?.label} ({b.fillLevel}%{b.status === 'FULL' ? ' FULL' : ''})
                  </option>
                ))}
              </select>
              {selectedBin && (
                <div className="mt-2">
                  <FillBar level={selectedBin.fillLevel} type={selectedBin.wasteType} />
                </div>
              )}
              {mismatch && (
                <p className="mt-2 text-xs font-medium text-amber-400">
                  This bin is for {WASTE_META[selectedBin.wasteType]?.label} waste. Using it for {WASTE_META[type]?.label} earns no points.
                </p>
              )}
            </div>
            <div>
              <label className="label">Weight (kg)</label>
              <input
                className="input"
                type="number"
                step="0.1"
                min="0.1"
                max="25"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full" disabled={busy || !binId}>
              {busy ? 'Submitting...' : 'Submit disposal'}
            </button>
          </form>

          {result && (
            <div
              className={`mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                result.correct ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/25 bg-rose-500/10 text-rose-300'
              }`}
            >
              {result.correct ? <CheckCircle2 className="shrink-0" /> : <XCircle className="shrink-0" />}
              <p>
                {result.correct
                  ? `Correct bin! You earned ${result.pointsEarned} EcoPoints.`
                  : 'Wrong bin. No points this time. Check the guide and try again.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
