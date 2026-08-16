'use client';

import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { FaqSectionCMS } from '@/lib/homepage-types';

export default function FAQSection({ cms }: { cms?: FaqSectionCMS }) {
  const items = cms?.items || [];
  if (!cms?.title || items.length === 0) return null;

  return (
    <section className="bg-[var(--bg-surface)] py-12 sm:py-16 md:py-20">
      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
            {cms.title}
          </h2>
          {cms.subtitle ? (
            <p className="text-sm text-[var(--text-secondary)] sm:text-base md:text-lg">{cms.subtitle}</p>
          ) : null}
        </div>

        <Accordion.Root type="single" collapsible className="w-full space-y-3 sm:space-y-4">
          {items.map((faq, idx) => (
            <Accordion.Item
              key={idx}
              value={`item-${idx}`}
              className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all duration-300 data-[state=open]:border-[var(--brand-500)]/50"
            >
              <Accordion.Header className="flex">
                <Accordion.Trigger className="flex flex-1 items-start justify-between gap-3 px-4 py-4 text-left text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--brand-700)] focus:outline-none sm:items-center sm:px-6 sm:py-5 sm:text-base [&[data-state=open]>svg]:rotate-180 [&[data-state=open]]:text-[var(--brand-700)]">
                  <span className="min-w-0">{faq.question}</span>
                  <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-300" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden text-sm text-[var(--text-secondary)] data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown sm:text-base">
                <div className="px-4 pb-4 pt-0 leading-relaxed sm:px-6 sm:pb-6">{faq.answer}</div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown {
          from { height: 0; opacity: 0; }
          to { height: var(--radix-accordion-content-height); opacity: 1; }
        }
        @keyframes slideUp {
          from { height: var(--radix-accordion-content-height); opacity: 1; }
          to { height: 0; opacity: 0; }
        }
        .animate-slideDown { animation: slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1); }
        .animate-slideUp { animation: slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1); }
      `}} />
    </section>
  );
}
