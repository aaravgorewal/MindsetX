// ============================================================================
// MindSet AI — 3-Tier Multi-Provider Text-to-Speech (TTS) Service
// ============================================================================
// Fallback Chain:
//   Tier 1 (Primary):   ElevenLabs (eleven_multilingual_v2, pre-made warm voice)
//   Tier 2 (Fallback):  OpenAI TTS (tts-1, nova voice)
//   Tier 3 (Offline):   Browser SpeechSynthesis (hi-IN / en-IN native voices)
// ============================================================================

export type TtsProvider = 'elevenlabs' | 'openai' | 'offline';

export type TtsProviderLabel =
  | 'Natural Voice (ElevenLabs)'
  | 'Natural Voice (OpenAI)'
  | 'Basic Voice (Offline)';

export const TTS_PROVIDER_LABELS: Record<TtsProvider, TtsProviderLabel> = {
  elevenlabs: 'Natural Voice (ElevenLabs)',
  openai: 'Natural Voice (OpenAI)',
  offline: 'Basic Voice (Offline)',
};

// ElevenLabs Voice IDs (Pre-made voices in ElevenLabs library)
// Sarah: Soft, warm, compassionate conversational tone, ideal for peer & therapy support
export const ELEVENLABS_VOICE_SARAH = 'EXAVITQu4vr4xnSDxMaL';
export const ELEVENLABS_VOICE_RACHEL = '21m00Tcm4TlvDq8ikWAM';
export const ELEVENLABS_MODEL_ID = 'eleven_multilingual_v2';

export interface SynthesizeOptions {
  lang?: 'en-IN' | 'hi-IN';
  onStart?: (provider: TtsProvider, label: TtsProviderLabel) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  forceProvider?: TtsProvider;
}

export interface SynthesizeResult {
  provider: TtsProvider;
  providerLabel: TtsProviderLabel;
  stop: () => void;
  audioPromise: Promise<void>;
}

// Active speech state for interruption
let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioBlobUrl: string | null = null;
let isSpeakingActive = false;

/**
 * Get ElevenLabs API Key from all possible environment bindings
 */
export const getElevenLabsApiKey = (): string => {
  const key =
    (import.meta as any).env?.VITE_ELEVENLABS_API_KEY ||
    (import.meta as any).env?.ELEVENLABS_API_KEY ||
    (typeof process !== 'undefined' && (process as any).env?.ELEVENLABS_API_KEY) ||
    (typeof process !== 'undefined' && (process as any).env?.VITE_ELEVENLABS_API_KEY) ||
    (typeof window !== 'undefined' && (window as any).__ELEVENLABS_API_KEY) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('mindset_elevenlabs_api_key')) ||
    '';
  return (key || '').trim();
};

/**
 * Get OpenAI API Key
 */
export const getOpenAIApiKey = (): string => {
  const key =
    (import.meta as any).env?.VITE_OPENAI_API_KEY ||
    (import.meta as any).env?.OPENAI_API_KEY ||
    (typeof process !== 'undefined' && (process as any).env?.OPENAI_API_KEY) ||
    (typeof process !== 'undefined' && (process as any).env?.VITE_OPENAI_API_KEY) ||
    (typeof window !== 'undefined' && (window as any).__OPENAI_API_KEY) ||
    '';
  return (key || '').trim();
};

/**
 * Clean text for spoken audio generation (strip asterisks, markdown, headers)
 */
