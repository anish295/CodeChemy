import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/layout/Header';
import api from '../api/axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowLeft, Clock, AlertTriangle, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function SubmissionDetail() {
  const { submissionId } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentSubs, setRecentSubs] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);

  // Optimal solution state (fetched separately via /api/ai/optimal)
  const [optimal, setOptimal] = useState(null);
  const [optimalLoading, setOptimalLoading] = useState(false);
  const [optimalError, setOptimalError] = useState(null);

  useEffect(() => {
    api.get('/dashboard/recent-submissions')
      .then(res => setRecentSubs(res.data.submissions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!submissionId && !selectedSub) {
      setLoading(false);
      return;
    }

    const id = submissionId || selectedSub;
    if (!id) return;

    setLoading(true);
    setOptimal(null);
    setOptimalError(null);
    api.get(`/submissions/${id}`)
      .then(res => {
        setSubmission(res.data.submission);
        if (res.data.sessionExpired) setError('session_expired');
        if (res.data.needsSession) setError('needs_session');
      })
      .catch(() => setError('Failed to load submission'))
      .finally(() => setLoading(false));
  }, [submissionId, selectedSub]);

  // Fetch optimal solution once submission code is loaded
  const fetchOptimal = async () => {
    if (!submission?.submittedCode || !submission?.problemTitle) return;
    setOptimalLoading(true);
    setOptimalError(null);
    try {
      const res = await api.post('/ai/optimal', {
        problemTitle: submission.problemTitle,
        code: submission.submittedCode,
        language: submission.language || 'python',
      });
      setOptimal(res.data);
    } catch (err) {
      setOptimalError(err.response?.data?.message || 'Failed to generate optimal solution');
    } finally {
      setOptimalLoading(false);
    }
  };

  // Auto-fetch optimal when submission loads
  useEffect(() => {
    if (submission?.submittedCode && !error) {
      fetchOptimal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?.submittedCode]);

  const cardClass = isDark ? 'card-dark' : 'card-light';

  return (
    <div className="page-enter">
      <Header title="Submission Detail" subtitle="Review your code against AI-suggested optimal solutions" />

      {/* Recent submissions list */}
      {!submissionId && recentSubs.length > 0 && (
        <div className={cardClass} style={{ padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
            Recent Submissions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentSubs.map(sub => (
              <button
                key={sub._id}
                onClick={() => { setSelectedSub(sub._id); setError(null); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: '10px', border: 'none',
                  backgroundColor: selectedSub === sub._id
                    ? (isDark ? 'var(--color-dark-surface-light)' : 'var(--color-accent-orange-bg)')
                    : 'transparent',
                  cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
                    {sub.problemTitle}
                  </span>
                  <span style={{ marginLeft: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                    color: sub.difficulty === 'Easy' ? 'var(--color-accent-green)' : sub.difficulty === 'Hard' ? 'var(--color-accent-red)' : 'var(--color-accent-orange)',
                  }}>
                    {sub.difficulty}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }}>
                  {new Date(sub.submittedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error states */}
      {error === 'needs_session' && (
        <div className={cardClass} style={{ padding: '24px', textAlign: 'center' }}>
          <AlertTriangle size={32} style={{ color: 'var(--color-accent-orange)', marginBottom: '12px' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
            Session Cookie Required
          </p>
          <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)', marginBottom: '16px' }}>
            Link your LeetCode session cookie in Settings to view your submitted code.
          </p>
          <button onClick={() => navigate('/settings')} className="btn-glass-primary" style={{
            padding: '10px 20px', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer',
          }}>
            Go to Settings
          </button>
        </div>
      )}

      {error === 'session_expired' && (
        <div className={cardClass} style={{ padding: '24px', textAlign: 'center' }}>
          <AlertTriangle size={32} style={{ color: 'var(--color-accent-red)', marginBottom: '12px' }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
            LeetCode Session Expired
          </p>
          <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)', marginBottom: '16px' }}>
            Please update your LeetCode session cookie in Settings to continue viewing submitted code.
          </p>
          <button onClick={() => navigate('/settings')} className="btn-glass-primary" style={{
            padding: '10px 20px', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer',
          }}>
            Update Session
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={cardClass} style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--color-accent-orange)' }} />
        </div>
      )}

      {/* Submission code comparison */}
      {submission?.submittedCode && !error && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* User's code */}
          <div className={cardClass} style={{ padding: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
                Your Solution
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {submission.language && (
                  <span className="pill" style={{ backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                    {submission.language}
                  </span>
                )}
              </div>
            </div>
            <SyntaxHighlighter language={submission.language || 'python'} style={oneDark}
              customStyle={{ borderRadius: '8px', fontSize: '0.82rem', margin: 0 }}>
              {submission.submittedCode}
            </SyntaxHighlighter>
          </div>

          {/* Optimal solution */}
          <div className={cardClass} style={{ padding: '20px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: 'var(--color-accent-orange)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
                  AI-Suggested Optimal
                </h3>
              </div>
              {optimal && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {optimal.time && (
                    <span className="pill" style={{ backgroundColor: 'var(--color-accent-green-bg)', color: 'var(--color-accent-green)' }}>
                      <Clock size={9} style={{ marginRight: '3px' }} /> {optimal.time}
                    </span>
                  )}
                  {optimal.space && (
                    <span className="pill" style={{ backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                      {optimal.space}
                    </span>
                  )}
                </div>
              )}
            </div>

            {optimalLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '14px' }}>
                <Loader2 size={32} className="spin" style={{ color: 'var(--color-accent-orange)' }} />
                <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                  Generating optimal solution…
                </p>
              </div>
            ) : optimalError ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-accent-red)', marginBottom: '12px' }}>{optimalError}</p>
                <button
                  onClick={fetchOptimal}
                  className="btn-glass-primary"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto',
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : optimal?.code ? (
              <>
                <SyntaxHighlighter language={submission.language || 'python'} style={oneDark}
                  customStyle={{ borderRadius: '8px', fontSize: '0.82rem', margin: 0 }}>
                  {optimal.code}
                </SyntaxHighlighter>
                <p style={{
                  fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginTop: '10px',
                  color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
                  fontStyle: 'italic',
                }}>
                  ⚗ AI-suggested optimal approach — not LeetCode's official editorial
                </p>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* No submission selected state */}
      {!submission && !error && !loading && !submissionId && recentSubs.length === 0 && (
        <div className={cardClass} style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.95rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
            No submissions yet. Sync your LeetCode data in Settings to see your recent submissions.
          </p>
        </div>
      )}
    </div>
  );
}
