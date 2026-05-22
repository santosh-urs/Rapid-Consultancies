'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-2xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-text placeholder:text-[#A1A1A1] focus:border-brand focus:ring-2 focus:ring-brand/10 ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
