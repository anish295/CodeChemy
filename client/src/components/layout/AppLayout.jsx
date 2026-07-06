import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

const STORAGE_KEY = 'codechemy_sidebar_collapsed';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Listen for localStorage changes from Sidebar
  useEffect(() => {
    const onStorage = () => {
      try {
        setCollapsed(localStorage.getItem(STORAGE_KEY) === 'true');
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Poll localStorage for same-tab updates (since storage event doesn't fire in same tab)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const val = localStorage.getItem(STORAGE_KEY) === 'true';
        setCollapsed(prev => prev !== val ? val : prev);
      } catch { /* ignore */ }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const marginLeft = collapsed
    ? 'var(--sidebar-width-collapsed)'
    : 'var(--sidebar-width)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft,
        padding: '32px 40px',
        minWidth: 0,
        maxWidth: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        transition: 'margin-left 0.3s ease',
      }}>
        {children}
      </main>
    </div>
  );
}
