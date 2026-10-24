'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  Gift,
  Home,
  ListChecks,
  Pencil,
  Plus,
  Recycle,
  Scale,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  Bin,
  Collection,
  gql,
  Participation,
  POINTS_PER_KG,
  Reward,
  timeAgo,
  User,
  WASTE_META,
  WASTE_TYPES,
  WasteLog,
} from '@/lib/api';
import { useGql } from '@/lib/useGql';
import { Empty, ErrorBox, FillBar, PageHeader, Spinner, Stat, TypeChip } from '@/components/ui';

const Q = `{
  adminStats { users bins fullBins disposals totalWasteKg pointsIssued redemptions wasteByType { wasteType kg } }
  bins { id name location household wasteType capacityKg fillLevel status }
  rewards { id name description cost stock }
  adminUsers { id name email role points totalWasteKg }
  adminWasteLogs(limit: 50) { id wasteType weightKg correct pointsEarned createdAt bin { name } user { name } }
  collections(limit: 50) { id household wasteType weightKg pointsEarned collectedAt createdAt bin { name location } user { name email } }
  householdParticipation { household collections totalKg totalPoints }
}`;

interface Data {
  adminStats: {
    users: number;
    bins: number;
    fullBins: number;
    disposals: number;
    totalWasteKg: number;
    pointsIssued: number;
    redemptions: number;
    wasteByType: { wasteType: string; kg: number }[];
  };
  bins: Bin[];
  rewards: Reward[];
  adminUsers: User[];
  adminWasteLogs: WasteLog[];
  collections: Collection[];
  householdParticipation: Participation[];
}

type TabKey = 'overview' | 'bins' | 'collections' | 'rewards' | 'users' | 'records';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'bins', label: 'Bins' },
  { key: 'collections', label: 'Collections' },
  { key: 'rewards', label: 'Rewards' },
  { key: 'users', label: 'Users' },
  { key: 'records', label: 'Waste Records' },
];

