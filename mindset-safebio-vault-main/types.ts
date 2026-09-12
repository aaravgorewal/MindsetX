
export enum Screen {
  HOME = 'HOME',
  CHAT = 'CHAT',
  VAULT = 'VAULT',
  STUDIO = 'STUDIO',
  LIVE = 'LIVE',
  SENTINEL = 'SENTINEL',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE'
}

export interface MessageOption {
  label: string;
  value: string | number;
  action?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  groundingUrls?: string[];
  isError?: boolean;
  options?: MessageOption[];
  sentimentScore?: number; // -1.0 to 1.0
  /** Which AI provider generated this SDoH response */
  provider?: 'gemini' | 'openai' | 'offline-template';
}

export interface MoodEntry {
  date: string;
  score: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: 'Aadhaar' | 'Vaccine' | 'DNA' | 'Prescription' | 'MentalHealth';
  isVerified: boolean;
  date: string;
}

export interface VideoGenerationState {
  status: 'idle' | 'generating' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

export interface ImageGenerationState {
  status: 'idle' | 'generating' | 'completed' | 'failed';
  imageUrl?: string;
  error?: string;
}

export interface AssessmentState {
  active: boolean;
  currentStep: number; // -1 for intro, 0-8 for questions
  scores: number[];
}

export interface SentinelMetrics {
  currentSentiment: number; // -1 to 1
  averageSentiment: number;
  phqScore: number;
  distressIndex: number; // 0 to 1
  behavioralFlags: string[];
}

// --- NEW STUDIO TYPES ---
export interface Influencer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  specialty: 'Allopathy' | 'Ayurveda' | 'Yoga';
  bio: string;
  followers: string;
  verified: boolean;
  hourlyRate: number;
}

export interface Reel {
  id: string;
  influencerId: string;
  videoUrl: string; // Placeholder or real
  thumbnail: string;
  description: string;
  category: 'Allopathy' | 'Ayurveda' | 'Yoga';
  likes: number;
  comments: number;
  isBookable: boolean;
}

// --- AGENTIC AI TYPES ---
export interface AgenticStep {
  id: string;
  toolName: string;
  endpoint: string;
  description: string;
  args: Record<string, any>;
  resultSummary: string;
  rawResult?: any;
  timestamp: string;
  status: 'invoked' | 'success' | 'error';
}

export interface AgenticWorkflowResult {
  userGoal: string;
  steps: AgenticStep[];
  plan: string;
  provider: 'gemini' | 'openai' | 'offline-agent';
  timestamp: string;
}

// --- USER PROFILE TYPES ---
export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt?: any;
  onboardingComplete: boolean;
  preferredLanguage: string;
}
