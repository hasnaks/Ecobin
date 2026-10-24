'use client';
import { AlertTriangle, Home, MapPin } from 'lucide-react';
import { Bin } from '@/lib/api';
import { useGql } from '@/lib/useGql';
import { ErrorBox, FillBar, PageHeader, Spinner, TypeChip } from '@/components/ui';

export default function BinsPage() {
  const { data, error, loading } = useGql<{ bins: Bin[] }>(
    '{ bins { id name location household wasteType capacityKg fillLevel status } }',
    {},
    10000,
  );
  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader title="Smart Bins" subtitle="Live fill levels, refreshed every 10 seconds" />
      <ErrorBox message={error} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.bins.map((b) => (
          <div key={b.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{b.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin size={12} /> {b.location}
                </p>
                {b.household && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-400/80">
                    <Home size={12} /> {b.household}
                  </p>
                )}
              </div>
              <TypeChip type={b.wasteType} />
            </div>
            <div className="mb-2 mt-5 flex items-end justify-between">
              <span className="text-3xl font-bold text-white">{b.fillLevel}%</span>
              <span className="text-xs text-slate-400">{b.capacityKg} kg capacity</span>
            </div>
            <FillBar level={b.fillLevel} type={b.wasteType} />
            <div className="mt-4">
              {b.status === 'FULL' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-400">
                  <AlertTriangle size={12} /> Full. Awaiting pickup
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  Accepting waste
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
