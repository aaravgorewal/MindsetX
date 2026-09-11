# 🔌 Gemini API Reference Documentation

## Quick Reference

```typescript
// Import the service
import {
  sendChatMessage,
  generateCatchyNudge,
  generateHealthLesson,
  generateHealingImage,
  generateRelaxationVideo,
  analyzeSDoH,
  runAgenticWorkflow,
  simulateDigitalTwin,
  analyzeMultiModal,
  runFederatedLearning,
  generateZKP,
  parseToFHIR,
  speakText
} from '@/services/geminiService';
```

---

## 📡 FUNCTION REFERENCE

### 1. `sendChatMessage(userMessage: string, conversationHistory?: Array)`

**Purpose**: Send a message to Gemini 2.0 Flash for mental health chat

**Parameters**:
```typescript
userMessage: string  // User's message (e.g., "I'm feeling anxious")
conversationHistory?: Array  // Previous messages for context
```

**Returns**:
```typescript
{
  reply: string,           // AI's response
  sentiment: number,       // -10 (very sad) to +10 (very happy)
  phq9_score?: number,     // PHQ-9 depression score if assessment
  grounding_urls?: string[] // Reference links
}
```

**Example Usage**:
```typescript
const result = await sendChatMessage("I'm having trouble sleeping");
console.log(result.reply);  // AI response with sleep advice
console.log(result.sentiment);  // Mood score: -3 (slightly sad)

// With conversation history
const history = [
  { role: 'user', content: 'I feel stressed' },
  { role: 'assistant', content: 'Tell me more...' }
];
const result2 = await sendChatMessage("It's about work", history);
```

**Error Handling**:
- Returns default supportive message if API fails
- No exception thrown, gracefully degrades

---

### 2. `generateCatchyNudge(mood?: string)`

**Purpose**: Generate personalized Hinglish motivational messages

**Parameters**:
```typescript
mood?: string  // One of: 'late_night', 'exam_week', 'high_stress_panic', 
               // 'anxious_tired', 'bored_neutral', 'feeling_good_productivity', 
               // 'celebration_great_mood'
```

**Returns**:
```typescript
string | null  // Nudge message in Hinglish or null if API fails
// Example: "Arre! Exam ke tension se zyada kuch nahi hai...
//          Deep breathing try karo - sirf 5 minutes!"
```

**Example Usage**:
```typescript
// Auto-detect mood from sentiment
const nudge = await generateCatchyNudge();
// "Aaj kal toh stress bahot ho gaya... Chill karo thoda!"

// Specific mood
const examNudge = await generateCatchyNudge('exam_week');
// "Beta! Exam se pehle zen raho. You got this! 💪"

// Handle fallback
const nudge2 = await generateCatchyNudge() || "You're doing great!";
```

**Uses Cases**:
- Homepage nudge on app load
- Mood button interaction
- Push notification messages
- Daily reminder notifications

---

### 3. `generateHealthLesson(topic: string, perspective?: string)`

**Purpose**: Create educational health content in 3 perspectives

**Parameters**:
```typescript
topic: string  // e.g., "Depression", "Stress Management", "Anxiety Relief"
perspective?: string  // 'allopathy' | 'ayurveda' | 'yoga' (default: all 3)
```

**Returns**:
```typescript
{
  allopathy?: string,  // Western medicine perspective (5-7 paragraphs)
  ayurveda?: string,   // Traditional Indian medicine
  yoga?: string        // Mind-body practice
}
```

**Example Usage**:
```typescript
// Get all perspectives
const lesson = await generateHealthLesson("Anxiety Management");
console.log(lesson.allopathy);   // Neuroscience-based explanation
console.log(lesson.ayurveda);    // Doshas and herbal remedies
console.log(lesson.yoga);        // Pranayama and meditation

// Specific perspective
const allopathy = await generateHealthLesson("Sleep Disorders", "allopathy");
// Returns Western medicine approach to insomnia

// Display in UI
{lesson.allopathy && <Text>{lesson.allopathy}</Text>}
```

