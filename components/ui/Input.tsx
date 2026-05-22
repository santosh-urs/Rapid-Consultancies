'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-text placeholder:text-[#A1A1A1] focus:border-brand focus:ring-2 focus:ring-brand/10 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
