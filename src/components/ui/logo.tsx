'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const badgeSizes = {
    sm: 'h-7 w-7 text-xs border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
    md: 'h-9 w-9 text-sm border-2 sm:border-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
    lg: 'h-12 w-12 text-lg border-3 sm:border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  };

  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Neo-Brutalist SM Icon Badge */}
      <div
        className={`bg-[#F5E600] border-black text-black font-black font-mono flex items-center justify-center tracking-tighter uppercase select-none ${badgeSizes[size]}`}
      >
        SM
      </div>

      {showText && (
        <span className={`font-black uppercase tracking-tight text-black ${textSizes[size]}`}>
          SplitMate
        </span>
      )}
    </div>
  );
}
