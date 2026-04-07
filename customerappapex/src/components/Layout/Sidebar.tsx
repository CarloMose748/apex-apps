import { NavLink } from 'react-router-dom';
import { 
  FiHome, 
  FiArchive, 
  FiShield, 
  FiTruck,
  FiSettings,
  FiFileText,
  FiGlobe
} from 'react-icons/fi';

const navigationItems = [
  { to: '/', icon: FiHome, label: 'Dashboard' },
  { to: '/collections', icon: FiArchive, label: 'Collection History' },
  { to: '/certificates', icon: FiShield, label: 'Certificates' },
  { to: '/requests', icon: FiTruck, label: 'Request Pickup' },
  { to: '/sars-form', icon: FiFileText, label: 'SARS Form' },
  { to: '/iscc-form', icon: FiGlobe, label: 'ISCC Form' },
  { to: '/account', icon: FiSettings, label: 'Account' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  return (
    <nav className="sidebar">
      <div className="sidebar__header">
        <img src="/logo-apex.svg" alt="Apex" className="sidebar__logo" />
      </div>
      
      <div className="sidebar__nav">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
              }
            >
              <Icon className="sidebar__nav-icon" />
              <span className="sidebar__nav-text">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      
      <div className="sidebar__footer">
        <p className="sidebar__footer-text">© 2025 Apex Chem</p>
      </div>
    </nav>
  );
}