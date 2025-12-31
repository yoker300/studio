'use client';
import { cn } from '@/lib/utils';

export function ScrollMask({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div
      className={cn("overflow-y-auto", className)}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      {children}
    </div>
  );
}
