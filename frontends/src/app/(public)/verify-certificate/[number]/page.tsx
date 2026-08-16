'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { verifyCertificate } from '@/lib/services';
import { formatDate } from '@/lib/utils';

export default function VerifyCertificatePage() {
  const params = useParams();
  const number = params.number as string;

  const { data: certificate, isLoading, isError } = useQuery({
    queryKey: ['verify-certificate', number],
    queryFn: () => verifyCertificate(number),
    enabled: !!number,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full p-8 text-center">
        {isLoading ? (
          <div className="skeleton h-48 w-full rounded-xl" />
        ) : isError || !certificate ? (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Invalid Certificate</h1>
            <p className="text-[var(--text-secondary)]">
              The certificate number <code className="font-mono">{number}</code> could not be verified.
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <Award className="w-12 h-12 text-[var(--brand-700)] mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-1">Certificate Verified</h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">This is an authentic Aimentra certificate</p>
            <div className="space-y-3 text-left bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-subtle)]">
              <div><p className="text-xs text-[var(--text-muted)] uppercase">Student</p><p className="font-semibold">{certificate.studentName}</p></div>
              <div><p className="text-xs text-[var(--text-muted)] uppercase">Course</p><p className="font-semibold">{certificate.courseName}</p></div>
              <div><p className="text-xs text-[var(--text-muted)] uppercase">Issued</p><p className="font-semibold">{formatDate(certificate.issuedAt || certificate.completionDate)}</p></div>
              <div><p className="text-xs text-[var(--text-muted)] uppercase">Certificate ID</p><p className="font-mono text-sm">{certificate.certificateNumber}</p></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
