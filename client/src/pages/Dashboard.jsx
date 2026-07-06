import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import Header from '../components/layout/Header';
import StatCard from '../components/dashboard/StatCard';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import FocusAreas from '../components/dashboard/FocusAreas';
import AICoach from '../components/dashboard/AICoach';
import BadgesRow from '../components/dashboard/BadgesRow';
import ContestRatingChart from '../components/dashboard/ContestRatingChart';
import api from '../api/axios';
import { CheckCircle, Flame, Globe, Target, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [heatmap, setHeatmap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.leetcodeUsername) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [overviewRes, heatmapRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/heatmap'),
        ]);
        setProfile(overviewRes.data.profile);
        setHeatmap(heatmapRes.data.submissionCalendar || {});
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.leetcodeUsername, user?.lastSyncedAt]);

  const { syncing, cooldownRemaining, triggerSync } = useSync();

  const handleSync = async () => {
    const res = await triggerSync();
    if (res?.success) {
      updateUser({ lastSyncedAt: new Date().toISOString() });
    }
  };

  // AI Coach data will now be fetched manually inside the AICoach component

  // Prepare topic data for FocusAreas
  const topicData = profile?.topicBreakdown?.length > 0
    ? profile.topicBreakdown
    : null;

  const calculateStreak = (calendarData) => {
    if (!calendarData) return profile?.currentStreak || 0;
    try {
      const parsed = typeof calendarData === 'string' ? JSON.parse(calendarData) : calendarData;
      const keys = Object.keys(parsed).map(Number).sort((a, b) => b - a);
      if (keys.length === 0) return 0;
      
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let targetDate = today;
      let hasStarted = false;
      
      for (const timestamp of keys) {
        const date = new Date(timestamp * 1000);
        date.setHours(0, 0, 0, 0);
        
        if (!hasStarted) {
          if (date.getTime() === today.getTime()) {
            currentStreak = 1;
            hasStarted = true;
            targetDate = yesterday;
          } else if (date.getTime() === yesterday.getTime()) {
            currentStreak = 1;
            hasStarted = true;
            targetDate = new Date(yesterday);
            targetDate.setDate(targetDate.getDate() - 1);
          } else {
            return 0;
          }
        } else {
          if (date.getTime() === targetDate.getTime()) {
            currentStreak++;
            targetDate.setDate(targetDate.getDate() - 1);
          } else if (date.getTime() < targetDate.getTime()) {
            break;
          }
        }
      }
      return currentStreak;
    } catch (e) {
      return profile?.currentStreak || 0;
    }
  };

  // Acceptance rate values
  let acceptanceRate = '—';
  let acceptanceSubline = undefined;

  const calculateLongestStreak = (calendarData) => {
    if (!calendarData) return profile?.longestStreak || 0;
    try {
      const parsed = typeof calendarData === 'string' ? JSON.parse(calendarData) : calendarData;
      const days = Object.keys(parsed)
        .map(ts => Math.floor(Number(ts) / 86400))
        .sort((a, b) => a - b);
      
      if (days.length === 0) return 0;
      
      let maxStreak = 1;
      let currStreak = 1;
      for (let i = 1; i < days.length; i++) {
        if (days[i] === days[i - 1]) continue;
        if (days[i] === days[i - 1] + 1) {
          currStreak++;
          maxStreak = Math.max(maxStreak, currStreak);
        } else {
          currStreak = 1;
        }
      }
      return maxStreak;
    } catch (e) {
      return profile?.longestStreak || 0;
    }
  };

  // Beats Stats
  let beatsOverall = '—';
  let beatsSubline = '';

  if (profile?.beatsStats) {
    const { medium, hard } = profile.beatsStats;
    const parts = [];
    if (medium != null) parts.push(`Medium: Beats ${medium.toFixed(1)}%`);
    if (hard != null) parts.push(`Hard: Beats ${hard.toFixed(1)}%`);
    if (parts.length > 0) beatsSubline = parts.join(' | ');
    
    // Average for overall if available
    const { easy } = profile.beatsStats;
    let sum = 0, count = 0;
    if (easy != null) { sum += easy; count++; }
    if (medium != null) { sum += medium; count++; }
    if (hard != null) { sum += hard; count++; }
    if (count > 0) beatsOverall = `Beats ${(sum/count).toFixed(1)}%`;
  }

  const globalRank = profile?.contestRanking
    ? `#${profile.contestRanking.toLocaleString()}`
    : '—';

  // Streak display
  const calculatedStreak = calculateStreak(heatmap);
  const streak = calculatedStreak > 0 ? `${calculatedStreak}d` : '—';
  
  const calculatedLongest = calculateLongestStreak(heatmap);
  const longestStreak = calculatedLongest > 0 ? `${calculatedLongest}d` : '—';

  // Problems solved
  const totalSolved = profile?.totalSolved?.toString() ?? '—';

  return (
    <div className="page-enter">
      <Header
        title={`Welcome back, ${user?.name || 'Dev'}`}
        subtitle="Your coding crucible is ready."
      >
        <button
          onClick={handleSync}
          disabled={syncing || cooldownRemaining > 0 || !user?.leetcodeUsername}
          className="btn-glass-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '12px',
            fontSize: '0.85rem', fontWeight: 600,
            cursor: (syncing || cooldownRemaining > 0) ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={16} className={syncing ? 'spin' : ''} />
          {syncing ? 'Syncing...' : cooldownRemaining > 0 ? `Syncing... (${Math.floor(cooldownRemaining / 60)}m ${cooldownRemaining % 60}s)` : 'Sync Now'}
        </button>
      </Header>

      {/* Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '16px',
        marginBottom: '20px',
        minWidth: 0,
      }}>
        <StatCard
          icon={CheckCircle}
          label="PROBLEMS SOLVED"
          value={totalSolved}
          tag="All Time"
          subline={profile ? `Easy: ${profile.easySolved} · Med: ${profile.mediumSolved} · Hard: ${profile.hardSolved}` : ''}
        />
        <StatCard
          icon={Flame}
          label="CURRENT STREAK"
          value={streak}
          tag="Active"
          subline={`Personal best: ${longestStreak}`}
          accentColor="orange"
          showFlame={true}
        />
        <StatCard
          icon={Globe}
          label="GLOBAL RANK"
          value={globalRank}
          tag={profile?.topPercentage ? `Top ${profile.topPercentage}%` : 'Leagues'}
          subline={profile?.attendedContestsCount ? `${profile.attendedContestsCount} contests` : undefined}
        />
        <StatCard
          icon={Target}
          label="PERCENTILE (BEATS)"
          value={beatsOverall}
          tag="Percentile"
          subline={beatsSubline}
        />
      </div>

      {/* Graph and Badges Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-5">
        {(profile?.contestHistory?.length > 0 || profile) && (
          <div className="h-full">
            <ContestRatingChart contestHistory={profile?.contestHistory || []} />
          </div>
        )}
        
        {(profile?.badges?.length > 0 || profile) && (
          <div className="h-full">
            <BadgesRow badges={profile?.badges || []} />
          </div>
        )}
      </div>

      {/* Heatmap + Focus Areas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)',
        gap: '16px',
        marginBottom: '20px',
        minWidth: 0,
      }}>
        <ActivityHeatmap submissionCalendar={heatmap} />
        <FocusAreas topics={topicData} />
      </div>

      {/* AI Coach — full width */}
      <div style={{ marginBottom: '20px' }}>
        <AICoach />
      </div>
    </div>
  );
}
