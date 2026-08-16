'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getMyCertificates } from '@/lib/services';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function CertificatesPage() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: getMyCertificates,
  });

  const downloadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.get(`/certificates/${id}/download`);
      return data.data;
    },
    onSuccess: (data) => {
      const url = data?.downloadUrl || data?.certificate?.verificationUrl;
      if (url) window.open(url, '_blank');
      else toast.error('Download link not available');
    },
    onError: () => toast.error('Failed to download certificate'),
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Certificates</h1>
        <p className="text-[var(--text-secondary)] mt-1">View and download your earned certificates.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      ) : !certificates?.length ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <Award className="mb-4 h-16 w-16 text-[var(--text-muted)]" />
          <h3 className="mb-2 text-xl font-semibold">No certificates yet</h3>
          <p className="text-[var(--text-secondary)]">Complete 100% of a course to earn your official certificate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {certificates.map((cert: any) => (
            <div key={cert._id} className="glass-card p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-1/2 aspect-[4/3] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--brand-500)]/20 to-[var(--navy-800)]/20 flex items-center justify-center">
                <Award className="w-16 h-16 text-[var(--brand-700)]" />
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{cert.courseName || cert.courseId?.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Issued: {formatDate(cert.issuedAt || cert.completionDate)}</p>
                </div>
                <div className="bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase font-semibold">Certificate ID</p>
                  <p className="break-all font-mono font-medium">{cert.certificateNumber}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => downloadMutation.mutate(cert._id)}
                    className="btn-brand flex-1 flex items-center justify-center gap-2 py-2"
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <Link href={cert.verificationUrl || `/verify-certificate/${cert.certificateNumber}`} className="btn-outline flex-1 flex items-center justify-center gap-2 py-2">
                    <ExternalLink className="w-4 h-4" /> Verify
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
