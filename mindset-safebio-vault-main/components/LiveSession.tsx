
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Mic, MicOff, PhoneOff, Video, Star, ChevronLeft, CheckCircle, Brain, X, Calendar as CalendarIcon, ExternalLink, RefreshCw, User, Briefcase, QrCode, ShieldCheck, MapPin, GraduationCap, Building2, Clock, Award, Languages } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { GoogleGenAI, LiveServerMessage } from '@google/genai';
import { useAuth } from '../context/AuthContext';
import { saveUserBooking } from '../services/userService';

interface LiveSessionProps {
  onEnd: () => void;
}

interface Specialist {
  id: string;
  name: string;
  role: string;
  specialty: string;
  isOnline: boolean;
  price: number;
  rating: number;
  avatar: string;
  languages: string[];
  experienceYears: number | string;
  qualification: string;
  workplace: string;
  bio: string;
  sessionsCompleted: number;
  location: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  attendee: string;
  date: string;
  time: string;
  type: 'User' | 'Creator';
  meetLink?: string;
}

const SPECIALISTS: Specialist[] = [
  {
    id: 'ai-001',
    name: 'MindSet AI',
    role: 'AI Companion',
    specialty: '24/7 Mental Health Support',
    isOnline: true,
    price: 0,
    rating: 5.0,
    avatar: 'ai',
    languages: ['English', 'Hindi', 'Hinglish'],
    experienceYears: 'Always Available',
    qualification: 'Adaptive Multimodal Neural Engine',
    workplace: 'MindSet Core On-Device & Cloud',
    bio: 'Trained on clinical triage frameworks (PHQ-9, GAD-7) and empathetic active listening models. I provide instant, judgment-free conversational support, de-escalation, and guided somatic exercises whenever you need someone to talk to.',
    sessionsCompleted: 12500,
    location: 'Cloud & On-Device (Pan-India)'
  },
  {
    id: '1',
    name: 'Dr. Ananya Sharma',
    role: 'Psychiatrist',
    specialty: 'Anxiety & Depression',
    isOnline: true,
    price: 1500,
    rating: 4.9,
    avatar: 'https://i.pravatar.cc/150?u=1',
    languages: ['English', 'Hindi'],
    experienceYears: 12,
    qualification: 'MD Psychiatry (AIIMS New Delhi), DNB',
    workplace: 'Senior Consultant, Max Super Speciality Hospital',
    bio: 'I specialize in mood disorders, acute panic, and clinical depression in university students and young professionals. My practice balances evidence-based pharmacological management with supportive psychotherapy to restore emotional equilibrium.',
    sessionsCompleted: 920,
    location: 'Delhi NCR'
  },
  {
    id: '2',
    name: 'Rohan Mehta',
    role: 'Saarthi',
    specialty: 'Student Peer Guide',
    isOnline: false,
    price: 200,
    rating: 4.7,
    avatar: 'https://i.pravatar.cc/150?u=8',
    languages: ['Hindi', 'Marathi'],
    experienceYears: '3rd Year B.Tech, Trained Peer Counselor',
    qualification: 'IIT Bombay Peer Support Certification',
    workplace: 'IIT Bombay Student Mentorship Cell',
    bio: 'Having survived intense semester backlogs, placement pressure, and hostel burnout myself, I help fellow students talk through academic isolation without feeling judged. Sometimes you just need someone who gets what an all-nighter before finals feels like.',
    sessionsCompleted: 68,
    location: 'Mumbai'
  },
  {
    id: '3',
    name: 'Coach Simran',
    role: 'Life Coach',
    specialty: 'Motivation & Goals',
    isOnline: true,
    price: 800,
    rating: 4.8,
    avatar: 'https://i.pravatar.cc/150?u=3',
    languages: ['English', 'Punjabi'],
    experienceYears: 7,
    qualification: 'PCC - International Coaching Federation (ICF)',
    workplace: 'Founder, Momentum Mind Coaching',
    bio: 'I work with ambitious students and early-career founders who feel stuck in chronic overthinking. We break down daunting career milestones into actionable micro-habits, working on executive function, self-efficacy, and purposeful momentum.',
    sessionsCompleted: 410,
    location: 'Chandigarh'
  },
  {
    id: '4',
    name: 'Vaidya Ravi',
    role: 'Ayurveda Expert',
    specialty: 'Holistic Healing',
    isOnline: false,
    price: 600,
    rating: 4.6,
    avatar: 'https://i.pravatar.cc/150?u=2',
    languages: ['Hindi', 'Sanskrit'],
    experienceYears: 15,
    qualification: 'BAMS (National Institute of Ayurveda, Jaipur)',
    workplace: 'Consultant, Charaka Ayurvedic Clinic & Wellness Retreat',
    bio: 'Rooted in classical Charaka Samhita wisdom, I assess chronic stress, insomnia, and psychosomatic tension through tridosha and circadian alignment. We integrate personalized dinacharya (daily routine), herbal adaptogens, and pranayama.',
    sessionsCompleted: 640,
    location: 'Rishikesh'
  },
  {
    id: '5',
    name: 'Dr. Arjun Rao',
    role: 'Psychiatrist',
    specialty: 'Sleep Disorders & ADHD Management',
    isOnline: false,
    price: 1400,
    rating: 4.8,
    avatar: 'https://i.pravatar.cc/150?u=12',
    languages: ['English', 'Hindi', 'Telugu'],
    experienceYears: 8,
    qualification: 'MBBS, MD Psychiatry (Osmania Medical College)',
    workplace: 'Attending Psychiatrist, Care Hospitals',
    bio: 'My clinical focus is on adult ADHD, executive dysfunction, and delayed sleep phase syndrome in tech-heavy student routines. I believe in comprehensive diagnostic rigor coupled with practical sleep-hygiene scaffolding.',
    sessionsCompleted: 430,
    location: 'Hyderabad'
  },
  {
    id: '6',
    name: 'Dr. Meera Iyer',
    role: 'Psychiatrist',
    specialty: 'Trauma, Grief & Clinical PTSD',
    isOnline: true,
    price: 2200,
    rating: 4.9,
    avatar: 'https://i.pravatar.cc/150?u=15',
    languages: ['English', 'Hindi', 'Tamil'],
    experienceYears: 18,
    qualification: 'MD Psychiatry (Madras Medical College), FRCPsych (UK)',
    workplace: 'Senior Consultant, Apollo Hospitals, Greams Road',
    bio: 'With nearly two decades of clinical experience, I work closely with individuals navigating profound grief, developmental trauma, and complex PTSD. I provide a calm, deeply safe therapeutic space where healing can unfold at your own pace.',
    sessionsCompleted: 1450,
    location: 'Chennai'
  },
  {
    id: '7',
    name: 'Kabir Chatterjee',
    role: 'Therapist',
    specialty: 'Exam Stress, Burnout & Performance Anxiety',
    isOnline: true,
    price: 850,
    rating: 4.9,
    avatar: 'https://i.pravatar.cc/150?u=19',
    languages: ['English', 'Hindi', 'Bengali'],
    experienceYears: 6,
    qualification: 'M.Phil Clinical Psychology (Calcutta University), RCI Licensed',
    workplace: 'Consultant Psychologist, Peerless Hospital & Private Practice',
    bio: 'I integrate Cognitive Behavioral Therapy (CBT) and Acceptance & Commitment Therapy (ACT) to help competitive exam aspirants dismantle perfectionism and crippling test anxiety. We target self-worth independent of test scores.',
    sessionsCompleted: 340,
    location: 'Kolkata'
  },
  {
    id: '8',
    name: 'Tanvi Patel',
    role: 'Saarthi',
    specialty: 'Hostel Adjustment & 1st Year Loneliness',
    isOnline: true,
    price: 150,
    rating: 4.7,
    avatar: 'https://i.pravatar.cc/150?u=24',
    languages: ['Hindi', 'Gujarati', 'English'],
    experienceYears: '2nd Year M.Sc Psychology, Trained Peer Mentor',
    qualification: 'Gujarat University Youth Counselor Training',
    workplace: 'Campus Student Wellness Collective',
    bio: 'Moving away from home for college can trigger unexpected homesickness, social awkwardness, and self-doubt. As a Saarthi peer guide, I listen with an open heart and share grounding techniques that made college feel like home for me.',
    sessionsCompleted: 42,
    location: 'Ahmedabad'
  },
  {
    id: '9',
    name: 'Aditya Kulkarni',
    role: 'Life Coach',
    specialty: 'Habit Systems & Procrastination Overcome',
    isOnline: false,
    price: 650,
    rating: 4.6,
    avatar: 'https://i.pravatar.cc/150?u=31',
    languages: ['English', 'Hindi', 'Marathi'],
    experienceYears: 5,
    qualification: 'Certified Behavior Analyst & Life Coach (ICF ACC)',
    workplace: 'Private Practice, Deccan Gymkhana',
    bio: 'Procrastination is rarely laziness—it is usually emotional regulation failure. I guide university students and engineers in architecting friction-free study environments, dopamine detoxes, and structured accountability rituals.',
    sessionsCompleted: 275,
    location: 'Pune'
  },
  {
    id: '10',
    name: 'Priya Nair',
    role: 'Therapist',
    specialty: 'Relationship, Family & Boundary Therapy',
    isOnline: false,
    price: 1100,
    rating: 4.8,
    avatar: 'https://i.pravatar.cc/150?u=35',
    languages: ['English', 'Hindi', 'Malayalam'],
    experienceYears: 9,
    qualification: 'M.Sc, M.Phil Clinical Psychology (NIMHANS Bangalore)',
    workplace: 'Aster Medcity & Private Practice',
    bio: 'I help young adults navigate complex interpersonal relationships, parental expectations, and personal boundaries. My relational approach focuses on emotional attunement, compassionate communication, and self-advocacy.',
    sessionsCompleted: 580,
    location: 'Kochi'
  }
];

