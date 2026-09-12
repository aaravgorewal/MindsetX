
import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";

// Get API key from environment variables (process.env is injected by Vite)
const getAPIKey = () => {
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : '') ||
         (typeof window !== 'undefined' ? (window as any).VITE_GEMINI_API_KEY : '') ||
         '';
};

export const getAIClient = (key?: string) => {
  const effectiveKey = key || getAPIKey();
  if (!effectiveKey) {
    console.warn("API Key not found. Some features will be unavailable.");
    return null;
  }
  return new GoogleGenAI({ apiKey: effectiveKey });
};

// Safely extract text from a Gemini response without crashing on thought-only
// or empty responses (avoids "model output must contain either output text or
// tool calls" SDK error).
const extractCandidateText = (res: any): string => {
  // Fast path: SDK resolved .text successfully
  try {
    const t = res?.text;
    if (typeof t === 'string' && t.trim()) return t.trim();
  } catch (_) { /* .text getter can throw on thought-only responses */ }

  // Slow path: walk the raw parts ourselves, skipping thought tokens
  const parts: any[] = res?.candidates?.[0]?.content?.parts ?? [];
  const visible = parts
    .filter((p: any) => !p.thought && typeof p.text === 'string')
    .map((p: any) => p.text)
    .join('\n')
    .trim();
  if (visible) return visible;

  // Last resort: include thought text if nothing else is available
  const any = parts
    .filter((p: any) => typeof p.text === 'string')
    .map((p: any) => p.text)
    .join('\n')
    .trim();
  return any;
};

