'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/services';
import { formatDate } from '@/lib/utils';

export default function BlogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => getBlogPosts({ limit: 20 }),
  });

  const posts = data?.posts ?? [];

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-10 sm:py-14">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h1 className="mb-3 text-3xl font-extrabold text-[var(--text-primary)] sm:text-4xl">
            Insights & <span className="gradient-text">Resources</span>
          </h1>
          <p className="text-base text-[var(--text-secondary)] sm:text-lg">
            Practical guides on marketing, sales, finance, and leadership.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-72 rounded-xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-[var(--text-muted)]">No blog posts published yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post: any) => (
              <article key={post._id} className="flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
                {post.coverImage && (
                  <div className="relative aspect-video overflow-hidden">
                    <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
                    <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {post.category}
                    </span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}
                  </div>
                  <h3 className="mb-2 font-bold leading-snug text-[var(--text-primary)]">{post.title}</h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">{post.excerpt}</p>
                  <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-700)]">
                    Read More <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
