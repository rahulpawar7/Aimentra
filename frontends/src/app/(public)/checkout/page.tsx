import { Suspense } from 'react';
import type { Metadata } from 'next';
import CheckoutClient from '@/components/checkout/CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout — Aimentra',
  description: 'Complete your plan purchase securely.',
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading checkout…</div>}>
      <CheckoutClient />
    </Suspense>
  );
}
