import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Screen, MoodLogEntry, UserProfile, SDoHHistoryEntry, BookingEntry } from '../types';
import {
  getRecentMoodLogs,
  getLocalDateString,
  getUserProfile,
  getLatestSDoHResult,
  getUpcomingBooking,
} from '../services/userService';
import {
  Brain,
  Activity,
  ShieldCheck,
  MessageCircle,
  Video,
  LogOut,
  BatteryCharging,
  TrendingUp,
  TrendingDown,
  Lock,
  Sparkles,
  ChevronRight,
  Shield,
  ShieldAlert,
  Clock,
  Bell,
  X,
  Wind,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  onNavigate?: (screen: Screen) => void;
  pendingConsentCount?: number;
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😫',
  2: '😓',
  3: '😐',
  4: '🙂',
  5: '🤩',
};

const MOOD_HEIGHTS: Record<number, string> = {
  1: 'h-6',
  2: 'h-10',
  3: 'h-14',
  4: 'h-18',
  5: 'h-24',
};

const formatTimeAgo = (timestamp: any): string => {
  if (!timestamp) return 'Recently';
  let date: Date;
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return 'Recently';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0 || isNaN(diffMs)) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatBookingDateTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const datePart = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} at ${timePart}`;
  } catch {
    return isoString;
  }
};

const isBookingJoinable = (isoString: string): boolean => {
  try {
    const sessionTime = new Date(isoString).getTime();
    if (isNaN(sessionTime)) return false;
    const diffMs = sessionTime - Date.now();
    // Active if within 10 minutes prior to session, up to 60 minutes after scheduled start
    return diffMs <= 10 * 60 * 1000 && diffMs >= -60 * 60 * 1000;
  } catch {
    return false;
  }
};

const getBookingTimingStatus = (isoString: string): string => {
  try {
    const sessionTime = new Date(isoString).getTime();
    if (isNaN(sessionTime)) return '';
    const diffMs = sessionTime - Date.now();
    if (diffMs < -60 * 60 * 1000) return 'Session finished';
    if (diffMs < 0) return 'In progress';
    const diffMin = Math.round(diffMs / (60 * 1000));
    if (diffMin <= 10) return diffMin === 0 ? 'Starting now' : `Starts in ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) {
      return diffHours === 1 ? 'Starts in ~1 hr' : `Starts in ~${diffHours} hrs`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return diffDays === 1 ? 'Starts tomorrow' : `Starts in ${diffDays} days`;
  } catch {
    return '';
  }
};

/**
 * Computes consecutive days with a mood log entry ending today or yesterday.
 * Purely derived client-side from the moodLog collection.
 */
