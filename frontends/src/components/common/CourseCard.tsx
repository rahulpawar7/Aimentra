import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, BookOpen, PlayCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';

export interface CourseCardProps {
  course?: any;
  variant?: 'default' | 'compact' | 'skeleton';
  className?: string;
}

export function CourseCard({ course, variant = 'default', className }: CourseCardProps) {
  if (variant === 'skeleton') {
    return (
      <div
        className={cn(
          'flex flex-col rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden',
          className
        )}
      >
        <Skeleton className="w-full aspect-video rounded-none max-h-40" />
        <div className="p-3 sm:p-4 flex flex-col gap-3">
          <Skeleton className="w-20 h-5" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-3/4 h-4" />
          <Skeleton className="w-24 h-6 mt-2" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  const id = course._id || course.id;
  const title = course.title;
  const slug = course.slug;
  const thumbnail = course.thumbnail;
  const categoryName =
    typeof course.category === 'object'
      ? course.category?.name
      : course.category || 'Business';
  const instructorName = course.instructorName || course.instructor?.name || 'Instructor';
  const instructorAvatar = course.instructorAvatar || course.instructor?.avatar;
  const durationInMinutes = course.totalDuration || course.duration || 120;
  const lessonsCount = course.lessonCount || course.lessonsCount || 24;
  const rating = course.rating || 4.9;
  const price = course.price ?? 9999;
  const originalPrice = course.compareAtPrice || course.originalPrice || 19999;
  const hours = Math.floor(durationInMinutes / 60);
  const mins = durationInMinutes % 60;
  const formattedDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <Link
      href={`/courses/${slug || id}`}
      className={cn(
        'group flex flex-col rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 hover:border-[var(--border-default)]',
        variant === 'compact' && 'flex-row items-center h-24',
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-[var(--bg-elevated)]',
          variant === 'compact' ? 'w-28 h-full shrink-0' : 'w-full aspect-video max-h-36 sm:max-h-44'
        )}
      >
        <Image
          src={thumbnail || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80'}
          alt={title || 'Course'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {variant !== 'compact' && categoryName && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="brand"
              className="backdrop-blur-md bg-[var(--brand-500)]/85 text-white border-none text-[10px] sm:text-xs px-2 py-0.5"
            >
              {String(categoryName)}
            </Badge>
          </div>
        )}

        {variant !== 'compact' && (
          <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex flex-col min-w-0',
          variant === 'compact' ? 'p-3 flex-1' : 'p-3 sm:p-4 flex-1'
        )}
      >
        {variant === 'compact' ? (
          <>
            <h3 className="font-semibold text-[var(--text-primary)] truncate text-sm">{title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{instructorName}</p>
          </>
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--text-muted)] mb-2">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedDuration}
              </span>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {lessonsCount}
              </span>
            </div>

            <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-snug mb-2 line-clamp-2 group-hover:text-[var(--brand-700)] transition-colors">
              {title}
            </h3>

            <div className="hidden sm:flex items-center gap-2 mb-3 mt-auto">
              <Avatar src={instructorAvatar} alt={instructorName} size="sm" className="w-5 h-5" />
              <span className="text-xs text-[var(--text-secondary)] truncate">{instructorName}</span>
            </div>

            <div className="h-px bg-[var(--border-subtle)] my-2 sm:my-3 -mx-3 sm:-mx-4" />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-[var(--bg-surface)] px-1.5 py-0.5 rounded-md shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
                <span className="font-semibold text-xs text-[var(--text-primary)]">
                  {Number(rating).toFixed(1)}
                </span>
              </div>

              <div className="flex flex-col items-end min-w-0">
                {originalPrice && originalPrice > price && (
                  <span className="text-[10px] text-[var(--text-muted)] line-through leading-none">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
                <span className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-tight">
                  {price === 0 ? 'Free' : formatCurrency(price)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

export default CourseCard;