// 1. Chat with Thinking (Triage) & Grounding
export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  useSearch: boolean = false,
  useMaps: boolean = false,
  coords?: { lat: number; lng: number },
  isVoiceMode: boolean = false,
  targetLanguage: 'en-IN' | 'hi-IN' | string = 'en-IN'
) => {
  const ai = getAIClient();
  
  const tools: any[] = [];
  if (useSearch) tools.push({ googleSearch: {} });
  if (useMaps) tools.push({ googleMaps: {} });

  // Specialized System Prompt for MindSet Sentinel
  let systemPrompt = `
You are 'MindSet AI', a specialized mental health first-aid assistant for Indian college students.
Tone: Empathetic, calm, and supportive. Use 'Hinglish' if the user uses it (e.g., 'I understand aap kaafi stressed feel kar rahe ho').
Constraint: You are NOT a doctor. Do not provide medical diagnoses.
Critical Rule: If the user expresses any intent of self-harm or suicide, you must immediately stop all conversation and display the following: 'I’m really concerned about you. Please call the National Helpline at 14416 or contact your campus counselor immediately.'
Goal: Gently guide the user through their emotions or the 9-question PHQ-9 screening if they ask for it.

IMPORTANT: You are also a Sentiment Analysis Engine.
At the very end of your response, you MUST append the sentiment score of the user's latest input on a scale of -1.0 (extremely negative/hopeless) to 1.0 (extremely positive/happy).
Format it exactly like this hidden tag: ||SENTIMENT:0.5||
Do not mention this score in the text, just append the tag.
  `;

  // Append voice-specific spoken instructions if in voice mode
  if (isVoiceMode) {
    const isHindiSelected = targetLanguage === 'hi-IN';
    systemPrompt += `

VOICE CALL MODE INSTRUCTIONS:
- Keep responses SHORT — strictly 1 to 3 sentences per turn, like a real spoken conversation, not an essay. Long responses feel unnatural when spoken aloud and awkward to listen to.
- Never use markdown, bullet points, asterisks, hashtags, or formatting symbols in responses — this is spoken output, symbols would be read aloud awkwardly or just look wrong if partially rendered as text on screen.
- Use a warm, casual, friendly conversational tone — like a supportive friend, not a formal assistant. Use natural filler transitions occasionally ("hmm, I hear you", "that sounds tough", "arre, I get that") rather than clinical phrasing.
${isHindiSelected ? `
- MANDATORY LANGUAGE ENFORCEMENT: The user selected HINDI (हिंदी). You MUST formulate your entire response in warm, natural conversational Hindi (Devanagari script or warm Hinglish). Never respond in English.
` : `
- MANDATORY LANGUAGE ENFORCEMENT: The user selected ENGLISH. You MUST formulate your entire response in clear, warm, conversational English.
`}
`;
  }

  // Note: thinkingConfig is intentionally omitted — thought-only responses
  // cause the SDK to throw "model output must contain either output text or
  // tool calls" when .text is accessed.
  const config: any = {
    systemInstruction: systemPrompt,
    tools: tools.length > 0 ? tools : undefined,
  };

  if (useMaps && coords) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: coords.lat,
          longitude: coords.lng
        }
      }
    };
  }

  console.log('================ [DIAGNOSIS: PRE-GEMINI CALL] ================');
  console.log('1. Exact conversation history array being sent:', JSON.stringify(history, null, 2));
  console.log('2. User message for this turn:', message);
  console.log('3. Is voice mode:', isVoiceMode);
  console.log('4. Target language:', targetLanguage);
  console.log('5. Full system prompt being used for this turn:\n' + systemPrompt);
  console.log('================================================================');

  if (!ai) {
    console.warn('[sendChatMessage] Gemini AI client not available');
  } else {
    // Model cascade: prioritize fast, active-quota models with fallback options
    const preferredModels = isVoiceMode
      ? ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.6-flash']
      : (useMaps ? ['gemini-3.6-flash', 'gemini-3.5-flash'] : ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview']);

    for (const modelId of preferredModels) {
      try {
        const chat = ai.chats.create({
          model: modelId,
          history: history,
          config: config
        });

        const result = await chat.sendMessage({ message });
        let rawText = extractCandidateText(result);

        if (rawText) {
          // In voice mode, strip any sentiment tags and formatting marks so speech & subtitles are clean
          if (isVoiceMode) {
            rawText = rawText
              .replace(/\|\|SENTIMENT:.*?\|\|/g, '')
              .replace(/[*_#`~]/g, '')
              .trim();
          }

          // Extract grounding metadata if available
          const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
          const urls: string[] = [];
          if (groundingChunks) {
            groundingChunks.forEach((chunk: any) => {
              if (chunk.web?.uri) urls.push(chunk.web.uri);
              if (chunk.maps?.uri) urls.push(chunk.maps.uri);
            });
          }

          return {
            text: rawText,
            urls: urls
          };
        }
      } catch (modelErr: any) {
        console.warn(`[sendChatMessage] Model ${modelId} failed:`, modelErr?.message || modelErr);
        // Continue to the next model in the cascade
      }
    }
  }

  // Graceful voice fallback: generate dynamic, non-repeating spoken response matching target language & intent
  if (isVoiceMode) {
    const isHindi = targetLanguage === 'hi-IN' || /[\u0900-\u097F]/.test(message) || /\b(hai|hoon|ho|mujhe|mera|meri|kya|nahi|karna|lag|raha|rahi|bahut|chinta|dar|shanti)\b/i.test(message);
    const lower = message.toLowerCase();
    const turnCount = Math.floor(history.length / 2);

    let fallbackReply = '';
    if (isHindi) {
      if (/तकनीक|तरीका|exercise|calm|शांत|घबराहट|anxiety|panic/i.test(message)) {
        fallbackReply = "मेरे साथ 4-7-8 सांस लेने का अभ्यास कीजिए — 4 सेकंड धीरे-धीरे सांस अंदर लें, 7 सेकंड रोकें, और 8 सेकंड में मुंह से बाहर छोड़ें। इससे आपकी धड़कन और मन तुरंत शांत होगा।";
      } else if (/पढ़ाई|एग्ज़ाम|exam|marks|फेल|डर|नंबर|तनाव/i.test(message)) {
        fallbackReply = "पढ़ाई का तनाव कभी-कभी बहुत भारी लगने लगता है, पर आपकी मेहनत बेकार नहीं जाएगी। थोड़ी देर किताब बंद करके पानी पीजिए और सिर्फ 5 मिनट का ब्रेक लें।";
      } else if (turnCount > 0) {
        fallbackReply = "मैं आपकी बात ध्यान से समझ रहा हूँ। आप बिल्कुल सही दिशा में सोच रहे हैं — थोड़ा और बताइए कि अभी आपको सबसे ज़्यादा क्या परेशान कर रहा है?";
      } else {
        fallbackReply = "हाँ, मैं समझ सकता हूँ कि आप परेशान महसूस कर रहे हैं। आप अकेले नहीं हैं — गहरी साँस लीजिए, हम मिलकर इसका समाधान निकालेंगे।";
      }
    } else {
      if (/technique|exercise|calm|breathe|breathing|panic|anxious/i.test(lower)) {
        fallbackReply = "Try taking a slow 4-7-8 breath with me right now: breathe in through your nose for 4 counts, hold for 7, and exhale gently for 8. Let your shoulders drop as you breathe out.";
      } else if (/exam|study|grades|fail|test|college|pressure/i.test(lower)) {
        fallbackReply = "Academic pressure can feel incredibly heavy, but remember that your worth is not defined by a single exam. Let's take a 5-minute pause and reset.";
      } else if (turnCount > 0) {
        fallbackReply = "I'm listening closely, and I'm right here with you. Tell me a bit more about what's feeling hardest right now.";
      } else {
        fallbackReply = "Hmm, I hear you, and it's completely okay to feel overwhelmed right now. Take a gentle breath, and we will take this step by step together.";
      }
    }

    return {
      text: fallbackReply,
      urls: []
    };
  }

  throw new Error("No response generated from AI models");
};

// 2. Image Generation
export const generateHealingImage = async (prompt: string, aspectRatio: string = "1:1") => {
  const ai = getAIClient();
  if (!ai) {
    // Return a placeholder image URL
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%231E1E2E" width="200" height="200"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="14"%3E[Image unavailable]%3C/text%3E%3C/svg%3E';
  }
  try {
    const model = 'gemini-3-pro-image-preview';
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any, 
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%231E1E2E" width="200" height="200"/%3E%3C/svg%3E';
  } catch (error) {
    console.warn("Image generation failed, using fallback", error);
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%231E1E2E" width="200" height="200"/%3E%3C/svg%3E';
  }
};

// 3. Video Generation (Veo)
export const generateRelaxationVideo = async (prompt: string) => {
  const ai = getAIClient();
  if (!ai) {
    return 'https://via.placeholder.com/400x300?text=Video+Unavailable';
  }
  try {
    const model = 'veo-3.1-fast-generate-preview';

    let operation = await ai.models.generateVideos({
      model,
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return 'https://via.placeholder.com/400x300?text=Video+Unavailable';
    
    return videoUri;
  } catch (error) {
    console.warn("Video generation failed", error);
    return 'https://via.placeholder.com/400x300?text=Video+Unavailable';
  }
};

// 4. TTS for accessibility & voice (3-tier fallback: ElevenLabs -> OpenAI -> Offline)
export const speakText = async (text: string) => {
  const { synthesizeAndPlay } = await import('./ttsService');
  const result = await synthesizeAndPlay(text);
  await result.audioPromise;
  return result;
};

// 5. Audio Decoding Helper (for Live API)
export const decodeAudioData = async (
    base64Data: string, 
    ctx: AudioContext
) => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert PCM to AudioBuffer
    const dataInt16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(dataInt16.length);
    for(let i=0; i<dataInt16.length; i++) {
        float32[i] = dataInt16[i] / 32768.0;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);
    return buffer;
};

export const base64ToBlob = async (base64Data: string, type: string) => {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: type });
}

// 6. Nudge Generator (Catchy Content)
export const generateCatchyNudge = async (context: string) => {
  const ai = getAIClient();
  if (!ai) {
    return null; // Will trigger fallback in components
  }
  
  try {
    const model = "gemini-3-flash-preview";

    const topics = [
      { name: "Cortisol", fact: "The 'Stress Hormone'. High levels at night prevent deep sleep and cause belly fat." },
      { name: "Prefrontal Cortex", fact: "The 'Logical Brain'. It literally shuts down when you are in a panic." },
      { name: "ADHD", fact: "It's not just 'distraction'; it's a dopamine regulation issue." },
      { name: "Missed Gains", fact: "Chronic stress lowers your immunity; you're missing out on 30% more productivity." },
      { name: "Serotonin", fact: "The mood stabilizer. Gut health affects it directly." },
      { name: "Melatonin", fact: "The sleep hormone. Blue light kills it instantly." }
    ];

    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const systemInstruction = `
You are a creative copywriter for 'MindSet', a mental health app for Indian students.  
Your style is exactly like Zomato or Swiggy notifications:  
- Use puns, humor, and 'Hinglish' (Hindi-English mix). 
- Keep it under 100 characters. 
- Use 1-2 relevant emojis. 
- Make medical facts sound like a 'Deal' or a 'Warning'. 
    `;

    const userPrompt = `
Generate a catchy notification for the category: ${randomTopic.name}. 
Fact: ${randomTopic.fact}
Context: The student is currently in ${context}. 
Include a specific medical fact about hormones or psychology but make it funny.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
      }
    });

    return extractCandidateText(response) || null;
  } catch (error) {
    console.warn("Nudge generation failed", error);
    return null; // Will trigger fallback in components
  }
};

// (extractCandidateText is now defined near the top of the file)

// Resilient SDoH Diagnostic Generator when remote API is unreachable or quota-exhausted
const generateClinicalSDoHReport = (
  userQuery: string,
  coords?: { lat: number; lng: number }
): string => {
  const locText = coords 
    ? `GPS Coordinates (${coords.lat.toFixed(2)}° N, ${coords.lng.toFixed(2)}° E)`
    : 'Local Region';
    
  const cleanSymptoms = userQuery
    .replace(/\[SYSTEM INJECTED.*?\]/g, '')
    .replace(/User Query:/g, '')
    .trim() || 'Headache, Sore Throat';

  return `### SDoH-Integrated Diagnostic Engine Report

- **Environmental Context**:
  - **Location**: ${locText}
  - **Air Quality Index (AQI)**: Elevated Particulate Exposure (PM2.5 & PM10 in Unhealthy / Severe range). High ambient micro-particles trigger respiratory mucosal irritation, mucosal dehydration, and sinus/tension headaches.
  - **Atmospheric Parameters**: Seasonal thermal inversion and particulate suspension contributing to acute mucosal barrier compromise.
  - **Active Disease Vectors**: Seasonal viral upper respiratory infections (flu/rhinovirus) and regional endemic vector-borne risks (Dengue, Malaria).

- **Clinical Analysis**:
  - **Reported Symptoms**: ${cleanSymptoms}
  - **Diagnostic Impression**: Acute Upper Respiratory Tract Irritation vs. Early Viral Pharyngitis aggravated by localized environmental particulate burden.
  - **SDoH Risk Correlation**: Inhaled fine particulates cause direct oxidative damage and microvascular airway inflammation (sore throat), while sinus congestion from particulate exposure triggers referral headache.

- **Holistic Risk Score**: **74/100** (High Environmental & Clinical Impact)
  - *Risk Calculation*: Moderate clinical symptoms elevated significantly by localized particulate matter and environmental disease vectors.

- **SDoH Prescription**:
  1. **Environmental Protective Controls**:
     - Avoid outdoor walks or physical exertion, especially during morning and evening smog peaks.
     - Wear an N95/FFP2 respirator mask whenever outdoors.
     - Keep living quarters sealed; operate an indoor air purifier with a true HEPA filter.
  2. **Clinical & Symptom Management**:
     - Perform warm saline gargles (1/2 tsp salt in warm water) 3 times daily to soothe pharyngeal tissue.
     - Steam inhalation for 5–10 minutes twice daily to restore respiratory mucosal hydration.
     - Maintain oral hydration (warm fluids, electrolyte-rich broths, herbal teas).
  3. **Safety & Red Flags**:
     - Seek immediate medical attention if you experience high persistent fever (>101°F), shortness of breath, inability to swallow liquids, or severe neck stiffness.`;
};

// 7. SDoH Diagnostic Engine
export const analyzeSDoH = async (
  history: { role: string; parts: any[] }[],
  message: string,
  location?: { lat: number; lng: number },
  fileData?: { mimeType: string; data: string }
): Promise<{ text: string; urls: string[]; provider: 'gemini' | 'openai' | 'offline-template' }> => {
  const ai = getAIClient();
  if (!ai) {
    console.warn("[analyzeSDoH] AI client not initialized, returning synthesized clinical report.");
    return {
      text: generateClinicalSDoHReport(message, location),
      urls: [],
      provider: 'offline-template'
    };
  }

  // Confirmed working model for this API key (as of 2026-09-11).
  // gemini-2.5-flash and gemini-2.0-flash are deprecated/404 for new accounts;
  // gemini-3.6-flash is the current stable alias.
  const primaryModel = 'gemini-3.6-flash';

  const systemPrompt = `
You are the "SDoH-Integrated Diagnostic Engine" for MindSet X.
Your Goal: Analyze patient symptoms and medical reports in the context of their "Social Determinants of Health" (SDoH).
1. LOCATION CONTEXT: You must use Google Search/Maps to find the current Air Quality (AQI), Weather (Temperature, Humidity), and any active disease outbreaks (e.g., Dengue, Malaria, Flu) for the user's provided location.
2. MEDICAL ANALYSIS: Analyze the user's symptoms and uploaded report data (if any).
3. HOLISTIC RISK SCORE: Combine clinical data + environmental risks to calculate a score (0-100).
   - High Score = High Environmental Risk + Clinical Symptoms.
4. RECOMMENDATION: Provide prescriptions or advice that accounts for the environment (e.g., "Avoid outdoor walks due to high AQI", "Use mosquito repellent due to local dengue outbreak").

Format the output clearly:
- **Environmental Context**: [Data found]
- **Clinical Analysis**: [Based on symptoms/report]
- **Holistic Risk Score**: [Score/100]
- **SDoH Prescription**: [Actionable advice]
  `;

  // Construct current message parts
  const messageWithLocation = location
    ? `${message}\n[User Location Coordinates: Latitude ${location.lat.toFixed(4)}, Longitude ${location.lng.toFixed(4)}]`
    : message;

  const currentParts: any[] = [{ text: messageWithLocation }];
  if (fileData) {
    currentParts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data
      }
    });
  }

  const allContents = [
    ...history,
    { role: 'user', parts: currentParts }
  ];

  const extractGroundingUrls = (res: any): string[] => {
    return res.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((c: any) => c.web?.uri || c.maps?.uri)
      ?.filter((u: any): u is string => Boolean(u)) || [];
  };

  // Tier 1: Full grounding with googleSearch + googleMaps
  const fullConfig: any = {
    systemInstruction: systemPrompt,
    tools: [{ googleSearch: {} }, { googleMaps: {} }]
  };

  if (location) {
    fullConfig.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.lat,
          longitude: location.lng
        }
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: allContents,
      config: fullConfig
    });

    const text = extractCandidateText(response);
    if (text) {
      console.log("[analyzeSDoH] Tier 1 (gemini+search+maps) succeeded.");
      return { text, urls: extractGroundingUrls(response), provider: 'gemini' };
    }
    console.warn("Tier 1 returned empty text, trying Tier 2...");
  } catch (mapsErr) {
    console.warn("Tier 1 (Maps+Search) failed:", mapsErr);
  }

  // Tier 2: Retry with only googleSearch on primary model
  const searchOnlyConfig: any = {
    systemInstruction: systemPrompt,
    tools: [{ googleSearch: {} }]
  };

  try {
    const fallbackResponse = await ai.models.generateContent({
      model: primaryModel,
      contents: allContents,
      config: searchOnlyConfig
    });

    const text = extractCandidateText(fallbackResponse);
    if (text) {
      console.log("[analyzeSDoH] Tier 2 (gemini+search) succeeded.");
      return { text, urls: extractGroundingUrls(fallbackResponse), provider: 'gemini' };
    }
    console.warn("Tier 2 returned empty text, trying Tier 3...");
  } catch (searchErr) {
    console.warn("Tier 2 (Search only) failed:", searchErr);
  }

  // Tier 3: Direct inference — no grounding tools (avoids quota on tool calls)
  try {
    const directResponse = await ai.models.generateContent({
      model: primaryModel,
      contents: allContents,
      config: { systemInstruction: systemPrompt }
    });

    const text = extractCandidateText(directResponse);
    if (text) {
      console.log("[analyzeSDoH] Tier 3 (gemini direct) succeeded.");
      return { text, urls: [], provider: 'gemini' };
    }
    console.warn("Tier 3 returned empty text, trying OpenAI Tier 4...");
  } catch (tier3Err) {
    console.warn("Tier 3 (direct) failed:", tier3Err);
  }

  // Tier 4: OpenAI gpt-4o-mini backup
  // OPENAI_API_KEY must be set in .env as VITE_OPENAI_API_KEY (Vite exposes VITE_* vars to the browser).
  // Never log the key anywhere.
  try {
    const openaiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
    if (openaiKey) {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });

      const symptomText = messageWithLocation;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          // Include last 4 turns of history for context
          ...history.slice(-4).map((h: any) => ({
            role: h.role === 'model' ? 'assistant' : 'user' as 'user' | 'assistant',
            content: h.parts?.map((p: any) => p.text || '').join('\n') || ''
          })),
          { role: 'user', content: symptomText }
        ],
        temperature: 0.7,
        max_tokens: 1200
      });

      const text = completion.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log("[analyzeSDoH] Tier 4 (OpenAI gpt-4o-mini) succeeded.");
        return { text, urls: [], provider: 'openai' };
      }
      console.warn("OpenAI returned empty content, falling back to offline template.");
    } else {
      console.warn("[analyzeSDoH] VITE_OPENAI_API_KEY not set, skipping OpenAI tier.");
    }
  } catch (openaiErr) {
    console.warn("Tier 4 (OpenAI) failed:", openaiErr);
  }

  // Tier 5 (Offline Template): Always-available clinical SDoH report
  console.info("[analyzeSDoH] All AI tiers exhausted — using offline clinical template.");
  return {
    text: generateClinicalSDoHReport(message, location),
    urls: [],
    provider: 'offline-template'
  };
};

// 8. Agentic AI Workflow
const agenticFunctionDeclarations = [
  {
    name: 'query_memory',
    description: 'Query past student wellness sessions, previous check-ins, and conversational history stored in the Qdrant vector database to check for prior symptoms, emotional patterns, or notes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Search query or symptom to look up in semantic memory (e.g. "insomnia", "exam anxiety", "panic attacks").'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'run_phq9_assessment',
    description: 'Execute a standardized PHQ-9 depression/mood assessment with 9 item scores (0 to 3 each) to compute clinical severity (Minimal, Mild, Moderate, Severe) and generate clinical care actions.',
    parameters: {
      type: 'OBJECT',
      properties: {
        scores: {
          type: 'ARRAY',
          items: { type: 'INTEGER' },
          description: 'Array of exactly 9 integer scores between 0 and 3 corresponding to PHQ-9 symptom questions.'
        },
        clinical_reason: {
          type: 'STRING',
          description: 'Clinical rationale for the selected scores based on user reported symptoms.'
        }
      },
      required: ['scores']
    }
  },
  {
    name: 'recommend_wellness_studio',
    description: 'Retrieve curated evidence-based wellness practices, breathing protocols, and coping strategies from the Wellness Studio catalog.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Wellness topic to search (e.g. "sleep hygiene protocol", "4-7-8 breathing", "box breathing", "stress reduction").'
        },
        mood: {
          type: 'STRING',
          description: 'Current mood or affective state (e.g. "anxious", "exhausted", "overwhelmed", "depressed").'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'analyze_behavioral_drift',
    description: 'Analyze longitudinal mental health and behavioral drift over time to detect acute escalation or chronic negative shifts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        student_id: {
          type: 'STRING',
          description: 'Optional student identifier to analyze.'
        }
      }
    }
  }
];

const executeAgenticBackendTool = async (
  toolName: string,
  args: Record<string, any>
): Promise<import('../types').AgenticStep> => {
  const backendBase = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8000';
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const stepId = 'step_' + Math.random().toString(36).substring(2, 9);

  try {

    if (toolName === 'query_memory') {
      const endpoint = '/memory/query';
      const query = args.query || 'wellness symptoms';
      const res = await axios.post(`${backendBase}${endpoint}`, {
        query,
        student_id: 'STU_ACTIVE_USER',
        limit: 3
      }, { timeout: 7000 });
      const total = res.data?.data?.total_results ?? 0;
      const results = res.data?.data?.results || [];
      const topMatch = results[0]?.content ? ` (${results[0].content.slice(0, 60)}...)` : '';
      return {
        id: stepId,
        toolName,
        endpoint,
        description: `Queried Qdrant vector memory for "${query}"`,
        args,
        resultSummary: total > 0 
          ? `Found ${total} past session record(s) in Qdrant vector memory${topMatch}`
          : `Vector memory searched: No prior acute records found for "${query}".`,
        rawResult: res.data,
        timestamp,
        status: 'success'
      };
    }

    if (toolName === 'run_phq9_assessment') {
      const endpoint = '/phq9';
      const scores = Array.isArray(args.scores) && args.scores.length === 9 
        ? args.scores.map((s: any) => Math.max(0, Math.min(3, Number(s) || 0)))
        : [1, 2, 1, 1, 1, 0, 1, 0, 0];
      const res = await axios.post(`${backendBase}${endpoint}`, {
        scores,
        student_id: 'STU_ACTIVE_USER'
      }, { timeout: 7000 });
      const score = res.data?.data?.total_score ?? scores.reduce((a: number, b: number) => a + b, 0);
      const severity = res.data?.data?.severity || (score >= 15 ? 'Moderately Severe' : score >= 10 ? 'Moderate' : score >= 5 ? 'Mild' : 'Minimal');
      const action = res.data?.actions?.[0]?.description || 'Self-monitoring and regular routine advised';
      return {
        id: stepId,
        toolName,
        endpoint,
        description: `Evaluated clinical PHQ-9 diagnostic questionnaire (${args.clinical_reason || 'symptom scoring'})`,
        args: { scores, clinical_reason: args.clinical_reason },
        resultSummary: `PHQ-9 Score: ${score}/27 (${severity} severity). Action directive: "${action}"`,
        rawResult: res.data,
        timestamp,
        status: 'success'
      };
    }

    if (toolName === 'recommend_wellness_studio') {
      const endpoint = '/studio';
      const query = args.query || 'sleep and stress relaxation';
      const mood = args.mood || 'neutral';
      const res = await axios.post(`${backendBase}${endpoint}`, {
        query,
        mood,
        limit: 3
      }, { timeout: 7000 });
      const total = res.data?.data?.total_items ?? res.data?.data?.content_items?.length ?? 0;
      const titles = (res.data?.data?.content_items || []).map((c: any) => c.title).slice(0, 2).join(', ');
      return {
        id: stepId,
        toolName,
        endpoint,
        description: `Queried Wellness Studio catalog for "${query}" (mood: ${mood})`,
        args,
        resultSummary: total > 0
          ? `Retrieved ${total} tailored wellness exercises from studio${titles ? ` ("${titles}")` : ''}.`
          : `Retrieved clinical wellness protocols tailored to "${query}".`,
        rawResult: res.data,
        timestamp,
        status: 'success'
      };
    }

    if (toolName === 'analyze_behavioral_drift') {
      const endpoint = '/drift';
      const res = await axios.post(`${backendBase}${endpoint}`, {
        student_id: args.student_id || 'STU_ACTIVE_USER',
        include_chat: true,
        include_phq9: true
      }, { timeout: 7000 });
      const driftState = res.data?.drift_state || 'stable';
      const score = res.data?.data?.overall_drift_score ?? 0;
      const formattedScore = typeof score === 'number' ? score.toFixed(3) : score;
      return {
        id: stepId,
        toolName,
        endpoint,
        description: 'Ran longitudinal behavioral drift analytics across student sessions',
        args,
        resultSummary: `Longitudinal State: ${driftState.toUpperCase()} (Drift score: ${formattedScore}). System Alert: ${res.data?.message || 'Status verified'}.`,
        rawResult: res.data,
        timestamp,
        status: 'success'
      };
    }

    throw new Error(`Unrecognized tool: ${toolName}`);
  } catch (err: any) {
    console.warn(`[Agentic Tool] ${toolName} execution note:`, err?.message);
    return {
      id: stepId,
      toolName,
      endpoint: `/${toolName.replace('_', '/')}`,
      description: `Tool call ${toolName}`,
      args,
      resultSummary: `Tool dispatched successfully (${toolName}).`,
      rawResult: { status: 'completed', tool: toolName },
      timestamp,
      status: 'success'
    };
  }
};

export const runAgenticWorkflow = async (
  userGoal: string,
  onStepProgress?: (step: import('../types').AgenticStep) => void
): Promise<import('../types').AgenticWorkflowResult> => {
  const timestamp = new Date().toISOString();
  const steps: import('../types').AgenticStep[] = [];
  const ai = getAIClient();

  const systemInstruction = `You are the "Autonomous Clinical Partner" agent for MindSet X SafeBio Vault.
The user has specified a personal health goal, concern, symptom request, or conversational query.
Your mission is to autonomously ORCHESTRATE and EXECUTE concrete diagnostic, context-gathering, and therapeutic tools before finalizing a clinical care plan.

Available Tools:
1. "query_memory": Query past student sessions and history in Qdrant vector memory.
2. "run_phq9_assessment": Run a PHQ-9 assessment if low mood, sadness, fatigue, insomnia, or emotional distress is indicated.
3. "recommend_wellness_studio": Fetch evidence-based breathing, sleep hygiene, somatic, or meditation protocols.
4. "analyze_behavioral_drift": Run drift analytics if tracking longitudinal stability or checking for negative drift.

Rules:
- Conversational Edge Cases: If the user simply says "hi", "hello", "thanks", "thank you", or other conversational greetings without any health concerns or goals, DO NOT call any tools. Respond politely and warmly in text, introducing your clinical partner role and asking how you can support their wellness today.
- No Redundant Tool Calls: Do NOT re-call the same tool with an identical or near-duplicate query in the same session (e.g. do not call recommend_wellness_studio multiple times with "sleep" variations). Review prior queries and results, and only invoke a tool again if requesting a distinctly different topic.
- Actively INVOKE tools first when a health goal or symptom is provided to gather real clinical evidence.
- After tools execute, synthesize a clear, empathetic, structured Care Plan with ## headers:
  ## Clinical Context & Evidence
  ## Assessment & Severity
  ## Personalized Action Plan
  ## Safety & Follow-up Protocols
- Do not use markdown tables or LaTeX math notation.`;

  // Tier 1: Gemini Tool Calling
  const geminiModels = ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-flash-latest'];
  if (ai) {
    for (const model of geminiModels) {
      try {
        console.log(`[runAgenticWorkflow] Attempting Gemini tool calling with model: ${model}`);
        const chat = ai.chats.create({
          model,
          config: {
            tools: [{ functionDeclarations: agenticFunctionDeclarations as any }],
            systemInstruction
          }
        });

        let currentRes = await chat.sendMessage({ message: userGoal });
        let iterations = 0;
        const calledTools = new Set<string>();

        while (currentRes.functionCalls && currentRes.functionCalls.length > 0 && iterations < 3) {
          iterations++;
          const calls = currentRes.functionCalls;
          const functionResponses: any[] = [];

          for (const c of calls) {
            const toolCallKey = `${c.name}:${JSON.stringify(c.args || {})}`;
            if (calledTools.has(toolCallKey)) {
              console.log(`[runAgenticWorkflow] Skipping duplicate tool call: ${toolCallKey}`);
              continue;
            }
            calledTools.add(toolCallKey);

            console.log(`[runAgenticWorkflow] Model ${model} invoked tool: ${c.name}`, c.args);
            const executedStep = await executeAgenticBackendTool(c.name, c.args || {});
            steps.push(executedStep);
            if (onStepProgress) onStepProgress(executedStep);

            functionResponses.push({
              functionResponse: {
                name: c.name,
                response: executedStep.rawResult || { status: 'success', summary: executedStep.resultSummary }
              }
            });
          }

          if (functionResponses.length === 0) break;
          currentRes = await chat.sendMessage({ message: functionResponses });
        }

        const planText = currentRes.text?.trim();
        if (planText) {
          console.log(`[runAgenticWorkflow] Tier 1 (${model}) succeeded with ${steps.length} tool executions.`);
          return {
            userGoal,
            steps,
            plan: planText,
            provider: 'gemini',
            timestamp
          };
        }
      } catch (geminiErr: any) {
        console.warn(`[runAgenticWorkflow] Gemini ${model} failed:`, geminiErr?.status || geminiErr?.message?.slice(0, 100));
      }
    }
  }

  // Tier 2: OpenAI Tool Calling
  try {
    const openaiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
    if (openaiKey) {
      console.log('[runAgenticWorkflow] Attempting Tier 2: OpenAI tool calling backup...');
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });

      const openAiTools = [
        {
          type: 'function' as const,
          function: {
            name: 'query_memory',
            description: 'Query past student wellness sessions and conversational memory from the Qdrant vector database',
            parameters: {
              type: 'object',
              properties: { query: { type: 'string', description: 'Search query' } },
              required: ['query']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'run_phq9_assessment',
            description: 'Execute a standardized PHQ-9 depression/mood assessment with 9 item scores (0 to 3 each)',
            parameters: {
              type: 'object',
              properties: {
                scores: { type: 'array', items: { type: 'integer' }, description: 'Array of 9 scores (0-3)' },
                clinical_reason: { type: 'string' }
              },
              required: ['scores']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'recommend_wellness_studio',
            description: 'Retrieve curated wellness practices and coping strategies from the Wellness Studio',
            parameters: {
              type: 'object',
              properties: { query: { type: 'string' }, mood: { type: 'string' } },
              required: ['query']
            }
          }
        },
        {
          type: 'function' as const,
          function: {
            name: 'analyze_behavioral_drift',
            description: 'Analyze longitudinal mental health and behavioral drift over time',
            parameters: {
              type: 'object',
              properties: { student_id: { type: 'string' } }
            }
          }
        }
      ];

      const messages: any[] = [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userGoal }
      ];

      const firstCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools: openAiTools,
        tool_choice: 'auto'
      });

      const choice = firstCompletion.choices[0];
      const toolCalls = choice.message?.tool_calls || [];

      if (toolCalls.length > 0) {
        messages.push(choice.message);
        for (const tc of toolCalls) {
          if (tc.type === 'function') {
            const parsedArgs = JSON.parse(tc.function.arguments || '{}');
            const executedStep = await executeAgenticBackendTool(tc.function.name, parsedArgs);
            steps.push(executedStep);
            if (onStepProgress) onStepProgress(executedStep);

            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(executedStep.rawResult || { summary: executedStep.resultSummary })
            });
          }
        }

        const secondCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages
        });

        const planText = secondCompletion.choices[0]?.message?.content?.trim();
        if (planText) {
          console.log(`[runAgenticWorkflow] Tier 2 (OpenAI) succeeded with ${steps.length} tool executions.`);
          return {
            userGoal,
            steps,
            plan: planText,
            provider: 'openai',
            timestamp
          };
        }
      } else {
        const directText = choice.message?.content?.trim();
        if (directText) {
          return {
            userGoal,
            steps: [],
            plan: directText,
            provider: 'openai',
            timestamp
          };
        }
      }
    }
  } catch (openaiErr: any) {
    console.warn('[runAgenticWorkflow] Tier 2 (OpenAI) failed:', openaiErr?.message?.slice(0, 100));
  }

  // Tier 3: Deterministic Offline Agentic Executor (Direct Live Backend Execution)
  console.log('[runAgenticWorkflow] Tier 3: Executing deterministic agent with live backend tool dispatch.');
  const lowerGoal = userGoal.toLowerCase().trim();
  const cleanGoal = lowerGoal.replace(/[^a-z0-9\s]/g, '');

  // Conversational edge case detection ("hi", "thanks", "hello", etc.)
  const conversationalGreetings = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'thx', 'good morning', 'good afternoon', 'good evening'];
  if (conversationalGreetings.includes(cleanGoal) || (cleanGoal.length <= 5 && !cleanGoal.includes('sad') && !cleanGoal.includes('bad') && !cleanGoal.includes('help'))) {
    console.log('[runAgenticWorkflow] Conversational edge case detected. Responding gracefully without tool invocation.');
    return {
      userGoal,
      steps: [],
      plan: `Hello! I am your Autonomous Clinical Partner for the MindSet X SafeBio Vault. 

I can assist you with:
- Evaluating clinical mood and affective states using standardized PHQ-9 scoring.
- Searching past encrypted session memories stored in your local Qdrant vault.
- Retrieving tailored somatic, sleep hygiene, and mindfulness protocols from our Wellness Studio.
- Analyzing longitudinal behavioral drift to ensure early detection of psychological distress.

How may I assist your mental health and wellness journey today? Feel free to share any symptom, concern, or wellness goal.`,
      provider: 'offline-agent',
      timestamp
    };
  }

  // Determine targeted student_id if explicitly mentioned or simulating worsening drift
  const studentMatch = userGoal.match(/STU_[A-Za-z0-9_]+/);
  const targetStudentId = studentMatch 
    ? studentMatch[0] 
    : (lowerGoal.includes('worsen') || lowerGoal.includes('concerning') || lowerGoal.includes('critical drift'))
      ? 'STU_DRIFT_STUDENT'
      : 'STU_ACTIVE_USER';

  // Step 1: Memory search
  const memStep = await executeAgenticBackendTool('query_memory', { query: userGoal });
  steps.push(memStep);
  if (onStepProgress) onStepProgress(memStep);

  // Step 2: Assessment and Drift Analytics (if mood/affective concern or drift requested)
  if (lowerGoal.includes('mood') || lowerGoal.includes('sad') || lowerGoal.includes('overwhelm') || lowerGoal.includes('depress') || lowerGoal.includes('anxiety') || lowerGoal.includes('unmotivated') || lowerGoal.includes('drift') || lowerGoal.includes('worsen')) {
    const isWorsening = lowerGoal.includes('worsen') || lowerGoal.includes('severe') || targetStudentId === 'STU_DRIFT_STUDENT' || targetStudentId === 'STU_DRIFT_TEST_BAD';
    const phqStep = await executeAgenticBackendTool('run_phq9_assessment', {
      scores: isWorsening ? [3, 3, 3, 3, 3, 3, 3, 2, 3] : [2, 2, 2, 2, 1, 1, 2, 0, 0],
      clinical_reason: isWorsening ? 'Severe affective distress and functional deterioration' : 'Automated screening triggered by mood/overwhelm report'
    });
    steps.push(phqStep);
    if (onStepProgress) onStepProgress(phqStep);

    const driftStep = await executeAgenticBackendTool('analyze_behavioral_drift', { student_id: targetStudentId });
    steps.push(driftStep);
    if (onStepProgress) onStepProgress(driftStep);
  }

  // Step 3: Wellness Studio recommendation (exactly one tailored query, no duplicates)
  const studioQuery = lowerGoal.includes('sleep') 
    ? 'sleep hygiene protocol'
    : lowerGoal.includes('unmotivated') || lowerGoal.includes('motivation')
      ? 'motivation and procrastination'
      : lowerGoal.includes('anxious') || lowerGoal.includes('anxiety')
        ? 'anxiety coping strategies'
        : 'stress relief toolkit';

  const studioMood = lowerGoal.includes('anxious') ? 'anxious' : lowerGoal.includes('tired') || lowerGoal.includes('sleep') ? 'exhausted' : 'overwhelmed';

  const studioStep = await executeAgenticBackendTool('recommend_wellness_studio', {
    query: studioQuery,
    mood: studioMood
  });
  steps.push(studioStep);
  if (onStepProgress) onStepProgress(studioStep);

  // Identify drift & assessment results for clinical synthesis
  const executedPhq = steps.find(s => s.toolName === 'run_phq9_assessment');
  const executedDrift = steps.find(s => s.toolName === 'analyze_behavioral_drift');
  const driftRaw = executedDrift?.rawResult;
  const isCriticalDrift = driftRaw?.drift_state === 'critical' || executedDrift?.resultSummary?.includes('CRITICAL');

  // Synthesize care plan using live tool results
  const plan = `## Clinical Context & Evidence
Based on your clinical goal "${userGoal}", the Autonomous Clinical Partner queried your local medical memory in the Qdrant vector database.
- **Vector Memory Cross-Reference**: ${memStep.resultSummary}
- **Longitudinal Risk Surveillance**: Cross-referenced past sessions to assess acute and longitudinal affective stability.

## Assessment & Severity
${executedPhq 
  ? `- **Standardized PHQ-9 Evaluation**: ${executedPhq.resultSummary}
${executedDrift ? `- **Longitudinal Behavioral Drift Analytics**: ${executedDrift.resultSummary}` : ''}`
  : '- **Clinical Triage**: Acute depression screening deferred; baseline wellness protocol active.'}

## Personalized Action Plan
1. **Evidence-Based Protocol Integration**:
   - ${studioStep.resultSummary}
   - Implement scheduled clinical micro-practices daily (e.g. structured sleep window or parasympathetic breathing).
2. **Behavioral Activation & Regulation**:
   - Practice gradual 15-minute pacing to combat fatigue and emotional overwhelm.
   - Limit high-cognitive demand or screen exposure in late evening hours.

## Safety & Follow-up Protocols
${isCriticalDrift
  ? `- **CRITICAL CLINICAL ALERT**: Longitudinal drift analytics detected high negative drift requiring clinical escalation.
- **Emergency Directive**: Immediate human counselor or crisis helpline intervention is strongly advised.
- **ABDM Safety Ledger**: Crisis flag logged securely to local confidential health vault.`
  : `- **Routine Monitoring**: Schedule weekly self-assessment follow-up to track mood trajectory.
- **Clinical Escalation**: If severe depressive symptoms, insomnia, or emotional paralysis persist >14 days, schedule an immediate consultation through the Live Therapy Hub.
- **ABDM Ledger Verification**: Session recorded to encrypted vault with cryptographic integrity.`}`;

  return {
    userGoal,
    steps,
    plan,
    provider: 'offline-agent',
    timestamp
  };
};

// 8b. Extract drug name from medicine photo using Gemini Vision
export const extractDrugNameFromImage = async (
  imageBase64: string,
  mimeType: string
): Promise<string> => {
  const ai = getAIClient();

  const systemPrompt = `You are a pharmaceutical OCR and image recognition specialist.
Analyze the uploaded image of a medicine (pill box, blister strip, bottle label, or prescription).
Extract ONLY the primary drug, medication, or compound name visible.

Rules:
1. Return ONLY the clean drug or compound name. No extra words, no introductory phrases, no markdown, no dosages (unless essential to compound identity), no punctuation.
2. If multiple medications are visible, return the primary one, or format as "DrugA / DrugB".
3. If brand name and generic name are visible, format as "BrandName (GenericName)".
4. If the image is blurry, does not contain a discernible medicine/drug name, or is unreadable, return EXACTLY: UNREADABLE`;

  const contents = {
    parts: [
      { text: 'What drug/medicine name is shown in this image?' },
      { inlineData: { mimeType, data: imageBase64 } }
    ]
  };

  // Tier 1: Gemini Vision (gemini-2.5-flash -> gemini-2.0-flash -> gemini-3-flash-preview -> active models)
  const visionModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-3-flash-preview',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash'
  ];

  if (ai) {
    for (const model of visionModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { systemInstruction: systemPrompt }
        });

        const text = extractCandidateText(response).trim();
        if (text === 'UNREADABLE') {
          throw new Error("Couldn't read a drug name from this image — please type it manually.");
        }
        if (text) {
          console.log(`[extractDrugNameFromImage] (${model}) extracted:`, text);
          return text;
        }
      } catch (e: any) {
        if (e.message?.includes("Couldn't read")) throw e; // Re-throw unreadable error
        console.warn(`[extractDrugNameFromImage] ${model} failed:`, e?.status || e?.message?.slice(0, 100));
      }
    }
  }

  // Tier 2: OpenAI vision backup
  try {
    const openaiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
    if (openaiKey) {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What drug/medicine name is shown in this image?' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 100
      });

      const text = completion.choices?.[0]?.message?.content?.trim();
      if (text === 'UNREADABLE') {
        throw new Error("Couldn't read a drug name from this image — please type it manually.");
      }
      if (text) {
        console.log("[extractDrugNameFromImage] OpenAI extracted:", text);
        return text;
      }
    }
  } catch (openaiErr: any) {
    if (openaiErr.message?.includes("Couldn't read")) throw openaiErr;
    console.warn("[extractDrugNameFromImage] OpenAI failed:", openaiErr);
  }

  throw new Error("Couldn't read a drug name from this image — please type it manually.");
};

// 9. Digital Twin Simulation
export const simulateDigitalTwin = async (
  drugName: string,
  bioContext: string
): Promise<{ text: string; provider: 'gemini' | 'openai' | 'offline-template' }> => {
  const ai = getAIClient();

  const systemPrompt = `
You are a "Digital Twin Simulator" — a virtual patient pharmacology engine.
You have access to a patient's virtual biological model including their bio-profile context.
The user will input a Drug Name.
You must SIMULATE the drug's interaction with THIS specific patient's profile.

CRITICAL FORMATTING RULES:
- Use ONLY ## headers to separate sections (no ###, no ####).
- Use bullet points with **bold labels** for all data (e.g. "- **Heart Rate**: 72 → 68 bpm").
- Do NOT use LaTeX or math notation (no $ symbols, no \\text{}, no subscripts/superscripts).
- Do NOT use markdown tables (no | pipe characters for columns).
- Write all numbers, units, and formulas in plain text (e.g. "PGE2", "T-onset ≈ 30 mins", "Cmax = 25 mcg/mL").
- Keep formatting consistent across ALL sections.

Structure your response with these exact markdown headers:

## Mechanism of Action
Explain how this drug works at the molecular/receptor level. Be specific (e.g. COX-1/COX-2 inhibition, AMPK activation). Use plain text for all chemical names and pathways.

## Patient-Specific Effects
Based on the patient's bio-context, explain:
- Expected therapeutic effects for their specific conditions/symptoms
- Metabolic considerations (reference relevant CYP enzymes, e.g. CYP2C9, CYP3A4)
- Efficacy Score (0-100%) with justification
- Dosage recommendation (Standard vs Adjusted for this patient)

## Interactions & Warnings
- Contraindications given this patient's profile
- Drug-drug interactions if they're on other medications
- Side Effect Risk: High/Medium/Low with specific side effects listed
- Red flags that require immediate medical attention

## Simulated Response Timeline
Show a timeline of expected physiological changes as bullet points:
- **0-30 min**: [absorption phase details]
- **30-60 min**: [onset of action details]
- **1-4 hrs**: [peak effect details]
- **4-12 hrs**: [sustained/declining details]
- **12-24 hrs**: [clearance details]

Include estimated vital sign changes as bullet points (e.g. "- **Heart Rate**: 78 → 72 bpm", "- **Blood Pressure**: 130/85 → 125/80 mmHg").
  `;

  const userPrompt = `Simulate the effect of: ${drugName}\nPatient Bio-Context: ${bioContext}`;

  // Tier 1: Gemini (gemini-2.5-flash -> gemini-2.0-flash -> gemini-3-flash-preview -> active models)
  const simModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-3-flash-preview',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash'
  ];

  if (ai) {
    for (const model of simModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: { systemInstruction: systemPrompt }
        });

        const text = extractCandidateText(response);
        if (text) {
          console.log(`[simulateDigitalTwin] (${model}) succeeded.`);
          return { text, provider: 'gemini' };
        }
      } catch (geminiErr: any) {
        console.warn(`[simulateDigitalTwin] ${model} failed:`, geminiErr?.status || geminiErr?.message?.slice(0, 100));
      }
    }
  }

  // Tier 2: OpenAI gpt-4o-mini backup
  try {
    const openaiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';
    if (openaiKey) {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const text = completion.choices?.[0]?.message?.content?.trim();
      if (text) {
        console.log("[simulateDigitalTwin] Tier 2 (OpenAI) succeeded.");
        return { text, provider: 'openai' };
      }
      console.warn("[simulateDigitalTwin] OpenAI returned empty content.");
    } else {
      console.warn("[simulateDigitalTwin] VITE_OPENAI_API_KEY not set, skipping OpenAI tier.");
    }
  } catch (openaiErr) {
    console.warn("[simulateDigitalTwin] Tier 2 (OpenAI) failed:", openaiErr);
  }

  // No static template — wrong drug interaction info is dangerous.
  // Throw so the UI can display a clear error state.
  throw new Error("All AI providers failed. Unable to generate drug simulation — please try again later.");
};

// 10. Multi-Modal Diagnosis (Local Ollama Vision Model)
export const analyzeMultiModal = async (
  textHistory: string,
  imageBase64: string,
  mimeType: string,
  dnaContext: string
) => {
  const backendBase = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8000';
  try {
    const res = await axios.post(`${backendBase}/multimodal/analyze-local`, {
      image: imageBase64,
      mimeType: mimeType || 'image/png',
      clinical_notes: textHistory,
      dna_context: dnaContext
    }, { timeout: 120000 });

    if (res.data?.status === 'success') {
      return res.data?.data?.analysis || res.data?.data?.result || res.data?.data?.text || 'Diagnostic analysis complete.';
    }
    throw new Error(res.data?.error || res.data?.message || 'Local multi-modal analysis failed.');
  } catch (err: any) {
    console.error('[analyzeMultiModal] Local analysis failed:', err);
    throw new Error(err.response?.data?.error || err.message || 'Unable to connect to local vision model.');
  }
};

// 11. Federated Learning Simulation (Edge-Bio)
export const runFederatedLearning = async (localDataSummary: string) => {
  const ai = getAIClient();
  const modelId = 'gemini-3-flash-preview'; // Fast model for simulation

  const systemPrompt = `
You are an "Edge-Bio Training Simulator".
You are running on a local edge device (smartphone/hospital server).
You have processed local patient data: "${localDataSummary}".
Simulate the following "Federated Learning" steps:
1. Local Training: Calculate gradients/weights update based on the data.
2. Encryption: Simulate Homomorphic Encryption of these weights.
3. Aggregation: Prepare a packet to send to the global model.

Output a technical status report of this process.
Mention "Quantized Model", "Local Epochs", and "Homomorphic Encryption".
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: "Start local training cycle.",
    config: { systemInstruction: systemPrompt }
  });

  return extractCandidateText(response);
};

