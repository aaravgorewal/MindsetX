
import React, { useEffect, useState } from 'react';
import { Activity, Moon, Clock, Brain, AlertTriangle, Shield, TrendingDown, TrendingUp, Phone, CheckCircle } from 'lucide-react';

const SentinelDashboard: React.FC = () => {
  const [phqScore, setPhqScore] = useState(0);
  const [sentimentHistory, setSentimentHistory] = useState<{date: string, score: number}[]>([]);
  const [behavioralFlags, setBehavioralFlags] = useState<string[]>([]);
  
  useEffect(() => {
    // Load data from LocalStorage simulation
    const savedPhq = localStorage.getItem('last_phq_score');
    if (savedPhq) setPhqScore(parseInt(savedPhq));

    const history = JSON.parse(localStorage.getItem('sentiment_history') || '[]');
    setSentimentHistory(history);

    // Simulated Behavioral Markers
    const hour = new Date().getHours();
    const flags = [];
    if (hour >= 1 && hour <= 5) {
        flags.push("Late Night Activity (Insomnia Risk)");
    }
    // Mock erratic usage for demo
    if (Math.random() > 0.7) flags.push("Erratic Usage Pattern Detected");
    
    setBehavioralFlags(flags);
  }, []);

  // DI Formula: (0.7 * (PHQ/27)) + (0.3 * ((1 - Sentiment)/2))
  const avgSentiment = sentimentHistory.length > 0 
    ? sentimentHistory.reduce((acc, curr) => acc + curr.score, 0) / sentimentHistory.length
    : 0;
  
  // Normalize Sentiment to Distress (Invert: 1 is happy/low distress, -1 is sad/high distress)
  // New Scale: 0 (Happy) to 1 (Sad) -> (1 - sentiment) / 2
  const sentimentDistress = (1 - avgSentiment) / 2;
  const phqDistress = phqScore / 27;

  const distressIndex = ((0.7 * phqDistress) + (0.3 * sentimentDistress)) * 10; // Scale 0-10
  const isHighRisk = distressIndex > 7;

  const getRiskLevel = (di: number) => {
      if (di > 7) return { label: "High Risk (Level 3)", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
      if (di > 4) return { label: "Moderate Risk (Level 2)", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" };
      return { label: "Low Risk (Level 1)", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" };
  };

  const risk = getRiskLevel(distressIndex);

  return (
    <div className="p-4 space-y-6 pb-24 animate-fade-in relative">
        {/* High Risk Alert Banner */}
        {isHighRisk && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-2xl shadow-sm animate-pulse flex items-start gap-4 mb-6">
                <div className="p-2 bg-red-500/20 text-red-400 rounded-full shrink-0">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-tight mb-1">Critical Distress Levels Detected</h3>
                    <p className="text-sm text-red-300 mb-3">Your Sentinel metrics indicate a high level of distress. Please reach out for professional help.</p>
                    <button 
                        onClick={() => window.open('tel:14416')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md"
                    >
                        <Phone size={16} /> Call Helpline (14416)
                    </button>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30">
                <Brain className="text-white" size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white">AI Sentinel</h1>
                <p className="text-xs text-gray-400 font-bold">Real-time Triage & Analytics</p>
            </div>
        </div>

        {/* Distress Index Card */}
        <div className={`rounded-3xl p-6 border ${risk.border} ${risk.bg} relative overflow-hidden transition-all duration-500 shadow-sm`}>
             <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Activity size={80} className="text-white" />
             </div>
             <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Distress Index (DI)</h2>
             <div className="flex items-end gap-2 mb-4">
                 <span className={`text-5xl font-bold ${risk.color}`}>{distressIndex.toFixed(1)}</span>
                 <span className="text-gray-400 text-lg mb-1 font-bold">/ 10</span>
             </div>
             <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${risk.border} ${risk.color} bg-white/5`}>
                 {risk.label}
             </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                    <Shield size={16} />
                    <span className="text-xs font-bold uppercase">PHQ-9 Score</span>
                </div>
                <div className="text-2xl font-bold text-white">{phqScore} <span className="text-sm text-gray-500 font-normal">/ 27</span></div>
                <p className="text-[10px] text-gray-500 mt-1">Clinical Baseline</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                    {avgSentiment > 0 ? <TrendingUp size={16} className="text-green-500"/> : <TrendingDown size={16} className="text-red-500"/>}
                    <span className="text-xs font-bold uppercase">AI Vibe</span>
                </div>
                <div className={`text-2xl font-bold ${avgSentiment >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {avgSentiment.toFixed(2)}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">-1.0 to +1.0 Scale</p>
            </div>
        </div>

        {/* Behavioral Markers */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-saffron-500"/>
                Behavioral Markers
            </h3>
            
            {behavioralFlags.length > 0 ? (
                <div className="space-y-3">
                    {behavioralFlags.map((flag, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertTriangle size={18} className="text-red-400 flex-none" />
                            <span className="text-sm text-red-200 font-medium">{flag}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center py-6 text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-500/30 fill-green-500/20" />
                    <p className="text-sm mt-3 font-medium">No concerning patterns detected.</p>
                </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                 <div className="text-center">
                     <div className="text-gray-400 text-xs mb-1 font-bold">Sleep Pattern</div>
                     <div className="text-white text-sm font-bold flex items-center justify-center gap-1">
                         <Moon size={12} className="text-indigo-400" /> Normal
                     </div>
                 </div>
                 <div className="text-center border-l border-white/10">
                     <div className="text-gray-400 text-xs mb-1 font-bold">Interaction</div>
                     <div className="text-white text-sm font-bold">Steady</div>
                 </div>
            </div>
        </div>

        <p className="text-[10px] text-center text-gray-500 mt-4 px-8 font-medium">
            Sentinel Algorithm combines clinical PHQ-9 data with linguistic sentiment analysis to calculate risk. Not a medical diagnosis.
        </p>
    </div>
  );
};

export default SentinelDashboard;
