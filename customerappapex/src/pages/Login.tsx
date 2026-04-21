import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { signInWithPassword, signInWithOtp, useAuthState } from '../lib/supabase';
import { FiInfo } from 'react-icons/fi';

export function Login() {
  const { user, loading } = useAuthState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Redirect if already logged in
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const { data, error: signInError } = await signInWithPassword(email, password);
    
    if (signInError) {
      setError(signInError);
    } else if (data?.user) {
      // In demo mode, persist the session
      if (!import.meta.env.VITE_SUPABASE_URL) {
        localStorage.setItem('demo-session', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || 'Demo User',
          role: data.user.user_metadata?.role || 'manager'
        }));
      }
      // Role validation passed — reload to pick up session cleanly
      window.location.href = '/';
      return;
    }
    
    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    
    const { error: magicLinkError } = await signInWithOtp(email);
    
    if (magicLinkError) {
      setError(magicLinkError);
    } else {
      setMessage('Check your email for a sign-in link!');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo-apex.png" alt="Apex Chem" className="login-logo__image" />
            <p>Customer Portal</p>
          </div>
        </div>
        
        <div className="login-content">
          {/* Demo Mode Info */}
          {!import.meta.env.VITE_SUPABASE_URL && (
            <div className="demo-notice">
              <div className="demo-notice__content">
                <h4><FiInfo /> Demo Mode</h4>
                <p>You're using the demo version. Use these credentials to explore the system:</p>
                <div className="demo-credentials">
                  <span><strong>Email:</strong> demo@apex.com</span>
                  <span><strong>Password:</strong> demo123</span>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handlePasswordLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="form-input"
              />
            </div>
            
            {error && (
              <div className="form-error">{error}</div>
            )}
            
            {message && (
              <div className="form-success">{message}</div>
            )}
            
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
              
              <button
                type="button"
                className="btn-secondary"
                disabled={isLoading || !email}
                onClick={handleMagicLink}
              >
                Send Magic Link
              </button>
            </div>
            
            <div className="auth-footer">
              <p>Don't have an account? <a href="/register" className="auth-link">Register your business</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}