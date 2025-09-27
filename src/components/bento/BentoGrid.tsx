import React from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "grid auto-rows-[minmax(200px,auto)] gap-4",
      "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
};

interface BentoResultsGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoResultsGrid: React.FC<BentoResultsGridProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "grid gap-6",
      "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3",
      "auto-rows-[minmax(320px,auto)]",
      className
    )}>
      {children}
    </div>
  );
};