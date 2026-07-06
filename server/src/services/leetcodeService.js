import axios from 'axios';
import { decrypt } from './encryption.js';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

const graphqlClient = axios.create({
  baseURL: LEETCODE_GRAPHQL,
  headers: {
    'Content-Type': 'application/json',
    'Referer': 'https://leetcode.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  },
});

// ─── PUBLIC QUERIES (no auth needed) ───

const USER_PUBLIC_PROFILE_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
        realName
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
        totalSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      problemsSolvedBeatsStats {
        difficulty
        percentage
      }
      tagProblemCounts {
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
      }
      badges {
        id
        name
        shortName
        displayName
        icon
        creationDate
        category
      }
    }
  }
`;

const USER_CONTEST_RANKING_QUERY = `
  query userContestRanking($username: String!) {
    userContestRanking(username: $username) {
      rating
      attendedContestsCount
      globalRanking
      totalParticipants
      topPercentage
    }
    userContestRankingHistory(username: $username) {
      contest {
        title
        startTime
      }
      rating
      ranking
    }
  }
`;

const USER_CALENDAR_QUERY = `
  query userProfileCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        activeYears
        streak
        totalActiveDays
        submissionCalendar
      }
    }
  }
`;

const RECENT_SUBMISSIONS_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
  }
`;

// ─── PUBLIC DATA FETCHERS ───

export async function fetchPublicProfile(username) {
  try {
    // Fetch current year and previous year calendar for 12-month coverage
    const currentYear = new Date().getFullYear();
    const [profileRes, contestRes, calendarRes, calendarPrevRes] = await Promise.all([
      graphqlClient.post('', {
        operationName: 'userPublicProfile',
        query: USER_PUBLIC_PROFILE_QUERY,
        variables: { username },
      }),
      graphqlClient.post('', {
        operationName: 'userContestRanking',
        query: USER_CONTEST_RANKING_QUERY,
        variables: { username },
      }),
      graphqlClient.post('', {
        operationName: 'userProfileCalendar',
        query: USER_CALENDAR_QUERY,
        variables: { username, year: currentYear },
      }),
      graphqlClient.post('', {
        operationName: 'userProfileCalendar',
        query: USER_CALENDAR_QUERY,
        variables: { username, year: currentYear - 1 },
      }),
    ]);

    const matchedUser = profileRes.data?.data?.matchedUser;
    if (!matchedUser) {
      throw new Error(`LeetCode user "${username}" not found`);
    }

    const contestRanking = contestRes.data?.data?.userContestRanking;
    const contestHistory = contestRes.data?.data?.userContestRankingHistory || [];
    const calendar = calendarRes.data?.data?.matchedUser?.userCalendar;
    const calendarPrev = calendarPrevRes.data?.data?.matchedUser?.userCalendar;

    // Parse accepted solve counts + submission totals for acceptance rate
    const acStats = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
    const totalSolved = acStats.find(s => s.difficulty === 'All')?.count || 0;
    const easySolved = acStats.find(s => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = acStats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = acStats.find(s => s.difficulty === 'Hard')?.count || 0;

    // Acceptance rate = accepted submissions / total submissions
    const acAllEntry = acStats.find(s => s.difficulty === 'All');
    const acEasyEntry = acStats.find(s => s.difficulty === 'Easy');
    const acMedEntry = acStats.find(s => s.difficulty === 'Medium');
    const acHardEntry = acStats.find(s => s.difficulty === 'Hard');

    const totalStats = matchedUser.submitStatsGlobal?.totalSubmissionNum || [];
    const totalAllEntry = totalStats.find(s => s.difficulty === 'All');
    const totalEasyEntry = totalStats.find(s => s.difficulty === 'Easy');
    const totalMedEntry = totalStats.find(s => s.difficulty === 'Medium');
    const totalHardEntry = totalStats.find(s => s.difficulty === 'Hard');

    const acceptanceRate = totalAllEntry?.submissions > 0
      ? parseFloat(((acAllEntry.submissions / totalAllEntry.submissions) * 100).toFixed(1))
      : null;
    const easyAcceptanceRate = totalEasyEntry?.submissions > 0
      ? parseFloat(((acEasyEntry.submissions / totalEasyEntry.submissions) * 100).toFixed(1))
      : null;
    const medAcceptanceRate = totalMedEntry?.submissions > 0
      ? parseFloat(((acMedEntry.submissions / totalMedEntry.submissions) * 100).toFixed(1))
      : null;
    const hardAcceptanceRate = totalHardEntry?.submissions > 0
      ? parseFloat(((acHardEntry.submissions / totalHardEntry.submissions) * 100).toFixed(1))
      : null;

    // Parse beats stats
    const beatsStatsRaw = matchedUser.problemsSolvedBeatsStats || [];
    const beatsStats = {
      easy: beatsStatsRaw.find(b => b.difficulty === 'Easy')?.percentage || null,
      medium: beatsStatsRaw.find(b => b.difficulty === 'Medium')?.percentage || null,
      hard: beatsStatsRaw.find(b => b.difficulty === 'Hard')?.percentage || null,
    };

    // Parse topic breakdown from all tag categories
    const allTags = [
      ...(matchedUser.tagProblemCounts?.advanced || []),
      ...(matchedUser.tagProblemCounts?.intermediate || []),
      ...(matchedUser.tagProblemCounts?.fundamental || []),
    ];
    const topicBreakdown = allTags.map(t => ({
      topic: t.tagName,
      solved: t.problemsSolved,
      total: null, // LeetCode API doesn't expose per-tag totals in this query
    }));

    // Parse badges
    const badges = (matchedUser.badges || []).map(b => ({
      id: b.id,
      name: b.name,
      shortName: b.shortName,
      displayName: b.displayName,
      icon: b.icon,
      creationDate: b.creationDate,
      category: b.category,
    }));

    // Merge submission calendars from current and previous year
    let submissionCalendar = {};
    if (calendarPrev?.submissionCalendar) {
      try {
        Object.assign(submissionCalendar, JSON.parse(calendarPrev.submissionCalendar));
      } catch (e) { /* skip */ }
    }
    if (calendar?.submissionCalendar) {
      try {
        Object.assign(submissionCalendar, JSON.parse(calendar.submissionCalendar));
      } catch (e) { /* skip */ }
    }

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      acceptanceRate,
      easyAcceptanceRate,
      medAcceptanceRate,
      hardAcceptanceRate,
      beatsStats,
      topicBreakdown,
      badges,
      contestRating: contestRanking?.rating ? Math.round(contestRanking.rating) : 0,
      contestRanking: contestRanking?.globalRanking || 0,
      totalParticipants: contestRanking?.totalParticipants || 0,
      topPercentage: contestRanking?.topPercentage ? parseFloat(contestRanking.topPercentage.toFixed(1)) : 0,
      attendedContestsCount: contestRanking?.attendedContestsCount || 0,
      contestHistory: contestHistory
        .filter(c => c.contest)
        .map(c => ({
          contestName: c.contest.title,
          date: new Date(c.contest.startTime * 1000),
          rating: Math.round(c.rating),
          rank: c.ranking,
        })),
      submissionCalendar,
      totalActiveDays: calendar?.totalActiveDays || 0,
      currentStreak: calendar?.streak || 0,
      longestStreak: calendar?.streak || 0,
    };
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('LeetCode rate limit reached. Please try again in a few minutes.');
    }
    throw error;
  }
}

