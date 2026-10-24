'use client';
import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { gql, Notif, timeAgo } from '@/lib/api';
import { useGql } from '@/lib/useGql';
import { Empty, ErrorBox, PageHeader, Spinner } from '@/components/ui';

const ICONS: Record<string, ReactNode> = {
  SUCCESS: <CheckCircle2 className="text-emerald-400" size={20} />,
  WARNING: <AlertTriangle className="text-amber-400" size={20} />,
  INFO: <Info className="text-sky-400" size={20} />,
};

export default function NotificationsPage() {
  const { data, error, loading, reload } = useGql<{ notifications: Notif[] }>(
    '{ notifications { id message type isRead createdAt } }',
    {},
    15000,
  );
  if (loading) return <Spinner />;
  const unread = data?.notifications.filter((n) => !n.isRead).length || 0;

  async function read(id: string) {
    await gql('mutation($id:ID!){ markNotificationRead(id:$id) }', { id });
    reload();
  }
  async function readAll() {
    await gql('mutation { markAllNotificationsRead }');
    reload();
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You are all caught up'}
        action={
          unread > 0 && (
            <button className="btn-ghost" onClick={readAll}>
              Mark all as read
            </button>
          )
        }
      />
      <ErrorBox message={error} />
      <div className="card p-0">
        {data?.notifications.length ? (
          <ul className="divide-y divide-white/5">
            {data.notifications.map((n) => (
              <li
                key={n.id}
                onClick={() => !n.isRead && read(n.id)}
                className={`flex cursor-pointer items-start gap-3 px-5 py-4 text-sm ${n.isRead ? '' : 'bg-emerald-500/5'}`}
              >
                <span className="mt-0.5">{ICONS[n.type] || ICONS.INFO}</span>
                <div className="flex-1">
                  <p className={n.isRead ? 'text-slate-400' : 'font-medium text-white'}>{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />}
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No notifications yet." />
        )}
      </div>
    </>
  );
}
