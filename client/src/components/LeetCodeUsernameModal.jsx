import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { Cpu, User, Loader2, AlertCircle } from 'lucide-react';

export default function LeetCodeUsernameModal() {
  const { updateUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.patch('/user/leetcode-username', { leetcodeUsername: trimmed });
      updateUser({ leetcodeUsername: trimmed });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        margin: '0 16px',
        padding: '40px',
        borderRadius: '20px',
        backgroundColor: isDark ? 'var(--color-dark-surface)' : 'var(--color-light-surface)',
        border: `1px solid ${isDark ? 'var(--color-dark-border-light)' : 'var(--color-light-border)'}`,
        animation: 'slide-up 0.3s ease-out',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <Cpu size={28} style={{ color: 'var(--color-accent-orange)' }} />
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: isDark ? 'var(--color-dark-text)' : 'var(--color-accent-orange)',
          }}>
            CodeChemy
          </span>
        </div>

        <h2 style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
          marginBottom: '10px',
        }}>
          Link Your LeetCode Account
        </h2>

        <p style={{
          fontSize: '0.9rem',
          lineHeight: 1.7,
          color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
          marginBottom: '28px',
        }}>
          CodeChemy uses your LeetCode username to fetch your solve counts, submission history, contest
          ratings, and topic breakdown. This data powers your entire dashboard — without it, nothing
          can be shown. Your password is never accessed.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
            marginBottom: '8px',
          }}>
            LeetCode Username
          </label>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <User
              size={16}
              style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)',
                color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
              }}
            />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. neal_wu"
              autoFocus
              required
              style={{
                width: '100%',
                padding: '12px 14px 12px 40px',
                borderRadius: '10px',
                border: `1px solid ${isDark ? 'var(--color-dark-border-light)' : 'var(--color-light-border)'}`,
                backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
                color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(229, 62, 62, 0.1)',
              color: 'var(--color-accent-red)',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="btn-glass-primary"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: loading || !username.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !username.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <><Loader2 size={18} className="spin" /> Linking account...</>
            ) : (
              'Connect LeetCode →'
            )}
          </button>
        </form>

        <p style={{
          marginTop: '16px',
          fontSize: '0.75rem',
          textAlign: 'center',
          color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
        }}>
          This cannot be skipped — it's required for the dashboard to function.
        </p>
      </div>
    </div>
  );
}
