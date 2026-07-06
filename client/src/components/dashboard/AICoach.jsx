import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowRight, Zap, Clock, TrendingUp, Settings, Cpu } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../../api/axios';

export default function AICoach() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [coachData, setCoachData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFullReview = () => {
    if (coachData?.userCode) {
      // Pre-fill AI Code Review page with the user's code
      const encoded = encodeURIComponent(coachData.userCode);
      navigate(`/ai-review?code=${encoded}`);
    } else {
      navigate('/ai-review');
    }
  };

  const handleGenerate = async () => {
    if (!user?.leetcodeUsername) return;
    setLoading(true);
    try {
      const res = await api.get('/dashboard/ai-coach');
      setCoachData(res.data);
    } catch (err) {
      console.error("Failed to fetch AI Coach data:", err);
      setCoachData({ error: true });
    } finally {
      setLoading(false);
    }
  };

  // No username linked
  if (!user?.leetcodeUsername) {
    return (
      <div
        className={isDark ? 'card-dark' : 'card-light'}
        style={{ padding: '24px', animation: 'var(--animate-slide-up)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BrainCircuit size={20} style={{ color: 'var(--color-accent-orange)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
            AI Coach
          </h3>
        </div>
        <p style={{ fontSize: '0.88rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
          Link your LeetCode username to activate AI Coach.
        </p>
      </div>
    );
  }

  // Initial Empty State or Loading before first fetch
  if (!coachData && !loading) {
    return (
      <div
        className={isDark ? 'card-dark' : 'card-light'}
        style={{ padding: '24px', animation: 'var(--animate-slide-up)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}
      >
        <Cpu size={36} style={{ color: 'var(--color-accent-orange)', marginBottom: '16px', opacity: 0.8 }} />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)', marginBottom: '8px' }}>
          Ready to Analyze
        </h3>
        <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)', marginBottom: '20px', textAlign: 'center', maxWidth: '300px' }}>
          Click below to analyze your last LeetCode submission and generate an optimal approach.
        </p>
        <button
          onClick={handleGenerate}
          className="btn-glass"
          style={{
            backgroundColor: 'rgba(255, 122, 0, 0.1)',
            color: 'var(--color-accent-orange)',
            border: '1px solid rgba(255, 122, 0, 0.3)',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }}
        >
          <Zap size={16} />
          Generate Optimal Solution
        </button>
      </div>
    );
  }

  // No submissions yet (returned from API)
  if (coachData?.noSubmissions) {
    return (
      <div
        className={isDark ? 'card-dark' : 'card-light'}
        style={{ padding: '24px', animation: 'var(--animate-slide-up)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <BrainCircuit size={20} style={{ color: 'var(--color-accent-orange)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
            AI Coach
          </h3>
        </div>
        <p style={{ fontSize: '0.88rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
          No accepted submissions found yet. Solve a problem on LeetCode and sync to activate AI Coach.
        </p>
      </div>
    );
  }

  const { hints, optimalCode, optimalTime, optimalSpace, userCode, hasSession, problemTitle, language, error } = coachData || {};
  const displayCode = hasSession && userCode ? userCode : optimalCode;
  const codeLabel = hasSession && userCode ? 'Your Submitted Code' : 'AI Optimal Solution';

  return (
    <div
      className={isDark ? 'card-dark' : 'card-light'}
      style={{
        padding: 0,
        animation: 'var(--animate-slide-up)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 20px 14px',
        borderBottom: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={18} style={{ color: 'var(--color-accent-orange)' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
            AI Coach
          </h3>
          <span className="pill" style={{
            backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-accent-orange-bg)',
            color: 'var(--color-accent-orange)',
            fontSize: '0.58rem',
          }}>
            {problemTitle || 'Analysis'}
          </span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-glass"
          style={{
            backgroundColor: 'transparent',
            color: loading ? 'var(--color-accent-orange)' : (isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)'),
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Zap size={14} className={loading ? 'pulse-soft' : ''} />
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>
      
      {/* Loading Overlay */}
      {loading && coachData && (
        <div style={{
          position: 'absolute', top: 56, left: 0, right: 0, bottom: 0,
          backgroundColor: isDark ? 'rgba(26,29,33,0.7)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
        }}>
          <BrainCircuit size={32} style={{ color: 'var(--color-accent-orange)', animation: 'pulse-soft 2s ease-in-out infinite' }} />
        </div>
      )}

      {/* Two-column body */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        flex: 1,
        minHeight: 0,
      }}>
        {/* ── Left half: Optimisation Hints ── */}
        <div style={{
          padding: '18px 20px',
          borderRight: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <Zap size={14} style={{ color: 'var(--color-accent-orange)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
              Optimisation Hints
            </span>
          </div>

          {hints ? (
            <>
              {/* Hint text */}
              <p style={{
                fontSize: '0.85rem', lineHeight: 1.7,
                color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
              }}>
                {hints.hint}
              </p>

              {/* Complexity comparison */}
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} style={{ color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                    Common: <span style={{ color: 'var(--color-accent-red)' }}>{hints.currentComplexity}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={12} style={{ color: 'var(--color-accent-green)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                    Optimal: <span style={{ color: 'var(--color-accent-green)' }}>{hints.suggestedComplexity}</span>
                  </span>
                </div>
                {hints.approachName && (
                  <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent-orange)', marginTop: '2px' }}>
                    → {hints.approachName}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }}>
              Hints unavailable. Try syncing your profile.
            </p>
          )}
        </div>

        {/* ── Right half: Code View ── */}
        <div style={{
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
            {codeLabel}
          </span>

          {displayCode ? (
            <div style={{ flex: 1, overflow: 'hidden', borderRadius: '8px' }}>
              <SyntaxHighlighter
                language={language || 'python'}
                style={oneDark}
                customStyle={{ borderRadius: '8px', fontSize: '0.72rem', margin: 0, maxHeight: '160px', overflow: 'auto' }}
              >
                {displayCode}
              </SyntaxHighlighter>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '0.82rem', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)', textAlign: 'center' }}>
                Code unavailable
              </p>
            </div>
          )}

          {/* Session prompt or complexity comparison */}
          {!hasSession ? (
            <button
              onClick={() => navigate('/settings')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '0', border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: '0.75rem',
                color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-muted)',
                textAlign: 'left',
              }}
            >
              <Settings size={12} style={{ flexShrink: 0 }} />
              Add your LeetCode session in Settings to compare with your submission →
            </button>
          ) : (
            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }}>
              {optimalTime && <span>Optimal: <span style={{ color: 'var(--color-accent-green)' }}>{optimalTime}</span> time</span>}
              {optimalSpace && <span style={{ marginLeft: '8px' }}>· <span style={{ color: 'var(--color-accent-green)' }}>{optimalSpace}</span> space</span>}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Full AI Code Review button */}
      <div style={{
        padding: '12px 20px',
        borderTop: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={handleFullReview}
          className="btn-glass-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px',
            color: '#fff',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Full AI Code Review <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
