import { useTheme } from '../../context/ThemeContext';
import { TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const { theme } = { theme: 'dark' }; // will be overridden by closure below
  const point = payload[0].payload;
  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: '10px',
      backgroundColor: 'rgba(15, 23, 18, 0.92)',
      border: '1px solid rgba(255,122,0,0.3)',
      fontSize: '0.8rem',
      color: '#F0EAD6',
      maxWidth: '200px',
    }}>
      <div style={{ fontWeight: 700, marginBottom: '4px', color: '#FF7A00' }}>{point.contestName}</div>
      <div>Rating: <strong>{point.rating}</strong></div>
      <div style={{ opacity: 0.7, fontSize: '0.72rem' }}>{point.dateLabel}</div>
    </div>
  );
}

export default function ContestRatingChart({ contestHistory = [] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Prepare chart data — sort by date ascending
  const data = [...contestHistory]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(c => ({
      contestName: c.contestName,
      rating: c.rating,
      dateLabel: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      date: new Date(c.date).getTime(),
    }));

  const empty = data.length === 0;
  const minRating = empty ? 0 : Math.min(...data.map(d => d.rating)) - 50;
  const maxRating = empty ? 3000 : Math.max(...data.map(d => d.rating)) + 50;

  return (
    <div
      className={isDark ? 'card-dark' : 'card-light'}
      style={{
        padding: '24px',
        animation: 'var(--animate-slide-up)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: 'var(--color-accent-orange)' }} />
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
          }}>
            Contest Rating
          </h3>
        </div>
        {data.length > 0 && (
          <span className="pill" style={{
            backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
            color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
          }}>
            {data.length} contests
          </span>
        )}
      </div>

      {empty ? (
        <div style={{
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{
            fontSize: '0.88rem',
            color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
            textAlign: 'center',
          }}>
            No contest history yet.<br />Participate in a LeetCode contest to see your rating progress.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: isDark ? '#6B7A6F' : '#9A9A8C', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
              // Only show every Nth tick to avoid crowding
              interval={Math.max(0, Math.floor(data.length / 5))}
            />
            <YAxis
              domain={[minRating, maxRating]}
              tick={{ fontSize: 10, fill: isDark ? '#6B7A6F' : '#9A9A8C', fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#FF7A00"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#FF7A00', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#FF7A00', stroke: 'rgba(255,122,0,0.3)', strokeWidth: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