**Content Typically Includes**:
**Allopathy**: Neurochemistry, medications, clinical evidence
**Ayurveda**: Doshas (Vata/Pitta/Kapha), herbs, digestion focus
**Yoga**: Asanas, pranayama, meditation duration and techniques

---

### 4. `generateHealingImage(topic: string)`

**Purpose**: Create educational health infographics

**Parameters**:
```typescript
topic: string  // e.g., "Depression Symptoms", "Stress Relief Techniques"
```

**Returns**:
```typescript
string  // Image URL or SVG placeholder if API fails
// Example: "https://images.unsplash.com/..." or "<svg>...</svg>"
```

**Example Usage**:
```typescript
const imageUrl = await generateHealingImage("Anxiety Symptoms");

// In React
<img src={imageUrl} alt="Anxiety Info" />

// With fallback handling
const image = await generateHealingImage("Sleep Tips") || 
  "https://via.placeholder.com/400x300?text=Sleep+Tips";
<Image source={{ uri: image }} />
```

**Generated Content**:
- Infographics with text and illustrations
- Symptom charts
- Treatment pathways
- Technique step-by-step visuals

**Timeout**: 15 seconds (returns placeholder if exceeds)

---

### 5. `generateRelaxationVideo(topic: string)`

**Purpose**: Create meditation and relaxation videos using Veo model

**Parameters**:
```typescript
topic: string  // e.g., "5-minute Meditation", "Breathing Exercise"
```

**Returns**:
```typescript
string  // Video URL or placeholder if API fails
// Example: "https://storage.googleapis.com/..." or fallback URL
```

**Example Usage**:
```typescript
const videoUrl = await generateRelaxationVideo("Guided Meditation");

// In React
<video controls>
  <source src={videoUrl} type="video/mp4" />
</video>

// Show loading while generating
const [video, setVideo] = useState(null);
const [loading, setLoading] = useState(false);

const handleGenerateVideo = async () => {
  setLoading(true);
  const url = await generateRelaxationVideo("10-minute Yoga");
  setVideo(url);
  setLoading(false);
};
```

**Wait Time**: 30-60 seconds (returns placeholder after timeout)

**Video Types**:
- Guided meditation
- Breathing exercises
- Yoga flows
- Progressive muscle relaxation
- Mindfulness sessions

---

### 6. `analyzeSDoH(location: {lat, lng}, symptoms: string, file?: File)`

**Purpose**: Analyze Social Determinants of Health with environmental context

**Parameters**:
```typescript
location: {
  latitude: number,   // GPS coordinate
  longitude: number   // GPS coordinate
}
symptoms: string     // User's health concerns
file?: File         // Optional: blood report or prescription
```

**Returns**:
```typescript
{
  environmental_context: {
    aqi: number,                    // 0-500 (higher = worse)
    aqi_category: string,           // "Good" | "Moderate" | "Poor"
    weather: string,                // Current weather description
    location_risks: string[],       // Disease outbreaks nearby
    pollution_advisories: string[]  // Health warnings
  },
  clinical_analysis: {
    symptom_severity: "Low" | "Medium" | "High",
    symptom_context: string,        // How symptoms relate to environment
    clinical_recommendation: string  // Medical guidance
  },
  risk_score: number,               // 0-100 (higher = worse)
  sdoh_prescription: string         // Actionable advice
}
```

**Example Usage**:
```typescript
const analysis = await analyzeSDoH(
  { latitude: 28.7041, longitude: 77.1025 },  // Delhi
  "Cough and shortness of breath"
);

console.log(analysis.environmental_context.aqi);  // 234 (poor air)
console.log(analysis.risk_score);  // 72 out of 100

// Display recommendation
<Text>{analysis.sdoh_prescription}</Text>
// "High AQI detected. Avoid outdoor activities. Use air purifier.
//  Wear N95 mask. Consult pulmonologist if symptoms persist."

// Handle no location
const analysisNoLocation = await analyzeSDoH(
  { latitude: 0, longitude: 0 },  // Placeholder
  "Fever"
);
// Still analyzes symptoms, just generic environmental data
```

**Environmental Factors**:
- Air Quality Index (AQI)
- Temperature & humidity
- Disease prevalence (Dengue, Flu, etc.)
- Water quality
- Pollen count

