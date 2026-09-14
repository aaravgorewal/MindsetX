
import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Search, Mic, StopCircle, Volume2, Phone, ClipboardList, AlertOctagon, Activity } from 'lucide-react';
import { sendChatMessage, speakText } from '../services/geminiService';
import { detectCrisis } from '../utils/crisisDetection';
import { apiService } from '../services/apiService';
import { ChatMessage, AssessmentState, MessageOption } from '../types';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/userService';

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things?",
  "Feeling down, depressed, or hopeless?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Feeling tired or having little energy?",
  "Poor appetite or overeating?",
  "Feeling bad about yourself—or that you are a failure or have let yourself or your family down?",
  "Trouble concentrating on things, such as reading the newspaper or watching television?",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual?",
  "Thoughts that you would be better off dead, or of hurting yourself in some way?"
];

const PHQ9_OPTIONS: MessageOption[] = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 }
];

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: "Namaste! I'm MindSet AI. I'm here to listen without judgment. How are you feeling today? (Stress, exams, or just life?)\n\nYou can also type 'Start Assessment' to take a quick mental health check.", sentimentScore: 0.1 }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  
  // Sentinel State
  const [currentSentiment, setCurrentSentiment] = useState<number>(0);
  const [behavioralFlag, setBehavioralFlag] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // PHQ-9 State
  const [assessment, setAssessment] = useState<AssessmentState>({
    active: false,
    currentStep: -1,
    scores: []
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, assessment.active]);

  // Check for Late Night Behavioral Marker on Mount
  useEffect(() => {
      const hour = new Date().getHours();
      if (hour >= 1 && hour <= 5) {
          setBehavioralFlag("Late Night Activity (Insomnia Marker)");
      }
  }, []);

  const checkForCrisis = (text: string) => {
    if (detectCrisis(text)) {
      triggerCrisisMode();
    }
  };

  const triggerCrisisMode = () => {
      setCrisisDetected(true);
      if (assessment.active) {
          setAssessment({ active: false, currentStep: -1, scores: [] });
      }
  };

  // --- PHQ-9 LOGIC START ---
  const startAssessment = () => {
    setAssessment({ active: true, currentStep: -1, scores: [] });
    addBotMessage("Hey! I'm here to check in on you. It'll take 2 minutes. Ready?", [
        { label: "Yes, let's do it", value: "start_confirmed" },
        { label: "No, later", value: "cancel" }
    ]);
  };

  // Check if routed with intent to start assessment immediately
  useEffect(() => {
    try {
      if (sessionStorage.getItem('start_assessment_flow') === 'true') {
        sessionStorage.removeItem('start_assessment_flow');
        startAssessment();
      }
    } catch (e) {
      console.error('Failed to read start_assessment_flow flag:', e);
    }
  }, []);

  const processAssessmentAnswer = (value: number | string) => {
      // Handle Intro
      if (assessment.currentStep === -1) {
          if (value === "cancel") {
              setAssessment({ active: false, currentStep: -1, scores: [] });
              addBotMessage("No problem. I'm here whenever you need me.");
          } else {
              setAssessment(prev => ({ ...prev, currentStep: 0 }));
              addBotMessage(`Over the last 2 weeks, how often have you been bothered by any of the following problems?\n\nQuestion 1/9: ${PHQ9_QUESTIONS[0]}`, PHQ9_OPTIONS);
          }
          return;
      }

      const score = typeof value === 'number' ? value : 0;
      const currentQIndex = assessment.currentStep;

      // Item 9 independent trigger: Any positive score on suicidal ideation must immediately escalate
      if (currentQIndex === 8 && score > 0) {
          triggerCrisisMode();
          addBotMessage("Please reach out now — Tele-MANAS: 14416 or KIRAN: 1800-599-0019, both free and available 24/7.", [
              { label: "Call Tele-MANAS (14416)", value: "call_telemanas", action: "tel:14416" },
              { label: "Call KIRAN (1800-599-0019)", value: "call_kiran", action: "tel:18005990019" }
          ]);
          return;
      }

      const newScores = [...assessment.scores, score];

      if (currentQIndex < 8) {
          setAssessment(prev => ({ ...prev, currentStep: currentQIndex + 1, scores: newScores }));
          addBotMessage(`Question ${currentQIndex + 2}/9: ${PHQ9_QUESTIONS[currentQIndex + 1]}`, PHQ9_OPTIONS);
      } else {
          finishAssessment(newScores);
      }
  };

  const finishAssessment = async (scores: number[]) => {
      setIsLoading(true);
      try {
          // Submit scores to backend /phq9 endpoint
          const response = await apiService.post<any>('/phq9', {
              scores: scores,
              timestamp: new Date().toISOString()
          });

          const { data } = response;
          const totalScore = data.totalScore ?? data.total_score ?? scores.reduce((a, b) => a + b, 0);
          const severity = data.severity || "Unknown";
          const driftState = data.driftState ?? data.drift_state ?? "stable";
          const recommendation = data.recommendation || (data.recommendations && data.recommendations[0]) || "Take care of yourself.";
          const actions = data.actions || [];

          // Connect backend emergency signal to frontend crisis banner (Defense-in-Depth)
          const hasEmergencyAction = actions.some((act: any) => act.type && act.type.toUpperCase() === 'EMERGENCY');
          if (hasEmergencyAction || driftState === 'critical' || driftState === 'high_risk') {
              triggerCrisisMode();
          }

          setAssessment({ active: false, currentStep: -1, scores: [] });
          
          const resultMessage = `Assessment Complete.\n\nTotal Score: ${totalScore}/27\nSeverity: ${severity}\nStatus: ${driftState.charAt(0).toUpperCase() + driftState.slice(1)}\n\nRecommendation: ${recommendation}`;
          
          const isHighRisk = severity.includes("Severe") || severity === "Severe" || driftState === "critical" || hasEmergencyAction;
          const options = isHighRisk 
              ? [
                  { label: "Call Tele-MANAS (14416)", value: "call_telemanas", action: "tel:14416" },
                  { label: "Call KIRAN (1800-599-0019)", value: "call_kiran", action: "tel:18005990019" }
                ]
              : undefined;

          addBotMessage(resultMessage, options);
          
          // Save last PHQ score and drift state to LocalStorage for Sentinel Dashboard
          localStorage.setItem('last_phq_score', totalScore.toString());
          localStorage.setItem('phq_drift_state', driftState);
          localStorage.setItem('phq_severity', severity);

          // Update onboardingComplete: true on user's Firestore profile
          if (user?.uid) {
              updateUserProfile(user.uid, { onboardingComplete: true }).catch((err) => {
                  console.error('Failed to update onboardingComplete in Firestore:', err);
              });
          }
      } catch (error: any) {
          console.error("PHQ-9 submission error:", error);
          setAssessment({ active: false, currentStep: -1, scores: [] });
          const errorMsg = error.response?.data?.message || "Error submitting assessment. Please try again.";
          addBotMessage(`Assessment submission failed: ${errorMsg}`);
      } finally {
          setIsLoading(false);
      }
  };
  // --- PHQ-9 LOGIC END ---

  const addBotMessage = (text: string, options?: MessageOption[], sentiment?: number) => {
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text,
          options,
          sentimentScore: sentiment
      }]);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;

    if (textToSend.toLowerCase().includes('assessment') || textToSend.toLowerCase().includes('quiz')) {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        startAssessment();
        return;
    }

    checkForCrisis(textToSend);

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Get or create user ID from session
      const userId = localStorage.getItem('user_id') || `user_${Date.now()}`;
      if (!localStorage.getItem('user_id')) {
        localStorage.setItem('user_id', userId);
      }

      // Prepare request payload for MAS backend
      const requestData = {
        user_id: userId,
        message: textToSend
      };

      // Send message to backend /chat endpoint
      const response = await apiService.post<any>('/chat', requestData);
      const data = response.data;
      
      // Parse response from MAS orchestrator
      let displayText = data.reply || data.message || "";
      const driftState = data.drift_state || "stable";
      const driftScore = data.drift_score || 0;
      const actions = data.actions || [];

      // Defense-in-depth: If backend flagged EMERGENCY action, trigger the crisis banner
      const hasEmergencyAction = actions.some((act: any) => act.type && act.type.toUpperCase() === 'EMERGENCY');
      if (hasEmergencyAction) {
        triggerCrisisMode();
      }
      
      // Map drift state to sentiment for dashboard compatibility
      let sentiment = 0;
      if (driftState === "high_risk") sentiment = -0.8;
      else if (driftState === "early_warning") sentiment = -0.3;
      else if (driftState === "stable") sentiment = 0.5;
      
      setCurrentSentiment(sentiment);
      
      // Save drift metrics to localStorage for Sentinel Dashboard
      const driftHistory = JSON.parse(localStorage.getItem('drift_history') || '[]');
      driftHistory.push({ 
        date: new Date().toISOString(), 
        score: driftScore,
        state: driftState,
        actions: actions
      });
      localStorage.setItem('drift_history', JSON.stringify(driftHistory.slice(-20)));
      localStorage.setItem('last_drift_state', driftState);
      localStorage.setItem('last_drift_score', driftScore.toString());

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: displayText,
        sentimentScore: sentiment
      };
      
      checkForCrisis(displayText);
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'model', 
        text: error.response?.data?.message || "Failed to connect to the backend. Please ensure the server is running on http://localhost:8000", 
        isError: true 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option: MessageOption) => {
      if (option.action && option.action.startsWith('tel:')) {
          window.open(option.action, '_self');
          return;
      }
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: option.label };
      setMessages(prev => [...prev, userMsg]);

      if (assessment.active) {
          processAssessmentAnswer(option.value);
      }
  };

  const handleTTS = async (text: string) => {
      try {
          const audioBase64 = await speakText(text);
          const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
          audio.play();
      } catch (e) {
          console.error("TTS Error", e);
      }
  }

  return (
    <div className="flex flex-col h-full relative pb-24">
      {/* Crisis Banner */}
      {crisisDetected && (
          <div className="absolute top-14 left-0 right-0 mx-4 rounded-xl bg-red-600 text-white p-3 flex justify-between items-center animate-pulse z-50 shadow-lg cursor-pointer" onClick={() => window.open('tel:14416')}>
              <div className="flex items-center">
                  <AlertOctagon className="mr-2" size={20} />
                  <div className="text-xs font-bold">
                      <div>Emergency Detected</div>
                      <div className="font-normal text-[10px]">Tap to call Tele-MANAS (14416)</div>
                  </div>
              </div>
              <div className="bg-white text-red-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm">
                  <Phone size={12} className="mr-1"/> Call
              </div>
          </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-charcoal/80 backdrop-blur-md sticky top-0 z-10 flex-none pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          MindSet Chat
          <span className="text-xs font-normal px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">Beta</span>
        </h2>
        
        <div className="flex gap-2">
            {behavioralFlag && (
                 <div title={behavioralFlag} className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            )}
            {!assessment.active && (
                <button onClick={startAssessment} className="text-xs bg-saffron-500/10 text-saffron-500 border border-saffron-500/30 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-saffron-500/20 transition-colors font-bold">
                    <ClipboardList size={12} /> Assess
                </button>
            )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
              msg.role === 'user' 
                ? 'bg-saffron-500 text-white rounded-tr-none' 
                : 'bg-white/10 text-gray-100 rounded-tl-none border border-white/5'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed font-hindi">{msg.text}</p>
              
              {/* Sentiment Debug */}
              {msg.sentimentScore !== undefined && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 opacity-70">
                      <Activity size={10} className={msg.sentimentScore < 0 ? 'text-red-400' : 'text-green-400'} />
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                          Sentiment: {msg.sentimentScore.toFixed(2)}
                      </span>
                  </div>
              )}

              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-1 rounded truncate max-w-[150px] border border-teal-500/20 hover:bg-teal-500/20 transition-colors">
                        {new URL(url).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {msg.role === 'model' && (
                  <button onClick={() => handleTTS(msg.text)} className="mt-2 text-gray-500 hover:text-saffron-400 transition-colors">
                      <Volume2 size={16} />
                  </button>
              )}
            </div>
            
            {msg.options && msg.id === messages[messages.length - 1].id && (
                <div className="mt-2 grid grid-cols-1 gap-2 w-[85%] animate-fade-in">
                    {msg.options.map((opt, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleOptionClick(opt)}
                            className={`w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-200 transition-all active:scale-95 flex justify-between items-center group shadow-sm ${opt.action === 'tel:14416' ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' : ''}`}
                        >
                            <span className="font-medium">{opt.label}</span>
                            <div className={`w-4 h-4 rounded-full border border-white/20 group-hover:border-saffron-500 group-hover:bg-saffron-500/20 ${opt.action ? 'hidden' : ''}`}></div>
                            {opt.action && <Phone size={16} className="text-red-500" />}
                        </button>
                    ))}
                </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2 border border-white/5 shadow-sm">
               <div className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce delay-100"></div>
               <div className="w-2 h-2 bg-saffron-400 rounded-full animate-bounce delay-200"></div>
               <span className="text-xs text-gray-400 ml-2">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!assessment.active ? (
        <div className="p-4 bg-charcoal/90 backdrop-blur-md border-t border-white/10 flex-none z-20">
            <div className="flex gap-2 mb-2 px-2">
                <button 
                    onClick={() => setUseSearch(!useSearch)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all font-bold ${useSearch ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}>
                    <Search size={12} className="inline mr-1"/> Web
                </button>
                <button 
                    onClick={() => setUseMaps(!useMaps)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all font-bold ${useMaps ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}>
                    <MapPin size={12} className="inline mr-1"/> Maps
                </button>
            </div>
            <div className="relative">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type or speak (Hinglish supported)..."
                className="w-full bg-white/5 border border-white/10 p-4 pr-12 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 resize-none h-14 shadow-inner"
            />
            <button 
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-2 p-2 bg-saffron-500 rounded-lg text-white hover:bg-saffron-600 disabled:opacity-50 transition-colors shadow-md"
            >
                <Send size={18} />
            </button>
            </div>
            <p className="text-[10px] text-center text-gray-500 mt-2">
            Conversations are anonymous. In crisis? Call 14416.
            </p>
        </div>
      ) : (
          <div className="p-4 bg-charcoal/90 backdrop-blur-md border-t border-white/10 flex-none z-20">
              <p className="text-center text-gray-400 text-xs mb-2">Assessment in progress... Select an option above.</p>
              <button onClick={() => processAssessmentAnswer("cancel")} className="w-full py-3 text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors">
                  Cancel Assessment
              </button>
          </div>
      )}
    </div>
  );
};

export default ChatInterface;
