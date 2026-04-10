import { useEffect } from 'react';
import { FiX, FiHome, FiArchive, FiShield, FiTruck, FiSettings, FiFileText } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const mobileNavigationItems = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/collections', icon: FiArchive, label: 'Collection History' },
  { to: '/certificates', icon: FiShield, label: 'Certificates & ISCC' },
  { to: '/requests', icon: FiTruck, label: 'Request Pickup' },
  { to: '/vat-declaration', icon: FiFileText, label: 'VAT Declaration' },
  { to: '/sars-form', icon: FiFileText, label: 'SARS Form' },
  { to: '/account', icon: FiSettings, label: 'Account' },
];

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {

  useEffect(() => {
    // Close menu when clicking outside or pressing escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar--mobile');
      const trigger = document.querySelector('.mobile-menu-trigger');
      
      if (sidebar && !sidebar.contains(e.target as Node) && 
          trigger && !trigger.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isOpen ? 'mobile-overlay--visible' : ''}`}
        onClick={onClose}
      />

      {/* Mobile Sidebar */}
      <div className={`sidebar--mobile ${isOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="mobile-menu__header">
          <h2 className="mobile-menu__title">Navigation</h2>
          <button
            className="mobile-menu__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <nav className="mobile-menu__nav">
          {mobileNavigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `mobile-menu__nav-item ${isActive ? 'mobile-menu__nav-item--active' : ''}`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
}