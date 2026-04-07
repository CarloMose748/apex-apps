import { Navigate } from 'react-router-dom';
import { useAuthState } from '../lib/supabase';
import { Spinner } from '../components/UI/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div className="spinner-overlay">
        <Spinner size={48} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}