import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Screen } from '../types';
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
  FileCheck,
  ChevronRight,
  Shield,
  Clock,
} from 'lucide-react';

interface DashboardProps {
  onNavigate?: (screen: Screen) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();

  // --- 1. Real Sentinel metrics pulled from localStorage (same as SentinelDashboard.tsx) ---
  const [phqScore, setPhqScore] = useState<number>(0);
  const [sentimentHistory, setSentimentHistory] = useState<{ date: string; score: number }[]>([]);

  useEffect(() => {
    try {
      const savedPhq = localStorage.getItem('last_phq_score');
      if (savedPhq) setPhqScore(parseInt(savedPhq, 10));

      const history = JSON.parse(localStorage.getItem('sentiment_history') || '[]');
      if (Array.isArray(history)) setSentimentHistory(history);
    } catch (e) {
      console.error('Failed to load Sentinel metrics from localStorage:', e);
    }
  }, []);

  const avgSentiment = sentimentHistory.length > 0
    ? sentimentHistory.reduce((acc, curr) => acc + curr.score, 0) / sentimentHistory.length
    : 0.25;

  const sentimentDistress = (1 - avgSentiment) / 2;
  const phqDistress = phqScore / 27;
  const computedDI = (0.7 * phqDistress + 0.3 * sentimentDistress) * 10;
  // If user hasn't taken an assessment yet, show healthy baseline of 2.1
  const distressIndex = phqScore === 0 && sentimentHistory.length === 0 ? 2.1 : computedDI;

  const getRiskLevel = (di: number) => {
    if (di > 7) return { label: 'High Risk (Level 3)', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    if (di > 4) return { label: 'Moderate Risk (Level 2)', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    return { label: 'Low Risk (Level 1)', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
  };

  const risk = getRiskLevel(distressIndex);

  // --- 2. Mood & Vibe Trend Mock Data ---
  // TODO: Connect to persisted Vibe Check Battery records from Firestore/MindSetFeed when multi-day persistence is implemented
  const moodHistory = [
    { day: 'Mon', emoji: '🙂', level: 4, height: 'h-16' },
    { day: 'Tue', emoji: '🙂', level: 4, height: 'h-16' },
    { day: 'Wed', emoji: '😐', level: 3, height: 'h-12' },
    { day: 'Thu', emoji: '🤩', level: 5, height: 'h-20' },
    { day: 'Fri', emoji: '🙂', level: 4, height: 'h-16' },
    { day: 'Sat', emoji: '🤩', level: 5, height: 'h-20' },
    { day: 'Sun', emoji: '🙂', level: 4, height: 'h-16', isToday: true },
  ];

  // --- 3. Bio Vault Summary Mock Data ---
  // TODO: Wire dynamically to SafeBioVault.tsx documents registry once vaulted records are synced globally
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
                <h3 className="text-sm font-bold text-white group-hover:text-saffron-300 transition-colors">Re-check SDoH</h3>
                <p className="text-[11px] text-gray-400">Run Sentinel Triage & PHQ-9</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* 3. CLINICAL TRIAGE & DISTRESS INDEX ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DISTRESS INDEX CARD (Matching SentinelDashboard style) */}
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

        {/* 4. BIO VAULT STATUS SUMMARY CARD */}
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

            {/* TODO: Wire dynamically to SafeBioVault.tsx documents registry once vaulted records are synced globally */}
            <div className="space-y-3 my-4">
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

      {/* 5. MOOD & VIBE BATTERY TREND */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BatteryCharging size={18} className="text-teal-400" />
              <h3 className="text-base font-bold text-white">Vibe Check Battery Trend</h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 font-hindi">
              Weekly emotional resilience & mood tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold font-mono">
              7-Day Average: 82%
            </span>
          </div>
        </div>

        {/* TODO: Connect to persisted Vibe Check Battery records from Firestore/MindSetFeed when multi-day persistence is implemented */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-4 pb-2">
          {moodHistory.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 group">
              <span className="text-2xl sm:text-3xl filter transition-transform group-hover:scale-125 cursor-default">
                {item.emoji}
              </span>
              <div className="w-full bg-black/30 rounded-xl p-1 h-24 flex flex-col justify-end items-center border border-white/5">
                <div
                  className={`w-full rounded-lg transition-all duration-500 ${item.height} ${
                    item.isToday
                      ? 'bg-gradient-to-t from-teal-500 to-emerald-400 shadow-[0_0_12px_rgba(45,212,191,0.4)]'
                      : 'bg-gradient-to-t from-teal-500/40 to-teal-400/70 group-hover:from-teal-500 group-hover:to-teal-400'
                  }`}
                ></div>
              </div>
              <span className={`text-[11px] font-bold ${item.isToday ? 'text-teal-400' : 'text-gray-400'}`}>
                {item.day}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-400 gap-2">
          <p className="text-[11px]">
            Log daily reflections in the <span className="text-teal-300 font-semibold cursor-pointer" onClick={() => onNavigate?.(Screen.HOME)}>Feed</span> to maintain accurate longitudinal trends.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> High Resilience</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Moderate</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
