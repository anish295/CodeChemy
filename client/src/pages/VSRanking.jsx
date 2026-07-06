import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/layout/Header';
import api from '../api/axios';
import { UserPlus, Trash2, ArrowUpRight, ArrowDownRight, Minus, ExternalLink, Loader2 } from 'lucide-react';

export default function VSRanking() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [friends, setFriends] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [error, setError] = useState(null);

  const cardClass = isDark ? 'card-dark' : 'card-light';

  useEffect(() => {
    api.get('/friends').then(res => setFriends(res.data.friends || []));
  }, []);

  const handleAdd = async () => {
    if (!newUsername.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await api.post('/friends', { leetcodeUsername: newUsername.trim() });
      setFriends(prev => [res.data.friend, ...prev]);
      setNewUsername('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add friend');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (friendId) => {
    try {
      await api.delete(`/friends/${friendId}`);
      setFriends(prev => prev.filter(f => f._id !== friendId));
      if (selectedFriend === friendId) { setSelectedFriend(null); setComparison(null); }
    } catch (err) {
      setError('Failed to remove friend');
    }
  };

  const handleCompare = async (friendId) => {
    setSelectedFriend(friendId);
    setComparing(true);
    try {
      const res = await api.get(`/friends/${friendId}/compare`);
      setComparison(res.data.comparison);
    } catch (err) {
      setError('Failed to compare');
    } finally {
      setComparing(false);
    }
  };

  const CompareRow = ({ label, userVal, friendVal }) => {
    const userWins = userVal > friendVal;
    const tie = userVal === friendVal;
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center',
        padding: '14px 0',
        borderBottom: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
      }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700,
            color: userWins ? 'var(--color-accent-green)' : (tie ? (isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)') : 'var(--color-accent-red)'),
          }}>
            {userVal}
          </span>
          {!tie && (
            userWins
              ? <ArrowUpRight size={14} style={{ color: 'var(--color-accent-green)', marginLeft: '4px' }} />
              : <ArrowDownRight size={14} style={{ color: 'var(--color-accent-red)', marginLeft: '4px' }} />
          )}
          {tie && <Minus size={14} style={{ marginLeft: '4px', opacity: 0.3 }} />}
        </div>
        <span style={{
          fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
          letterSpacing: '0.1em', fontWeight: 500,
          color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)',
          minWidth: '120px', textAlign: 'center',
        }}>
          {label}
        </span>
        <div>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700,
            color: !userWins && !tie ? 'var(--color-accent-green)' : (tie ? (isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)') : 'var(--color-accent-red)'),
          }}>
            {friendVal}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter">
      <Header title="VS Ranking" subtitle="Compare your stats with friends" />

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(229,62,62,0.1)', color: 'var(--color-accent-red)', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid rgba(229,62,62,0.2)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
        {/* Friends List */}
        <div className={cardClass} style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
            Friends
          </h3>

          {/* Add friend */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              placeholder="LeetCode username"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '10px',
                border: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
                backgroundColor: isDark ? 'var(--color-dark-surface-light)' : 'var(--color-light-surface)',
                color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
                fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none',
              }}
            />
            <button onClick={handleAdd} disabled={adding} className="btn-glass-primary" style={{
              padding: '10px 14px', borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
              {adding ? <Loader2 size={16} className="spin" /> : <UserPlus size={16} />}
            </button>
          </div>

          {/* Friend list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {friends.map(f => (
              <div
                key={f._id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                  backgroundColor: selectedFriend === f._id
                    ? (isDark ? 'var(--color-dark-surface-light)' : 'var(--color-accent-orange-bg)')
                    : 'transparent',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => handleCompare(f._id)}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
                    {f.friendLeetcodeUsername}
                  </span>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)', marginTop: '2px' }}>
                    {f.cachedStats?.totalSolved || 0} solved
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <a href={f.friendLeetcodeUrl} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="btn-glass"
                    style={{ color: 'var(--color-accent-orange)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(f._id); }}
                    className="btn-glass"
                    style={{ cursor: 'pointer', color: 'var(--color-accent-red)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {friends.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)', textAlign: 'center', padding: '20px' }}>
                Add a friend's LeetCode username to compare stats.
              </p>
            )}
          </div>
        </div>

        {/* Comparison View */}
        <div className={cardClass} style={{ padding: '24px' }}>
          {comparing && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 size={24} style={{ color: 'var(--color-accent-orange)', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {comparison && !comparing && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent-orange)' }}>
                  {comparison.user.name}
                </h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }}>
                  VS
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)' }}>
                  {comparison.friend.name}
                </h3>
              </div>

              <CompareRow label="Contest Rating" userVal={comparison.user.contestRating} friendVal={comparison.friend.contestRating} />
              <CompareRow label="Total Solved" userVal={comparison.user.totalSolved} friendVal={comparison.friend.totalSolved} />
              <CompareRow label="Easy" userVal={comparison.user.easySolved} friendVal={comparison.friend.easySolved} />
              <CompareRow label="Medium" userVal={comparison.user.mediumSolved} friendVal={comparison.friend.mediumSolved} />
              <CompareRow label="Hard" userVal={comparison.user.hardSolved} friendVal={comparison.friend.hardSolved} />
              <CompareRow label="Contests" userVal={comparison.user.contestCount} friendVal={comparison.friend.contestCount} />
            </>
          )}

          {!comparison && !comparing && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '0.95rem', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }}>
                Select a friend to see the comparison
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
