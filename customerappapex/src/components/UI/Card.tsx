import { ReactNode } from 'react';

interface CardProps {
  header?: ReactNode;
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ header, title, extra, children, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(header || title || extra) && (
        <div className="card__header">
          {header || (
            <div className="card__header-content">
              {title && <h3 className="card__title">{title}</h3>}
              {extra && <div className="card__extra">{extra}</div>}
            </div>
          )}
        </div>
      )}
      <div className="card__body">
        {children}
      </div>
    </div>
  );
}