export const cleanTextForSpeech = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[*_#`~>\[\]\(\)]/g, ' ')
    .replace(/\|\|SENTIMENT:[^|]+\|\|/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Stop any active audio or speech synthesis immediately (user interruption)
 */
export const stopActiveSpeech = (): void => {
  isSpeakingActive = false;

  if (activeAudioElement) {
    try {
      activeAudioElement.onplay = null;
      activeAudioElement.onended = null;
      activeAudioElement.onerror = null;
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.removeAttribute('src');
    } catch (e) {}
    activeAudioElement = null;
  }

  if (activeAudioBlobUrl) {
    try {
      URL.revokeObjectURL(activeAudioBlobUrl);
    } catch (e) {}
    activeAudioBlobUrl = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
};

/**
 * Tier 1: Call ElevenLabs Multilingual v2 API
 */
const synthesizeElevenLabs = async (
  text: string,
  voiceId: string = ELEVENLABS_VOICE_SARAH
): Promise<Blob> => {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured in .env (ELEVENLABS_API_KEY).');
  }

  console.log(`[TTS Tier 1] Calling ElevenLabs API (model: ${ELEVENLABS_MODEL_ID}, voice: ${voiceId})...`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    let errDetail = '';
    try {
      const errJson = await response.json();
      errDetail = errJson?.detail?.message || JSON.stringify(errJson);
    } catch {
      errDetail = await response.text();
    }
    throw new Error(`ElevenLabs API HTTP ${response.status}: ${errDetail}`);
  }

  const blob = await response.blob();
  if (!blob || blob.size < 100) {
    throw new Error('ElevenLabs returned empty or invalid audio data.');
  }

  return blob;
};

/**
 * Tier 2: Call OpenAI TTS API (tts-1 / nova)
 */
const synthesizeOpenAI = async (text: string): Promise<Blob> => {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured in .env (VITE_OPENAI_API_KEY).');
  }

  console.log('[TTS Tier 2] Calling OpenAI TTS API (model: tts-1, voice: nova)...');

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'nova',
      input: text,
    }),
  });

  if (!response.ok) {
    let errDetail = '';
    try {
      const errJson = await response.json();
      errDetail = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      errDetail = await response.text();
    }
    throw new Error(`OpenAI TTS HTTP ${response.status}: ${errDetail}`);
  }

  const blob = await response.blob();
  if (!blob || blob.size < 100) {
    throw new Error('OpenAI returned empty or invalid audio data.');
  }

  return blob;
};

/**
 * Tier 3: Speak via Browser SpeechSynthesis
 */