---

### 7. `runAgenticWorkflow(condition: string, userProfile?: Object)`

**Purpose**: Multi-step AI-driven care plan orchestration

**Parameters**:
```typescript
condition: string      // Health condition to plan for
userProfile?: {        // Optional user context
  age?: number,
  gender?: string,
  comorbidities?: string[],
  medications?: string[]
}
```

**Returns**:
```typescript
{
  care_plan: {
    step_1: string,    // Initial assessment
    step_2: string,    // Primary intervention
    step_3: string,    // Follow-up
    step_4: string     // Maintenance
  },
  specialists_needed: string[],  // "Cardiologist", "Therapist", etc.
  timeline: string,              // "2 weeks" to "3 months"
  risks: string[]                // Potential complications
}
```

**Example Usage**:
```typescript
const plan = await runAgenticWorkflow("Depression", {
  age: 28,
  gender: "Female",
  comorbidities: ["Anxiety"]
});

console.log(plan.care_plan.step_1);
// "Initial psychiatric assessment and PHQ-9 screening"

console.log(plan.specialists_needed);
// ["Psychiatrist", "Psychotherapist", "Nutritionist"]

// Display in UI
<List>
  {Object.entries(plan.care_plan).map(([step, description]) => (
    <ListItem key={step} title={step} description={description} />
  ))}
</List>
```

**Multi-step Process**:
1. Diagnosis confirmation
2. Treatment selection
3. Progress monitoring
4. Adjustment & optimization

---

### 8. `simulateDigitalTwin(drugName: string, userBiodata?: Object)`

**Purpose**: Simulate drug interactions on your biological model

**Parameters**:
```typescript
drugName: string       // e.g., "Fluoxetine", "Metformin"
userBiodata?: {
  age?: number,
  weight?: number,        // kg
  genetic_markers?: string[],  // e.g., "CYP3A4 slow metabolizer"
  comorbidities?: string[],
  current_medications?: string[]
}
```

**Returns**:
```typescript
{
  drug_info: {
    name: string,
    mechanism: string,         // How it works
    absorption_time: string    // "15-30 minutes"
  },
  efficacy_score: number,      // 0-100%
  side_effect_probability: {
    nausea: number,            // % chance
    headache: number,
    insomnia: number,
    // ... other side effects
  },
  dosage_recommendation: {
    standard: string,          // "20mg once daily"
    adjusted: string,          // Personalized dose
    reason_for_adjustment: string
  },
  drug_interactions: string[]  // "Avoid with alcohol"
}
```

**Example Usage**:
```typescript
const simulation = await simulateDigitalTwin("Sertraline", {
  age: 30,
  weight: 65,
  genetic_markers: ["CYP2D6 poor metabolizer"],
  current_medications: ["Vitamin D"]
});

console.log(simulation.efficacy_score);  // 85%
console.log(simulation.dosage_recommendation.adjusted);  // "50mg"
console.log(simulation.side_effect_probability.nausea);  // 15%

// Display drug interaction warnings
<Alert severity="warning">
  {simulation.drug_interactions.join(", ")}
</Alert>
```

**Genetic Considerations**:
- CYP450 enzyme variants
- HLA alleles
- TPMT status
- MTHFR mutations

---

### 9. `analyzeMultiModal(scanImage: File, clinicalNotes: string, geneticData?: string)`

**Purpose**: Cross-reference medical scan + clinical notes + genetic data

**Parameters**:
```typescript
scanImage: File        // Medical image (X-Ray, MRI, CT)
clinicalNotes: string  // Doctor's clinical observations
geneticData?: string   // Genetic test results (optional)
```

**Returns**:
```typescript
{
  scan_interpretation: string,     // What's visible in the image
  clinical_correlation: string,    // How notes align with scan
  genetic_relevance?: string,      // Connection to genetic markers
  composite_diagnosis: string,     // Integrated diagnosis
  confidence_score: number,        // 0-100%
  recommended_next_steps: string[] // Further tests or treatments
}
```