export async function fetchRecentSubmissions(username, limit = 5) {
  try {
    const res = await graphqlClient.post('', {
      query: RECENT_SUBMISSIONS_QUERY,
      variables: { username, limit },
    });

    return (res.data?.data?.recentAcSubmissionList || []).map(s => ({
      leetcodeSubmissionId: s.id,
      problemSlug: s.titleSlug,
      problemTitle: s.title,
      language: s.lang,
      submittedAt: new Date(parseInt(s.timestamp) * 1000),
      status: s.statusDisplay,
    }));
  } catch (error) {
    throw new Error('Failed to fetch recent submissions: ' + error.message);
  }
}

// ─── PRIVATE DATA FETCHERS (require session cookie) ───

const SUBMISSION_CODE_QUERY = `
  query submissionDetails($submissionId: Int!) {
    submissionDetails(submissionId: $submissionId) {
      code
      lang {
        name
        verboseName
      }
      statusDisplay
      runtime
      memory
      question {
        titleSlug
        title
        difficulty
      }
    }
  }
`;

export async function fetchSubmissionCode(submissionId, encryptedSessionCookie) {
  try {
    const sessionCookie = decrypt(encryptedSessionCookie);

    const res = await axios.post(LEETCODE_GRAPHQL, {
      query: SUBMISSION_CODE_QUERY,
      variables: { submissionId: parseInt(submissionId) },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'Cookie': `LEETCODE_SESSION=${sessionCookie}`,
      },
    });

    const details = res.data?.data?.submissionDetails;
    if (!details) {
      throw new Error('Submission not found or session expired');
    }

    return {
      code: details.code,
      language: details.lang?.name || 'python3',
      status: details.statusDisplay,
      runtime: details.runtime,
      memory: details.memory,
      problemSlug: details.question?.titleSlug,
      problemTitle: details.question?.title,
      difficulty: details.question?.difficulty,
    };
  } catch (error) {
    if (error.message.includes('session expired') || error.response?.status === 403) {
      throw new Error('LEETCODE_SESSION_EXPIRED');
    }
    throw error;
  }
}
