'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Leaf, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ErrorBox } from '@/components/ui';

export default function AdminLoginPage() {
  const { user, loading, adminLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) router.replace(user.role === 'ADMIN' ? '/admin' : '/dashboard');
  }, [user, loading, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await adminLogin(email, password);
      router.replace('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(700px 420px at 50% -10%, rgba(16,185,129,0.16), transparent 60%), radial-gradient(600px 400px at 10% 110%, rgba(16,185,129,0.08), transparent 55%)',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-emerald-400">
            <ShieldCheck size={24} />
          </span>
          <div>
            <p className="text-lg font-bold text-white">EcoBin Admin</p>
            <p className="text-xs text-slate-400">Administrator portal</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white">Administrator sign in</h1>
        <p className="mb-6 mt-1 text-sm text-slate-400">
          Authorized administrators only.
        </p>

        <ErrorBox message={error} />

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Admin email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            <Lock size={15} />
            {busy ? 'Verifying...' : 'Sign in securely'}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-xs text-slate-400">
          <p className="mb-1.5 font-semibold text-slate-300">Demo admin account</p>
          <button
            className="block transition hover:text-emerald-400"
            onClick={() => {
              setEmail('admin@ecobin.com');
              setPassword('admin123');
            }}
          >
            admin@ecobin.com / admin123
          </button>
        </div>

        <Link
          href="/login"
          className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={14} /> Back to user sign in
        </Link>

        <p className="mt-8 flex items-center gap-1.5 text-xs text-slate-500">
          <Leaf size={12} className="text-emerald-500" /> EcoBin · Smart Waste Management
        </p>
      </div>
    </div>
  );
}
