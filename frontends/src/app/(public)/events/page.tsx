'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { getEvents, registerForEvent } from '@/lib/services';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function EventsPage() {
  const { isAuthenticated } = useAuthStore();
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents({ upcoming: true }),
  });

  useQuery({
    queryKey: ['my-event-registrations'],
    queryFn: async () => {
      const { data } = await api.get('/events/my/registrations');
      const ids = new Set<string>((data.data || []).map((r: any) => r.eventId?._id || r.eventId));
      setRegisteredIds(ids);
      return data.data;
    },
    enabled: isAuthenticated,
  });

  const registerMutation = useMutation({
    mutationFn: registerForEvent,
    onSuccess: (_data, eventId) => {
      toast.success('Successfully registered for the event!');
      setRegisteredIds((prev) => new Set(prev).add(eventId));
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Registration failed'),
  });

  const events = data?.events ?? [];

  const handleRegister = (eventId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to register');
      window.location.href = `/login?redirect=/events`;
      return;
    }
    registerMutation.mutate(eventId);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="surface-dark relative overflow-hidden py-14 text-center sm:py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--gradient-glow)' }} />
        <div className="container relative z-10 mx-auto max-w-2xl px-4">
          <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Live Events & Workshops</h1>
          <p className="text-base text-muted-on-dark sm:text-lg">
            Learn live, ask questions in real time, and connect with fellow entrepreneurs.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-[var(--text-muted)]">No upcoming events scheduled. Check back soon!</p>
        ) : (
          <div className="space-y-5">
            {events.map((event: any) => {
              const isRegistered = registeredIds.has(event._id);
              const seatsLeft = event.capacity ? Math.max(0, event.capacity - (event.registeredCount || 0)) : null;
              return (
                <div key={event._id} className="flex flex-col gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">{event.title}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(event.date)}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {new Date(event.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.isOnline ? 'Online — Live Session' : event.venue || 'In-Person'}
                      </span>
                    </div>
                    {seatsLeft !== null && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--success)]">
                        <Users className="h-3.5 w-3.5" /> {seatsLeft} seats left
                      </p>
                    )}
                  </div>
                  {isRegistered ? (
                    <span className="badge badge-success shrink-0 px-4 py-2">Registered</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRegister(event._id)}
                      disabled={registerMutation.isPending || (seatsLeft === 0)}
                      className="btn-brand w-full shrink-0 sm:w-auto disabled:opacity-50"
                    >
                      {seatsLeft === 0 ? 'Event Full' : 'Reserve Your Spot'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
