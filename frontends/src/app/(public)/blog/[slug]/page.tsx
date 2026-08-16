'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data } = await api.get(`/blog/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="skeleton h-64 w-full max-w-3xl" /></div>;
  if (isError || !post) return <div className="min-h-screen flex items-center justify-center"><p>Post not found</p></div>;

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {post.coverImage && (
        <div className="h-64 md:h-80 overflow-hidden">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}
      <article className="container mx-auto max-w-3xl px-4 py-10">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[var(--brand-700)] mb-6"><ArrowLeft className="w-4 h-4" /> Back to Blog</Link>
        <span className="badge badge-brand mb-3">{post.category}</span>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-8">
          <span>{post.authorName}</span>
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(post.publishedAt || post.createdAt)}</span>
          <span>{post.readTime} min read</span>
        </div>
        <div className="prose prose-lg max-w-none text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </div>
  );
}
