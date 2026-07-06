import { useTheme } from '../../context/ThemeContext';
import { Medal } from 'lucide-react';

export default function BadgesRow({ badges = [] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={isDark ? 'card-dark' : 'card-light'}
      style={{
        padding: '20px 24px',
        animation: 'var(--animate-slide-up)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Medal size={18} style={{ color: 'var(--color-accent-orange)' }} />
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
          }}>
            Badges
          </h3>
        </div>
        <span className="pill" style={{
          backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
          color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
        }}>
          {badges.length} earned
        </span>
      </div>

      {badges.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.88rem',
            color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
          }}>
            No badges yet — keep solving! 🏆
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '6px',
        }}>
          {badges.map((badge, idx) => (
            <div
              key={badge.id || idx}
              title={badge.displayName || badge.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
                border: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
                minWidth: '80px',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                cursor: 'default',
              }}
            >
              {badge.icon ? (
                <img
                  src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`}
                  alt={badge.name}
                  style={{
                    width: '36px',
                    height: '36px',
                    objectFit: 'contain',
                  }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <Medal size={28} style={{ color: 'var(--color-accent-orange)' }} />
              )}
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                textAlign: 'center',
                color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
                maxWidth: '70px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-mono)',
              }}>
                {badge.displayName || badge.shortName || badge.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
