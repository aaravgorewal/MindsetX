import React, { useEffect, useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { Shield, Sparkles, ChevronRight, Lock, Activity } from 'lucide-react';

interface WelcomeTransitionProps {
  user: User;
  onComplete: () => void;

  durationMs?: number;
}

export const WelcomeTransition: React.FC<WelcomeTransitionProps> = ({
  user,
  onComplete,
  durationMs = 3000,
}) => {
  const [phase, setPhase] = useState<number>(0);
  const [progress, setProgress] = useState<number>(10);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const completedRef = useRef<boolean>(false);

  // Extract real user details from Google OAuth profile
  const rawDisplayName = (user.displayName || '').trim();
  const firstName = rawDisplayName ? rawDisplayName.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'Friend');
  const userInitials = rawDisplayName
    ? rawDisplayName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : firstName.slice(0, 2).toUpperCase();

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 320);
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Multi-stage timed animation pipeline
  useEffect(() => {
    // Stage 1: Brand logo & identity reveal (0 - 800ms)
    const t1 = setTimeout(() => {
      setPhase(1);
      setProgress(40);
    }, 500);

    // Stage 2: Personalized greeting & biometric synchronization (800 - 1800ms)
    const t2 = setTimeout(() => {
      setPhase(2);
      setProgress(75);
    }, 1300);

    // Stage 3: Ready state & final polish (1800 - 2700ms)
    const t3 = setTimeout(() => {
      setPhase(3);
      setProgress(100);
    }, 2200);

    // Stage 4: Automatic transition to dashboard (at durationMs)
    const t4 = setTimeout(() => {
      handleFinish();
    }, durationMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [durationMs]);

  return (
    <div
      onClick={handleFinish}
      role="button"
      tabIndex={0}
      aria-label="Welcome to MindSet X - Tap anywhere to skip to dashboard"
      className={`fixed inset-0 z-[200] bg-[#0A0D12] flex flex-col items-center justify-center p-6 text-white select-none cursor-pointer overflow-hidden transition-all duration-300 ease-out ${isExiting
        ? 'opacity-0 scale-[1.03] blur-sm pointer-events-none'
        : 'opacity-100 scale-100'
        }`}
    >
      {/* 1. Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[650px] h-[450px] bg-[#2A9D8F]/18 rounded-full blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-[#D86A38]/14 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#F0F4F8 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* 2. Top Banner / Skip Indicator */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-400 hover:text-white transition-all backdrop-blur-md">
        <span>Tap anywhere to continue</span>
        <ChevronRight size={14} className="text-teal-400" />
      </div>

      {/* 3. Main Center Welcome Card */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-6">

        {/* Brand Shield & User Avatar Ring */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing outer aura ring */}
          <div className="absolute w-28 h-28 rounded-full bg-teal-500/20 animate-ping opacity-30" />
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-saffron-500/30 via-teal-500/30 to-emerald-500/30 blur-md animate-pulse" />

          {/* User Photo or Fallback Initial Avatar */}
          <div className="relative w-20 h-20 rounded-2xl bg-[#161E28] border-2 border-teal-500/40 p-1 shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-105">
            {user.photoURL && !imageError ? (
              <img
                src={user.photoURL}
                alt={rawDisplayName || 'User'}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-teal-500/30 via-saffron-500/20 to-teal-500/40 flex items-center justify-center text-warmWhite font-bold text-xl border border-white/10 shadow-inner">
                <span>{userInitials}</span>
              </div>
            )}

            {/* Micro verified shield badge */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0A0D12] border border-teal-500/50 flex items-center justify-center shadow-md">
              <Shield size={12} className="text-teal-400" />
            </div>
          </div>
        </div>

        {/* Dynamic Typography & Personal Greeting */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles size={12} className="animate-spin-slow" />
            <span>Google Account Verified</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-warmWhite to-gray-200 bg-clip-text text-transparent">
            Welcome, {firstName}
          </h1>

          <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto transition-opacity duration-300">
            {phase < 2 && 'Initializing secure biometric handshake...'}
            {phase === 2 && 'Setting up your personalized wellness space...'}
            {phase >= 3 && 'Encrypted session established. Entering dashboard...'}
          </p>
        </div>

        {/* Progress Bar & Sub-Step Indicators */}
        <div className="w-full max-w-xs space-y-3 pt-2">
          {/* Progress track */}
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-teal-400 via-saffron-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Micro Status Indicators */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
            <span className="flex items-center gap-1">
              <Lock size={11} className="text-teal-400" />
              <span>SafeBio Encrypted</span>
            </span>
            <span className="flex items-center gap-1">
              <Activity size={11} className="text-saffron-400" />
              <span>AI Sentinel Ready</span>
            </span>
          </div>
        </div>

      </div>

      {/* 4. Footer Note */}
      <div className="absolute bottom-6 text-center text-xs text-gray-500 z-10">
        <span>MindSet X • Culturally Grounded Student Wellness</span>
      </div>
    </div>
  );
};

export default WelcomeTransition;
