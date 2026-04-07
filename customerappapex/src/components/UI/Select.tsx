import { SelectHTMLAttributes } from 'react';
import type { SelectOption } from '../../lib/types';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  help?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  help,
  error,
  options,
  placeholder,
  className = '',
  ...props
}: SelectProps) {
  const selectClass = `input select ${error ? 'input--error' : ''} ${className}`;
  const id = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="form__group">
      {label && (
        <label htmlFor={id} className="form__label">
          {label}
        </label>
      )}
      <select
        {...props}
        id={id}
        className={selectClass}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help && !error && (
        <div className="form__help">{help}</div>
      )}
      {error && (
        <div className="form__error">{error}</div>
      )}
    </div>
  );
}