const EMPTY_BIN = { name: '', location: '', household: '', wasteType: 'PLASTIC', capacityKg: '50' };
const EMPTY_REWARD = { name: '', description: '', cost: '100', stock: '10' };
const EMPTY_USER = { name: '', role: 'USER', points: '0' };
const today = () => new Date().toISOString().slice(0, 10);

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';
  const { data, error, loading, reload } = useGql<Data>(isAdmin ? Q : '{ unreadCount }', {}, 15000);

  const [tab, setTab] = useState<TabKey>('overview');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const [bin, setBin] = useState(EMPTY_BIN);
  const [binEditId, setBinEditId] = useState('');
  const [reward, setReward] = useState(EMPTY_REWARD);
  const [rewardEditId, setRewardEditId] = useState('');
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [userEditId, setUserEditId] = useState('');
  const [coll, setColl] = useState({
    binId: '',
    userId: '',
    wasteType: 'ORGANIC',
    weightKg: '5',
    collectedAt: today(),
    household: '',
  });

  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard');
  }, [user, isAdmin, router]);

  // preselect first bin and member once data arrives
  useEffect(() => {
    if (!data) return;
    setColl((c) => ({
      ...c,
      binId: c.binId || data.bins[0]?.id || '',
      userId: c.userId || data.adminUsers.find((u) => u.role === 'USER')?.id || '',
      household: c.household || data.bins[0]?.household || '',
      wasteType: c.binId ? c.wasteType : data.bins[0]?.wasteType || 'ORGANIC',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function run(fn: () => Promise<unknown>, successMsg = 'Saved.') {
    setErr('');
    setMsg('');
    try {
      await fn();
      await reload();
      if (successMsg) setMsg(successMsg);
      return true;
    } catch (e: any) {
      setErr(e.message);
      return false;
    }
  }

  const confirmDo = (question: string, fn: () => Promise<unknown>, successMsg: string) => {
    if (window.confirm(question)) run(fn, successMsg);
  };

  // ----- bins -----
  const saveBin = (e: FormEvent) => {
    e.preventDefault();
    const vars = {
      n: bin.name,
      l: bin.location,
      t: bin.wasteType,
      c: parseFloat(bin.capacityKg),
      h: bin.household,
    };
    if (binEditId) {
      run(
        () =>
          gql(
            'mutation($id:ID!,$n:String!,$l:String!,$t:String!,$c:Float!,$h:String!){ updateBin(id:$id,name:$n,location:$l,wasteType:$t,capacityKg:$c,household:$h){ id } }',
            { id: binEditId, ...vars },
          ),
        'Bin updated.',
      );
    } else {
      run(
        () =>
          gql(
            'mutation($n:String!,$l:String!,$t:String!,$c:Float!,$h:String!){ createBin(name:$n,location:$l,wasteType:$t,capacityKg:$c,household:$h){ id } }',
            vars,
          ),
        'Bin registered.',
      );
    }
    setBin(EMPTY_BIN);
    setBinEditId('');
  };

  const editBin = (b: Bin) => {
    setBin({ name: b.name, location: b.location, household: b.household, wasteType: b.wasteType, capacityKg: String(b.capacityKg) });
    setBinEditId(b.id);
    setMsg('');
    setErr('');
  };

  // ----- collections -----
  const pickBin = (id: string) => {
    const b = data?.bins.find((x) => x.id === id);
    setColl((c) => ({ ...c, binId: id, household: b?.household || '', wasteType: b?.wasteType || c.wasteType }));
  };

  const collectionPoints = (type: string, weight: string) =>
    Math.max(1, Math.round((parseFloat(weight) || 0) * (POINTS_PER_KG[type] || 0)));

  const saveCollection = (e: FormEvent) => {
    e.preventDefault();
    const earned = collectionPoints(coll.wasteType, coll.weightKg);
    run(
      () =>
        gql(
          `mutation($b:ID!,$u:ID!,$t:String!,$w:Float!,$d:String!,$h:String!){
            recordCollection(binId:$b,userId:$u,wasteType:$t,weightKg:$w,collectedAt:$d,household:$h){
              id household weightKg pointsEarned
            } }`,
          { b: coll.binId, u: coll.userId, t: coll.wasteType, w: parseFloat(coll.weightKg), d: coll.collectedAt, h: coll.household },
        ),
      `Recorded ${coll.weightKg} kg ${WASTE_META[coll.wasteType]?.label} — +${earned} EcoPoints awarded.`,
    ).then((ok) => {
      if (ok) setColl((c) => ({ ...c, weightKg: '5', collectedAt: today() }));
    });
  };

  // ----- rewards -----
  const saveReward = (e: FormEvent) => {
    e.preventDefault();
    const vars = { n: reward.name, d: reward.description, c: parseInt(reward.cost, 10), s: parseInt(reward.stock, 10) };
    if (rewardEditId) {
      run(
        () =>
          gql(
            'mutation($id:ID!,$n:String!,$d:String!,$c:Int!,$s:Int!){ updateReward(id:$id,name:$n,description:$d,cost:$c,stock:$s){ id } }',
            { id: rewardEditId, ...vars },
          ),
        'Reward updated.',
      );
    } else {
      run(
        () => gql('mutation($n:String!,$d:String!,$c:Int!,$s:Int!){ createReward(name:$n,description:$d,cost:$c,stock:$s){ id } }', vars),
        'Reward added.',
      );
    }
    setReward(EMPTY_REWARD);
    setRewardEditId('');
  };

  const editReward = (r: Reward) => {
    setReward({ name: r.name, description: r.description, cost: String(r.cost), stock: String(r.stock) });
    setRewardEditId(r.id);
    setMsg('');
    setErr('');
  };

  // ----- users -----
  const saveUser = (e: FormEvent) => {
    e.preventDefault();
    if (!userEditId) return;
    run(
      () =>
        gql(
          'mutation($id:ID!,$n:String!,$r:String!,$p:Int!){ updateUser(id:$id,name:$n,role:$r,points:$p){ id } }',
          { id: userEditId, n: userForm.name, r: userForm.role, p: parseInt(userForm.points, 10) },
        ),
      'User updated.',
    );
    setUserForm(EMPTY_USER);
    setUserEditId('');
  };

  const editUser = (u: User) => {
    setUserForm({ name: u.name, role: u.role, points: String(u.points) });
    setUserEditId(u.id);
    setMsg('');
    setErr('');
  };

  if (!isAdmin || loading || !data?.adminStats) return <Spinner />;
  const s = data.adminStats;
  const maxKg = Math.max(1, ...s.wasteByType.map((w) => w.kg));
  const bins = data.bins;
  const selectedCollBin = bins.find((b) => b.id === coll.binId);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Bins, collections, rewards and users"
      />
      <ErrorBox message={error || err} />
      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
          {msg}
        </div>
      )}

      {/* tabs */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-white/5 bg-white/5 p-1 text-sm font-semibold">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setMsg('');
              setErr('');
            }}
            className={`rounded-lg px-4 py-2 transition ${
              tab === t.key ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------- overview ---------- */}
      {tab === 'overview' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Users" value={s.users} icon={<Users size={20} />} />
            <Stat label="Total waste" value={`${s.totalWasteKg} kg`} hint={`${s.disposals} disposals`} icon={<Scale size={20} />} />
            <Stat label="Points issued" value={s.pointsIssued} hint={`${s.redemptions} redemptions`} icon={<Recycle size={20} />} />
            <Stat label="Full bins" value={`${s.fullBins}/${s.bins}`} icon={<Trash2 size={20} />} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
                <BarChart3 size={18} className="text-emerald-400" /> Waste by type (kg)
              </h2>
              <div className="space-y-3">
                {s.wasteByType.map((w) => (
                  <div key={w.wasteType} className="flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-slate-300">{WASTE_META[w.wasteType].label}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${WASTE_META[w.wasteType].bar}`}
                        style={{ width: `${(w.kg / maxKg) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-semibold text-white">{w.kg}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="mb-3 font-semibold text-white">Recent disposals</h2>
              <ul className="divide-y divide-white/5 text-sm">
                {data.adminWasteLogs.slice(0, 8).map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2.5">
                    <span className="text-slate-300">
                      <span className="font-medium text-white">{l.user?.name}</span> · {l.weightKg} kg{' '}
                      {WASTE_META[l.wasteType]?.label} → {l.bin?.name}
                    </span>
                    <span className={l.correct ? 'text-emerald-400' : 'text-rose-400'}>
                      {l.correct ? `+${l.pointsEarned}` : 'wrong'}
                    </span>
                  </li>
                ))}
              </ul>
              {!data.adminWasteLogs.length && <Empty text="No disposals yet." />}
            </div>
          </div>
        </>
      )}

      {/* ---------- bins ---------- */}
      {tab === 'bins' && (
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Home size={18} className="text-emerald-400" /> Manage bins
            <span className="ml-auto text-xs font-normal text-slate-400">
              Homes, shops & public locations
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-2">Bin</th>
                  <th className="pb-2">Household / area</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Fill</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bins.map((b) => (
                  <tr key={b.id} className={binEditId === b.id ? 'bg-emerald-500/5' : ''}>
                    <td className="py-3">
                      <p className="font-medium text-white">{b.name}</p>
                      <p className="text-xs text-slate-400">
                        {b.location} · {b.capacityKg} kg
                      </p>
                    </td>
                    <td className="text-slate-300">{b.household || <span className="text-slate-500">—</span>}</td>
                    <td>
                      <TypeChip type={b.wasteType} />
                    </td>
                    <td className="w-40 pr-4">
                      <FillBar level={b.fillLevel} type={b.wasteType} />
                      <span className="text-xs text-slate-400">{b.fillLevel}%</span>
                    </td>
                    <td className={b.status === 'FULL' ? 'font-semibold text-rose-400' : 'text-emerald-400'}>{b.status}</td>
                    <td className="whitespace-nowrap text-right">
                      <button
                        className="btn-ghost mr-1 !px-3 !py-1.5"
                        disabled={b.status !== 'FULL'}
                        title={b.status === 'FULL' ? 'Reset fill level' : 'Bin is not full'}
                        onClick={() =>
                          confirmDo(`Empty ${b.name} and mark it available again?`, () => gql('mutation($id:ID!){ emptyBin(id:$id){ id } }', { id: b.id }), 'Bin emptied.')
                        }
                      >
                        Empty
                      </button>
                      <button className="btn-ghost mr-1 !px-3 !py-1.5" onClick={() => editBin(b)}>
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn-danger !px-3 !py-1.5"
                        onClick={() =>
                          confirmDo(
                            `Delete ${b.name}? Its waste logs and collection history will be removed.`,
                            () => gql('mutation($id:ID!){ deleteBin(id:$id) }', { id: b.id }),
                            'Bin deleted.',
                          )
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={saveBin} className="mt-5 grid gap-3 border-t border-white/5 pt-5 sm:grid-cols-6">
            <input className="input" placeholder="Bin name" value={bin.name} onChange={(e) => setBin({ ...bin, name: e.target.value })} required />
            <input className="input" placeholder="Location" value={bin.location} onChange={(e) => setBin({ ...bin, location: e.target.value })} required />
            <input
              className="input"
              placeholder="Household / area"
              value={bin.household}
              onChange={(e) => setBin({ ...bin, household: e.target.value })}
            />
            <select className="input" value={bin.wasteType} onChange={(e) => setBin({ ...bin, wasteType: e.target.value })}>
              {WASTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WASTE_META[t].label}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="Capacity kg"
              value={bin.capacityKg}
              onChange={(e) => setBin({ ...bin, capacityKg: e.target.value })}
              required
            />
            <div className="flex gap-2">
              <button className="btn-primary flex-1">
                <Plus size={15} /> {binEditId ? 'Save' : 'Add'}
              </button>
              {binEditId && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setBin(EMPTY_BIN);
                    setBinEditId('');
                  }}
                >
                  <XCircle size={15} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ---------- collections ---------- */}
      {tab === 'collections' && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
                <ListChecks size={18} className="text-emerald-400" /> Record a collection
              </h2>
              <form onSubmit={saveCollection} className="space-y-4">
                <div>
                  <label className="label">Bin</label>
                  <select className="input" value={coll.binId} onChange={(e) => pickBin(e.target.value)}>
                    {bins.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.status === 'FULL'}>
                        {b.name} · {b.location} ({b.fillLevel}%{b.status === 'FULL' ? ' FULL' : ''})
                      </option>
                    ))}
                  </select>
                  {selectedCollBin && (
                    <div className="mt-2">
                      <FillBar level={selectedCollBin.fillLevel} type={selectedCollBin.wasteType} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Household / area</label>
                  <input
                    className="input"
                    placeholder="Defaults to the bin's assigned household"
                    value={coll.household}
                    onChange={(e) => setColl({ ...coll, household: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Member (EcoPoints recipient)</label>
                  <select className="input" value={coll.userId} onChange={(e) => setColl({ ...coll, userId: e.target.value })}>
                    {data.adminUsers
                      .filter((u) => u.role === 'USER')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} · {u.email} ({u.points} pts)
                        </option>
                      ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Waste type</label>
                    <select className="input" value={coll.wasteType} onChange={(e) => setColl({ ...coll, wasteType: e.target.value })}>
                      {WASTE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {WASTE_META[t].emoji} {WASTE_META[t].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Weight (kg)</label>
                    <input
                      className="input"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="250"
                      value={coll.weightKg}
                      onChange={(e) => setColl({ ...coll, weightKg: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Collection date</label>
                  <input
                    className="input"
                    type="date"
                    value={coll.collectedAt}
                    onChange={(e) => setColl({ ...coll, collectedAt: e.target.value })}
                    required
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Awards{' '}
                  <span className="font-semibold text-emerald-400">
                    {collectionPoints(coll.wasteType, coll.weightKg)} EcoPoints
                  </span>{' '}
                  at {WASTE_META[coll.wasteType]?.label} rate, updates the bin's fill level and marks it FULL at 85%.
                </p>
                <button className="btn-primary w-full" disabled={!coll.binId || !coll.userId}>
                  <Calendar size={15} /> Record collection
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="mb-4 font-semibold text-white">Household participation</h2>
              {data.householdParticipation.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="pb-2">Household / area</th>
                        <th className="pb-2 text-right">Collections</th>
                        <th className="pb-2 text-right">Weight</th>
                        <th className="pb-2 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.householdParticipation.map((p) => (
                        <tr key={p.household}>
                          <td className="py-2.5 font-medium text-white">{p.household}</td>
                          <td className="text-right text-slate-300">{p.collections}</td>
                          <td className="text-right text-slate-300">{p.totalKg} kg</td>
                          <td className="text-right font-semibold text-emerald-400">{p.totalPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty text="No collections recorded yet." />
              )}
            </div>
          </div>

          <div className="card mt-6">
            <h2 className="mb-4 font-semibold text-white">Collection history</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Household / area</th>
                    <th className="pb-2">Member</th>
                    <th className="pb-2">Waste</th>
                    <th className="pb-2 text-right">Weight</th>
                    <th className="pb-2 text-right">Points</th>
                    <th className="pb-2">Bin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.collections.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 text-slate-300">{c.collectedAt}</td>
                      <td className="font-medium text-white">{c.household}</td>
                      <td className="text-slate-300">{c.user?.name || '—'}</td>
                      <td>
                        <TypeChip type={c.wasteType} />
                      </td>
                      <td className="text-right text-slate-300">{c.weightKg} kg</td>
                      <td className="text-right font-semibold text-emerald-400">+{c.pointsEarned}</td>
                      <td className="text-slate-400">{c.bin?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.collections.length && <Empty text="No collections yet." />}
          </div>
        </>
      )}

      {/* ---------- rewards ---------- */}
      {tab === 'rewards' && (
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Gift size={18} className="text-emerald-400" /> Manage rewards
          </h2>
          <ul className="divide-y divide-white/5 text-sm">
            {data.rewards.map((r) => (
              <li key={r.id} className={`flex items-center justify-between gap-3 py-3 ${rewardEditId === r.id ? 'bg-emerald-500/5 px-2' : ''}`}>
                <span>
                  <span className="font-medium text-white">{r.name}</span>
                  <span className="ml-2 text-slate-400">
                    {r.cost} pts · {r.stock} in stock
                  </span>
                  {r.description && <p className="text-xs text-slate-500">{r.description}</p>}
                </span>
                <span className="flex gap-2">
                  <button className="btn-ghost !px-3 !py-1.5" onClick={() => editReward(r)}>
                    <Pencil size={13} />
                  </button>
                  <button
                    className="btn-danger !px-3 !py-1.5"
                    onClick={() =>
                      confirmDo(`Delete reward "${r.name}"?`, () => gql('mutation($id:ID!){ deleteReward(id:$id) }', { id: r.id }), 'Reward deleted.')
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {!data.rewards.length && <Empty text="No rewards yet." />}
          <form onSubmit={saveReward} className="mt-5 grid gap-3 border-t border-white/5 pt-5 sm:grid-cols-5">
            <input className="input" placeholder="Reward name" value={reward.name} onChange={(e) => setReward({ ...reward, name: e.target.value })} required />
            <input
              className="input"
              placeholder="Description"
              value={reward.description}
              onChange={(e) => setReward({ ...reward, description: e.target.value })}
            />
            <input className="input" type="number" min="1" placeholder="Cost" value={reward.cost} onChange={(e) => setReward({ ...reward, cost: e.target.value })} required />
            <input className="input" type="number" min="0" placeholder="Stock" value={reward.stock} onChange={(e) => setReward({ ...reward, stock: e.target.value })} required />
            <div className="flex gap-2">
              <button className="btn-primary flex-1">
                <Plus size={15} /> {rewardEditId ? 'Save' : 'Add'}
              </button>
              {rewardEditId && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setReward(EMPTY_REWARD);
                    setRewardEditId('');
                  }}
                >
                  <XCircle size={15} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ---------- users ---------- */}
      {tab === 'users' && (
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Users size={18} className="text-emerald-400" /> Manage users
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2 text-right">Points</th>
                  <th className="pb-2 text-right">Waste</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.adminUsers.map((u) => (
                  <tr key={u.id} className={userEditId === u.id ? 'bg-emerald-500/5' : ''}>
                    <td className="py-2.5 font-medium text-white">{u.name}</td>
                    <td className="text-slate-400">{u.email}</td>
                    <td>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.role === 'ADMIN' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="text-right font-semibold text-emerald-400">{u.points}</td>
                    <td className="text-right text-slate-400">{u.totalWasteKg} kg</td>
                    <td className="whitespace-nowrap text-right">
                      <button className="btn-ghost mr-1 !px-3 !py-1.5" onClick={() => editUser(u)}>
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn-danger !px-3 !py-1.5"
                        disabled={u.id === user?.id}
                        title={u.id === user?.id ? 'You cannot delete your own account' : 'Delete user'}
                        onClick={() =>
                          confirmDo(
                            `Delete ${u.name} and all their data?`,
                            () => gql('mutation($id:ID!){ deleteUser(id:$id) }', { id: u.id }),
                            'User deleted.',
                          )
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={saveUser} className="mt-5 flex flex-wrap items-end gap-3 border-t border-white/5 pt-5">
            <div className="min-w-[180px] flex-1">
              <label className="label">Name</label>
              <input
                className="input"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                disabled={!userEditId}
                required
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                disabled={!userEditId}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div>
              <label className="label">Points</label>
              <input
                className="input"
                type="number"
                min="0"
                value={userForm.points}
                onChange={(e) => setUserForm({ ...userForm, points: e.target.value })}
                disabled={!userEditId}
              />
            </div>
            <button className="btn-primary" disabled={!userEditId}>
              <Pencil size={15} /> Save user
            </button>
            {userEditId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setUserForm(EMPTY_USER);
                  setUserEditId('');
                }}
              >
                Cancel
              </button>
            )}
            {!userEditId && <p className="text-xs text-slate-500">Click a user's edit button to change name, role or points.</p>}
          </form>
        </div>
      )}

      {/* ---------- waste records ---------- */}
      {tab === 'records' && (
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <Trash2 size={18} className="text-emerald-400" /> Waste records
            <span className="ml-auto text-xs font-normal text-slate-400">Self-reported user disposals</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="pb-2">When</th>
                  <th className="pb-2">User</th>
                  <th className="pb-2">Waste</th>
                  <th className="pb-2 text-right">Weight</th>
                  <th className="pb-2">Bin</th>
                  <th className="pb-2 text-right">Result</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.adminWasteLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2.5 text-slate-400">{timeAgo(l.createdAt)}</td>
                    <td className="font-medium text-white">{l.user?.name || '—'}</td>
                    <td>
                      <TypeChip type={l.wasteType} />
                    </td>
                    <td className="text-right text-slate-300">{l.weightKg} kg</td>
                    <td className="text-slate-400">{l.bin?.name}</td>
                    <td className={`text-right font-semibold ${l.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {l.correct ? `+${l.pointsEarned}` : 'wrong bin'}
                    </td>
                    <td className="text-right">
                      <button
                        className="btn-danger !px-3 !py-1.5"
                        onClick={() =>
                          confirmDo(
                            'Delete this waste record?',
                            () => gql('mutation($id:ID!){ deleteWasteLog(id:$id) }', { id: l.id }),
                            'Waste record deleted.',
                          )
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.adminWasteLogs.length && <Empty text="No waste records." />}
        </div>
      )}
    </>
  );
}
