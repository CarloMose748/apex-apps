import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  help,
  error,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}: InputProps) {
  const inputClass = `input ${error ? 'input--error' : ''} ${className}`;
  const id = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="form__group">
      {label && (
        <label htmlFor={id} className="form__label">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="search-input__icon">
            {leftIcon}
          </div>
        )}
        <input
          {...props}
          id={id}
          className={inputClass}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted">
            {rightIcon}
          </div>
        )}
      </div>
      {help && !error && (
        <div className="form__help">{help}</div>
      )}
      {error && (
        <div className="form__error">{error}</div>
      )}
    </div>
  );
}