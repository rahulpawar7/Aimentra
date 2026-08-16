import React from 'react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--bg-surface)] border-t-[var(--brand-400)] rounded-full animate-spin"></div>
        <p className="text-[var(--text-muted)] font-medium">Loading...</p>
      </div>
    </div>
  );
}
