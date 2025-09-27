import React from 'react';
import { cn } from '@/lib/utils';

interface BentoTileProps {
  children: React.ReactNode;
  cols?: number;
  rows?: number;
  className?: string;
}

export const BentoTile: React.FC<BentoTileProps> = ({ 
  children, 
  cols = 1, 
  rows = 1, 
  className 
}) => {
  const gridClasses = {
    // Column spans
    ...(cols === 1 && { 'md:col-span-1': true }),
    ...(cols === 2 && { 'md:col-span-2': true }),
    ...(cols === 3 && { 'md:col-span-3': true }),
    ...(cols === 4 && { 'md:col-span-4': true }),
    
    // Row spans
    ...(rows === 1 && { 'md:row-span-1': true }),
    ...(rows === 2 && { 'md:row-span-2': true }),
    ...(rows === 3 && { 'md:row-span-3': true }),
  };

  return (
    <div className={cn(
      // Base styling
      "group relative overflow-hidden rounded-2xl",
      "bg-gradient-to-br from-card to-card/80",
      "border border-border/50 shadow-lg",
      "hover:shadow-xl hover:-translate-y-1",
      "transition-all duration-200 ease-out",
      "p-6",
      
      // Grid positioning
      Object.entries(gridClasses)
        .filter(([_, shouldApply]) => shouldApply)
        .map(([className]) => className),
      
      className
    )}>
      {children}
    </div>
  );
};