'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bell, Award, CreditCard, Video, MessageSquare, Check } from 'lucide-react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/services';
import { formatDate } from '@/lib/utils';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) markReadMutation.mutate(notif._id);
    if (notif.actionUrl) router.push(notif.actionUrl);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'certificate': return <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-full"><Award className="w-5 h-5" /></div>;
      case 'course': return <div className="p-2 bg-blue-500/10 text-blue-500 rounded-full"><Video className="w-5 h-5" /></div>;
      case 'purchase': return <div className="p-2 bg-green-500/10 text-green-500 rounded-full"><CreditCard className="w-5 h-5" /></div>;
      default: return <div className="p-2 bg-[var(--brand-500)]/10 text-[var(--brand-700)] rounded-full"><MessageSquare className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
          <p className="text-sm text-[var(--text-secondary)]">Stay updated with your account activity.</p>
        </div>
        <button onClick={() => markAllMutation.mutate()} className="btn-ghost flex items-center gap-2 text-sm">
          <Check className="w-4 h-4" /> Mark all read
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-[var(--border-subtle)]">
            {[1, 2, 3].map(i => <div key={i} className="p-4"><div className="skeleton h-12 w-full" /></div>)}
          </div>
        ) : !notifications?.length ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-secondary)]">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {notifications.map((notif: any) => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-5 flex gap-4 cursor-pointer hover:bg-[var(--bg-surface)]/50 ${!notif.read ? 'bg-[var(--brand-500)]/5 relative' : ''}`}
              >
                {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--brand-500)]" />}
                <div className="shrink-0 pt-1">{getIcon(notif.category)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 mb-1">
                    <h4 className={`text-sm ${!notif.read ? 'font-bold' : 'font-semibold text-[var(--text-secondary)]'}`}>{notif.title}</h4>
                    <span className="text-xs text-[var(--text-muted)] shrink-0">{timeAgo(notif.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
