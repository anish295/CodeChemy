import { useTheme } from '../../context/ThemeContext';
import { Flame } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, tag, subline, delta, accentColor, showFlame }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const valueColor = accentColor === 'orange'
    ? 'var(--color-accent-orange)'
    : (isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)');

  return (
    <div
      className={isDark ? 'card-dark' : 'card-light'}
      style={{
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'var(--animate-slide-up)',
      }}
    >
      {/* Flame watermark for streak card */}
      {showFlame && (
        <div style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: isDark ? 0.07 : 0.08,
          pointerEvents: 'none',
          lineHeight: 1,
        }}>
          <Flame
            size={72}
            style={{ color: isDark ? '#FF7A00' : '#C97B3D' }}
          />
        </div>
      )}

      {/* Top row: icon + tag */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        {Icon && (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-accent-orange-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent-orange)',
          }}>
            <Icon size={16} />
          </div>
        )}
        {tag && (
          <span className="pill" style={{
            backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
            color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
            fontSize: '0.6rem',
          }}>
            {tag}
          </span>
        )}
      </div>

      {/* Label */}
      <div style={{
        fontSize: '0.65rem',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
        marginBottom: '6px',
        fontWeight: 500,
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '2.2rem',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        color: valueColor,
        lineHeight: 1.1,
        marginBottom: '6px',
      }}>
        {value}
      </div>

      {/* Subline / Delta */}
      <div style={{
        fontSize: '0.75rem',
        color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
      }}>
        {delta && (
          <span style={{
            color: 'var(--color-accent-green)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            marginRight: '4px',
          }}>
            ↑ {delta}
          </span>
        )}
        {subline && <span>{subline}</span>}
      </div>
    </div>
  );
}
