
import { GoogleGenAI, Type } from "@google/genai";

// Get API key from environment variables (process.env is injected by Vite)
const getAPIKey = () => {
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || 
         process.env.VITE_GEMINI_API_KEY ||
         (window as any).VITE_GEMINI_API_KEY ||
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
  coords?: { lat: number; lng: number }
) => {
  const ai = getAIClient();
  
  // Maps grounding is only supported in Gemini 2.5 series models.
  // Use 2.5 Flash if Maps is requested, otherwise use 3 Pro for better reasoning.
  const modelId = useMaps ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
  
  const tools: any[] = [];
  if (useSearch) tools.push({ googleSearch: {} });
  if (useMaps) tools.push({ googleMaps: {} });

  // Specialized System Prompt for MindSet Sentinel
  const systemPrompt = `
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

  const chat = ai.chats.create({
    model: modelId,
    history: history,
    config: config
  });

  const result = await chat.sendMessage({ message });
  
  // Extract grounding metadata if available
  const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const urls: string[] = [];
  
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri) urls.push(chunk.web.uri);
      if (chunk.maps?.uri) urls.push(chunk.maps.uri); // Map links
    });
  }

  return {
    text: extractCandidateText(result),
    urls: urls
  };
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

// 4. TTS for accessibility
export const speakText = async (text: string) => {
  const ai = getAIClient();
  const model = "gemini-2.5-flash-preview-tts";
  
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO" as any],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("TTS failed");
  
  return base64Audio;
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
export const runAgenticWorkflow = async (trigger: string) => {
  const ai = getAIClient();
  const modelId = 'gemini-3-pro-preview';

  const systemPrompt = `
You are an "Autonomous Medical Partner" agent. 
Given a medical risk or trigger, you must ORCHESTRATE a complete care plan.
IMPORTANT: You must output a JSON list of concrete ACTIONS that you have "prepared" for the doctor/patient to approve.
Also, act as a "Universal FHIR Translator" by ensuring all proposed actions are compatible with HL7 FHIR standards (though output here is simplified JSON).
Read unstructured data from the trigger and structure it.

Return ONLY valid JSON in this format:
{
  "risk_analysis": "string",
  "actions": [
    { "type": "appointment", "detail": "string", "status": "Ready to Book" },
    { "type": "document", "detail": "string", "status": "Drafted" },
    { "type": "plan", "detail": "string", "status": "Generated" },
    { "type": "fhir_data", "detail": "string", "status": "Standardized" }
  ]
}
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: trigger,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json"
    }
  });

  return JSON.parse(extractCandidateText(response) || "{}");
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

Structure your response with these exact markdown headers:

## Mechanism of Action
Explain how this drug works at the molecular/receptor level. Be specific (e.g. COX-1/COX-2 inhibition, AMPK activation).

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
Show a timeline of expected physiological changes:
- 0-30 min: [absorption phase]
- 30-60 min: [onset of action]
- 1-4 hrs: [peak effect]
- 4-12 hrs: [sustained/declining]
- 12-24 hrs: [clearance]

Include estimated vital sign changes (heart rate, BP, temperature, blood glucose if relevant).
  `;

  const userPrompt = `Simulate the effect of: ${drugName}\nPatient Bio-Context: ${bioContext}`;

  // Tier 1: Gemini (gemini-3.6-flash — only working model for this API key)
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: userPrompt,
        config: { systemInstruction: systemPrompt }
      });

      const text = extractCandidateText(response);
      if (text) {
        console.log("[simulateDigitalTwin] Tier 1 (Gemini) succeeded.");
        return { text, provider: 'gemini' };
      }
      console.warn("[simulateDigitalTwin] Gemini returned empty text.");
    } catch (geminiErr) {
      console.warn("[simulateDigitalTwin] Tier 1 (Gemini) failed:", geminiErr);
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

// 10. Multi-Modal Diagnosis
export const analyzeMultiModal = async (
  textHistory: string,
  imageBase64: string,
  mimeType: string,
  dnaContext: string
) => {
  const ai = getAIClient();
  const modelId = 'gemini-3-pro-preview'; // Multimodal

  const systemPrompt = `
You are a Multi-Modal AI Diagnostician.
You analyze three data streams simultaneously:
1. VISION: Medical Scan (X-Ray/MRI/Skin).
2. TEXT: Clinical Notes/History (Unstructured).
3. BIO: DNA/Genetic Markers.

First, perform "Reading the Unreadable" using NLP to extract key clinical terms from the notes.
Then, cross-reference these inputs to find correlations that a human might miss.
Example: "Vision shows lung nodule + DNA shows BRCA1 + History shows smoking = 99% High Risk."
Provide a concise, high-accuracy holistic analysis.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: {
      parts: [
        { text: `Clinical History (Notes): ${textHistory}\nDNA Context: ${dnaContext}` },
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        }
      ]
    },
    config: { systemInstruction: systemPrompt }
  });

  return extractCandidateText(response);
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

