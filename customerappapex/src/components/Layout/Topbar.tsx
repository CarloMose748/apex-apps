import { useState } from 'react';
import { FiUser, FiChevronDown, FiMenu } from 'react-icons/fi';
import { useAuthState, signOut, useMockData } from '../../lib/supabase';

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const { user } = useAuthState();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isMockMode = useMockData();

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
  };

  return (
    <>
      {isMockMode && (
        <div className="topbar__mock-banner">
          Mock Mode - No Supabase connection
        </div>
      )}
      <header className="topbar">
        <div className="topbar__left">
          <button 
            className="mobile-menu-trigger" 
            onClick={onMobileMenuToggle}
            aria-label="Toggle menu"
          >
            <FiMenu size={20} />
          </button>
          <img src="/logo-apex.png" alt="Apex Chem" className="topbar__logo" />
          <h1 className="topbar__title">Apex Customer App</h1>
        </div>
        
        <div className="topbar__right">
          <div className="topbar__user-menu">
            <button 
              className="topbar__user-button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
            >
              <FiUser size={20} />
              <span>{user?.name || user?.email || 'User'}</span>
              <FiChevronDown size={16} />
            </button>
            
            {userMenuOpen && (
              <div className="dropdown-menu">
                <button onClick={() => setUserMenuOpen(false)}>
                  Account
                </button>
                <button onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}