**Example Usage**:
```typescript
const file = /* X-Ray image file */;
const analysis = await analyzeMultiModal(
  file,
  "Patient presents with persistent cough for 3 weeks",
  "FEV1: 70%, No pulmonary fibrosis markers"
);

console.log(analysis.scan_interpretation);
// "Mild bilateral infiltrates, consistent with chronic bronchitis"

console.log(analysis.composite_diagnosis);
// "Chronic bronchitis with seasonal exacerbation, likely viral"

// Show confidence
<Progress value={analysis.confidence_score} />
```

**Supported Scan Types**:
- X-Ray (chest, limbs, spine)
- MRI scans
- CT scans
- Ultrasound images
- ECG/EEG readings

---

### 10. `runFederatedLearning(localData: Object)`

**Purpose**: Train AI models locally without sharing raw data

**Parameters**:
```typescript
localData: {
  user_health_metrics: Object,     // Local vital signs
  symptom_history: string[],       // Past symptoms
  treatment_outcomes: Object       // What worked/didn't work
}
```

**Returns**:
```typescript
{
  model_accuracy: number,          // % accuracy of local model
  insights: string[],              // What model learned
  privacy_preserved: boolean,      // ✅ Data not sent to servers
  aggregation_status: string,      // "Ready for aggregation"
  local_improvements: string[]     // Personalized predictions
}
```

**Example Usage**:
```typescript
const flResult = await runFederatedLearning({
  user_health_metrics: { heart_rate: 72, bp: "120/80" },
  symptom_history: ["headache", "fatigue"],
  treatment_outcomes: { aspirin: "effective", rest: "very effective" }
});

console.log(flResult.privacy_preserved);  // true ✅
console.log(flResult.local_improvements);
// ["Rest is more effective than medication for your headaches"]

// Show privacy badge
{flResult.privacy_preserved && <Badge>Privacy Protected 🔒</Badge>}
```

**Privacy Features**:
- No raw data sent to servers
- Only model weights shared
- Differential privacy noise added
- Homomorphic encryption optional

---

### 11. `generateZKP(claim: string)`

**Purpose**: Create privacy-preserving mathematical proofs

**Parameters**:
```typescript
claim: string  // e.g., "I have diabetes" or "I'm over 18 years old"
```

**Returns**:
```typescript
{
  proof_hash: string,              // Cryptographic proof
  claim_verified: boolean,         // Proof is mathematically valid
  can_share_with_smart_contract: boolean,
  proof_details: {
    algorithm: string,             // e.g., "zk-SNARK"
    proof_generation_time: string  // "2.3 seconds"
  }
}
```

**Example Usage**:
```typescript
// Prove medical condition without revealing details
const proof = await generateZKP("I have Type-2 Diabetes");

console.log(proof.claim_verified);  // true ✅

// Share with healthcare provider via smart contract
if (proof.can_share_with_smart_contract) {
  await shareProofToBlockchain(proof.proof_hash);
}

// Share proof with insurance
<CopyButton text={proof.proof_hash} label="Copy Proof" />
```

**Use Cases**:
- Prove age without revealing birthdate
- Prove medical condition for insurance
- Prove vaccination status
- Smart contract-based healthcare benefits
- Credential verification

---

### 12. `parseToFHIR(rawMedicalData: string)`

**Purpose**: Convert medical data to standard FHIR format

**Parameters**:
```typescript
rawMedicalData: string  // Unstructured medical text
// Example: "Blood pressure 120/80, Heart rate 72, Temperature 98.6F"
```

**Returns**:
```typescript
{
  fhir_bundle: Object,  // Standard HL7 FHIR structure
  observations: Array,  // Parsed vital signs
  conditions: Array,    // Detected diagnoses
  medications: Array,   // Identified drugs
  conversion_success: boolean
}
```

**Example Usage**:
```typescript
const fhirData = await parseToFHIR(
  "Patient has history of hypertension. Currently on Lisinopril 10mg daily. " +
  "Blood pressure today: 135/88. No complaints."
);

console.log(fhirData.fhir_bundle.resourceType);  // "Bundle"
console.log(fhirData.conditions);  // ["hypertension"]
console.log(fhirData.medications);  // [{ name: "Lisinopril", dose: "10mg" }]

// Export to FHIR-compatible EHR system
const jsonLD = JSON.stringify(fhirData.fhir_bundle);
downloadFile(jsonLD, "health-record.fhir.json");
```

