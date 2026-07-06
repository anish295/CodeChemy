import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSync } from '../context/SyncContext';
import Header from '../components/layout/Header';
import api from '../api/axios';
import { Link2, Key, RefreshCw, Shield, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [leetcodeUsername, setLeetcodeUsername] = useState(user?.leetcodeUsername || '');
  const [sessionCookie, setSessionCookie] = useState('');
  const { syncing, cooldownRemaining, triggerSync } = useSync();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const cardClass = isDark ? 'card-dark' : 'card-light';

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
    backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface)',
    color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-mono)',
    outline: 'none',
  };

  const btnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const handleLinkUsername = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/user/leetcode-link', { leetcodeUsername });
      updateUser({ leetcodeUsername });
      setMessage({ type: 'success', text: 'LeetCode username linked successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to link username' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSession = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/user/leetcode-session', { sessionCookie });
      setSessionCookie('');
      setMessage({ type: 'success', text: 'Session cookie saved securely!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save session' });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setMessage(null);
    const res = await triggerSync();
    if (res?.success) {
      setMessage({ type: 'success', text: 'LeetCode data synced successfully' });
    } else if (res?.error) {
      setMessage({ type: 'error', text: res.error.response?.data?.message || 'Sync failed' });
    }
  };

  return (
    <div className="page-enter">
      <Header title="Settings" subtitle="Manage your account and integrations" />

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          backgroundColor: message.type === 'success' ? 'var(--color-accent-green-bg)' : 'rgba(229,62,62,0.1)',
          color: message.type === 'success' ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
          fontSize: '0.88rem', fontWeight: 500,
          border: `1px solid ${message.type === 'success' ? 'rgba(87,200,77,0.2)' : 'rgba(229,62,62,0.2)'}`,
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1024px', width: '100%', margin: '0 auto' }}>
        {/* LeetCode Username */}
        <div className={cardClass} style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', justifyContent: 'center' }}>
            <Link2 size={20} style={{ color: 'var(--color-accent-orange)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
              LeetCode Username
            </h3>
            <span className="pill" style={{
              backgroundColor: 'var(--color-accent-green-bg)',
              color: 'var(--color-accent-green)',
            }}>
              Required
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)', marginBottom: '14px', maxWidth: '500px' }}>
            Link your LeetCode username to sync your public profile data (solve counts, contest rating, submission calendar).
          </p>
          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
            <input
              value={leetcodeUsername}
              onChange={e => setLeetcodeUsername(e.target.value)}
              placeholder="e.g., leetcoder123"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleLinkUsername} disabled={saving} className="btn-glass-primary" style={btnStyle}>
              {saving ? 'Saving...' : 'Link'}
            </button>
          </div>
        </div>

        {/* Sync Data */}
        <div className={cardClass} style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', justifyContent: 'center' }}>
            <RefreshCw size={20} style={{ color: 'var(--color-accent-orange)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
              Sync LeetCode Data
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)', marginBottom: '14px', maxWidth: '500px' }}>
            Pull the latest data from your LeetCode profile. Last synced: {user?.lastSyncedAt ? new Date(user.lastSyncedAt).toLocaleString() : 'Never'}
          </p>
          <button onClick={handleSync} disabled={syncing || cooldownRemaining > 0 || !user?.leetcodeUsername} className="btn-glass-primary" style={{...btnStyle, justifyContent: 'center'}}>
            <RefreshCw size={16} className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing...' : cooldownRemaining > 0 ? `Syncing... (${Math.floor(cooldownRemaining / 60)}m ${cooldownRemaining % 60}s)` : 'Sync Now'}
          </button>
        </div>

        {/* Session Cookie */}
        <div className={cardClass} style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', justifyContent: 'center' }}>
            <Key size={20} style={{ color: 'var(--color-accent-orange)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
              LeetCode Session Cookie
            </h3>
            <span className="pill" style={{
              backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface-muted)',
              color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
            }}>
              Optional
            </span>
          </div>

          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '14px',
            backgroundColor: 'rgba(255,165,0,0.1)', color: 'var(--color-accent-orange)',
            border: '1px solid rgba(255,165,0,0.2)', fontSize: '0.85rem', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Shield size={18} style={{ color: 'var(--color-accent-orange)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '0.82rem', lineHeight: 1.5, color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)' }}>
                <strong style={{ color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>Why is this needed?</strong>{' '}
                This unlocks the ability to view your actual submitted code in Submission Detail. It's NOT required for the Dashboard, Company Sheets, or any other feature.
                <br /><br />
                <strong style={{ color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>How to get it:</strong>{' '}
                Open leetcode.com → DevTools (F12) → Application → Cookies → copy the value of <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-orange)' }}>LEETCODE_SESSION</code>
                <br /><br />
                <strong style={{ color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>Security:</strong>{' '}
                Your cookie is encrypted with AES-256 before storage. It's never logged, never returned in API responses, and never exposed to the frontend after saving.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
            <input
              type="password"
              value={sessionCookie}
              onChange={e => setSessionCookie(e.target.value)}
              placeholder="Paste your LEETCODE_SESSION cookie value"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleSaveSession} disabled={saving || !sessionCookie} className="btn-glass-primary" style={btnStyle}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {user?.leetcodeSessionCookie === 'expired' && (
            <div style={{
              marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
              backgroundColor: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.2)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <AlertTriangle size={16} style={{ color: 'var(--color-accent-red)' }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--color-accent-red)' }}>
                Your LeetCode session has expired. Please update it with a fresh cookie.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
