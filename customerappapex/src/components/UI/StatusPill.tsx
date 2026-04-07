interface StatusPillProps {
  status: string;
  variant?: 'neutral' | 'success' | 'warning' | 'danger';
}

export function StatusPill({ status, variant = 'neutral' }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${variant}`}>
      {status}
    </span>
  );
}