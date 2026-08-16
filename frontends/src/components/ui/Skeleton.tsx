import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-md)] bg-[var(--bg-elevated)]/50',
        className
      )}
      style={{
        width: width ?? style?.width,
        height: height ?? style?.height,
        ...style,
      }}
      {...props}
    />
  );
}
