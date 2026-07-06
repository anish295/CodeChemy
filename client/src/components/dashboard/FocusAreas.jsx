import { useTheme } from '../../context/ThemeContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const STATUS_META = {
  strong: { label: 'STRONG', color: 'var(--color-accent-green)', Icon: TrendingUp, bg: 'rgba(34, 197, 94, 0.1)' },
  medium: { label: 'PRACTICE', color: 'var(--color-accent-orange)', Icon: Minus, bg: 'rgba(249, 115, 22, 0.1)' },
  weak:   { label: 'WEAK',   color: 'var(--color-accent-red)',    Icon: TrendingDown, bg: 'rgba(239, 68, 68, 0.1)' },
};

export default function FocusAreas({ topics }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Empty state
  if (!topics || topics.length === 0) {
    return (
      <div
        className={isDark ? 'card-dark' : 'card-light'}
        style={{ padding: '24px', animation: 'var(--animate-slide-up)', display: 'flex', flexDirection: 'column' }}
      >
        <h3 style={{
          fontSize: '1.1rem', fontWeight: 700,
          color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
          marginBottom: '20px',
        }}>
          Topic Strength
        </h3>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{
            textAlign: 'center', fontSize: '0.88rem', lineHeight: 1.7,
            color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
          }}>
            Sync your LeetCode profile to see topic breakdown.
          </p>
        </div>
      </div>
    );
  }

  // Sort by solved count descending
  const sortedBySolved = [...topics].sort((a, b) => b.solved - a.solved);
  
  // Top 2 are strong, Bottom 4 are weak/practice
  const strongTopics = sortedBySolved.slice(0, 2).map(t => ({ ...t, status: 'strong' }));
  const weakTopics = sortedBySolved.slice(-4).reverse().map((t, idx) => ({ 
    ...t, 
    status: idx < 2 ? 'weak' : 'medium' 
  }));

  const sorted = [...strongTopics, ...weakTopics];
  const maxSolved = sorted[0]?.solved || 1;

  return (
    <div
      className={isDark ? 'card-dark' : 'card-light'}
      style={{
        padding: '24px',
        animation: 'var(--animate-slide-up)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
        marginBottom: '20px',
      }}>
        Topic Strength
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {sorted.map((topic, idx) => {
          const { color, Icon, label } = STATUS_META[topic.status];
          const barPct = Math.round((topic.solved / maxSolved) * 100);

          return (
            <div key={idx}>
              {/* Topic row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '55%',
                }}>
                  {topic.topic}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <Icon size={13} style={{ color }} />
                  <span style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    color,
                  }}>
                    {topic.solved} solved
                  </span>
                  
                  {/* Badge */}
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    color: STATUS_META[topic.status].color,
                    backgroundColor: STATUS_META[topic.status].bg,
                    padding: '4px 8px',
                    borderRadius: '6px',
                  }}>
                    {STATUS_META[topic.status].label}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{
                height: '5px',
                borderRadius: '3px',
                backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${barPct}%`,
                  borderRadius: '3px',
                  backgroundColor: color,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