const computeCurrentStreak = (logs: Record<string, MoodLogEntry>): number => {
  const today = new Date();
  const todayStr = getLocalDateString(today);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let startDate: Date;
  if (logs[todayStr] && logs[todayStr].moodScore != null) {
    startDate = today;
  } else if (logs[yesterdayStr] && logs[yesterdayStr].moodScore != null) {
    startDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(startDate);
  for (let i = 0; i < 365; i++) {
    const dateKey = getLocalDateString(cursor);
    if (logs[dateKey] && logs[dateKey].moodScore != null) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, pendingConsentCount = 1 }) => {
  const { user, signOut } = useAuth();

  // --- 1. Sentinel & PHQ-9 Baseline State ---
  const [hasPhqAssessment, setHasPhqAssessment] = useState<boolean>(false);
  const [phqScore, setPhqScore] = useState<number | null>(null);
  const [sentimentHistory, setSentimentHistory] = useState<{ date: string; score: number }[]>([]);

  // --- 2. User Profile & Onboarding State ---
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  // --- 3. Real Vibe Check Mood Log State from Firestore ---
  const [moodLogs, setMoodLogs] = useState<Record<string, MoodLogEntry>>({});
  const [loadingMoods, setLoadingMoods] = useState<boolean>(true);

  // --- 4. SDoH Environmental Health Risk State from Firestore ---
  const [latestSdoh, setLatestSdoh] = useState<SDoHHistoryEntry | null>(null);
  const [loadingSdoh, setLoadingSdoh] = useState<boolean>(true);

  // --- 5. Upcoming Live Booking State from Firestore ---
  const [upcomingBooking, setUpcomingBooking] = useState<BookingEntry | null>(null);
  const [loadingBooking, setLoadingBooking] = useState<boolean>(true);

  // Fetch UserProfile to check onboarding status
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        const profile = await getUserProfile(user.uid);
        if (isMounted) setUserProfile(profile);
      } catch (err) {
        console.error('Failed to load user profile in Dashboard:', err);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Load real Sentinel metrics from localStorage (shared with SentinelDashboard.tsx & ChatInterface.tsx)
  useEffect(() => {
    try {
      const savedPhq = localStorage.getItem('last_phq_score');
      if (savedPhq !== null && !isNaN(parseInt(savedPhq, 10))) {
        setHasPhqAssessment(true);
        setPhqScore(parseInt(savedPhq, 10));
      } else {
        setHasPhqAssessment(false);
        setPhqScore(null);
      }

      const history = JSON.parse(localStorage.getItem('sentiment_history') || '[]');
      if (Array.isArray(history)) setSentimentHistory(history);
    } catch (e) {
      console.error('Failed to load Sentinel metrics from localStorage:', e);
    }
  }, []);

  // Fetch 7-day mood logs from Firestore at users/{uid}/moodLog
  useEffect(() => {
    let isMounted = true;
    const fetchMoods = async () => {
      if (!user?.uid) {
        setLoadingMoods(false);
        return;
      }
      try {
        setLoadingMoods(true);
        const logs = await getRecentMoodLogs(user.uid);
        if (isMounted) setMoodLogs(logs);
      } catch (err) {
        console.error('Failed to load mood logs from Firestore:', err);
      } finally {
        if (isMounted) setLoadingMoods(false);
      }
    };
    fetchMoods();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Fetch latest SDoH result from Firestore at users/{uid}/sdohHistory
  useEffect(() => {
    let isMounted = true;
    const fetchSdoh = async () => {
      if (!user?.uid) {
        setLoadingSdoh(false);
        return;
      }
      try {
        setLoadingSdoh(true);
        const res = await getLatestSDoHResult(user.uid);
        if (isMounted) setLatestSdoh(res);
      } catch (err) {
        console.error('Failed to load latest SDoH result:', err);
      } finally {
        if (isMounted) setLoadingSdoh(false);
      }
    };
    fetchSdoh();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Fetch upcoming live session booking from Firestore at users/{uid}/bookings
  useEffect(() => {
    let isMounted = true;
    const fetchBooking = async () => {
      if (!user?.uid) {
        setLoadingBooking(false);
        return;
      }
      try {
        setLoadingBooking(true);
        const res = await getUpcomingBooking(user.uid);
        if (isMounted) setUpcomingBooking(res);
      } catch (err) {
        console.error('Failed to load upcoming booking in Dashboard:', err);
      } finally {
        if (isMounted) setLoadingBooking(false);
      }
    };
    fetchBooking();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Compute DI using the identical formula from SentinelDashboard.tsx
  const avgSentiment = sentimentHistory.length > 0
    ? sentimentHistory.reduce((acc, curr) => acc + curr.score, 0) / sentimentHistory.length
    : 0;

  const sentimentDistress = (1 - avgSentiment) / 2;
  const phqDistress = phqScore !== null ? phqScore / 27 : 0;
  const distressIndex = ((0.7 * phqDistress) + (0.3 * sentimentDistress)) * 10;

  const getRiskLevel = (di: number) => {
    if (di > 7) return { label: 'High Risk (Level 3)', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    if (di > 4) return { label: 'Moderate Risk (Level 2)', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    return { label: 'Low Risk (Level 1)', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
  };

  const risk = getRiskLevel(distressIndex);

  // SDoH Color Band: green <30, amber 30-60, red >60
  const getSdohColorBand = (score: number) => {
    if (score > 60) {
      return {
        label: 'High Environmental Risk',
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        badge: 'bg-red-500/20 text-red-300 border-red-500/30',
      };
    }
    if (score >= 30) {
      return {
        label: 'Moderate Environmental Risk',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
    return {
      label: 'Low Environmental Risk',
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      badge: 'bg-green-500/20 text-green-300 border-green-500/30',
    };
  };

  const sdohBand = latestSdoh ? getSdohColorBand(latestSdoh.riskScore) : null;

  const handleNavigateToSdoh = () => {
    try {
      sessionStorage.setItem('vault_initial_view', 'SDOH_ENGINE');
    } catch (e) {}
    onNavigate?.(Screen.VAULT);
  };

  // Generate 7 consecutive days ending today from real Firestore entries
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const entry = moodLogs[dateStr];
      const score = entry?.moodScore ?? null;
      days.push({
        dateStr,
        day: dayLabel,
        isToday: i === 0,
        score,
        emoji: score !== null && MOOD_EMOJIS[score] ? MOOD_EMOJIS[score] : null,
        height: score !== null && MOOD_HEIGHTS[score] ? MOOD_HEIGHTS[score] : 'h-2',
      });
    }
    return days;
  }, [moodLogs]);

  // Derived client-side current streak from moodLog collection
  const currentStreak = useMemo(() => {
    return computeCurrentStreak(moodLogs);
  }, [moodLogs]);

  const loggedDays = last7Days.filter((d) => d.score !== null);
  const avgMood = loggedDays.length > 0
    ? loggedDays.reduce((acc, d) => acc + (d.score as number), 0) / loggedDays.length
    : null;
  const avgPercentage = avgMood !== null ? Math.round((avgMood / 5) * 100) : null;

  // Bio Vault summary
  const vaultSummary = {
    totalDocs: 5,
    verifiedCount: 5,
    lastAccessTime: 'Today, 10:30 AM',
    lastAccessor: 'Dr. Rao (Psychiatry)',
    status: 'Hardware Encrypted',
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out from Dashboard:', err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Friend';
  const avatarUrl = user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 0. ONBOARDING NUDGE BANNER */}
      {!bannerDismissed && userProfile?.onboardingComplete === false && (
        <div className="bg-gradient-to-r from-saffron-500 to-red-500 rounded-3xl p-4 shadow-vibrant relative overflow-hidden animate-slide-in-up flex items-start sm:items-center gap-3.5 border-2 border-white/20">
          <div className="p-2 bg-white/20 rounded-full backdrop-blur-md shrink-0">
            <Bell size={20} className="text-white animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-white font-bold text-sm leading-snug drop-shadow-md">
              Complete your profile — take your first PHQ-9 baseline to personalize your care
            </p>
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('start_assessment_flow', 'true');
                } catch (e) {}
                onNavigate?.(Screen.CHAT);
              }}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-white/90 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all self-start sm:self-center cursor-pointer shrink-0"
            >
              <span>Take check-in</span>
              <ChevronRight size={14} />
            </button>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
            title="Dismiss for now"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* 1. GREETING HEADER */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-saffron-500 to-teal-500 p-0.5 shadow-xl">
              <div className="w-full h-full rounded-2xl bg-charcoal flex items-center justify-center overflow-hidden">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-charcoal flex items-center justify-center shadow-md">
              <Sparkles size={10} className="text-white" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-[11px] font-bold text-teal-300">
                SafeBio Authenticated
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {user?.email}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-saffron-400 to-teal-400 bg-clip-text text-transparent">
                {displayName}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Your holistic mental wellness baseline, genomic records, and AI sentinel overview.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <button
            onClick={handleSignOut}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Sign out of Firebase session"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. QUICK ACTIONS ROW */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Actions</h2>
          <span className="text-[11px] text-teal-400 font-mono">Direct Navigation</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate?.(Screen.CHAT)}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all shadow-md active:scale-98 text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 group-hover:scale-105 transition-transform">
                <MessageCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">Vent Box</h3>
                <p className="text-[11px] text-gray-400">Holistic SDoH Chat & Support</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => onNavigate?.(Screen.LIVE)}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all shadow-md active:scale-98 text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform">
                <Video size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Consult</h3>
                <p className="text-[11px] text-gray-400">Live Doctor & Specialist Session</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={() => onNavigate?.(Screen.SENTINEL)}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between group transition-all shadow-md active:scale-98 text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-saffron-500/20 to-orange-500/20 border border-saffron-500/30 flex items-center justify-center text-saffron-300 group-hover:scale-105 transition-transform">
                <Brain size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-saffron-300 transition-colors">AI Sentinel</h3>
                <p className="text-[11px] text-gray-400">Run Sentinel Triage & Analytics</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* 3. UPCOMING LIVE SESSION CARD */}
      <div>
        {loadingBooking ? (
          <div className="rounded-3xl p-5 bg-white/5 border border-white/10 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10"></div>
              <div className="space-y-1.5">
                <div className="w-32 h-3.5 bg-white/10 rounded"></div>
                <div className="w-48 h-3 bg-white/5 rounded"></div>
              </div>
            </div>
            <div className="w-24 h-8 bg-white/10 rounded-xl"></div>
          </div>
        ) : upcomingBooking ? (
          (() => {
            const canJoin = isBookingJoinable(upcomingBooking.dateTime);
            const timingStatus = getBookingTimingStatus(upcomingBooking.dateTime);
            const formattedDate = formatBookingDateTime(upcomingBooking.dateTime);

            return (
              <div className="rounded-3xl p-6 bg-gradient-to-r from-teal-500/10 via-white/5 to-saffron-500/10 border border-teal-500/30 shadow-xl relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                  <Video size={160} className="text-teal-400" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
                      <Video size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                          Upcoming Session
                        </span>
                        {timingStatus && (
                          <span className={`text-[11px] font-mono font-bold flex items-center gap-1 ${canJoin ? 'text-emerald-400' : 'text-saffron-400'}`}>
                            <Clock size={12} />
                            {timingStatus}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                        Next Session: {upcomingBooking.specialistName} — {formattedDate}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {upcomingBooking.specialistRole} • 1-on-1 Confidential Video Consultation
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    {canJoin ? (
                      <button
                        onClick={() => onNavigate?.(Screen.LIVE)}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95 transition-all cursor-pointer"
                      >
                        <Video size={17} />
                        <span>Join</span>
                      </button>
                    ) : (
                      <div className="flex flex-col sm:items-end">
                        <button
                          disabled
                          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold text-sm flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                          title="Join button is enabled 10 minutes before the scheduled session"
                        >
                          <Video size={17} />
                          <span>Join</span>
                        </button>
                        <span className="text-[10px] text-gray-400 mt-1 font-mono text-center sm:text-right">
                          Scheduled: {formattedDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="rounded-3xl p-5 sm:p-6 bg-white/5 border border-white/10 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-white/5 text-gray-400 border border-white/10 shrink-0">
                <Video size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Upcoming Live Session</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Consult 1-on-1 with verified psychiatrists, therapists, and peer guides.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate?.(Screen.LIVE)}
              className="group inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-teal-400 hover:text-teal-300 font-bold text-xs transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <span>No sessions booked — Browse specialists →</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. CLINICAL TRIAGE & DISTRESS INDEX ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DISTRESS INDEX CARD: Honest Empty State vs. Live Clinical Metric */}
        {!hasPhqAssessment ? (
          <div className="lg:col-span-2 rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/5 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Brain size={120} className="text-white" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-saffron-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Distress Index & Clinical Baseline</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-saffron-500/10 border border-saffron-500/30 text-[11px] font-bold text-saffron-400 font-mono">
                  Assessment Needed
                </span>
              </div>

              <div className="my-2 space-y-2">
                <h4 className="text-2xl font-bold text-white tracking-tight">
                  No Clinical Assessment Yet
                </h4>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl">
                  You haven't completed a PHQ-9 wellness check-in yet. Take your first standardized assessment to establish an honest clinical baseline and activate real-time AI Sentinel distress monitoring.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="w-8 h-8 rounded-lg bg-saffron-500/10 border border-saffron-500/20 flex items-center justify-center text-saffron-400 shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <span>Quick 2-minute standardized clinical screen in Vent Box</span>
              </div>
              <button
                onClick={() => {
                  try {
                    sessionStorage.setItem('start_assessment_flow', 'true');
                  } catch (e) {}
                  onNavigate?.(Screen.CHAT);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-teal-500 hover:from-saffron-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <span>Take your first PHQ-9 check-in</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className={`lg:col-span-2 rounded-3xl p-6 border ${risk.border} ${risk.bg} relative overflow-hidden transition-all duration-500 shadow-xl flex flex-col justify-between`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Activity size={100} className="text-white" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className={risk.color} />
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Distress Index (DI)</h3>
                </div>
                <button
                  onClick={() => onNavigate?.(Screen.SENTINEL)}
                  className="text-[11px] font-bold text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>Full Sentinel Analytics</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex items-baseline gap-3 mb-4">
                <span className={`text-5xl font-black ${risk.color}`}>{distressIndex.toFixed(1)}</span>
                <span className="text-gray-400 text-lg font-bold">/ 10</span>
                <div className={`ml-2 inline-block px-3 py-1 rounded-full text-xs font-bold border ${risk.border} ${risk.color} bg-white/5`}>
                  {risk.label}
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
                Calculated dynamically using your verified PHQ-9 score ({phqScore}/27) and linguistic sentiment analysis. Real-time early warning system for cognitive distress.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase font-bold text-gray-400">PHQ-9 Clinical Baseline</p>
                <p className="text-lg font-bold text-white mt-0.5">{phqScore} <span className="text-xs text-gray-500 font-normal">/ 27</span></p>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase font-bold text-gray-400">Linguistic Sentiment</p>
                <p className={`text-lg font-bold mt-0.5 flex items-center gap-1 ${avgSentiment >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {avgSentiment >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {avgSentiment.toFixed(2)}
                </p>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase font-bold text-gray-400">Clinical Recommendation</p>
                <p className="text-xs font-bold text-teal-300 mt-1">
                  {distressIndex > 7 ? 'Immediate Helpline Support' : distressIndex > 4 ? 'Therapy Consult Recommended' : 'Routine Preventive Care'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BIO VAULT STATUS SUMMARY CARD */}
        <div className="rounded-3xl p-6 bg-white/5 border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">SafeBio Vault</h3>
                  <p className="text-[10px] text-gray-400 font-mono">Hardware Encrypted</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.(Screen.VAULT)}
                className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <span>Open Vault</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* PENDING CONSENT BADGE (Phase 6) */}
            {pendingConsentCount > 0 && (
              <button
                onClick={() => onNavigate?.(Screen.VAULT)}
                className="w-full mb-3 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-between transition-all group active:scale-98 cursor-pointer shadow-sm text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-xs font-bold">
                    {pendingConsentCount} pending consent request{pendingConsentCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Review</span>
                  <ChevronRight size={13} />
                </div>
              </button>
            )}

            <div className="space-y-3 my-3">
              <div className="bg-black/20 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Encrypted Health Records</p>
                  <p className="text-xl font-bold font-mono text-white mt-0.5">{vaultSummary.totalDocs} Documents</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {vaultSummary.verifiedCount} Verified
                </span>
              </div>

              <div className="bg-black/20 p-3.5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span className="text-[10px] uppercase font-bold">Recent Audited Access</span>
                  <Clock size={12} />
                </div>
                <p className="text-xs font-bold text-white truncate">{vaultSummary.lastAccessor}</p>
                <p className="text-[10px] font-mono text-gray-400 mt-0.5">{vaultSummary.lastAccessTime}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <Lock size={12} className="text-saffron-400" />
              <span>PIN & Biometric Gate</span>
            </div>
            <span className="text-emerald-400 font-bold">Protected</span>
          </div>
        </div>
      </div>

      {/* 5. ENVIRONMENTAL HEALTH RISK & VIBE BATTERY TREND ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ENVIRONMENTAL HEALTH RISK (SDoH) CARD */}
        {latestSdoh && sdohBand ? (
          <div className={`rounded-3xl p-6 border ${sdohBand.border} ${sdohBand.bg} shadow-xl relative overflow-hidden flex flex-col justify-between transition-all`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Wind size={90} className="text-white" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${sdohBand.border} ${sdohBand.color} bg-black/20`}>
                    <Wind size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Environmental Health</h3>
                    <p className="text-[10px] text-gray-400 font-mono">SDoH Diagnostic Engine</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${sdohBand.badge}`}>
                  {sdohBand.label}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-4xl font-extrabold ${sdohBand.color}`}>
                  {latestSdoh.riskScore}
                </span>
                <span className="text-gray-400 font-bold text-base">/ 100</span>
                <span className="text-xs text-gray-400 ml-auto font-mono flex items-center gap-1">
                  <Clock size={12} />
                  {formatTimeAgo(latestSdoh.createdAt)}
                </span>
              </div>

              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed mb-4 bg-black/20 p-3 rounded-2xl border border-white/5">
                {latestSdoh.summary || 'Environmental and geographical determinants evaluated.'}
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Live multi-modal scan
              </span>
              <button
                onClick={handleNavigateToSdoh}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Re-check</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl p-6 bg-white/5 border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Wind size={90} className="text-white" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Wind size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Environmental Health</h3>
                    <p className="text-[10px] text-gray-400 font-mono">SDoH Diagnostic Engine</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-gray-400 font-mono">
                  Unchecked
                </span>
              </div>

              <div className="my-3 space-y-1.5">
                <h4 className="text-base font-bold text-white">
                  No Environmental Scan Yet
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Analyze local air quality, climate stressors, and socioeconomic determinants of health using Gemini 2.5 Flash.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Live environmental data</span>
              <button
                onClick={handleNavigateToSdoh}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>Run check</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* MOOD & VIBE BATTERY TREND (Real 7-day Firestore Data) */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <BatteryCharging size={18} className="text-teal-400" />
                  <h3 className="text-base font-bold text-white">Vibe Check Battery Trend</h3>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 font-hindi">
                  Last 7 days emotional resilience logged from the Feed
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Streak Badge */}
                {!loadingMoods && (
                  currentStreak > 0 ? (
                    <span
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm"
                      title={`${currentStreak} consecutive day${currentStreak > 1 ? 's' : ''} with mood logs ending today or yesterday`}
                    >
                      <span className="text-sm">🔥</span>
                      <span>{currentStreak}-day streak</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onNavigate?.(Screen.HOME)}
                      className="px-3 py-1 rounded-full bg-saffron-500/10 hover:bg-saffron-500/20 border border-saffron-500/25 text-saffron-300 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      title="Log today's mood on the Feed to start your streak"
                    >
                      <span className="text-sm">✨</span>
                      <span>Start your streak today</span>
                    </button>
                  )
                )}

                {loadingMoods ? (
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold font-mono">
                    Syncing mood data...
                  </span>
                ) : avgPercentage !== null ? (
                  <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold font-mono">
                    7-Day Average: {avgPercentage}% ({loggedDays.length}/7 days)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold font-mono">
                    No entries this week
                  </span>
                )}
              </div>
            </div>

            {/* Real 7-day bar graph with honest empty days */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-4 pb-2">
              {last7Days.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 group">
                  <div className="h-8 flex items-center justify-center">
                    {item.emoji ? (
                      <span className="text-2xl sm:text-3xl filter transition-transform group-hover:scale-125 cursor-default">
                        {item.emoji}
                      </span>
                    ) : (
                      <span className="text-gray-600 font-mono text-xs select-none">
                        —
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-black/30 rounded-xl p-1 h-24 flex flex-col justify-end items-center border border-white/5">
                    {item.score !== null ? (
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${item.height} ${
                          item.isToday
                            ? 'bg-gradient-to-t from-teal-500 to-emerald-400 shadow-[0_0_12px_rgba(45,212,191,0.4)]'
                            : 'bg-gradient-to-t from-teal-500/50 to-teal-400/80 group-hover:from-teal-500 group-hover:to-teal-400'
                        }`}
                        title={`${item.day} (${item.dateStr}): Mood ${item.score}/5`}
                      ></div>
                    ) : (
                      <div
                        className="w-full h-2 rounded-md bg-white/5 border border-dashed border-white/10"
                        title={`${item.day} (${item.dateStr}): No mood logged`}
                      ></div>
                    )}
                  </div>
                  <span className={`text-[11px] font-bold ${item.isToday ? 'text-teal-400' : 'text-gray-400'}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-400 gap-2">
            <p className="text-[11px]">
              {loggedDays.length === 0 ? (
                <span>
                  No mood checks logged yet. Tap a mood emoji on the{' '}
                  <span
                    className="text-teal-300 font-semibold cursor-pointer underline hover:text-teal-200"
                    onClick={() => onNavigate?.(Screen.HOME)}
                  >
                    Feed
                  </span>{' '}
                  to build your emotional resilience trend.
                </span>
              ) : (
                <span>
                  Log daily reflections in the{' '}
                  <span
                    className="text-teal-300 font-semibold cursor-pointer underline hover:text-teal-200"
                    onClick={() => onNavigate?.(Screen.HOME)}
                  >
                    Feed
                  </span>{' '}
                  to maintain your longitudinal trend.
                </span>
              )}
            </p>
            <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active Log
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/20"></span> Unlogged Day
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Crisis Helpline Note */}
      <p className="text-[11px] text-center text-gray-500 pt-2">
        In crisis? Call <a href="tel:14416" className="hover:underline text-gray-400">14416</a>
      </p>
    </div>
  );
};

export default Dashboard;
