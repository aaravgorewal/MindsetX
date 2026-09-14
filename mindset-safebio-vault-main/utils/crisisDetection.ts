/**
 * MindSet Sentinel - Centralized Crisis & Self-Harm Detection Engine
 * Shared across Text Chat (ChatInterface), Voice Calls (LiveSession), and Gemini Service.
 *
 * Clinical & Linguistic Standard:
 * 1. Word Boundary Enforcement (\b): Prevents false alarms on common words (e.g., "diet" contains "die").
 * 2. PHQ-9 Item 9 Alignment: Detects passive/active suicidal ideation phrases like "better off dead".
 * 3. Contextual Hinglish/Devanagari: Detects student vernacular without tripping on harmless conversational Hindi.
 */

export const CRISIS_HELPLINES = [
  {
    name: 'Tele-MANAS',
    number: '14416',
    tollFree: '1800-891-4416',
    hours: '24/7',
    description: 'Ministry of Health & Family Welfare, Govt. of India (Free, 20+ Languages)'
  },
  {
    name: 'KIRAN',
    number: '1800-599-0019',
    hours: '24/7',
    description: 'Ministry of Social Justice & Empowerment, Govt. of India (Free Psychological First-Aid)'
  },
  {
    name: 'National Emergency',
    number: '112',
    hours: '24/7',
    description: 'All-in-one Emergency (Police / Ambulance)'
  }
];

export const CRISIS_PATTERNS: RegExp[] = [
  // ── English Explicit Intent & Clinical Terms (Word Boundary \b Enforced) ──
  /\bbetter off dead\b/i,           // PHQ-9 Item 9 clinical standard
  /\bnot worth living\b/i,
  /\bcan'?t go on\b/i,              // "can't go on" / "cant go on"
  /\bwant to die\b/i,
  /\bwanna die\b/i,
  /\bdon'?t want to live\b/i,       // "don't want to live" / "dont want to live"
  /\bno reason to live\b/i,
  /\bkill myself\b/i,
  /\bkilling myself\b/i,
  /\bend my life\b/i,
  /\bending my life\b/i,
  /\bend it all\b/i,
  /\btake my life\b/i,
  /\btaking my life\b/i,
  /\bhurt myself\b/i,
  /\bhurting myself\b/i,
  /\bharm myself\b/i,
  /\bharming myself\b/i,
  /\bself[\s-]harm\b/i,             // "self harm" / "self-harm"
  /\bcutting myself\b/i,
  /\bcut myself\b/i,
  /\boverdose\b/i,
  /\bod['\s]?ing\b/i,
  /\bjump off\b/i,
  /\bhang myself\b/i,
  /\bsuicide\b/i,
  /\bsuicidal\b/i,
  /\bdie\b/i,                       // STRICT word boundary: "diet" does NOT match
  /\bno way out\b/i,
  /\bhopeless\b/i,

  // ── Hinglish Student Vernacular (Contextual Phrasings) ────────────────────
  /\bjeene ka man{1,2} nahi\b/i,    // "jeene ka man nahi", "jeene ka mann nahi"
  /\bjeene ki ich{1,2}ha nahi\b/i,
  /\bkhud ko khatam\b/i,            // contextual qualifier prevents false alarm on "khatam ho gaya"
  /\bzindagi khatam\b/i,
  /\bmarna chahta\b/i,
  /\bmarna chahti\b/i,
  /\bmarne ka man{1,2}\b/i,
  /\bjaan de den[a-z]*\b/i,
  /\bjaan de dung[ai]\b/i,
  /\bjaan deni hai\b/i,
  /\bmar jaunga\b/i,
  /\bmar jaungi\b/i,
  /\bmar jau\b/i,
  /\bkhudkushi\b/i,
  /\baatmaghat\b/i,
  /\batmaghat\b/i,
  /\bapne aap ko chot\b/i,
  /\bapne aap ko nuksan\b/i,

  // ── Devanagari Hindi Script ───────────────────────────────────────────────
  /आत्महत्या/,
  /खुदकुशी/,
  /जान देनी|जान दे दूंगा|जान दे दूंगी/,
  /मरना चाहता|मरना चाहती|मरने का मन/,
  /जीना नहीं चाहता|जीना नहीं चाहती|जीने का मन नहीं/,
  /जिंदगी खत्म|खुद को खत्म/
];

/**
 * Detects whether an input message or speech utterance contains crisis or self-harm ideation.
 * Pure function with zero side-effects.
 */
export const detectCrisis = (message: string): boolean => {
  if (!message || typeof message !== 'string') return false;
  const text = message.trim();
  if (!text) return false;

  return CRISIS_PATTERNS.some(pattern => pattern.test(text));
};

/**
 * Returns formatted crisis helpline response in English or Hindi.
 */
export const getCrisisResponse = (isVoiceMode: boolean = false, targetLanguage: string = 'en-IN'): string => {
  const isHindi = targetLanguage === 'hi-IN';

  if (isVoiceMode) {
    if (isHindi) {
      return "मैं आपकी सुरक्षा को लेकर चिंतित हूँ और आप अकेले नहीं हैं। कृपया तुरंत 24 घंटे उपलब्ध राष्ट्रीय हेल्पलाइन पर संपर्क करें — टेली-मानस: 14416 या किरण: 1800-599-0019। ये दोनों बिल्कुल निशुल्क और सुरक्षित हैं।";
    }
    return "I am deeply concerned about your safety, and you do not have to carry this alone. Please reach out right now — call Tele-MANAS at 14416 or the KIRAN helpline at 1800-599-0019. Both are free, confidential, and available 24/7 across India.";
  }

  if (isHindi) {
    return "मुझे आपकी सुरक्षा को लेकर गहरी चिंता है। आप अकेले नहीं हैं — कृपया तुरंत इन राष्ट्रीय हेल्पलाइन पर संपर्क करें:\n\n• **टेली-मानस (Tele-MANAS):** 14416 (या 1800-891-4416) — 24/7 निशुल्क एवं गोपनीय\n• **किरण (KIRAN Helpline):** 1800-599-0019 — 24/7 निशुल्क मानसिक स्वास्थ्य सेवा\n• **राष्ट्रीय आपातकालीन सेवा:** 112\n\nसहायता तुरंत उपलब्ध है। कृपया अभी कॉल करें।";
  }

  return "I'm deeply concerned about what you're going through, and your safety is the top priority. You do not have to carry this alone. Please connect immediately with professional, confidential support:\n\n• **Tele-MANAS (Govt. of India):** Dial **14416** (or toll-free 1800-891-4416) — Free, 24/7 in 20+ languages\n• **KIRAN Mental Health Helpline:** Dial **1800-599-0019** — Free, 24/7 psychological first aid\n• **National Emergency Service:** Dial **112**\n\nThese services are free, confidential, and ready to support you right now.";
};