// --- SUB-COMPONENT: GEMINI LIVE SESSION ---
const GeminiLiveSession = ({ onEnd }: { onEnd: () => void }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const apiKey = process.env.API_KEY || '';
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const wsRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    startSession();
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
            try { await audioContextRef.current.close(); } catch (e) {}
        }
        audioContextRef.current = null;
    }
    if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
        wsRef.current = null;
    }
  };

  const startSession = async () => {
    try {
      if (!apiKey) throw new Error("API Key required");

      const ai = new GoogleGenAI({ apiKey });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 }});
      if (!isMountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
            onopen: () => { if (isMountedRef.current) setStatus('connected'); },
            onmessage: (message: LiveServerMessage) => {
                if (!isMountedRef.current) return;
                const data = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (data && audioContextRef.current) playAudioChunk(data);
            },
            onclose: () => { if (isMountedRef.current) { setStatus('disconnected'); onEnd(); } },
            onerror: (e) => { console.error("Session error", e); if (isMountedRef.current) setStatus('error'); }
        },
        config: { responseModalities: ["AUDIO" as any], systemInstruction: "You are a helpful, calm mental health assistant." }
      });
      
      const session = await sessionPromise;
      if (!isMountedRef.current) { session.close(); return; }
      wsRef.current = session;

      const inputContext = new AudioContext({ sampleRate: 16000 });
      const source = inputContext.createMediaStreamSource(stream);
      const processor = inputContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (isMuted || !isMountedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const l = inputData.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const base64Data = btoa(binary);

        sessionPromise.then(currentSession => {
            if(isMountedRef.current) {
                currentSession.sendRealtimeInput({ media: { mimeType: "audio/pcm;rate=16000", data: base64Data } });
            }
        });
      };

      source.connect(processor);
      processor.connect(inputContext.destination);
      processorRef.current = processor;
      sourceRef.current = source as any; 

    } catch (error) {
      console.error("Live Session Error:", error);
      if (isMountedRef.current) setStatus('error');
    }
  };

  const playAudioChunk = async (base64Data: string) => {
     if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
     try {
         const binaryString = atob(base64Data);
         const len = binaryString.length;
         const bytes = new Uint8Array(len);
         for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
         const int16 = new Int16Array(bytes.buffer);
         const float32 = new Float32Array(int16.length);
         for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;
         const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
         buffer.copyToChannel(float32, 0);
         const source = audioContextRef.current.createBufferSource();
         source.buffer = buffer;
         source.connect(audioContextRef.current.destination);
         const now = audioContextRef.current.currentTime;
         const startTime = Math.max(now, nextStartTimeRef.current);
         source.start(startTime);
         nextStartTimeRef.current = startTime + buffer.duration;
     } catch (e) { console.error("Error playing audio chunk", e); }
  };

  const handleUserEnd = () => { cleanup(); setStatus('disconnected'); onEnd(); };

  return (
    <div className="fixed inset-0 z-[100] bg-charcoal flex flex-col items-center justify-center p-6 animate-fade-in text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
           <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-saffron-500/20 rounded-full blur-[100px]"></div>
           <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-teal-500/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="text-center space-y-8 relative z-10">
        <div className="relative">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 border-white/10 shadow-xl ${status === 'connected' ? 'bg-white/10 animate-pulse' : 'bg-red-500/20'}`}>
             <Brain size={48} className={status === 'connected' ? 'text-teal-400' : 'text-red-400'} />
          </div>
          {status === 'connected' && <div className="absolute inset-0 rounded-full border border-teal-500/30 animate-ping"></div>}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {status === 'connecting' ? 'Connecting to MindSet AI...' : status === 'error' ? 'Connection Failed' : 'AI Listening...'}
          </h2>
          <p className="text-gray-400 font-medium">{status === 'error' ? 'Please check your connection.' : "Speak naturally. I'm here to help."}</p>
        </div>
        <div className="flex space-x-6 justify-center">
          <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full shadow-lg transition-transform hover:scale-105 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300 hover:text-white'}`}>
            {isMuted ? <MicOff /> : <Mic />}
          </button>
          <button onClick={handleUserEnd} className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg transition-transform hover:scale-105"><PhoneOff /></button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT: DIRECTORY & BOOKING ---
