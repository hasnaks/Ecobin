'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Recycle, ShieldCheck, Trophy, Gift } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ErrorBox } from '@/components/ui';

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const features = [
    { icon: <Recycle size={18} />, text: 'Segregate waste correctly' },
    { icon: <Leaf size={18} />, text: 'Earn EcoPoints on every disposal' },
    { icon: <Gift size={18} />, text: 'Redeem points for rewards' },
    { icon: <Trophy size={18} />, text: 'Climb the campus leaderboard' },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/5 bg-[#04120c] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(700px 380px at 15% 10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(600px 420px at 90% 90%, rgba(16,185,129,0.12), transparent 55%)',
          }}
        />
        <div className="relative flex items-center gap-2 text-xl font-bold text-emerald-400">
          <Leaf /> EcoBin
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Smarter bins.
            <br />
            Cleaner campus.
          </h2>
          <p className="mt-3 max-w-md text-slate-300">
            A smart waste management platform that rewards you for doing the right thing.
          </p>
          <ul className="mt-8 space-y-3">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-slate-300">
                <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                  {f.icon}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-slate-500">Web Technologies Project</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 text-xl font-bold text-emerald-400 lg:hidden">
            <Leaf /> EcoBin
          </div>
          <h1 className="text-2xl font-bold text-white">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-400">
            {mode === 'login' ? 'Sign in to continue.' : 'Start earning EcoPoints today.'}
          </p>
          <ErrorBox message={error} />
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">
            {mode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
            <button
              className="font-semibold text-emerald-400 hover:underline"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
          {mode === 'login' && (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-xs text-slate-400">
              <p className="mb-2 font-semibold text-slate-300">Demo accounts</p>
              <button
                className="block transition hover:text-emerald-400"
                onClick={() => {
                  setEmail('demo@ecobin.com');
                  setPassword('demo123');
                }}
              >
                User: demo@ecobin.com / demo123
              </button>
              <Link
                href="/admin/login"
                className="mt-2 flex items-center gap-1.5 font-semibold text-emerald-400 transition hover:text-emerald-300"
              >
                <ShieldCheck size={13} /> Administrator portal →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
