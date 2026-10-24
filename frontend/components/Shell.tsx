'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Gift,
  History,
  Leaf,
  LayoutDashboard,
  LogOut,
  Menu,
  Recycle,
  ShieldCheck,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useGql } from '@/lib/useGql';
import { Spinner } from './ui';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dispose', label: 'Dispose Waste', icon: Recycle },
  { href: '/bins', label: 'Smart Bins', icon: Trash2 },
  { href: '/rewards', label: 'Rewards', icon: Gift },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/history', label: 'History', icon: History },
  { href: '/notifications', label: 'Notifications', icon: Bell },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data } = useGql<{ unreadCount: number }>('{ unreadCount }', {}, 15000);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => setOpen(false), [pathname]);

  if (loading || !user) return <Spinner />;

  const items = user.role === 'ADMIN' ? [...NAV, { href: '/admin', label: 'Admin', icon: ShieldCheck }] : NAV;
  const unread = data?.unreadCount || 0;

  const nav = (
    <nav className="flex-1 space-y-1 px-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
              active
                ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {href === '/notifications' && unread > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-[#080b09]/95 py-5 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-6 text-xl font-bold text-emerald-400">
          <Leaf /> EcoBin
        </div>
        {nav}
        <div className="mx-3 mt-4 rounded-xl border border-white/5 bg-white/5 p-3">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
          <button
            onClick={logout}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-400 transition hover:text-rose-300"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-white/5 bg-[#080b09] py-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between px-6 text-xl font-bold text-emerald-400">
              <span className="flex items-center gap-2">
                <Leaf /> EcoBin
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            {nav}
            <button onClick={logout} className="mx-6 mt-4 flex items-center gap-2 text-sm font-semibold text-rose-400">
              <LogOut size={16} /> Sign out
            </button>
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/70 px-4 py-3 backdrop-blur-xl sm:px-8">
          <button className="text-slate-400 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <div className="hidden text-sm text-slate-400 lg:block">
            Hello, <span className="font-semibold text-white">{user.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}
            </Link>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-bold text-emerald-400">
              <Leaf size={14} /> {user.points} pts
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
