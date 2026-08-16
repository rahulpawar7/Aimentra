'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthSession } from '@/hooks/useAuthSession';
import { buildLoginUrl } from '@/lib/auth-utils';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('planId') || searchParams.get('plan') || '';
  const { user, isAuthenticated, authReady } = useAuthSession();
  const [plan, setPlan] = useState<any>(null);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [planLoading, setPlanLoading] = useState(!!planId);

  const checkoutReturnUrl = planId
    ? `/checkout?${searchParams.get('planId') ? `planId=${planId}` : `plan=${planId}`}`
    : '/checkout';

  // Redirect unauthenticated users to login — preserve checkout destination
  useEffect(() => {
    if (!authReady || !planId) return;
    if (!isAuthenticated) {
      router.replace(buildLoginUrl(checkoutReturnUrl));
    }
  }, [authReady, isAuthenticated, planId, router, checkoutReturnUrl]);

  useEffect(() => {
    if (!planId) {
      setPlanLoading(false);
      return;
    }
    setPlanLoading(true);
    api.get('/plans').then(({ data }) => {
      const list = data.data?.plans || data.data || [];
      const found = Array.isArray(list)
        ? list.find((p: any) => p._id === planId || p.slug === planId)
        : null;
      setPlan(found || null);
    }).catch(() => toast.error('Failed to load plan'))
      .finally(() => setPlanLoading(false));
  }, [planId]);

  const applyCoupon = async () => {
    if (!plan || !coupon) return;
    try {
      const { data } = await api.post('/orders/apply-coupon', { code: coupon, planId: plan._id });
      setDiscount(data.data.discountAmount || 0);
      toast.success('Coupon applied');
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Invalid coupon');
      setDiscount(0);
    }
  };

  const startCheckout = async () => {
    if (!plan || !user) return;

    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        planId: plan._id,
        couponCode: coupon || undefined,
        billingDetails: {
          name: user.name || 'User',
          email: user.email || '',
          phone: user.phone || '9999999999',
          address: 'India',
          state: 'Maharashtra',
        },
      });

      if (data.data?.free || data.data?.order?.status === 'paid') {
        setDone(true);
        toast.success('Access granted!');
        setLoading(false);
        return;
      }

      const rz = data.data.razorpay;
      const order = data.data.order;

      if (rz?.mock || !rz?.key || rz.key === 'rzp_test_mock') {
        await api.post('/orders/verify', {
          orderId: order._id,
          razorpayOrderId: rz.orderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: `mock_${Date.now()}`,
        });
        setDone(true);
        toast.success('Payment verified (test mode)');
        setLoading(false);
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        toast.error('Failed to load Razorpay');
        setLoading(false);
        return;
      }

      const rp = new window.Razorpay({
        key: rz.key,
        amount: rz.amount,
        currency: rz.currency,
        name: 'Aimentra',
        description: plan.name,
        order_id: rz.orderId,
        handler: async (response: any) => {
          await api.post('/orders/verify', {
            orderId: order._id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          setDone(true);
          toast.success('Payment successful!');
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: { color: '#0f766e' },
      });
      rp.open();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  if (!authReady || (planId && !isAuthenticated)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="skeleton h-8 w-48 rounded" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <h1 className="text-3xl font-bold">You&apos;re in!</h1>
        <p className="text-[var(--text-secondary)]">Your plan is active. Start learning from your dashboard.</p>
        <Link href="/dashboard/courses" className="btn-brand inline-block px-6 py-3 rounded-lg">
          Go to My Courses
        </Link>
      </div>
    );
  }

  if (planLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="skeleton h-8 w-48 rounded" />
      </div>
    );
  }

  if (!planId || !plan) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <p className="text-[var(--text-secondary)]">Select a plan from pricing to checkout.</p>
        <Link href="/packages" className="text-[var(--brand-700)] underline mt-4 inline-block">View plans</Link>
      </div>
    );
  }

  const gst = Math.round(((plan.price - discount) * (plan.gstPercent || 18)) / 100);
  const total = plan.price - discount + gst;

  return (
    <div className="max-w-xl mx-auto py-12 px-4 space-y-8">
      <div>
        <p className="text-sm text-[var(--text-muted)] mb-1">Signed in as {user?.email}</p>
        <h1 className="text-3xl font-bold tracking-tight">{plan.name}</h1>
        <p className="text-[var(--text-secondary)] mt-2">{plan.description}</p>
      </div>

      <div className="space-y-2 border border-[var(--border-subtle)] rounded-xl p-5">
        <div className="flex justify-between"><span>Subtotal</span><span>₹{plan.price}</span></div>
        {discount > 0 && <div className="flex justify-between text-green-500"><span>Discount</span><span>-₹{discount}</span></div>}
        <div className="flex justify-between"><span>GST</span><span>₹{gst}</span></div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t border-[var(--border-subtle)]">
          <span>Total</span><span>₹{total}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 input"
          placeholder="Coupon code"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
        />
        <button type="button" className="btn-outline px-4" onClick={applyCoupon}>Apply</button>
      </div>

      <button
        type="button"
        className="btn-brand w-full py-3 text-base font-semibold disabled:opacity-50"
        disabled={loading}
        onClick={startCheckout}
      >
        {loading ? 'Processing…' : 'Pay securely'}
      </button>
    </div>
  );
}
