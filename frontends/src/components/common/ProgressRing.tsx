import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function ProgressRing({
  percentage,
  size = 60,
  strokeWidth = 4,
  color = 'var(--brand-500)',
  className
}: ProgressRingProps) {
  const [offset, setOffset] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // Animate to the percentage on mount
    const safePercentage = Math.min(Math.max(percentage, 0), 100);
    const progressOffset = circumference - (safePercentage / 100) * circumference;
    
    // Slight timeout for animation effect
    const timeout = setTimeout(() => {
      setOffset(progressOffset);
    }, 100);

    return () => clearTimeout(timeout);
  }, [percentage, circumference]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          stroke="var(--bg-elevated)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress stroke */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset === 0 ? circumference : offset} // initial state is 0 progress
          className="transition-all duration-1000 ease-out"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold text-[var(--text-primary)]">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}
