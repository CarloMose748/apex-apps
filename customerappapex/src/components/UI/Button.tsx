import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  let buttonClass = 'button';
  
  if (variant === 'primary') buttonClass += ' button--primary';
  if (variant === 'secondary') buttonClass += ' button--secondary';
  if (variant === 'ghost') buttonClass += ' button--ghost';
  
  if (size === 'sm') buttonClass += ' button--sm';
  if (size === 'lg') buttonClass += ' button--lg';
  
  if (loading) buttonClass += ' button--loading';
  if (className) buttonClass += ` ${className}`;

  return (
    <button
      className={buttonClass}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="spinner" width="16" height="16" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
          <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}