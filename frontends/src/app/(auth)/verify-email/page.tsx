'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'ok' | 'fail'>('pending');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('fail');
      return;
    }
    api
      .post('/auth/verify-email', { token })
      .then(() => {
        setStatus('ok');
        setTimeout(() => router.push('/login'), 1500);
      })
      .catch(() => setStatus('fail'));
  }, [params, router]);

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Email verification</h1>
      {status === 'pending' && <p>Verifying…</p>}
      {status === 'ok' && <p className="text-green-500">Verified! Redirecting to login…</p>}
      {status === 'fail' && <p className="text-red-600">Invalid or expired link.</p>}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center">Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
