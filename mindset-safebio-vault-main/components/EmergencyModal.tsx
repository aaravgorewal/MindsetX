import React, { useState } from 'react';
import { Phone, ShieldAlert, Heart, X, AlertOctagon, PhoneCall, ExternalLink, Activity, Wind } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale (4s)' | 'Hold (7s)' | 'Exhale (8s)'>('Inhale (4s)');

  if (!isOpen) return null;

  const handleStartBreathing = () => {
    setShowBreathing(true);
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 3;
      if (step === 0) setBreathPhase('Inhale (4s)');
      else if (step === 1) setBreathPhase('Hold (7s)');
      else setBreathPhase('Exhale (8s)');
    }, 4000);
    return () => clearInterval(interval);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-lg bg-[#181824] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <ShieldAlert size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Emergency Crisis Support
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">24/7 Free</span>
              </h2>
              <p className="text-xs text-gray-400">Immediate confidential support across India</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {/* Reassurance Callout */}
          <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/20 text-xs text-red-200 flex items-start gap-2.5">
            <Heart size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span>
              <strong>You do not have to go through this alone.</strong> If you or someone you know is in distress, having thoughts of self-harm, or in need of someone to talk to, free trained professionals are ready to help you right now.
            </span>
          </div>

          {/* Primary Helpline Card: Tele-MANAS */}
          <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-emerald-500/30 transition-all shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Tele-MANAS</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">Primary National</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Ministry of Health & Family Welfare, Govt. of India</div>
                <div className="text-lg font-extrabold text-emerald-400 mt-1 font-mono tracking-wide">14416</div>
                <div className="text-[11px] text-gray-400">Toll-free 24/7 across all telecom networks in 20+ Indian languages</div>
              </div>
              <a
                href="tel:14416"
                className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <PhoneCall size={14} /> Call 14416
              </a>
            </div>
            <div className="mt-2 text-[11px] text-gray-500 border-t border-white/5 pt-2 flex justify-between">
              <span>Alternative Toll-Free: <strong>1800-891-4416</strong></span>
              <a href="tel:18008914416" className="text-emerald-400 hover:underline">Dial Alt</a>
            </div>
          </div>

          {/* Secondary Helpline Card: KIRAN */}
          <div className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-blue-500/30 transition-all shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">KIRAN Mental Health Helpline</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">Psychological Support</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Ministry of Social Justice and Empowerment, Govt. of India</div>
                <div className="text-lg font-extrabold text-blue-400 mt-1 font-mono tracking-wide">1800-599-0019</div>
                <div className="text-[11px] text-gray-400">24/7 toll-free crisis counselling and psychological first aid in 13 languages</div>
              </div>
              <a
                href="tel:18005990019"
                className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <PhoneCall size={14} /> Call KIRAN
              </a>
            </div>
          </div>

          {/* General Emergency 112 */}
          <div className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold font-mono">112</div>
              <div>
                <div className="font-bold text-xs text-white">National Emergency Number (All-in-One)</div>
                <div className="text-[11px] text-gray-400">Police, Fire & Medical Emergencies</div>
              </div>
            </div>
            <a
              href="tel:112"
              className="px-3.5 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-300 font-bold text-xs flex items-center gap-1 transition-all"
            >
              <Phone size={12} /> Call 112
            </a>
          </div>

          {/* Calming Breathing Exercise Toggle */}
          <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-center">
            {!showBreathing ? (
              <button
                onClick={handleStartBreathing}
                className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Wind size={15} /> Feel Overwhelmed? Try 4-7-8 Calming Breath
              </button>
            ) : (
              <div className="py-2 space-y-1">
                <div className="text-xs text-purple-300 font-bold uppercase tracking-wider">Grounding Exercise</div>
                <div className="text-base font-extrabold text-purple-100 animate-pulse">{breathPhase}</div>
                <div className="text-[11px] text-gray-400">Follow the rhythm and let your shoulders drop</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 text-center">
          <p className="text-[11px] text-gray-400">All calls are confidential and free of charge.</p>
        </div>
      </div>
    </div>
  );
};
