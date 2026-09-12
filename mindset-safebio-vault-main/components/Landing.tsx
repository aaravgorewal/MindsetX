import React, { useState } from 'react';
import { 
  Shield, 
  MessageSquare, 
  HeartPulse, 
  CloudSun, 
  Lock, 
  UserCheck, 
  PhoneCall, 
  CheckCircle2, 
  ArrowDown, 
  EyeOff, 
  ShieldCheck, 
  Thermometer, 
  Wind,
  Loader2,
  ChevronRight,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'sentinel' | 'sdoh' | 'vault' | 'care'>('chat');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleGetStarted = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    // Smooth transition before switching view
    setTimeout(() => {
      onGetStarted();
    }, 450);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div 
      className={`fixed inset-0 overflow-y-auto overflow-x-hidden scroll-smooth bg-[#0A0D12] text-[#F0F4F8] font-sans antialiased selection:bg-[#2A9D8F]/30 selection:text-white transition-all duration-500 ease-out ${
        isTransitioning ? 'opacity-0 scale-[0.985] blur-xs pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      
      {/* Ambient background depth lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle teal radial illumination */}
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[550px] bg-[#2A9D8F]/12 rounded-full blur-[150px] animate-pulse-slow" />
        {/* Subtle warm ember ambient glow */}
        <div className="absolute top-[40%] right-[-12%] w-[550px] h-[550px] bg-[#D86A38]/6 rounded-full blur-[150px]" />
        {/* Architectural precision micro grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#F0F4F8 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* 1. Header */}
      <header className="w-full border-b border-white/[0.08] bg-[#0A0D12]/80 sticky top-0 z-40 backdrop-blur-xl transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#161E28] to-[#0E141D] border border-white/10 flex items-center justify-center shadow-inner group-hover:border-[#2A9D8F]/50 transition-colors">
              <Shield size={18} className="text-[#2A9D8F] group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                MindSetX
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </span>
              <span className="text-[10px] text-[#8A96A6] font-medium hidden sm:inline -mt-0.5">
                Student Mental Health Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-[#8A96A6]">
            <button onClick={() => scrollToSection('capabilities')} className="hover:text-white transition-colors cursor-pointer">
              Capabilities
            </button>
            <button onClick={() => scrollToSection('privacy')} className="hover:text-white transition-colors cursor-pointer">
              Privacy & Ethics
            </button>
            <button onClick={() => scrollToSection('crisis')} className="hover:text-white transition-colors cursor-pointer">
              Crisis Helpline
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGetStarted}
              disabled={isTransitioning}
              className="px-4 py-2 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all shadow-[0_0_15px_rgba(42,157,143,0.25)] hover:shadow-[0_0_22px_rgba(42,157,143,0.45)] cursor-pointer flex items-center gap-2"
            >
              {isTransitioning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Opening...</span>
                </>
              ) : (
                <span>Get Started</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 sm:py-20 space-y-32">
        
        {/* 2. Hero Section */}
        <section className="space-y-8 max-w-4xl pt-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#8A96A6] backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A9D8F] animate-pulse" />
            <span>Built for Indian Higher Education • Free, Anonymous & Encrypted</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl sm:leading-[1.12] font-normal text-white tracking-tight">
            Mental health support built for Indian students.
          </h1>

          <p className="text-base sm:text-xl text-[#8A96A6] leading-relaxed font-normal max-w-2xl">
            An anonymous, culturally grounded space to talk through academic burnout, track emotional and physical strain, and consult verified care professionals.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={handleGetStarted}
              disabled={isTransitioning}
              className="group relative px-7 py-3.5 rounded-xl bg-[#2A9D8F] hover:bg-[#238276] active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-[0_4px_20px_rgba(42,157,143,0.35)] hover:shadow-[0_6px_30px_rgba(42,157,143,0.55)] cursor-pointer flex items-center gap-2.5 overflow-hidden"
            >
              {isTransitioning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Opening MindSet Portal...</span>
                </>
              ) : (
                <>
                  <span>Get Started</span>
                  <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
            <button
              onClick={() => scrollToSection('capabilities')}
              className="px-5 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 active:scale-[0.98] text-white text-sm font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Platform Systems</span>
              <ArrowDown size={14} className="text-[#8A96A6]" />
            </button>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs text-[#8A96A6]">
              <EyeOff size={15} className="text-[#2A9D8F] shrink-0" />
              <span>Zero roll number or identity tracking</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8A96A6]">
              <Lock size={15} className="text-[#2A9D8F] shrink-0" />
              <span>On-device PIN & biometric encryption</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8A96A6]">
              <PhoneCall size={15} className="text-[#D86A38] shrink-0" />
              <span>Direct Tele-MANAS 14416 crisis routing</span>
            </div>
          </div>
        </section>

        {/* 3. Core Capabilities Section (Interactive System Showcase) */}
        <section id="capabilities" className="space-y-10 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                What MindSetX does
              </h2>
              <p className="text-sm text-[#8A96A6]">
                Five concrete subsystems addressing student distress from late-night conversation to clinical intervention.
              </p>
            </div>

            {/* Subsystem tabs with active indicator */}
            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-[#12171F] border border-white/[0.08] shadow-inner">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'chat' 
                    ? 'bg-[#2A9D8F] text-white shadow-[0_2px_10px_rgba(42,157,143,0.3)]' 
                    : 'text-[#8A96A6] hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Hinglish Chat
              </button>
              <button
                onClick={() => setActiveTab('sentinel')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'sentinel' 
                    ? 'bg-[#2A9D8F] text-white shadow-[0_2px_10px_rgba(42,157,143,0.3)]' 
                    : 'text-[#8A96A6] hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                AI Sentinel
              </button>
              <button
                onClick={() => setActiveTab('sdoh')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'sdoh' 
                    ? 'bg-[#2A9D8F] text-white shadow-[0_2px_10px_rgba(42,157,143,0.3)]' 
                    : 'text-[#8A96A6] hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                SDoH Engine
              </button>
              <button
                onClick={() => setActiveTab('vault')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'vault' 
                    ? 'bg-[#2A9D8F] text-white shadow-[0_2px_10px_rgba(42,157,143,0.3)]' 
                    : 'text-[#8A96A6] hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Bio-Vault
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'care' 
                    ? 'bg-[#2A9D8F] text-white shadow-[0_2px_10px_rgba(42,157,143,0.3)]' 
                    : 'text-[#8A96A6] hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Care Clinic
              </button>
            </div>
          </div>

          {/* Active Featured Showcase Card */}
          <div className="rounded-2xl bg-[#12171F]/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Background accent wash */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#2A9D8F]/5 rounded-full blur-[100px] pointer-events-none" />

            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 text-[#2A9D8F] text-xs font-semibold">
                    <MessageSquare size={14} />
                    <span>Linguistic & Cultural Comfort</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Talk through late-night anxiety, exam panic, or hostel isolation in everyday Hinglish without fear of judgment.
                  </h3>
                  <p className="text-sm text-[#8A96A6] leading-relaxed">
                    Most Indian students think in a natural blend of Hindi and English. MindSet AI doesn't demand stiff clinical terminology — it understands colloquial hostel distress, parental expectations, and academic guilt, completely anonymous with no conversational logging.
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs text-[#8A96A6]">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> Zero Identity Logs
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> Natural Hinglish
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> 24/7 Available
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#0A0D12] rounded-xl border border-white/10 p-5 space-y-3.5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs text-[#8A96A6]">
                    <span className="font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Anonymous Chat Session
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px]">Private Enclave</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-white/[0.04] text-white/90 max-w-[88%] ml-auto text-right border border-white/[0.06] shadow-sm">
                      Raat ke 2:30 baj rahe hain. Syllabus khatam nahi ho raha, dimag blank ho raha hai.
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#161E28] text-white/95 max-w-[92%] border border-[#2A9D8F]/30 space-y-1.5 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#2A9D8F] font-semibold flex items-center gap-1">
                          <Sparkles size={11} /> MindSet Companion
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-[#2A9D8F] animate-ping" />
                          <span className="text-[9px] text-[#8A96A6]">Real-time</span>
                        </div>
                      </div>
                      <p className="leading-relaxed text-slate-200">
                        Syllabus kitna bhi bada ho, panic mein memory retain nahi hoti. Abhi 20 minute ke liye books band karo. Let’s do a 60s box breathing cycle and protect tomorrow’s stamina.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sentinel' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 text-[#2A9D8F] text-xs font-semibold">
                    <HeartPulse size={14} />
                    <span>Clinical Risk Monitoring</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Screens for depressive symptoms using standardized PHQ-9 baselines and routes to immediate support when needed.
                  </h3>
                  <p className="text-sm text-[#8A96A6] leading-relaxed">
                    AI Sentinel tracks longitudinal sentiment shifts across your daily entries. If severe distress or suicide risk patterns are flagged, the platform suppresses non-essential notifications and quietly arms a direct connection to Tele-MANAS (14416).
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs text-[#8A96A6]">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> PHQ-9 Baseline
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> Behavioral Flagging
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#D86A38]" /> Tele-MANAS 14416
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#0A0D12] rounded-xl border border-white/10 p-5 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs text-[#8A96A6]">
                    <span className="font-mono flex items-center gap-2">
                      <Activity size={14} className="text-emerald-400" /> Sentinel Triage Readout
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px]">Calibrated</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs text-[#8A96A6]">PHQ-9 Baseline Score</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">6 / 27 (Mild Strain)</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs text-[#8A96A6]">Cognitive Sentiment Trend</span>
                      <span className="text-xs font-mono font-bold text-white">7-Day Moving Baseline</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[#D86A38]/10 border border-[#D86A38]/30 flex items-center justify-between">
                      <span className="text-xs text-[#D86A38] font-semibold flex items-center gap-1.5">
                        <PhoneCall size={12} /> Acute Crisis Bridge
                      </span>
                      <span className="text-xs font-mono font-bold text-white">Tele-MANAS 14416</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sdoh' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 text-[#2A9D8F] text-xs font-semibold">
                    <CloudSun size={14} />
                    <span>Social & Environmental Determinants</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Examines whether local air pollution, heat waves, or seasonal illness are draining your physical energy.
                  </h3>
                  <p className="text-sm text-[#8A96A6] leading-relaxed">
                    Students frequently blame themselves for lethargy and poor retention when severe particulate pollution (PM2.5) or heat stress is impairing cognitive function. MindSetX cross-correlates your local AQI and climate metrics with fatigue check-ins.
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs text-[#8A96A6]">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> Real-time AQI Correlation
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> Thermal Strain Multiplier
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#0A0D12] rounded-xl border border-white/10 p-5 space-y-3.5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs text-[#8A96A6]">
                    <span className="font-mono flex items-center gap-2">
                      <Wind size={14} className="text-amber-400" /> SDoH Environmental Telemetry
                    </span>
                    <span className="text-amber-400 font-mono text-[11px]">Live Sensor Sync</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1">
                      <div className="flex items-center gap-1.5 text-[#8A96A6] text-[11px]">
                        <Wind size={12} className="text-amber-400" /> Local AQI
                      </div>
                      <div className="text-sm font-mono font-bold text-amber-400">284 PM2.5</div>
                      <div className="text-[10px] text-[#8A96A6]">Very Unhealthy Air</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1">
                      <div className="flex items-center gap-1.5 text-[#8A96A6] text-[11px]">
                        <Thermometer size={12} className="text-rose-400" /> Temperature
                      </div>
                      <div className="text-sm font-mono font-bold text-rose-400">41°C Heatwave</div>
                      <div className="text-[10px] text-[#8A96A6]">Thermal Fatigue Factor</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px] text-[#8A96A6]">
                    <strong className="text-white">Clinical Insight:</strong> 42% of reported cognitive brain fog correlates directly with atmospheric particulate spikes rather than personal insufficiency.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vault' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 text-[#2A9D8F] text-xs font-semibold">
                    <Lock size={14} />
                    <span>Encrypted Bio-Vault</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Stores prescriptions, lab reports, and daily mood entries under client-side PIN and biometric protection.
                  </h3>
                  <p className="text-sm text-[#8A96A6] leading-relaxed">
                    Your personal health records are locked behind an on-device app lock. Includes simulated ABDM ABHA sandbox interoperability and voluntary, time-bounded consent controls for clinical consults.
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs text-[#8A96A6]">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> Local PIN / Face Lock
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> ABDM Sandbox Protocol
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> Revocable Consent
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#0A0D12] rounded-xl border border-white/10 p-5 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs text-[#8A96A6]">
                    <span className="font-mono flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400" /> Vault Security Ledger
                    </span>
                    <span className="text-emerald-400 text-[11px] font-mono">Secured</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex justify-between items-center">
                      <span className="text-[#8A96A6]">Encrypted Records</span>
                      <span className="font-mono text-white">VCF, Lab Reports, Mood Log</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex justify-between items-center">
                      <span className="text-[#8A96A6]">ABDM Sandbox Protocol</span>
                      <span className="font-mono text-white">Simulated ABHA Interop</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex justify-between items-center">
                      <span className="text-[#8A96A6]">Consent Model</span>
                      <span className="font-mono text-emerald-400">Strictly Time-Bounded</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'care' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 text-[#2A9D8F] text-xs font-semibold">
                    <UserCheck size={14} />
                    <span>Human Clinical Network</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Book confidential sessions with licensed psychiatrists, clinical psychologists, and trained student peer counselors.
                  </h3>
                  <p className="text-sm text-[#8A96A6] leading-relaxed">
                    AI is a companion, not a replacement for human medicine. When self-guided resets and journaling aren't enough, seamlessly book verified specialists for 1-on-1 tele-consultations with full consent controls over what data you share.
                  </p>
                  <div className="pt-2 flex items-center gap-4 text-xs text-[#8A96A6]">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> MBBS / MD Psychiatrists
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> RCI Clinical Psychologists
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <CheckCircle2 size={14} className="text-[#2A9D8F]" /> Verified Peers
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#0A0D12] rounded-xl border border-white/10 p-5 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs text-[#8A96A6]">
                    <span className="font-mono">Care Network Directory</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Verified Credentials</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex justify-between items-center hover:border-white/20 transition-colors">
                      <div>
                        <div className="font-semibold text-white">Psychiatrist Consult</div>
                        <div className="text-[10px] text-[#8A96A6]">MD / DNB Clinical Diagnosis</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">Available</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex justify-between items-center hover:border-white/20 transition-colors">
                      <div>
                        <div className="font-semibold text-white">Clinical Psychology</div>
                        <div className="text-[10px] text-[#8A96A6]">CBT & Somatic Grounding</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">Available</span>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] flex justify-between items-center hover:border-white/20 transition-colors">
                      <div>
                        <div className="font-semibold text-white">Trained Peer Support</div>
                        <div className="text-[10px] text-[#8A96A6]">Hostel & Exam Experience</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">Available</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* 4. Privacy & Data Ethics Section */}
        <section id="privacy" className="space-y-8 border-t border-white/[0.08] pt-20 scroll-mt-24">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Privacy and data ethics
            </h2>
            <p className="text-sm text-[#8A96A6]">
              Health data requires an uncompromising standard of responsibility. Here is how your information is safeguarded.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-6 rounded-2xl bg-[#12171F]/80 border border-white/[0.08] hover:border-[#2A9D8F]/40 transition-all space-y-3 group hover:shadow-lg hover:shadow-[#2A9D8F]/5">
              <div className="w-10 h-10 rounded-xl bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 flex items-center justify-center text-[#2A9D8F] group-hover:scale-110 transition-transform">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Client-side security</h3>
              <p className="text-xs text-[#8A96A6] leading-relaxed">
                Your chat logs, biometric data, and health vault documents are encrypted on your device behind your personal PIN and biometric scan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#12171F]/80 border border-white/[0.08] hover:border-[#2A9D8F]/40 transition-all space-y-3 group hover:shadow-lg hover:shadow-[#2A9D8F]/5">
              <div className="w-10 h-10 rounded-xl bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 flex items-center justify-center text-[#2A9D8F] group-hover:scale-110 transition-transform">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Zero commercialization</h3>
              <p className="text-xs text-[#8A96A6] leading-relaxed">
                We do not sell user records, display behavioral advertisements, or utilize your confidential health conversations to train public machine learning algorithms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#12171F]/80 border border-white/[0.08] hover:border-[#2A9D8F]/40 transition-all space-y-3 group hover:shadow-lg hover:shadow-[#2A9D8F]/5">
              <div className="w-10 h-10 rounded-xl bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 flex items-center justify-center text-[#2A9D8F] group-hover:scale-110 transition-transform">
                <EyeOff size={20} />
              </div>
              <h3 className="text-base font-semibold text-white">Campus independence</h3>
              <p className="text-xs text-[#8A96A6] leading-relaxed">
                MindSetX is entirely separate from university administrations, coaching institutes, and family members. Your activity is never reported.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Final CTA & Crisis Helpline */}
        <section id="crisis" className="border-t border-white/[0.08] pt-20 pb-12 space-y-8 text-center flex flex-col items-center scroll-mt-24">
          <div className="space-y-3 max-w-md">
            <h2 className="text-3xl sm:text-4xl font-serif text-white font-normal">
              Begin your check-in.
            </h2>
            <p className="text-sm text-[#8A96A6] leading-relaxed">
              Take 60 seconds to reflect on your cognitive fatigue and access support on your own terms.
            </p>
          </div>

          <button
            onClick={handleGetStarted}
            disabled={isTransitioning}
            className="group px-8 py-4 rounded-xl bg-[#2A9D8F] hover:bg-[#238276] active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-[0_4px_25px_rgba(42,157,143,0.35)] hover:shadow-[0_6px_35px_rgba(42,157,143,0.55)] cursor-pointer flex items-center gap-2"
          >
            {isTransitioning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Opening MindSet Portal...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          <div className="pt-10 border-t border-white/[0.08] w-full max-w-2xl flex flex-col sm:flex-row items-center justify-center gap-2.5 text-xs text-[#8A96A6]">
            <PhoneCall size={15} className="text-[#D86A38] shrink-0" />
            <span>
              In acute distress or crisis? Call Tele-MANAS at <strong className="text-white">14416</strong> (24/7 free national mental health helpline).
            </span>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] py-8 bg-[#0A0D12] text-center text-xs text-[#8A96A6] relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>MindSetX &bull; Non-diagnostic academic mental health platform</p>
          <p>Not a replacement for clinical psychiatric emergency care</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
