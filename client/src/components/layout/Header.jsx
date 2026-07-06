import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Sun, Moon, Bell, Flame, CheckCircle, Trophy, Lightbulb, AlertTriangle, Trash2, X } from 'lucide-react';

export default function Header({ title, subtitle, children }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const [readIds, setReadIds] = useState(new Set());
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  const isInitialMount = useRef(true);
  const prevNotifsRef = useRef([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const dynamicNotes = [];

      // 1. Cookie Alert
      if (user && !user.leetcodeSessionCookie) {
        dynamicNotes.push({
          id: 'cookie', icon: AlertTriangle, color: 'var(--color-accent-red)',
          text: "⚠️ Missing Session Cookie: Add your LeetCode session in Settings to enable AI Code Reviews on your actual submissions.",
          time: 'Just now'
        });
      }

      // If no leetcode username, just set what we have and return
      if (!user?.leetcodeUsername) {
        if (dynamicNotes.length === 0) {
          dynamicNotes.push({
            id: 'empty', icon: CheckCircle, color: 'var(--color-dark-text-dim)',
            text: "You're all caught up!", time: ''
          });
        }
        setNotifications(dynamicNotes);
        return;
      }

      try {
        const [overviewRes, heatmapRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/heatmap'),
        ]);

        const profile = overviewRes.data.profile || {};
        const heatmapStr = heatmapRes.data.submissionCalendar || '{}';

        // 2. Streak Alert
        let currentStreak = profile.currentStreak || 0;
        let submittedToday = false;
        
        try {
          const parsed = JSON.parse(heatmapStr);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (const ts of Object.keys(parsed)) {
            const date = new Date(Number(ts) * 1000);
            date.setHours(0, 0, 0, 0);
            if (date.getTime() === today.getTime()) {
              submittedToday = true;
              break;
            }
          }
        } catch (e) {}

        if (currentStreak > 0 && !submittedToday) {
          dynamicNotes.push({
            id: 'streak', icon: Flame, color: 'var(--color-accent-orange)',
            text: `🔥 Keep it going! Solve a problem today to maintain your ${currentStreak}-day streak.`,
            time: 'Today'
          });
        }

        // 3. Recent Badge
        if (profile.badges && profile.badges.length > 0) {
          const sortedBadges = [...profile.badges].sort((a, b) => {
            const dateA = new Date(a.creationDate || 0).getTime();
            const dateB = new Date(b.creationDate || 0).getTime();
            return dateB - dateA;
          });
          
          const recentBadge = sortedBadges[0];
          if (recentBadge) {
            dynamicNotes.push({
              id: 'badge', icon: Trophy, color: '#FCD34D',
              text: `🏆 Milestone: You recently earned the ${recentBadge.displayName || recentBadge.name || 'new'} badge!`,
              time: 'Recent'
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch notification data:", err);
      }

      // Empty fallback
      if (dynamicNotes.length === 0) {
        dynamicNotes.push({
          id: 'empty', icon: CheckCircle, color: 'var(--color-dark-text-dim)',
          text: "You're all caught up!", time: ''
        });
      }

      setNotifications(dynamicNotes);
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!isInitialMount.current) {
      const newNotifs = notifications.filter(n => !prevNotifsRef.current.find(p => p.id === n.id));
      newNotifs.forEach(n => {
        if (n.id !== 'empty' && !dismissedIds.has(n.id)) {
          const toastId = Date.now() + Math.random();
          setToasts(prev => [...prev, { ...n, toastId }]);
          setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== toastId)), 5000);
        }
      });
    } else if (notifications.length > 0) {
      isInitialMount.current = false;
    }
    prevNotifsRef.current = notifications;
  }, [notifications]);

  const activeNotifications = notifications.filter(n => !dismissedIds.has(n.id));
  const unreadCount = activeNotifications.filter(n => !readIds.has(n.id) && n.id !== 'empty').length;

  const handleMarkAllRead = () => {
    const newRead = new Set(readIds);
    activeNotifications.forEach(n => newRead.add(n.id));
    setReadIds(newRead);
  };

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
  };

  const handleNotifClick = (id) => {
    const newRead = new Set(readIds);
    newRead.add(id);
    setReadIds(newRead);
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '28px',
      position: 'relative',
    }}>
      {/* Toasts Container */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <div key={t.toastId} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
            backgroundColor: isDark ? 'rgba(26, 29, 33, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: `1px solid ${isDark ? 'var(--color-dark-border)' : 'var(--color-light-border)'}`,
            borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            width: '320px', animation: 'var(--animate-slide-up)',
          }}>
            <t.icon size={20} color={t.color} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)', margin: 0, lineHeight: 1.4 }}>
                {t.text}
              </p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.toastId !== t.toastId))} style={{ background: 'none', border: 'none', color: 'var(--color-dark-text-dim)', cursor: 'pointer', padding: '4px' }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div>
        <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 700,
          color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: '0.9rem',
            color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
            marginTop: '6px',
          }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}

        {/* Theme Toggle Slider */}
        <div
          onClick={toggleTheme}
          style={{
            position: 'relative',
            width: '56px', // w-14
            height: '28px', // h-7
            borderRadius: '9999px', // rounded-full
            backgroundColor: 'rgba(255, 255, 255, 0.1)', // bg-white/10
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px',
            boxSizing: 'border-box',
          }}
        >
          <Sun size={14} style={{ color: !isDark ? 'transparent' : 'var(--color-dark-text-dim)', zIndex: 1 }} />
          <Moon size={14} style={{ color: isDark ? 'transparent' : 'var(--color-light-text-dim)', zIndex: 1 }} />
          
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent-orange)',
              transform: isDark ? 'translateX(28px)' : 'translateX(0)',
              transition: 'transform 300ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            {isDark ? <Moon size={12} color="#fff" /> : <Sun size={12} color="#fff" />}
          </div>
        </div>

        {/* Notification Bell & Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="btn-glass"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '38px', height: '38px', borderRadius: '12px',
              color: isDark ? 'var(--color-dark-text-muted)' : 'var(--color-light-text-muted)',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '8px', right: '9px',
                width: '7px', height: '7px', borderRadius: '50%',
                backgroundColor: 'var(--color-accent-red)',
              }} />
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '48px', // top-12
              width: '384px', // w-96
              maxHeight: '384px', // max-h-96
              overflowY: 'auto',
              backgroundColor: isDark ? 'rgba(26, 29, 33, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(24px)', // backdrop-blur-xl
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px', // rounded-xl
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // shadow-lg
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderBottom: `1px solid ${isDark ? 'var(--color-dark-border-light)' : 'var(--color-light-border)'}`,
              }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)', margin: 0 }}>
                  Notifications
                </h4>
                <button onClick={handleMarkAllRead} style={{
                  background: 'none', border: 'none', color: 'var(--color-accent-orange)',
                  fontSize: '0.8rem', cursor: 'pointer', padding: 0,
                }}>
                  Mark all as read
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activeNotifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-dark-text-dim)', fontSize: '0.85rem' }}>No notifications</div>
                ) : activeNotifications.map(n => (
                  <div key={n.id} onClick={() => handleNotifClick(n.id)} style={{
                    display: 'flex', gap: '12px', padding: '16px',
                    borderBottom: `1px solid ${isDark ? 'var(--color-dark-border-light)' : 'var(--color-light-border)'}`,
                    backgroundColor: readIds.has(n.id) || n.id === 'empty' ? 'transparent' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    cursor: 'pointer', transition: 'background-color 0.2s', position: 'relative',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
                    const trash = e.currentTarget.querySelector('.trash-btn');
                    if (trash) trash.style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = readIds.has(n.id) || n.id === 'empty' ? 'transparent' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)');
                    const trash = e.currentTarget.querySelector('.trash-btn');
                    if (trash) trash.style.opacity = '0';
                  }}
                  >
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      <n.icon size={18} color={n.color} />
                    </div>
                    <div style={{ flex: 1, paddingRight: '20px' }}>
                      <p style={{
                        fontSize: '0.85rem', lineHeight: 1.4, margin: '0 0 4px 0',
                        color: isDark ? 'var(--color-dark-text)' : 'var(--color-light-text)',
                        opacity: readIds.has(n.id) ? 0.7 : 1,
                      }}>
                        {n.text}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: isDark ? 'var(--color-dark-text-dim)' : 'var(--color-light-text-dim)' }}>
                        {n.time}
                      </span>
                    </div>
                    {n.id !== 'empty' && (
                      <button 
                        className="trash-btn"
                        onClick={(e) => handleDismiss(e, n.id)} 
                        style={{
                          position: 'absolute', top: '16px', right: '16px',
                          background: 'none', border: 'none', color: 'var(--color-dark-text-dim)',
                          cursor: 'pointer', padding: '4px', opacity: 0, transition: 'opacity 0.2s'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
