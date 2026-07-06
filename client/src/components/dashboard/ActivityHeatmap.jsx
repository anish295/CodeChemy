import { useMemo, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

// Generate last 12 months of dates as a proper week-column grid
function generateGrid(submissionCalendar) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Build a UTC-date-string → count lookup from the calendar
  // LeetCode keys are Unix seconds pointing to UTC midnight
  const calendarByDate = {};
  Object.entries(submissionCalendar).forEach(([tsStr, count]) => {
    const ts = parseInt(tsStr, 10);
    if (!isNaN(ts) && count > 0) {
      // Convert Unix seconds → UTC date string
      const d = new Date(ts * 1000);
      const key = d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
      calendarByDate[key] = (calendarByDate[key] || 0) + count;
    }
  });

  // Go back exactly 52 weeks + days to fill current week
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  // Align start to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());
  startDate.setHours(0, 0, 0, 0);

  const weeks = [];
  const current = new Date(startDate);

  while (current <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(current);
      day.setDate(current.getDate() + d);
      if (day > today) {
        week.push(null); // future — leave blank
      } else {
        // Build UTC date string for this grid cell
        const year = day.getFullYear();
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const date = String(day.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${date}`;
        const count = calendarByDate[dateKey] || 0;
        week.push({
          date: new Date(day),
          count,
          month: day.getMonth(),
          dayOfWeek: day.getDay(),
        });
      }
    }
    weeks.push(week);
    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

// Build month label positions for X-axis
function getMonthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstValidDay = week.find(d => d !== null);
    if (firstValidDay && firstValidDay.month !== lastMonth) {
      lastMonth = firstValidDay.month;
      labels.push({
        weekIndex: wIdx,
        label: new Date(firstValidDay.date).toLocaleString('default', { month: 'short' }),
      });
    }
  });
  return labels;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActivityHeatmap({ submissionCalendar = {} }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const scrollRef = useRef(null);

  const weeks = useMemo(() => generateGrid(submissionCalendar), [submissionCalendar]);
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks]);

  const maxCount = useMemo(() => {
    let max = 1;
    weeks.forEach(week => week.forEach(day => {
      if (day && day.count > max) max = day.count;
    }));
    return max;
  }, [weeks]);

  const getCellColor = (count, weekIdx) => {
    if (count === 0) {
      return isDark ? 'var(--color-dark-surface-light)' : '#F1F5F9'; // slate-100
    }

    if (isDark) {
      const ratio = count / maxCount;
      if (ratio >= 0.75) return 'var(--color-accent-orange)';
      if (ratio >= 0.5) return '#57C84D';
      if (ratio >= 0.3) return '#3EA538';
      if (ratio >= 0.15) return '#2D7A28';
      return '#1E5A1A';
    } else {
      const ratio = count / maxCount;
      // Bright vibrant green spectrum for light mode
      if (ratio >= 0.75) return '#22C55E'; // green-500
      if (ratio >= 0.5) return '#4ADE80';  // green-400
      if (ratio >= 0.3) return '#86EFAC';  // green-300
      if (ratio >= 0.15) return '#BBF7D0'; // green-200
      return '#DCFCE7'; // green-100
    }
  };

  const CELL_SIZE = 12;
  const CELL_GAP = 3;
  const DAY_LABEL_W = 28;
  const MONTH_LABEL_H = 18;

  const totalWidth = DAY_LABEL_W + weeks.length * (CELL_SIZE + CELL_GAP);
  const totalHeight = MONTH_LABEL_H + 7 * (CELL_SIZE + CELL_GAP);

  return (
    <div
      className={isDark ? 'card-dark' : 'card-light'}
      style={{
        padding: '24px',
        animation: 'var(--animate-slide-up)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
        }}>
          Activity Heatmap
        </h3>
        <span className="pill" style={{
          backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
          color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
        }}>
          Last 12 Months
        </span>
      </div>

      {/* Heatmap Grid */}
      <div ref={scrollRef} style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <div style={{ position: 'relative', display: 'inline-block', minWidth: totalWidth }}>
          {/* Month labels row */}
          <div style={{
            display: 'flex',
            height: `${MONTH_LABEL_H}px`,
            marginLeft: `${DAY_LABEL_W}px`,
            position: 'relative',
          }}>
            {monthLabels.map(({ weekIndex, label }) => (
              <div
                key={`${weekIndex}-${label}`}
                style={{
                  position: 'absolute',
                  left: `${weekIndex * (CELL_SIZE + CELL_GAP)}px`,
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid rows: Sun=0 … Sat=6 */}
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Day-of-week labels */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${CELL_GAP}px`,
              marginRight: `${CELL_GAP}px`,
              width: `${DAY_LABEL_W}px`,
              flexShrink: 0,
            }}>
              {DAY_LABELS.map((d, i) => (
                <div
                  key={d}
                  style={{
                    height: `${CELL_SIZE}px`,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
                    // Only show Mon, Wed, Fri to reduce clutter
                    opacity: [1, 3, 5].includes(i) ? 1 : 0,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wIdx) => (
              <div
                key={wIdx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${CELL_GAP}px`,
                  marginRight: `${CELL_GAP}px`,
                }}
              >
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    title={
                      day
                        ? `${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${day.count} submission${day.count !== 1 ? 's' : ''}`
                        : ''
                    }
                    style={{
                      width: `${CELL_SIZE}px`,
                      height: `${CELL_SIZE}px`,
                      borderRadius: '3px',
                      backgroundColor: day
                        ? getCellColor(day.count, wIdx)
                        : 'transparent',
                      transition: 'all 0.15s ease',
                      cursor: day ? 'default' : 'default',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '5px',
        marginTop: '12px',
      }}>
        <span style={{
          fontSize: '0.6rem',
          fontFamily: 'var(--font-mono)',
          color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
        }}>
          Less
        </span>
        {[0, 0.1, 0.3, 0.55, 0.8].map((ratio, i) => (
          <div
            key={i}
            style={{
              width: '11px',
              height: '11px',
              borderRadius: '3px',
              backgroundColor: ratio === 0
                ? (isDark ? 'var(--color-dark-surface-light)' : '#E8E0CC')
                : getCellColor(Math.ceil(ratio * maxCount), i % 2),
            }}
          />
        ))}
        <span style={{
          fontSize: '0.6rem',
          fontFamily: 'var(--font-mono)',
          color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
        }}>
          More
        </span>
      </div>
    </div>
  );
}