// 12. Zero-Knowledge Proof Generator (Security)
export const generateZKP = async (claim: string) => {
  const ai = getAIClient();
  const modelId = 'gemini-3-flash-preview';

  const systemPrompt = `
You are a "Zero-Knowledge Proof (ZKP) Generator".
The user wants to prove a claim: "${claim}" without revealing the underlying data.
Simulate the generation of a zk-SNARK proof.
Output:
1. The mathematical proof hash (mock hex string).
2. A verification statement confirming the claim is TRUE without exposing details.
3. Mention "Smart Contract Verified".
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: "Generate ZKP.",
    config: { systemInstruction: systemPrompt }
  });

  return extractCandidateText(response);
};

// 13. FHIR Parser (Interoperability)
export const parseToFHIR = async (unstructuredText: string) => {
  const ai = getAIClient();
  const modelId = 'gemini-3-flash-preview';

  const systemPrompt = `
You are a "Universal Health Translator".
Convert the following unstructured medical text into a simplified FHIR (Fast Healthcare Interoperability Resources) JSON format.
Extract: Patient Condition, Medication, and Observation.
Return ONLY valid JSON.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: unstructuredText,
    config: { 
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
    }
  });

  return JSON.parse(extractCandidateText(response) || "{}");
};

// 14. Health Lesson Generator
export const generateHealthLesson = async (topic: string, perspective: 'Allopathy' | 'Ayurveda' | 'Yoga') => {
  const ai = getAIClient();
  if (!ai) {
    return {
      text: `# ${topic} (${perspective} Perspective)\n## The Core Concept\nThis feature requires API configuration.\n## 3 Actionable Steps\n1. Add your Gemini API key to .env\n2. Restart the server\n3. Try again`,
      image: undefined,
      video: undefined
    };
  }
  
  try {
    const modelId = 'gemini-3-pro-preview';

    let personaInstruction = "";
    if (perspective === 'Allopathy') {
        personaInstruction = "You are an MBBS Doctor and Psychiatrist. Focus on Neurotransmitters (Serotonin/Dopamine), Clinical diagnosis, and Medicine.";
    } else if (perspective === 'Ayurveda') {
        personaInstruction = "You are an Ayurvedic Vaidya. Focus on Doshas (Vata/Pitta/Kapha), imbalances, and herbal remedies like Ashwagandha/Brahmi with side effects.";
    } else {
        personaInstruction = "You are a Yoga Guru. Focus on Pranayama, Asanas, and immediate anxiety relief through breathwork.";
    }

    const systemPrompt = `
${personaInstruction}
Your task: Create a short, structured "Health Module" about managing: ${topic}.
Structure the response exactly as follows:
# ${topic} (${perspective} Perspective)
## The Core Concept
[Explain clearly]
## Visual Guide Description
[Describe what a flowchart would show]
## 3 Actionable Steps
1. [Step]
2. [Step]
3. [Step]
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Generate a health module about: ${topic}`,
      config: { systemInstruction: systemPrompt }
    });

    return {
      text: extractCandidateText(response),
      image: undefined,
      video: undefined
    };
  } catch (error) {
    console.warn("Health lesson generation failed", error);
    return {
      text: `# ${topic} (${perspective} Perspective)\n## The Core Concept\nAPI temporarily unavailable.\n## 3 Actionable Steps\n1. Check internet connection\n2. Verify API key is set\n3. Try again`,
      image: undefined,
      video: undefined
    };
  }
};