export default function LiveSession({ onEnd }: LiveSessionProps) {
  const { user } = useAuth();
  const [view, setView] = useState<'DIRECTORY' | 'AI_SESSION' | 'SCHEDULE'>('DIRECTORY');
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [profileSpecialist, setProfileSpecialist] = useState<Specialist | null>(null);
  const [bookingStep, setBookingStep] = useState<'NONE' | 'DATE' | 'PAYMENT' | 'CONFIRM'>('NONE');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedBookingDate, setSelectedBookingDate] = useState<Date>(new Date());
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Close profile or booking modal via Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (profileSpecialist) {
          setProfileSpecialist(null);
        } else if (bookingStep !== 'NONE') {
          setSelectedSpecialist(null);
          setBookingStep('NONE');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileSpecialist, bookingStep]);
  
  // Google Calendar State
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'USER' | 'CREATOR'>('USER');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('All');

  const filteredSpecialists = useMemo(() => {
    if (selectedRole === 'All') return SPECIALISTS;
    return SPECIALISTS.filter(s => s.role === selectedRole);
  }, [selectedRole]);

  // --- Date picker helpers ---
  const bookingDates = useMemo(() => {
    const dates: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }
    return dates;
  }, []);

  const formatDateLabel = (d: Date, idx: number): string => {
    if (idx === 0) return 'Today';
    if (idx === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatDateWeekday = (d: Date): string =>
    d.toLocaleDateString('en-IN', { weekday: 'short' });

  const TIME_SLOTS = ['10:00 AM', '02:00 PM', '04:30 PM', '06:00 PM', '08:00 PM', '09:30 PM'];

  const isTimeSlotPast = (slot: string): boolean => {
    // Only disable past slots for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(selectedBookingDate);
    selDate.setHours(0, 0, 0, 0);
    if (selDate.getTime() !== today.getTime()) return false;

    const now = new Date();
    // Parse slot like "10:00 AM" or "02:00 PM"
    const match = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return false;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const slotTime = new Date();
    slotTime.setHours(hours, mins, 0, 0);
    return now > slotTime;
  };

  const formatBookingDateFull = (d: Date): string =>
    d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const buildUpiLink = (): string => {
    const vpa = (import.meta as any).env?.VITE_UPI_ID || '';
    if (!vpa || !selectedSpecialist) return '';
    const payeeName = encodeURIComponent('MindSetX');
    const amount = selectedSpecialist.price.toFixed(2);
    const note = encodeURIComponent(`MindSetX-${selectedSpecialist.name}-${selectedTimeSlot}`);
    return `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}`;
  };

  const handleSpecialistClick = (specialist: Specialist) => {
    if (specialist.role === 'AI Companion') {
      setView('AI_SESSION');
    } else {
      setSelectedSpecialist(specialist);
      setBookingStep('DATE');
      setSelectedTimeSlot('');
      setSelectedBookingDate(new Date());
      setPaymentConfirmed(false);
    }
  };

  const proceedToPayment = () => {
    setBookingStep('PAYMENT');
    setPaymentConfirmed(false);
  };

  const finalizeBooking = async () => {
    setBookingStep('CONFIRM');
    if (selectedSpecialist) {
        const dateLabel = formatBookingDateFull(selectedBookingDate);
        const newEvent: CalendarEvent = {
            id: Date.now().toString(),
            title: `Session with ${selectedSpecialist.name}`,
            attendee: selectedSpecialist.name,
            date: dateLabel,
            time: selectedTimeSlot,
            type: 'User',
            meetLink: 'https://meet.google.com/abc-def-ghi'
        };
        setCalendarEvents(prev => [...prev, newEvent]);

        // Construct ISO string for the booking dateTime
        let combinedDate = new Date(selectedBookingDate);
        const match = selectedTimeSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1], 10);
          const mins = parseInt(match[2], 10);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && hours !== 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          combinedDate.setHours(hours, mins, 0, 0);
        }
        const dateTimeIso = combinedDate.toISOString();

        if (user?.uid) {
          try {
            await saveUserBooking(user.uid, {
              specialistName: selectedSpecialist.name,
              specialistRole: selectedSpecialist.role,
              dateTime: dateTimeIso,
              status: 'upcoming',
            });
          } catch (err) {
            console.error('Failed to persist booking to Firestore:', err);
          }
        }
    }
  };

  const handleConnectCalendar = () => {
      setIsSyncing(true);
      // Simulate API Call
      setTimeout(() => {
          setIsSyncing(false);
          setIsCalendarConnected(true);
          // Mock Initial Data
          setCalendarEvents(prev => [
              ...prev,
              { id: '101', title: 'Consultation with Rohan', attendee: 'Rohan Das (Student)', date: 'Today', time: '4:00 PM', type: 'Creator', meetLink: 'https://meet.google.com/xyz' },
              { id: '102', title: 'Therapy with Dr. Ananya', attendee: 'Dr. Ananya', date: 'Yesterday', time: '10:00 AM', type: 'User' }
          ]);
      }, 1500);
  };

  const addToGoogleCalendar = () => {
      if (!selectedSpecialist || !selectedTimeSlot) return;
      
      const title = encodeURIComponent(`Session with ${selectedSpecialist.name}`);
      const details = encodeURIComponent(`MindSet X Live Therapy Session. Specialist: ${selectedSpecialist.role}`);
      const location = encodeURIComponent("MindSet Live Hub (Video)");
      
      // Calculate Dates (Mocking tomorrow for demo)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 8);
      
      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateStr}/${dateStr}`;
      
      window.open(calendarUrl, '_blank');
  };

  if (view === 'AI_SESSION') {
      return <GeminiLiveSession onEnd={() => setView('DIRECTORY')} />;
  }

  return (
    <div className="h-full bg-charcoal flex flex-col pb-24 text-white">
       {/* Header */}
       <div className="p-6 pb-2 sticky top-0 bg-charcoal z-10 shadow-sm border-b border-white/5">
           <div className="flex justify-between items-center mb-4">
                <button onClick={onEnd} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={20} /> Back to Home
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setView('DIRECTORY')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'DIRECTORY' ? 'bg-saffron-500 text-white' : 'bg-white/5 text-gray-400'}`}
                    >
                        Directory
                    </button>
                    <button 
                        onClick={() => setView('SCHEDULE')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${view === 'SCHEDULE' ? 'bg-saffron-500 text-white' : 'bg-white/5 text-gray-400'}`}
                    >
                        <CalendarIcon size={12}/> Schedule
                    </button>
                </div>
           </div>
           
           <h1 className="text-2xl font-bold text-white">{view === 'DIRECTORY' ? 'Live Therapy Hub' : 'My Schedule'}</h1>
           <p className="text-sm text-gray-400">{view === 'DIRECTORY' ? 'Connect with AI or Verified Specialists instantly.' : 'Manage your upcoming sessions.'}</p>
       </div>

       {/* CONTENT: DIRECTORY VIEW */}
       {view === 'DIRECTORY' && (
           <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24 pt-4">
               {/* Filters */}
               <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                   {['All', 'Psychiatrist', 'Therapist', 'Saarthi', 'Life Coach'].map(f => (
                       <button 
                           key={f}
                           onClick={() => setSelectedRole(f)}
                           className={`px-4 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap shadow-sm transition-all cursor-pointer ${
                               selectedRole === f 
                                   ? 'bg-saffron-500 text-white border-saffron-500 shadow-md' 
                                   : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                           }`}
                       >
                           {f}
                       </button>
                   ))}
               </div>

                {filteredSpecialists.map((s) => (
                    <div 
                        key={s.id} 
                        onClick={() => setProfileSpecialist(s)}
                        className="bg-white/5 rounded-2xl p-4 shadow-sm border border-white/10 flex items-center gap-4 relative overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer group"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setProfileSpecialist(s);
                            }
                        }}
                    >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            {s.role === 'AI Companion' ? (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                    <Brain size={28} />
                                </div>
                            ) : (
                                <img src={s.avatar} alt={s.name} className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-md" />
                            )}
                            
                            {/* ONLINE/OFFLINE INDICATOR */}
                            <div className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-charcoal ${s.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <h3 className="font-bold text-white flex items-center gap-1 text-sm group-hover:text-saffron-400 transition-colors">
                                        {s.name}
                                        {s.role !== 'AI Companion' && <CheckCircle size={14} className="text-blue-400 shrink-0" />}
                                    </h3>
                                    <p className="text-xs text-saffron-500 font-bold">{s.role}</p>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-500 text-[10px] font-bold shrink-0">
                                    <Star size={10} fill="currentColor" /> {s.rating}
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.specialty}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                                {s.languages.map(l => (
                                    <span key={l} className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{l}</span>
                                ))}
                            </div>
                        </div>

                        {/* Action */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="text-sm font-bold text-white">
                                {s.price === 0 ? 'Free' : `₹${s.price}`}
                                {s.price > 0 && <span className="text-[10px] text-gray-500 font-normal">/session</span>}
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSpecialistClick(s);
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold shadow-md transition-transform active:scale-95 ${
                                    s.isOnline || s.role === 'AI Companion'
                                    ? 'bg-navy-800 text-white hover:bg-navy-700' 
                                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                                }`}
                            >
                                {s.role === 'AI Companion' ? 'Start Live' : s.isOnline ? 'Join Now' : 'Book Slot'}
                            </button>
                        </div>
                    </div>
                ))}
               <div className="h-12"></div>
           </div>
       )}

       {/* CONTENT: SCHEDULE VIEW */}
       {view === 'SCHEDULE' && (
           <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-24 pt-4">
               {/* Connect Google Calendar Card */}
               {!isCalendarConnected ? (
                   <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center animate-fade-in">
                       <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                           <CalendarIcon size={32} className="text-blue-400" />
                       </div>
                       <h3 className="text-lg font-bold text-white mb-2">Sync with Google Calendar</h3>
                       <p className="text-sm text-gray-400 mb-6">See your therapy sessions and campus events in one place. Enable two-way sync for better reminders.</p>
                       <button 
                           onClick={handleConnectCalendar}
                           disabled={isSyncing}
                           className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                       >
                           {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-5 h-5" alt="GCal" />}
                           {isSyncing ? 'Connecting...' : 'Connect Google Calendar'}
                       </button>
                   </div>
               ) : (
                   <div className="space-y-4 animate-fade-in">
                       {/* Role Toggle */}
                       <div className="flex bg-white/10 p-1 rounded-xl">
                           <button 
                               onClick={() => setScheduleMode('USER')}
                               className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${scheduleMode === 'USER' ? 'bg-charcoal shadow-sm text-white' : 'text-gray-400'}`}
                           >
                               <User size={14} /> My Appointments
                           </button>
                           <button 
                               onClick={() => setScheduleMode('CREATOR')}
                               className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${scheduleMode === 'CREATOR' ? 'bg-charcoal shadow-sm text-white' : 'text-gray-400'}`}
                           >
                               <Briefcase size={14} /> Creator Dashboard
                           </button>
                       </div>

                       <div className="flex items-center justify-between">
                           <h3 className="text-sm font-bold text-gray-400 uppercase">Upcoming Events</h3>
                           <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={10}/> Synced with Google</span>
                       </div>

                       {calendarEvents.filter(e => e.type === (scheduleMode === 'USER' ? 'User' : 'Creator')).length === 0 ? (
                           <div className="text-center py-10 text-gray-500">
                               <p>No upcoming events found.</p>
                           </div>
                       ) : (
                           calendarEvents
                               .filter(e => e.type === (scheduleMode === 'USER' ? 'User' : 'Creator'))
                               .map((evt) => (
                               <div key={evt.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                   <div>
                                       <div className="flex items-center gap-2 mb-1">
                                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                           <span className="text-xs font-bold text-blue-400">{evt.date} • {evt.time}</span>
                                       </div>
                                       <h4 className="font-bold text-white text-sm">{evt.title}</h4>
                                       <p className="text-xs text-gray-400 mt-1">with {evt.attendee}</p>
                                   </div>
                                   {evt.meetLink && (
                                       <a href={evt.meetLink} target="_blank" rel="noreferrer" className="p-2 bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors shadow-sm">
                                           <Video size={18} />
                                       </a>
                                   )}
                               </div>
                           ))
                       )}
                   </div>
               )}
           </div>
       )}

        {/* Profile Detail Modal */}
        {profileSpecialist && (
            <div 
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
                onClick={() => setProfileSpecialist(null)}
            >
                <div 
                    className="bg-charcoal border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-slide-in-up text-white max-h-[90vh] overflow-y-auto no-scrollbar relative"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top Bar with Close Button */}
                    <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs uppercase font-bold tracking-wider text-gray-400">Specialist Profile</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-saffron-500"></span>
                            <span className="text-xs text-saffron-400 font-semibold">{profileSpecialist.role}</span>
                        </div>
                        <button 
                            onClick={() => setProfileSpecialist(null)}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Profile Hero Header */}
                    <div className="flex items-start gap-4 mb-5">
                        <div className="relative shrink-0">
                            {profileSpecialist.role === 'AI Companion' ? (
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg border border-indigo-400/30">
                                    <Brain size={36} />
                                </div>
                            ) : (
                                <img 
                                    src={profileSpecialist.avatar} 
                                    alt={profileSpecialist.name} 
                                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md" 
                                />
                            )}
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-charcoal ${profileSpecialist.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h2 className="text-xl font-bold text-white tracking-tight">{profileSpecialist.name}</h2>
                                {profileSpecialist.role !== 'AI Companion' && (
                                    <CheckCircle size={18} className="text-blue-400 shrink-0" title="Verified Specialist" />
                                )}
                            </div>
                            <p className="text-xs font-semibold text-saffron-400 mb-2">{profileSpecialist.specialty}</p>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1 bg-yellow-500/15 border border-yellow-500/30 px-2 py-0.5 rounded-md text-yellow-400 text-xs font-bold">
                                    <Star size={12} fill="currentColor" /> {profileSpecialist.rating}
                                </div>
                                <div className="text-xs text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <MapPin size={11} className="text-gray-400" />
                                    {profileSpecialist.location}
                                </div>
                                <div className={`text-xs px-2 py-0.5 rounded-md font-medium ${profileSpecialist.isOnline ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-white/10'}`}>
                                    {profileSpecialist.isOnline ? 'Online Now' : 'Accepting Bookings'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metric Highlights */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-white/[0.03] border border-white/10 rounded-2xl mb-5 text-center">
                        <div className="p-2">
                            <div className="flex items-center justify-center text-saffron-400 mb-1">
                                <Award size={16} />
                            </div>
                            <div className="text-[11px] text-gray-400">Experience</div>
                            <div className="text-xs font-bold text-white mt-0.5">
                                {typeof profileSpecialist.experienceYears === 'number' 
                                    ? `${profileSpecialist.experienceYears} Years` 
                                    : profileSpecialist.experienceYears}
                            </div>
                        </div>
                        <div className="p-2 border-x border-white/10">
                            <div className="flex items-center justify-center text-blue-400 mb-1">
                                <Clock size={16} />
                            </div>
                            <div className="text-[11px] text-gray-400">Sessions</div>
                            <div className="text-xs font-bold text-white mt-0.5">
                                {profileSpecialist.sessionsCompleted.toLocaleString()}+
                            </div>
                        </div>
                        <div className="p-2">
                            <div className="flex items-center justify-center text-green-400 mb-1">
                                <span className="font-bold text-sm">₹</span>
                            </div>
                            <div className="text-[11px] text-gray-400">Fee</div>
                            <div className="text-xs font-bold text-white mt-0.5">
                                {profileSpecialist.price === 0 ? 'Free' : `₹${profileSpecialist.price}/session`}
                            </div>
                        </div>
                    </div>

                    {/* Professional Background Details */}
                    <div className="space-y-3 mb-5">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-start gap-3">
                            <GraduationCap size={18} className="text-saffron-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Qualification</div>
                                <div className="text-sm font-semibold text-white mt-0.5">{profileSpecialist.qualification}</div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-start gap-3">
                            <Building2 size={18} className="text-blue-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Practice / Affiliation</div>
                                <div className="text-sm font-semibold text-white mt-0.5">{profileSpecialist.workplace}</div>
                            </div>
                        </div>
                    </div>

                    {/* Bio / Approach */}
                    <div className="mb-5">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About & Approach</h3>
                        <p className="text-sm text-gray-300 leading-relaxed bg-white/[0.02] border border-white/5 rounded-xl p-4">
                            {profileSpecialist.bio}
                        </p>
                    </div>

                    {/* Languages */}
                    <div className="mb-6">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            <Languages size={14} className="text-saffron-400" />
                            <span>Languages Spoken</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profileSpecialist.languages.map(l => (
                                <span key={l} className="text-xs font-medium text-gray-200 bg-white/10 border border-white/15 px-3 py-1 rounded-lg">
                                    {l}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Direct Booking CTA from inside modal */}
                    <div className="pt-2 border-t border-white/10">
                        <button
                            onClick={() => {
                                const s = profileSpecialist;
                                setProfileSpecialist(null);
                                handleSpecialistClick(s);
                            }}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2 ${
                                profileSpecialist.isOnline || profileSpecialist.role === 'AI Companion'
                                    ? 'bg-navy-800 hover:bg-navy-700 text-white' 
                                    : 'bg-saffron-500 hover:bg-saffron-600 text-white'
                            }`}
                        >
                            {profileSpecialist.role === 'AI Companion' ? (
                                <>
                                    <Brain size={18} />
                                    Start Live AI Session (Free)
                                </>
                            ) : profileSpecialist.isOnline ? (
                                <>
                                    <Video size={18} />
                                    Join Now • {profileSpecialist.price === 0 ? 'Free' : `₹${profileSpecialist.price}`}
                                </>
                            ) : (
                                <>
                                    <CalendarIcon size={18} />
                                    Book Slot • ₹{profileSpecialist.price}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )}

       {/* Booking Modal */}
       {selectedSpecialist && bookingStep !== 'NONE' && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
               <div className="bg-charcoal border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-in-up text-white max-h-[90vh] overflow-y-auto no-scrollbar">
                   {bookingStep === 'DATE' && (
                       <>
                           <div className="flex justify-between items-center mb-6">
                               <h2 className="text-xl font-bold">Book Session</h2>
                               <button onClick={() => { setSelectedSpecialist(null); setBookingStep('NONE'); }}><X size={24} className="text-gray-400" /></button>
                           </div>
                           
                           <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                               <img src={selectedSpecialist.avatar} alt="Avatar" className="w-14 h-14 rounded-full" />
                               <div>
                                   <h3 className="font-bold text-white">{selectedSpecialist.name}</h3>
                                   <p className="text-xs text-gray-400">{selectedSpecialist.role} • ₹{selectedSpecialist.price}</p>
                                   <div className={`mt-1 text-[10px] font-bold ${selectedSpecialist.isOnline ? 'text-green-500' : 'text-gray-500'}`}>
                                      {selectedSpecialist.isOnline ? '• Online Now' : '• Currently Offline'}
                                   </div>
                               </div>
                           </div>

                           {/* Date Selector */}
                           <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Select Date</h3>
                           <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
                               {bookingDates.map((d, idx) => {
                                   const isSelected = d.toDateString() === selectedBookingDate.toDateString();
                                   return (
                                       <button
                                           key={idx}
                                           onClick={() => { setSelectedBookingDate(d); setSelectedTimeSlot(''); }}
                                           className={`flex flex-col items-center min-w-[72px] py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex-none ${
                                               isSelected
                                                   ? 'bg-saffron-500 text-white border-saffron-500 shadow-md'
                                                   : 'border-white/10 text-gray-400 hover:border-white/30 bg-white/5'
                                           }`}
                                       >
                                           <span className="text-[10px] uppercase opacity-70">{formatDateWeekday(d)}</span>
                                           <span className="mt-0.5">{formatDateLabel(d, idx)}</span>
                                       </button>
                                   );
                               })}
                           </div>

                           {/* Time Slot Grid */}
                           <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Select Time Slot</h3>
                           <div className="grid grid-cols-3 gap-3 mb-6">
                               {TIME_SLOTS.map(time => {
                                   const past = isTimeSlotPast(time);
                                   const isSelected = selectedTimeSlot === time;
                                   return (
                                       <button 
                                         key={time} 
                                         onClick={() => !past && setSelectedTimeSlot(time)}
                                         disabled={past}
                                         className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                                             past
                                                 ? 'border-white/5 text-gray-600 bg-white/[0.02] cursor-not-allowed line-through'
                                                 : isSelected
                                                     ? 'bg-saffron-500 text-white border-saffron-500 shadow-md'
                                                     : 'border-white/10 text-gray-400 hover:border-white/30 bg-white/5'
                                         }`}
                                       >
                                           {time}
                                       </button>
                                   );
                               })}
                           </div>

                           <button 
                             onClick={proceedToPayment}
                             disabled={!selectedTimeSlot}
                             className="w-full py-4 bg-navy-800 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy-700 transition-colors"
                           >
                               Proceed to Pay ₹{selectedSpecialist.price}
                           </button>
                       </>
                   )}

                   {/* PAYMENT STEP — UPI QR */}
                   {bookingStep === 'PAYMENT' && (
                       <>
                           <div className="flex justify-between items-center mb-5">
                               <div className="flex items-center gap-2">
                                   <button onClick={() => setBookingStep('DATE')} className="p-1 rounded-lg hover:bg-white/10 transition-colors"><ChevronLeft size={20} className="text-gray-400" /></button>
                                   <h2 className="text-xl font-bold">Payment</h2>
                               </div>
                               <button onClick={() => { setSelectedSpecialist(null); setBookingStep('NONE'); }}><X size={24} className="text-gray-400" /></button>
                           </div>

                           {/* Summary card */}
                           <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-5">
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-gray-400">Session with</span>
                                   <span className="font-bold text-white">{selectedSpecialist.name}</span>
                               </div>
                               <div className="flex justify-between items-center text-sm mt-1.5">
                                   <span className="text-gray-400">Date</span>
                                   <span className="font-bold text-white">{formatBookingDateFull(selectedBookingDate)}</span>
                               </div>
                               <div className="flex justify-between items-center text-sm mt-1.5">
                                   <span className="text-gray-400">Time</span>
                                   <span className="font-bold text-white">{selectedTimeSlot}</span>
                               </div>
                               <div className="border-t border-white/10 mt-3 pt-3 flex justify-between items-center">
                                   <span className="text-gray-400 text-sm">Total</span>
                                   <span className="text-xl font-black text-saffron-400">₹{selectedSpecialist.price}</span>
                               </div>
                           </div>

                           {/* QR Code */}
                           {buildUpiLink() ? (
                               <div className="flex flex-col items-center mb-5">
                                   <div className="bg-white rounded-2xl p-4 shadow-lg mb-3">
                                       <QRCodeSVG
                                           value={buildUpiLink()}
                                           size={200}
                                           level="M"
                                           includeMargin={false}
                                       />
                                   </div>
                                   <div className="flex items-center gap-2 text-sm text-gray-300">
                                       <QrCode size={16} className="text-saffron-400" />
                                       <span>Scan to Pay <strong className="text-saffron-400">₹{selectedSpecialist.price}</strong> via UPI</span>
                                   </div>
                                   <p className="text-[10px] text-gray-500 mt-1.5 text-center max-w-[260px]">
                                       Open any UPI app (Google Pay, PhonePe, Paytm) and scan this code.
                                   </p>
                               </div>
                           ) : (
                               <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5 text-center">
                                   <p className="text-amber-300 text-sm font-medium">UPI ID not configured.</p>
                                   <p className="text-amber-400/70 text-[10px] mt-1">Set VITE_UPI_ID in .env to enable QR payments.</p>
                               </div>
                           )}

                           {/* Manual confirmation */}
                           <label className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors mb-5">
                               <input
                                   type="checkbox"
                                   checked={paymentConfirmed}
                                   onChange={e => setPaymentConfirmed(e.target.checked)}
                                   className="mt-0.5 w-5 h-5 rounded border-white/20 accent-green-500 flex-none"
                               />
                               <div>
                                   <span className="text-sm font-bold text-white">I've completed the payment</span>
                                   <p className="text-[10px] text-gray-500 mt-0.5">Check this box after you have successfully paid via UPI.</p>
                               </div>
                           </label>

                           <button
                               onClick={finalizeBooking}
                               disabled={!paymentConfirmed}
                               className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                           >
                               <ShieldCheck size={18} />
                               Confirm Booking
                           </button>
                       </>
                   )}

                   {bookingStep === 'CONFIRM' && (
                       <div className="text-center py-8">
                           <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                               <CheckCircle size={40} className="text-green-500" />
                           </div>
                           <h2 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h2>
                           <p className="text-gray-400 mb-1">
                               Your session with <strong className="text-white">{selectedSpecialist.name}</strong>
                           </p>
                           <p className="text-gray-400 mb-6">
                               {formatBookingDateFull(selectedBookingDate)} at {selectedTimeSlot}
                           </p>

                           <button 
                               onClick={addToGoogleCalendar}
                               className="w-full py-3 mb-4 bg-white text-navy-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
                           >
                               <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-5 h-5" alt="GCal" />
                               Add to Google Calendar
                           </button>

                           <button 
                               onClick={() => { setSelectedSpecialist(null); setBookingStep('NONE'); setView('SCHEDULE'); }}
                               className="text-gray-400 text-sm hover:text-white"
                           >
                               Close
                           </button>
                       </div>
                   )}
               </div>
           </div>
       )}
    </div>
  );
}
