import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Code2,
  Lightbulb,
  BarChart3,
  Settings,
  Cpu,
  Flame,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/submissions', label: 'Submission Detail', icon: FileText },
  { path: '/company-sheets', label: 'Company Sheets', icon: Briefcase },
  { path: '/ai-review', label: 'AI Code Review', icon: Code2 },
  { path: '/ai-hints', label: 'AI Hint Generator', icon: Lightbulb },
  { path: '/vs-ranking', label: 'VS Ranking', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const STORAGE_KEY = 'codechemy_sidebar_collapsed';

export default function Sidebar() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch { /* ignore */ }
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const width = collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)';

  return (
    <aside 
      className={isDark ? 'sidebar-clay-dark' : 'sidebar-clay-light'}
      style={{
      width,
      minHeight: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: collapsed ? '20px 0 20px' : '24px 16px 20px',
      zIndex: 50,
      transition: 'width 0.3s ease, padding 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
      overflow: 'hidden',
    }}>
      {/* Header: Logo + collapse toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        marginBottom: '28px',
        paddingLeft: collapsed ? '0' : '8px',
        paddingRight: collapsed ? '0' : '4px',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={26} style={{ color: 'var(--color-accent-orange)', flexShrink: 0 }} />
            <div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: isDark ? 'var(--color-dark-text)' : 'var(--color-accent-orange)',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}>
                CodeChemy
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <Cpu size={24} style={{ color: 'var(--color-accent-orange)' }} />
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '8px',
              border: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
              background: 'transparent',
              color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
              cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) => isActive ? 'sidebar-nav-active' : ''}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0' : '12px',
              padding: collapsed ? '10px 0' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '16px',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              color: isActive
                ? 'var(--color-accent-orange)'
                : (isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)'),
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              flexShrink: 0,
            })}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Spacer + Expand button when collapsed */}
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', padding: '10px 0', borderRadius: '10px',
                border: 'none', background: 'transparent',
                color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </nav>

      {/* User Profile Chip */}
      <div 
        className="glass-panel"
        style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? '0' : '10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '12px',
        borderRadius: '16px',
        marginTop: '12px',
        transition: 'background-color 0.3s ease',
        flexShrink: 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '10px',
          background: isDark
            ? 'linear-gradient(135deg, #3A5A40, #588157)'
            : 'linear-gradient(135deg, var(--color-accent-orange), var(--color-accent-orange-light))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}>
          {initials}
        </div>

        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.name || 'User'}
              </div>
            </div>

            {/* Logout chevron button */}
            <button
              onClick={handleLogout}
              className="btn-glass"
              data-tooltip="Log out"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-accent-red)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              <LogOut size={13} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
