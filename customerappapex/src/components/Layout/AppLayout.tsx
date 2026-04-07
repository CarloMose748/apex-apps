import { ReactNode, useState } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar />
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="app-layout__main">
        <Topbar onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="app-layout__content">
          {children}
        </main>
      </div>
    </div>
  );
}