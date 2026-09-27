import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import GlobalSearchModal from './GlobalSearchModal';
import GuidewireModal from './GuidewireModal';

export default function Layout({ children, title, crumb }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [gwOpen, setGwOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar onOpenGuidewireGuide={() => setGwOpen(true)} />
      <div className="main-area">
        <Header
          title={title}
          crumb={crumb}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenGuidewireGuide={() => setGwOpen(true)}
        />
        <main className="page-content">{children}</main>
      </div>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <GuidewireModal isOpen={gwOpen} onClose={() => setGwOpen(false)} />
    </div>
  );
}
