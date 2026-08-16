'use client';

import React, { useState } from 'react';
import { Upload, Image, FileVideo, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminMediaPage() {
  const [uploading, setUploading] = useState(false);
  const [lastUrl, setLastUrl] = useState('');

  const handleUpload = async (type: 'image' | 'video' | 'document', file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/upload/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLastUrl(data.data.url);
      toast.success('File uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="text-[var(--text-secondary)] mt-1">Upload images, videos, and documents.</p>
      </div>

      <div className="grid gap-4">
        {[
          { type: 'image' as const, icon: Image, label: 'Upload Image', accept: 'image/*' },
          { type: 'video' as const, icon: FileVideo, label: 'Upload Video', accept: 'video/*' },
          { type: 'document' as const, icon: FileText, label: 'Upload Document', accept: '.pdf,.doc,.docx' },
        ].map(({ type, icon: Icon, label, accept }) => (
          <label key={type} className="glass-card p-6 flex items-center gap-4 cursor-pointer hover:border-[var(--brand-500)]/30 transition-colors">
            <div className="p-3 rounded-xl bg-[var(--brand-500)]/10 text-[var(--brand-700)]"><Icon className="w-6 h-6" /></div>
            <div className="flex-1">
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-[var(--text-muted)]">{accept}</p>
            </div>
            <Upload className="w-5 h-5 text-[var(--text-muted)]" />
            <input type="file" accept={accept} className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && handleUpload(type, e.target.files[0])} />
          </label>
        ))}
      </div>

      {lastUrl && (
        <div className="glass-card p-4">
          <p className="text-sm font-medium mb-2">Last uploaded URL:</p>
          <input readOnly value={lastUrl} className="input-base w-full text-xs font-mono" onClick={(e) => (e.target as HTMLInputElement).select()} />
        </div>
      )}
    </div>
  );
}