const speakWithBrowserSynthesis = (
  text: string,
  lang: 'en-IN' | 'hi-IN' = 'en-IN',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return reject(new Error('Browser SpeechSynthesis is not supported in this environment.'));
    }

    // Cancel any ongoing speech
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95; // slightly slower for calm, supportive peer cadence
    utterance.pitch = 1.0;

    // Pick best available voice for language
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (lang === 'hi-IN') {
        const hindiVoice = voices.find(
          (v) => v.lang === 'hi-IN' || v.lang.toLowerCase().startsWith('hi')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const indianVoice = voices.find(
          (v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india')
        );
        const englishVoice = voices.find(
          (v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('whisper')
        );
        if (indianVoice) utterance.voice = indianVoice;
        else if (englishVoice) utterance.voice = englishVoice;
      }
    }

    let hasStarted = false;
    utterance.onstart = () => {
      hasStarted = true;
      isSpeakingActive = true;
      onStart?.();
    };

    utterance.onend = () => {
      isSpeakingActive = false;
      onEnd?.();
      resolve();
    };

    utterance.onerror = (e) => {
      isSpeakingActive = false;
      // Some browsers fire error on cancel or user interrupt, resolve gracefully
      if (e.error === 'interrupted' || e.error === 'canceled') {
        onEnd?.();
        resolve();
      } else {
        console.warn('[SpeechSynthesis warning]:', e.error);
        onEnd?.();
        resolve();
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
      // Failsafe for browsers where onstart doesn't fire immediately
      setTimeout(() => {
        if (!hasStarted && isSpeakingActive) {
          onStart?.();
        }
      }, 100);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Play audio Blob via HTML5 Audio element
 */
const playAudioBlob = (
  blob: Blob,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    stopActiveSpeech();

    const url = URL.createObjectURL(blob);
    activeAudioBlobUrl = url;

    const audio = new Audio(url);
    activeAudioElement = audio;

    audio.onplay = () => {
      isSpeakingActive = true;
      onStart?.();
    };

    audio.onended = () => {
      isSpeakingActive = false;
      if (activeAudioBlobUrl) {
        URL.revokeObjectURL(activeAudioBlobUrl);
        activeAudioBlobUrl = null;
      }
      activeAudioElement = null;
      onEnd?.();
      resolve();
    };

    audio.onerror = (e) => {
      isSpeakingActive = false;
      if (activeAudioBlobUrl) {
        URL.revokeObjectURL(activeAudioBlobUrl);
        activeAudioBlobUrl = null;
      }
      activeAudioElement = null;
      onEnd?.();
      resolve(); // Graceful completion on cancel or abort
    };

    audio.play().catch((err) => {
      console.warn('[TTS Audio Play warning]:', err);
      // Could be browser autoplay restriction, fall back to resolve
      isSpeakingActive = false;
      onEnd?.();
      resolve();
    });
  });
};

/**
 * Synthesize and play speech with full 3-tier fallback chain
 * Tier 1: ElevenLabs -> Tier 2: OpenAI -> Tier 3: Browser Offline SpeechSynthesis
 */
export const synthesizeAndPlay = async (
  rawText: string,
  options: SynthesizeOptions = {}
): Promise<SynthesizeResult> => {
  const text = cleanTextForSpeech(rawText);
  if (!text) {
    return {
      provider: 'offline',
      providerLabel: TTS_PROVIDER_LABELS.offline,
      stop: () => {},
      audioPromise: Promise.resolve(),
    };
  }

  const lang = options.lang || (text.match(/[\u0900-\u097F]/) ? 'hi-IN' : 'en-IN');
  const forceProvider = options.forceProvider;

  // Stop any ongoing speech before starting a new one
  stopActiveSpeech();

  // -------------------------------------------------------------
  // TIER 1: ElevenLabs (Primary)
  // -------------------------------------------------------------
  if (!forceProvider || forceProvider === 'elevenlabs') {
    const elevenKey = getElevenLabsApiKey();
    if (elevenKey) {
      try {
        const blob = await synthesizeElevenLabs(text);
        const provider: TtsProvider = 'elevenlabs';
        const label = TTS_PROVIDER_LABELS.elevenlabs;

        console.log(`[TTS SUCCESS] Responded via Tier 1: ElevenLabs ("${label}")`);
        options.onStart?.(provider, label);

        const playPromise = playAudioBlob(blob, undefined, options.onEnd);

        return {
          provider,
          providerLabel: label,
          stop: stopActiveSpeech,
          audioPromise: playPromise,
        };
      } catch (elevenErr: any) {
        console.warn('[TTS Tier 1 Failed] ElevenLabs error:', elevenErr?.message || elevenErr);
        console.log('[TTS Fallback] Falling back to Tier 2 (OpenAI TTS)...');
      }
    } else {
      console.log('[TTS Tier 1 Skipped] ELEVENLABS_API_KEY not set in .env. Falling back to Tier 2 (OpenAI)...');
    }
  }

  // -------------------------------------------------------------
  // TIER 2: OpenAI (Fallback)
  // -------------------------------------------------------------
  if (!forceProvider || forceProvider === 'openai') {
    const openaiKey = getOpenAIApiKey();
    if (openaiKey) {
      try {
        const blob = await synthesizeOpenAI(text);
        const provider: TtsProvider = 'openai';
        const label = TTS_PROVIDER_LABELS.openai;

        console.log(`[TTS SUCCESS] Responded via Tier 2: OpenAI ("${label}")`);
        options.onStart?.(provider, label);

        const playPromise = playAudioBlob(blob, undefined, options.onEnd);

        return {
          provider,
          providerLabel: label,
          stop: stopActiveSpeech,
          audioPromise: playPromise,
        };
      } catch (openaiErr: any) {
        console.warn('[TTS Tier 2 Failed] OpenAI TTS error:', openaiErr?.message || openaiErr);
        console.log('[TTS Fallback] Falling back to Tier 3 (Offline Browser SpeechSynthesis)...');
      }
    } else {
      console.log('[TTS Tier 2 Skipped] VITE_OPENAI_API_KEY not set. Falling back to Tier 3 (Offline)...');
    }
  }

  // -------------------------------------------------------------
  // TIER 3: Browser SpeechSynthesis (Last Resort Offline)
  // -------------------------------------------------------------
  const provider: TtsProvider = 'offline';
  const label = TTS_PROVIDER_LABELS.offline;

  console.log(`[TTS SUCCESS] Responded via Tier 3: Browser SpeechSynthesis ("${label}")`);
  options.onStart?.(provider, label);

  const speechPromise = speakWithBrowserSynthesis(text, lang, undefined, options.onEnd);

  return {
    provider,
    providerLabel: label,
    stop: stopActiveSpeech,
    audioPromise: speechPromise,
  };
};
