import { ReactNode } from 'react';

interface EmptyProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function Empty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon">{icon}</div>}
      <div className="empty__title">{title}</div>
      {description && <div className="empty__description">{description}</div>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}