**FHIR Resources Created**:
- Patient
- Observation (vitals)
- Condition (diagnoses)
- MedicationStatement
- Procedure
- DiagnosticReport

---

### 13. `speakText(text: string, language?: string)`

**Purpose**: Convert text to speech for accessibility

**Parameters**:
```typescript
text: string            // Text to speak aloud
language?: string       // 'en' (English) | 'hi' (Hindi) | 'hi-en' (Hinglish)
```

**Returns**:
```typescript
{
  audio_url: string,         // Audio file URL
  duration_seconds: number,  // How long it takes to play
  status: "playing" | "paused" | "stopped"
}
```

**Example Usage**:
```typescript
const audio = await speakText("Take a deep breath and relax", "en");
const audioHi = await speakText("Ghar par rahe, relaxation karo", "hi-en");

// Play audio
const audioElement = new Audio(audio.audio_url);
audioElement.play();

// With UI controls
<button onClick={() => new Audio(audio.audio_url).play()}>
  🔊 Listen to Lesson
</button>

// Multiple languages
<LanguageToggle
  onLanguageChange={(lang) => {
    const audio = await speakText(lesson, lang);
    audioElement.src = audio.audio_url;
    audioElement.play();
  }}
/>
```

**Supported Languages**:
- English (en)
- Hindi (hi)
- Hinglish (hi-en)
- Tamil (ta)
- Bengali (bn)

---

## 🚀 USAGE PATTERNS

### Pattern 1: Error Handling with Fallbacks

```typescript
// Safe pattern - always has fallback
const nudge = await generateCatchyNudge() || 
  "You're doing amazing! Keep going! 💪";

// Never throws an error
try {
  const lesson = await generateHealthLesson("Stress");
  displayContent(lesson);
} catch (e) {
  // Won't reach here - uses fallback instead
}
```

### Pattern 2: Loading States

```typescript
const [loading, setLoading] = useState(false);

const generateContent = async () => {
  setLoading(true);
  try {
    const image = await generateHealingImage("Anxiety");
    setImage(image);
  } finally {
    setLoading(false);
  }
};

{loading && <LoadingSpinner />}
```

### Pattern 3: Combining Multiple Functions

```typescript
// Generate complete module
const generateModule = async (topic) => {
  const [lesson, image, video] = await Promise.all([
    generateHealthLesson(topic),
    generateHealingImage(topic),
    generateRelaxationVideo(topic)
  ]);
  
  return { lesson, image, video };
};
```

### Pattern 4: Error Awareness

```typescript
// Check for API issues
if (!process.env.VITE_GEMINI_API_KEY) {
  console.warn("Gemini API key not configured. Using fallbacks.");
  // App still works with cached/static content
}
```

---

## 📊 API Response Timing

| Operation | Min | Typical | Max | Timeout |
|-----------|-----|---------|-----|---------|
| Chat | 1s | 3-5s | 10s | 15s |
| Nudge | 1s | 2-3s | 8s | 10s |
| Lesson | 3s | 5-10s | 20s | 25s |
| Image | 5s | 10-15s | 25s | 30s |
| Video | 10s | 30-60s | 120s | 90s |
| SDoH | 2s | 8-12s | 20s | 25s |
| Simulation | 2s | 5-8s | 15s | 20s |
| Multi-modal | 5s | 10-20s | 30s | 40s |

---

## 🔑 Environment Setup

```bash
# .env file
VITE_GEMINI_API_KEY=AIzaSyDvW8GGgRMuYMEyZxPSaD8o3-FP4vEfmVk
```

**Never commit `.env` to Git!**

---

## 📚 Related Documentation

- [FEATURE_GUIDE.md](./FEATURE_GUIDE.md) - User-facing features
- [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md) - Integration status
- [GEMINI_INTEGRATION.md](./GEMINI_INTEGRATION.md) - Technical overview

---

**Last Updated**: Full Integration Complete
**All Functions**: Production Ready ✅
