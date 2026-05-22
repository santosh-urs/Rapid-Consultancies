'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60';
    const variantStyle =
      variant === 'outline'
        ? 'border border-brand bg-white text-brand hover:bg-surface'
        : variant === 'ghost'
        ? 'bg-transparent text-[#555555] hover:bg-surface'
        : 'bg-brand text-white hover:bg-[#A30000]';

    return <button ref={ref} className={`${baseStyle} ${variantStyle} ${className}`} {...props} />;
  }
);

Button.displayName = 'Button';
