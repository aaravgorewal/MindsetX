import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Screen } from '../types';
import {
  Wind,
  MessageSquare,
  Moon,
  PhoneCall,
  Brain,
  Leaf,
  Play,
  X,
  Loader2,
  ChevronRight,
  Image as ImageIcon,
  ArrowUpRight,
  BookOpen,
  Timer,
} from 'lucide-react';
import {
  generateCatchyNudge,
  generateHealthLesson,
  generateHealingImage,
  generateRelaxationVideo,
} from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { logUserMood } from '../services/userService';

interface HealthModule {
  topic: string;
  perspective: 'Allopathy' | 'Ayurveda' | 'Yoga';
  title: string;
  description: string;
  tag: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface MindSetFeedProps {
  onNavigate?: (screen: Screen) => void;
}

const MOOD_OPTIONS = [
  { level: 1, emoji: '😫', labelHindi: 'Heavy', labelEn: 'Overwhelmed', desc: 'Brain fog, high stress' },
  { level: 2, emoji: '😓', labelHindi: 'Drained', labelEn: 'Low Energy', desc: 'Sleep-deprived, tired' },
  { level: 3, emoji: '😐', labelHindi: 'Okay', labelEn: 'In-Between', desc: 'Floating, neutral' },
  { level: 4, emoji: '🙂', labelHindi: 'Steady', labelEn: 'Grounded', desc: 'Clear mind, focused' },
  { level: 5, emoji: '🤩', labelHindi: 'Energized', labelEn: 'In Flow', desc: 'Strong, productive' },
];

const HEALTH_MODULES: HealthModule[] = [
  {
    topic: 'Dopamine & Cortisol Circuitry',
    perspective: 'Allopathy',
    title: 'Dopamine & Cortisol Circuitry',
    description: 'How prolonged academic pressure alters receptor sensitivity, and how sleep resets neural fatigue.',
    tag: 'Neuroscience • MBBS',
    borderColor: 'border-l-sky-500/60',
    badgeBg: 'bg-sky-500/10 border-sky-500/30',
    badgeText: 'text-sky-300',
    icon: Brain,
  },
  {
    topic: 'Vata Imbalance & Adaptogens',
    perspective: 'Ayurveda',
    title: 'Vata Imbalance & Adaptogens',
    description: 'Grounding racing thoughts, restlessness, and digestive tension using classical Ashwagandha protocols.',
    tag: 'Ayurvedic Science',
    borderColor: 'border-l-emerald-500/60',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    badgeText: 'text-emerald-300',
    icon: Leaf,
  },
  {
    topic: 'Vagus Nerve Reset (Pranayama)',
    perspective: 'Yoga',
    title: 'Vagus Nerve Reset (Pranayama)',
    description: '60-second physiological sigh and Nadi Shodhana to quickly regulate pre-exam tachycardia.',
    tag: 'Yogic Breathwork',
    borderColor: 'border-l-amber-500/60',
    badgeBg: 'bg-amber-500/10 border-amber-500/30',
    badgeText: 'text-amber-300',
    icon: Wind,
  },
];

const QUICK_ACTIONS = [
  {
    id: 'breath',
    title: '60s Pranayama',
    subtitle: 'Box breathing for acute exam panic',
    icon: Wind,
    actionLabel: 'Start Reset',
  },
  {
    id: 'vent',
    title: 'Vent Box',
    subtitle: 'Unfiltered thought dump with AI',
    icon: MessageSquare,
    actionLabel: 'Open Journal',
  },
  {
    id: 'nap',
    title: '15m Power Rest',
    subtitle: 'Delta-wave hostel audio recharge',
    icon: Moon,
    actionLabel: 'Play Audio',
  },
  {
    id: 'consult',
    title: 'Peer / Doc Consult',
    subtitle: 'Confidential 1-on-1 verified guidance',
    icon: PhoneCall,
    actionLabel: 'Book Slot',
  },
];

const MindSetFeed: React.FC<MindSetFeedProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [nudge, setNudge] = useState<string | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const [isGeneratingNudge, setIsGeneratingNudge] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodSavedToast, setMoodSavedToast] = useState(false);

  // Active breathing quick-modal state
  const [activeBreathing, setActiveBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(60);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 15m Power Rest state
  const [activePowerRest, setActivePowerRest] = useState(false);
  const [powerRestSecondsLeft, setPowerRestSecondsLeft] = useState(15 * 60);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorLeftRef = useRef<OscillatorNode | null>(null);
  const oscillatorRightRef = useRef<OscillatorNode | null>(null);
  const powerRestIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Health Module Modal State
  const [activeModule, setActiveModule] = useState<HealthModule | null>(null);
  const [moduleContent, setModuleContent] = useState<{ text: string; image?: string; video?: string } | null>(null);
  const [loadingModule, setLoadingModule] = useState(false);
  const [genStatus, setGenStatus] = useState<string>('');

  // Campus Voices: essay reader modal
  const [activeEssayIndex, setActiveEssayIndex] = useState<number | null>(null);

  // Campus Voices: focus mode timer (replaces fake "Quiet Room Live")
  const [activeFocusMode, setActiveFocusMode] = useState(false);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60); // 25-minute pomodoro
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Initial campus-grounded contextual check-in message
  useEffect(() => {
    const fetchNudge = async () => {
      const hour = new Date().getHours();
      let context = 'normal';

      if (hour >= 23 || hour < 5) context = 'late_night';
      else if (Math.random() > 0.7) context = 'exam_week';

      const studentFallbackNudges: Record<string, string[]> = {
        late_night: [
          'Raat ka 1:30 baj raha hai. Agar dimag ghoom raha hai, screen brightness kam karo aur 5 minute aankhein band karo.',
          'Hostel study hall quiet hai. Don’t trade tomorrow’s cognitive stamina for 2 more hours of tired revision.',
        ],
        exam_week: [
          'Syllabus kitna bhi lamba ho, panic se retain nahi hota. Take one chapter at a time.',
          'Competitive prep is a marathon, not a sprint. 10 minute ka walk is productive study time.',
        ],
        normal: [
          'College ya coaching start hone se pehle, take 30 seconds to check your own battery.',
          'Sharma ji ke taane side mein rakho. Focus on today’s single practical priority.',
        ],
      };

      try {
        const text = await generateCatchyNudge(context);
        if (text) {
          setNudge(text);
          setShowNudge(true);
        } else {
          const pool = studentFallbackNudges[context] || studentFallbackNudges.normal;
          setNudge(pool[Math.floor(Math.random() * pool.length)]);
          setShowNudge(true);
        }
      } catch (e) {
        const pool = studentFallbackNudges[context] || studentFallbackNudges.normal;
        setNudge(pool[Math.floor(Math.random() * pool.length)]);
        setShowNudge(true);
      }
    };

    fetchNudge();
  }, []);

  // 2. Mood check-in interaction
  const handleMoodClick = async (level: number) => {
    setSelectedMood(level);
    setIsGeneratingNudge(true);
    setMoodSavedToast(true);
    setTimeout(() => setMoodSavedToast(false), 2800);

    if (user?.uid) {
      logUserMood(user.uid, level).catch((err) => {
        console.error('Failed to log mood to Firestore:', err);
      });
    }

    let context = 'normal';
    switch (level) {
      case 1: context = 'high_stress_panic'; break;
      case 2: context = 'anxious_tired'; break;
      case 3: context = 'bored_neutral'; break;
      case 4: context = 'feeling_good_productivity'; break;
      case 5: context = 'celebration_great_mood'; break;
    }

    const studentFeedback: Record<string, string> = {
      high_stress_panic: 'Feeling heavy right now. That is completely valid. Drop everything non-essential for the next 20 minutes.',
      anxious_tired: 'Battery is running on reserve. Don’t force intense memorization right now; hydrate and rest.',
      bored_neutral: 'Steady baseline. Good moment for low-stress tasks or quick revision.',
      feeling_good_productivity: 'Clear head today. Ride this steady wave without burning out your reserves.',
      celebration_great_mood: 'High battery day! Remember this feeling when test weeks get stressful.',
    };

    try {
      const text = await generateCatchyNudge(context);
      if (text) {
        setNudge(text);
        setShowNudge(true);
      } else {
        setNudge(studentFeedback[context] || 'Check-in recorded.');
        setShowNudge(true);
      }
    } catch {
      setNudge(studentFeedback[context] || 'Check-in recorded.');
      setShowNudge(true);
    } finally {
      setIsGeneratingNudge(false);
    }
  };

  // 3. Quick Action handlers

  // --- Breathing: start a proper 60s countdown with phase cycling ---
  const startBreathing = useCallback(() => {
    // Clean up any prior session
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);

    setActiveBreathing(true);
    setBreathSecondsLeft(60);
    setBreathPhase('Inhale');

    let elapsed = 0;
    const phases: Array<'Inhale' | 'Hold' | 'Exhale' | 'Pause'> = ['Inhale', 'Hold', 'Exhale', 'Pause'];

    breathIntervalRef.current = setInterval(() => {
      elapsed += 1;
      const remaining = 60 - elapsed;
      setBreathSecondsLeft(remaining);

      // Cycle phase every 4 seconds (4-4-4-4 box breathing)
      const phaseIndex = Math.floor(elapsed / 4) % 4;
      setBreathPhase(phases[phaseIndex]);

      if (remaining <= 0) {
        if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
        breathIntervalRef.current = null;
        setActiveBreathing(false);
        setBreathSecondsLeft(60);
      }
    }, 1000);
  }, []);

  const stopBreathing = useCallback(() => {
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    breathIntervalRef.current = null;
    setActiveBreathing(false);
    setBreathSecondsLeft(60);
  }, []);

  // --- Power Rest: Web Audio API binaural delta-wave (4 Hz) ---
  const startPowerRest = useCallback(() => {
    setActivePowerRest(true);
    setPowerRestSecondsLeft(15 * 60);

    // Create audio context and binaural beat
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      // Channel merger for stereo separation
      const merger = ctx.createChannelMerger(2);
      merger.connect(ctx.destination);

      // Gain node for gentle volume (binaural tones should be soft)
      const gainL = ctx.createGain();
      gainL.gain.value = 0.08;
      const gainR = ctx.createGain();
      gainR.gain.value = 0.08;

      // Left ear: 200 Hz carrier
      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.value = 200;
      oscL.connect(gainL);
      gainL.connect(merger, 0, 0);

      // Right ear: 204 Hz carrier → 4 Hz delta-wave beat
      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.value = 204;
      oscR.connect(gainR);
      gainR.connect(merger, 0, 1);

      oscL.start();
      oscR.start();
      oscillatorLeftRef.current = oscL;
      oscillatorRightRef.current = oscR;
    } catch (e) {
      console.error('Web Audio API not available:', e);
    }

    // Start 15-minute countdown
    let elapsed = 0;
    powerRestIntervalRef.current = setInterval(() => {
      elapsed += 1;
      const remaining = 15 * 60 - elapsed;
      setPowerRestSecondsLeft(remaining);

      if (remaining <= 0) {
        stopPowerRest();
      }
    }, 1000);
  }, []);

  const stopPowerRest = useCallback(() => {
    // Stop oscillators
    try {
      oscillatorLeftRef.current?.stop();
      oscillatorRightRef.current?.stop();
      audioContextRef.current?.close();
    } catch { /* already stopped */ }
    oscillatorLeftRef.current = null;
    oscillatorRightRef.current = null;
    audioContextRef.current = null;

    // Stop countdown
    if (powerRestIntervalRef.current) clearInterval(powerRestIntervalRef.current);
    powerRestIntervalRef.current = null;
    setActivePowerRest(false);
    setPowerRestSecondsLeft(15 * 60);
  }, []);

  // --- Focus Mode: 25-minute Pomodoro silent desk ---
  const startFocusMode = useCallback(() => {
    setActiveFocusMode(true);
    setFocusSecondsLeft(25 * 60);
    let elapsed = 0;
    focusIntervalRef.current = setInterval(() => {
      elapsed += 1;
      const remaining = 25 * 60 - elapsed;
      setFocusSecondsLeft(remaining);
      if (remaining <= 0) {
        stopFocusMode();
      }
    }, 1000);
  }, []);

  const stopFocusMode = useCallback(() => {
    if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
    focusIntervalRef.current = null;
    setActiveFocusMode(false);
    setFocusSecondsLeft(25 * 60);
  }, []);

  // --- Campus Essays (real content) ---
  const CAMPUS_ESSAYS = [
    {
      slug: 'sharma-ji-ka-beta',
      title: '"Sharma ji ka beta" Syndrome',
      subtitle: 'Separating self-worth from exam rankings',
      author: 'Rohan M., 2nd Year Engineering',
      readTime: '3 min read',
      body: `Every family WhatsApp group has that one uncle. "Sharma ji ka beta got AIR 247. What are you doing?" The message lands at 10 PM, right when you are finally getting into a study groove, and suddenly your brain switches from thermodynamics to existential crisis.

Here is what nobody tells you: Sharma ji ka beta is also stressed. He is also comparing himself to someone else. The comparison ladder has no top rung. I spent my entire first year chasing a rank that would make the dinner table conversations stop. It did not work. The goalpost moved — "Great, but Gupta ji ka beta got into IIM."

What actually helped was embarrassingly simple. I started writing down three things I learned each day. Not three achievements. Three things. "Understood Fourier transforms better." "Figured out why my code was segfaulting." "Learned that daal tastes better with extra butter." It sounds stupid, but it rewired my brain from measuring output to noticing input.

The comparison will not stop. Your parents mean well — in their world, comparison was motivation. But you get to decide what scoreboard you play on. Their scoreboard measures rank. Yours can measure curiosity, sleep quality, and how often you genuinely understood something versus just memorized it.

Next time the WhatsApp message lands, try this: read it, put the phone face down, and ask yourself "Aaj maine kya seekha?" — that is the only metric you actually control.`,
    },
    {
      slug: 'sleep-debt-hostel',
      title: 'The Hostel Sleep Debt Trap',
      subtitle: 'Why pulling all-nighters is borrowing from tomorrow',
      author: 'Priya S., Final Year MBBS',
      readTime: '3 min read',
      body: `Hostel culture glorifies the all-nighter. "Raat bhar padha" is worn like a badge of honor in the mess hall at 7 AM, dark circles and all. I did this for three semesters straight during MBBS. Here is what it actually cost me.

By third semester, I could not focus for more than 20 minutes. My reading speed dropped. I would read the same pathology paragraph four times and retain nothing. I was studying more hours than ever and learning less than ever. The math was simple — I was borrowing cognitive capacity from tomorrow to feel productive tonight.

The science is not complicated. Sleep is when your hippocampus consolidates short-term memories into long-term storage. Skip it, and you are essentially studying into a bucket with a hole in the bottom. Eight hours of focused study with seven hours of sleep beats twelve hours of zombie revision with four hours of broken sleep. Every single time.

What changed for me: I set a hard 11:30 PM cutoff. Phone on airplane mode, lights off. The first two weeks felt like I was "falling behind" — everyone else in the hostel was still awake, still grinding. By week three, I was finishing my study targets by 9 PM because my daytime focus had doubled.

The hostel peer pressure is real. When your roommate is studying at 2 AM, sleeping feels like quitting. It is not. Sleeping is the single highest-ROI activity for exam performance. Your brain literally cannot form memories without it.

Ek experiment try karo: next 5 days, sleep by 11:30. Track how much you actually retain. You will not go back.`,
    },
  ];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      if (powerRestIntervalRef.current) clearInterval(powerRestIntervalRef.current);
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
      try {
        oscillatorLeftRef.current?.stop();
        oscillatorRightRef.current?.stop();
        audioContextRef.current?.close();
      } catch { /* noop */ }
    };
  }, []);

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'breath') {
      startBreathing();
    } else if (actionId === 'vent') {
      onNavigate?.(Screen.CHAT);
    } else if (actionId === 'consult') {
      onNavigate?.(Screen.LIVE);
    } else if (actionId === 'nap') {
      startPowerRest();
    }
  };

  // 4. Module click logic
  const handleModuleClick = async (module: HealthModule) => {
    const win = window as any;
    if (win.aistudio) {
      try {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) await win.aistudio.openSelectKey();
      } catch (e) {
        console.error('API Key selection error:', e);
      }
    }

    setActiveModule(module);
    setLoadingModule(true);
    setModuleContent(null);
    setGenStatus('Reviewing clinical & traditional evidence...');

    try {
      const text = await generateHealthLesson(module.topic, module.perspective);
      setModuleContent({ text });

      setGenStatus('Synthesizing visual anatomical guide...');
      generateHealingImage(
        `Clear textbook medical diagram illustrating ${module.topic} from ${module.perspective} perspective. Clean annotations, neutral academic style.`,
        '16:9'
      )
        .then((img) => setModuleContent((prev) => ({ ...prev!, image: img })))
        .catch((e) => console.error('Image gen failed', e));

      setGenStatus('Preparing brief demonstration video...');
      generateRelaxationVideo(
        `Calm educational demonstration of ${module.topic} using ${module.perspective} guidelines for Indian students.`
      )
        .then((vid) => setModuleContent((prev) => ({ ...prev!, video: vid })))
        .catch((e) => console.error('Video gen failed', e));
    } catch (e) {
      console.error('Module generation failed', e);
      setModuleContent({ text: 'Could not load the module lesson right now. Please try again shortly.' });
    } finally {
      setLoadingModule(false);
      setGenStatus('');
    }
  };

  return (
    <div className="space-y-8 pb-20 text-kora">
      
      {/* 1. QUIET CONTEXTUAL BANNER (No loud wallpaper gradients) */}
      {(showNudge || isGeneratingNudge) && (
        <aside
          role="region"
          aria-label="Daily reflection notice"
          className="bg-cardSlate border border-cardBorder rounded-xl p-4 flex items-start justify-between gap-3 text-sm text-kora shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-terracotta mt-2 shrink-0"></span>
            <div>
              <p className="font-hindi text-sm text-kora/95 leading-relaxed">
                {isGeneratingNudge ? 'Updating reflection...' : nudge}
              </p>
            </div>
          </div>
          {!isGeneratingNudge && (
            <button
              onClick={() => setShowNudge(false)}
              className="text-pencil hover:text-kora p-1 transition-colors rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta"
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          )}
        </aside>
      )}

      {/* 2. THE ONE BOLD MOMENT: VIBE CHECK BATTERY (Daily Ritual) */}
      <section aria-labelledby="vibe-check-heading" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-cardSlate border border-cardBorder rounded-2xl p-6 sm:p-7 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-5 border-b border-cardBorder">
              <div>
                <h1 id="vibe-check-heading" className="text-xl sm:text-2xl font-bold font-hindi text-kora tracking-tight">
                  Kaisa lag raha hai aaj?
                </h1>
                <p className="text-xs sm:text-sm text-pencil font-hindi mt-1">
                  No tests, no scores. Just an honest daily check on your battery.
                </p>
              </div>

              {/* Segmented battery gauge */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-midnight/70 px-3 py-1.5 rounded-lg border border-cardBorder">
                <span className="text-[11px] font-mono text-pencil uppercase tracking-wider mr-1">Battery</span>
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const isActive = selectedMood !== null ? lvl <= selectedMood : lvl <= 3;
                  return (
                    <div
                      key={lvl}
                      className={`w-2.5 h-4 rounded-xs transition-colors ${
                        isActive
                          ? lvl <= 2
                            ? 'bg-terracotta'
                            : lvl === 3
                            ? 'bg-amber-400'
                            : 'bg-neem-light'
                          : 'bg-cardBorder'
                      }`}
                      aria-hidden="true"
                    />
                  );
                })}
              </div>
            </div>

            {/* 5 Mood Option Buttons with explicit labels */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-6">
              {MOOD_OPTIONS.map((opt) => {
                const isSelected = selectedMood === opt.level;
                return (
                  <button
                    key={opt.level}
                    onClick={() => handleMoodClick(opt.level)}
                    className={`group flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-xl border transition-all text-center min-h-[92px] sm:min-h-[105px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-midnight active:scale-95 motion-reduce:transform-none cursor-pointer ${
                      isSelected
                        ? 'bg-terracotta/15 border-terracotta text-kora shadow-sm'
                        : 'bg-midnight/40 border-cardBorder hover:border-cardBorder/90 hover:bg-midnight/70 text-pencil hover:text-kora'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="text-2xl sm:text-3xl select-none group-hover:scale-110 transition-transform duration-150 motion-reduce:transform-none">
                      {opt.emoji}
                    </span>
                    <div className="mt-2 w-full truncate">
                      <span className="block text-[11px] sm:text-xs font-semibold font-hindi text-kora/90 truncate">
                        {opt.labelHindi}
                      </span>
                      <span className="hidden sm:block text-[10px] text-pencil truncate">
                        {opt.labelEn}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-cardBorder/60 flex items-center justify-between text-xs text-pencil">
            <span className="font-hindi text-[11px]">
              {selectedMood
                ? `Selected: ${MOOD_OPTIONS.find((m) => m.level === selectedMood)?.desc}`
                : 'Tap an emoji to log your daily reflection'}
            </span>
            {moodSavedToast && (
              <span className="text-emerald-400 font-bold text-[11px] animate-fade-in flex items-center gap-1">
                ✓ Recorded in vault
              </span>
            )}
          </div>
        </div>

        {/* 3. QUICK COPING ACTIONS (Distinct functional icons, no lightning bolts everywhere) */}
        <div className="bg-cardSlate border border-cardBorder rounded-2xl p-5 sm:p-6 shadow-md flex flex-col justify-between">
          <div className="pb-3 border-b border-cardBorder">
            <h2 className="text-base font-bold text-kora font-hindi">Quick Resets</h2>
            <p className="text-xs text-pencil mt-0.5">Calm tools for instant hostel or desk relief</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 my-3">
            {QUICK_ACTIONS.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleQuickAction(item.id)}
                  className="p-3 rounded-xl border border-cardBorder bg-midnight/30 hover:bg-midnight/70 hover:border-cardBorder/90 flex items-center justify-between group transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-cardSlate border border-cardBorder text-pencil group-hover:text-terracotta shrink-0 transition-colors">
                      <IconComponent size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-kora group-hover:text-terracotta-light transition-colors truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-pencil truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-pencil group-hover:text-kora group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-pencil/80 pt-2 border-t border-cardBorder/60">
            Emergency helpline: Dial <a href="tel:14416" className="underline hover:text-kora">14416</a> (Tele-MANAS)
          </p>
        </div>
      </section>

      {/* 4. ACTIVE BREATHING EXERCISE — Full-screen guided overlay */}
      {activeBreathing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Box breathing exercise"
          className="fixed inset-0 z-[100] bg-midnight/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
        >
          {/* Expanding / contracting circle */}
          <div className="relative flex items-center justify-center mb-8">
            <div
              className="rounded-full border-2 border-terracotta/60 transition-all ease-in-out motion-reduce:transition-none"
              style={{
                width: breathPhase === 'Inhale' ? 200 : breathPhase === 'Exhale' ? 80 : breathPhase === 'Hold' ? 200 : 80,
                height: breathPhase === 'Inhale' ? 200 : breathPhase === 'Exhale' ? 80 : breathPhase === 'Hold' ? 200 : 80,
                transitionDuration: '3800ms',
                backgroundColor: breathPhase === 'Inhale' || breathPhase === 'Hold'
                  ? 'rgba(216, 106, 56, 0.15)'
                  : 'rgba(216, 106, 56, 0.05)',
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono text-terracotta">{breathPhase}</span>
              <span className="text-xs text-pencil mt-1">
                {breathPhase === 'Inhale' && 'Breathe in through your nose'}
                {breathPhase === 'Hold' && 'Hold gently, do not strain'}
                {breathPhase === 'Exhale' && 'Slow release through mouth'}
                {breathPhase === 'Pause' && 'Rest before next cycle'}
              </span>
            </div>
          </div>

          {/* Countdown */}
          <div className="mb-6">
            <span className="text-4xl font-mono font-bold text-kora">{breathSecondsLeft}</span>
            <span className="text-sm text-pencil ml-1">sec remaining</span>
          </div>

          {/* Progress bar */}
          <div className="w-64 h-1.5 bg-cardBorder rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-1000"
              style={{ width: `${((60 - breathSecondsLeft) / 60) * 100}%` }}
            />
          </div>

          <p className="text-xs text-pencil max-w-xs mb-6">
            4-4-4-4 Box Breathing (Pranayama). Sit upright, shoulders relaxed. Exercise auto-ends at 0.
          </p>

          <button
            onClick={stopBreathing}
            className="px-5 py-2 rounded-lg bg-cardSlate border border-cardBorder text-kora text-sm font-semibold hover:bg-cardBorder/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
          >
            End Early
          </button>
        </div>
      )}

      {/* 4b. POWER REST OVERLAY — 15m delta-wave binaural timer */}
      {activePowerRest && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="15-minute power rest timer"
          className="fixed inset-0 z-[100] bg-midnight/98 flex flex-col items-center justify-center p-6 text-center"
        >
          {/* Gentle wave visualization */}
          <div className="relative mb-10">
            <div className="w-32 h-32 rounded-full border border-neem/30 flex items-center justify-center">
              <div
                className="w-20 h-20 rounded-full bg-neem/10 border border-neem/20 transition-all duration-[4000ms] ease-in-out motion-reduce:transition-none"
                style={{
                  transform: `scale(${1 + 0.3 * Math.sin((powerRestSecondsLeft % 8) * Math.PI / 4)})`,
                }}
              />
            </div>
            <Moon size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neem" />
          </div>

          {/* Timer */}
          <div className="mb-4">
            <span className="text-5xl font-mono font-bold text-kora tracking-wider">
              {String(Math.floor(powerRestSecondsLeft / 60)).padStart(2, '0')}
              <span className="text-pencil">:</span>
              {String(powerRestSecondsLeft % 60).padStart(2, '0')}
            </span>
          </div>

          <h3 className="text-lg font-bold text-kora font-hindi mb-1">Power Rest</h3>
          <p className="text-xs text-pencil max-w-sm mb-2">
            Delta-wave binaural tone (200 Hz / 204 Hz → 4 Hz beat) playing through your headphones.
            Close your eyes and let the low-frequency pulse ease your mind into rest.
          </p>
          <p className="text-[11px] text-amber-400/80 mb-8">
            🎧 Headphones required for binaural effect
          </p>

          {/* Progress bar */}
          <div className="w-72 h-1 bg-cardBorder rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-neem rounded-full transition-all duration-1000"
              style={{ width: `${((15 * 60 - powerRestSecondsLeft) / (15 * 60)) * 100}%` }}
            />
          </div>

          <button
            onClick={stopPowerRest}
            className="px-5 py-2 rounded-lg bg-cardSlate border border-cardBorder text-kora text-sm font-semibold hover:bg-cardBorder/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
          >
            End Power Rest
          </button>
        </div>
      )}

      {/* 5. THREE PERSPECTIVES ON STRESS & RECOVERY (Allopathy, Ayurveda, Yoga) */}
      <section aria-labelledby="perspectives-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h2 id="perspectives-heading" className="text-lg font-bold text-kora font-hindi">
              Three Angles on Stress & Recovery
            </h2>
            <p className="text-xs text-pencil mt-0.5">
              MBBS neuroscience, classical Ayurveda, and Yogic breathwork compared
            </p>
          </div>
          <span className="text-[11px] font-mono text-pencil self-start sm:self-auto">
            Evidence & Tradition
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HEALTH_MODULES.map((mod, idx) => {
            const IconComponent = mod.icon;
            return (
              <div
                key={idx}
                onClick={() => handleModuleClick(mod)}
                className={`bg-cardSlate border border-cardBorder ${mod.borderColor} border-l-4 rounded-xl p-5 hover:border-cardBorder/90 transition-all cursor-pointer group flex flex-col justify-between min-h-[190px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta shadow-sm`}
                tabIndex={0}
                role="button"
                aria-label={`Open ${mod.perspective} guide on ${mod.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick(mod);
                  }
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${mod.badgeBg} ${mod.badgeText}`}>
                      {mod.tag}
                    </span>
                    <IconComponent size={18} className="text-pencil group-hover:text-kora transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-kora leading-snug group-hover:text-terracotta-light transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-pencil mt-2 line-clamp-3 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-cardBorder/60 flex items-center justify-between text-xs font-semibold text-pencil group-hover:text-kora transition-colors">
                  <span>Explore Approach</span>
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CAMPUS VOICES & STUDY DESKS (Student Stream) */}
      <section aria-labelledby="campus-voices-heading" className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 id="campus-voices-heading" className="text-lg font-bold text-kora font-hindi">
              Campus Voices & Study Desks
            </h2>
            <p className="text-xs text-pencil mt-0.5">
              Reflections on competitive exam pressure, sleep debt, and expectations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1 — Exam Panic Breathing (wired to the real breathing timer) */}
          <article
            onClick={startBreathing}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startBreathing(); } }}
            className="bg-cardSlate border border-cardBorder rounded-xl p-5 flex flex-col justify-between min-h-[220px] group shadow-sm cursor-pointer hover:border-cardBorder/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-pencil mb-2.5">
                <span className="px-2 py-0.5 rounded bg-midnight border border-cardBorder text-pencil">
                  Breathing Tool &bull; 60s
                </span>
                <Wind size={14} className="text-pencil group-hover:text-terracotta transition-colors" />
              </div>
              <h3 className="text-base font-bold text-kora leading-snug group-hover:text-terracotta-light transition-colors">
                Exam Hall Panic: Box Breathing Reset
              </h3>
              <p className="text-xs text-pencil mt-2 line-clamp-2 leading-relaxed">
                4-4-4-4 guided Pranayama to slow tachycardia and regain focus before a paper.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-cardBorder/60 flex items-center justify-between text-xs font-semibold text-pencil group-hover:text-kora transition-colors">
              <span className="flex items-center gap-1.5 text-terracotta">
                <Play size={13} fill="currentColor" /> Start 60s Breathing
              </span>
              <span className="text-[11px] font-mono text-pencil">Interactive</span>
            </div>
          </article>

          {/* Card 2 & 3 — Student Essays (data-driven from CAMPUS_ESSAYS) */}
          {CAMPUS_ESSAYS.map((essay, idx) => (
            <article
              key={essay.slug}
              onClick={() => setActiveEssayIndex(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveEssayIndex(idx); } }}
              className="bg-cardSlate border border-cardBorder rounded-xl p-5 flex flex-col justify-between min-h-[220px] group shadow-sm cursor-pointer hover:border-cardBorder/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-pencil mb-2.5">
                  <span className="px-2 py-0.5 rounded bg-midnight border border-cardBorder text-pencil">
                    Campus Essay &bull; {essay.readTime}
                  </span>
                  <span className="font-hindi text-pencil">{essay.author.split(',')[0]}</span>
                </div>
                <h3 className="text-base font-bold text-kora leading-snug group-hover:text-terracotta-light transition-colors">
                  {essay.title}
                </h3>
                <p className="text-xs text-pencil mt-2 line-clamp-2 leading-relaxed">
                  {essay.subtitle}
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-cardBorder/60 flex items-center justify-between text-xs font-semibold text-pencil group-hover:text-kora transition-colors">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={13} /> Read Essay
                </span>
                <span className="text-[11px] font-mono text-pencil">Reflection</span>
              </div>
            </article>
          ))}

        </div>

        {/* Focus Mode Card (below the grid — full width, replaces fake "Quiet Room Live") */}
        <div className="bg-cardSlate border border-cardBorder rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-midnight border border-cardBorder text-neem shrink-0">
              <Timer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-kora">Focus Mode &mdash; 25-Minute Silent Desk</h3>
              <p className="text-xs text-pencil mt-0.5">
                Distraction-free Pomodoro timer. No fake social counts, just you and a countdown.
              </p>
            </div>
          </div>
          <button
            onClick={startFocusMode}
            className="px-4 py-2 rounded-lg bg-midnight border border-cardBorder text-kora text-xs font-bold hover:border-cardBorder/90 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
          >
            Start Focus Timer &rarr;
          </button>
        </div>
      </section>

      {/* 7. HEALTH MODULE DETAIL MODAL (Calm, structured, non-gradient) */}
      {activeModule && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-cardSlate border border-cardBorder w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-cardBorder flex items-start justify-between gap-4 bg-midnight/50">
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border mb-2 ${activeModule.badgeBg} ${activeModule.badgeText}`}>
                  {activeModule.tag}
                </span>
                <h2 id="modal-title" className="text-xl font-bold text-kora flex items-center gap-2">
                  <activeModule.icon size={22} className="text-pencil shrink-0" />
                  <span>{activeModule.title}</span>
                </h2>
                <p className="text-xs text-pencil mt-1">{activeModule.description}</p>
              </div>
              <button
                onClick={() => setActiveModule(null)}
                className="p-1.5 rounded-lg bg-midnight border border-cardBorder text-pencil hover:text-kora transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {loadingModule ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3 text-center">
                  <Loader2 size={36} className="text-terracotta animate-spin" />
                  <p className="font-semibold text-sm text-kora">{genStatus}</p>
                  <p className="text-xs text-pencil">Compiling clinical & traditional synthesis...</p>
                </div>
              ) : moduleContent ? (
                <div className="space-y-6 text-kora">
                  
                  {/* Visual Guide */}
                  <div className="bg-midnight rounded-xl overflow-hidden border border-cardBorder min-h-[180px] flex items-center justify-center relative">
                    {moduleContent.image ? (
                      <img src={moduleContent.image} alt="Medical anatomical illustration" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-6 flex flex-col items-center text-pencil">
                        <ImageIcon size={28} className="mb-2 text-pencil/60" />
                        <span className="text-xs">Generating anatomical synthesis...</span>
                        <Loader2 size={16} className="animate-spin mt-2 text-terracotta" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-midnight/80 border border-cardBorder text-pencil text-[10px] px-2 py-0.5 rounded">
                      Synthesized Medical Flowchart
                    </div>
                  </div>

                  {/* Text Lesson */}
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-kora/90 leading-relaxed space-y-2 bg-midnight/40 p-4 rounded-xl border border-cardBorder">
                    {moduleContent.text}
                  </div>

                  {/* Video Guide */}
                  {moduleContent.video && (
                    <div className="bg-midnight rounded-xl overflow-hidden aspect-video relative border border-cardBorder">
                      <video src={moduleContent.video} controls className="w-full h-full object-cover" />
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-10 text-xs text-pencil">
                  Content could not be loaded at this time.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-midnight/60 border-t border-cardBorder flex items-center justify-between text-xs text-pencil">
              <span>Confidential medical & yogic reference</span>
              <button
                onClick={() => setActiveModule(null)}
                className="px-4 py-1.5 rounded-lg bg-cardSlate border border-cardBorder text-kora font-semibold hover:bg-cardBorder/40 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
      {/* 8. ESSAY READER MODAL */}
      {activeEssayIndex !== null && CAMPUS_ESSAYS[activeEssayIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="essay-title"
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-cardSlate border border-cardBorder w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
            {/* Essay Header */}
            <div className="p-5 sm:p-6 border-b border-cardBorder flex items-start justify-between gap-4 bg-midnight/50">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border bg-midnight border-cardBorder text-pencil mb-2">
                  {CAMPUS_ESSAYS[activeEssayIndex].readTime}
                </span>
                <h2 id="essay-title" className="text-xl font-bold text-kora flex items-center gap-2">
                  <BookOpen size={20} className="text-pencil shrink-0" />
                  <span>{CAMPUS_ESSAYS[activeEssayIndex].title}</span>
                </h2>
                <p className="text-xs text-pencil mt-1">
                  by {CAMPUS_ESSAYS[activeEssayIndex].author}
                </p>
              </div>
              <button
                onClick={() => setActiveEssayIndex(null)}
                className="p-1.5 rounded-lg bg-midnight border border-cardBorder text-pencil hover:text-kora transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
                aria-label="Close essay"
              >
                <X size={18} />
              </button>
            </div>

            {/* Essay Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="whitespace-pre-wrap font-sans text-sm text-kora/90 leading-relaxed bg-midnight/40 p-5 rounded-xl border border-cardBorder">
                {CAMPUS_ESSAYS[activeEssayIndex].body}
              </div>
            </div>

            {/* Essay Footer */}
            <div className="p-4 bg-midnight/60 border-t border-cardBorder flex items-center justify-between text-xs text-pencil">
              <span>Campus Voices &bull; Student Reflection</span>
              <button
                onClick={() => setActiveEssayIndex(null)}
                className="px-4 py-1.5 rounded-lg bg-cardSlate border border-cardBorder text-kora font-semibold hover:bg-cardBorder/40 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. FOCUS MODE OVERLAY — 25-minute Pomodoro timer */}
      {activeFocusMode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Focus mode timer"
          className="fixed inset-0 z-[100] bg-midnight/98 flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="mb-10">
            <div className="w-28 h-28 rounded-full border-2 border-neem/30 flex items-center justify-center">
              <Timer size={32} className="text-neem" />
            </div>
          </div>

          {/* Timer */}
          <div className="mb-4">
            <span className="text-5xl font-mono font-bold text-kora tracking-wider">
              {String(Math.floor(focusSecondsLeft / 60)).padStart(2, '0')}
              <span className="text-pencil">:</span>
              {String(focusSecondsLeft % 60).padStart(2, '0')}
            </span>
          </div>

          <h3 className="text-lg font-bold text-kora font-hindi mb-1">Focus Mode</h3>
          <p className="text-xs text-pencil max-w-sm mb-8">
            25-minute silent study session. Close your eyes, put on headphones, and study without distraction.
            The timer will chime when your session ends.
          </p>

          {/* Progress bar */}
          <div className="w-72 h-1 bg-cardBorder rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-neem rounded-full transition-all duration-1000"
              style={{ width: `${((25 * 60 - focusSecondsLeft) / (25 * 60)) * 100}%` }}
            />
          </div>

          <button
            onClick={stopFocusMode}
            className="px-5 py-2 rounded-lg bg-cardSlate border border-cardBorder text-kora text-sm font-semibold hover:bg-cardBorder/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta cursor-pointer"
          >
            End Focus Session
          </button>
        </div>
      )}

    </div>
  );
};

export default MindSetFeed;
