'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Download, FileText, ExternalLink } from 'lucide-react';
import api from '@/lib/api';

type DownloadItem = {
  _id: string;
  title: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  externalUrl?: string;
  courseId?: { title: string; slug: string };
};

export default function DownloadsPage() {
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['my-downloads'],
    queryFn: async () => {
      const { data } = await api.get('/progress/downloads');
      return (data.data || []) as DownloadItem[];
    },
  });

  const openResource = (item: DownloadItem) => {
    const url = item.fileUrl || item.externalUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Downloads</h1>
        <p className="text-[var(--text-secondary)] mt-1">Access downloadable resources from your enrolled courses.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : resources.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Download className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-40" />
          <p className="text-[var(--text-secondary)]">No downloadable content yet.</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">Enroll in a course with download access to see resources here.</p>
          <Link href="/courses" className="btn-brand inline-flex mt-6 px-5 py-2 text-sm">Browse Courses</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((item) => (
            <div key={item._id} className="glass-card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--brand-500)]/10 flex items-center justify-center text-[var(--brand-700)] shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--text-primary)] truncate">{item.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {item.courseId?.title || 'Course'} · {item.type.toUpperCase()}
                  {item.fileName ? ` · ${item.fileName}` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => openResource(item)} className="btn-brand flex items-center gap-2 text-sm px-3 py-2">
                  <Download className="w-4 h-4" /> Download
                </button>
                {item.courseId?.slug ? (
                  <Link href={`/courses/${item.courseId.slug}`} className="btn-outline flex items-center gap-2 text-sm px-3 py-2">
                    Course <ExternalLink className="w-4 h-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
