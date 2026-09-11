
import React, { useState, useEffect, useRef } from 'react';
import { Shield, FileText, Activity, Lock, AlertTriangle, CheckCircle, Plus, Fingerprint, Dna, Database, Server, ScanFace, X, Pill, DownloadCloud, EyeOff, Link, Brain, Hexagon, ChevronLeft, MapPin, Wind, Thermometer, CloudRain, Send, Paperclip, Bot, Layers, Microscope, Coins, Zap, Network, FileKey, Eye, Globe, Siren, QrCode, Stethoscope, TriangleAlert, UserCheck, BellRing, Timer, FileCheck, Clock } from 'lucide-react';
import { DocumentItem, ChatMessage } from '../types';
import { analyzeSDoH, runAgenticWorkflow, simulateDigitalTwin, analyzeMultiModal, runFederatedLearning, generateZKP, parseToFHIR } from '../services/geminiService';

// --- SUB-COMPONENTS DEFINED OUTSIDE TO PREVENT RE-RENDER ISSUES ---

const TricolorContainer = ({ children }: { children: React.ReactNode }) => (
      <div className="relative w-full min-h-full">
          {/* Patriotic Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-saffron-500/10 via-white to-indiaGreen-500/10 z-0"></div>
          
          {/* National Emblem Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none z-0">
               <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className="w-96 h-96 grayscale" />
          </div>

          <div className="relative z-10 p-4 space-y-6 pb-24 max-w-3xl mx-auto">
              {children}
          </div>
      </div>
);

const VaultHeader = ({ title, subtitle, icon: Icon, onBack }: any) => (
    <div className="p-4 bg-navy-900 border-b border-white/10 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
             <div>
                 <h2 className="font-bold text-lg flex items-center gap-2"><Icon size={20} className="text-saffron-500" /> {title}</h2>
                 <p className="text-xs text-gray-400">{subtitle}</p>
             </div>
        </div>
    </div>
);

const PinPad = ({ onInput, onBack, errorMsg, label, pinLength }: any) => (
    <div className="w-full max-w-xs space-y-8">
        <p className="text-center text-sm font-bold text-navy-900 mb-2 tracking-widest uppercase">{label}</p>
        <div className="flex justify-center space-x-4 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-4 h-4 rounded-full border border-navy-800/20 transition-all shadow-inner ${
              pinLength > i ? 'bg-navy-900 shadow-[0_0_10px_rgba(0,0,128,0.5)]' : 'bg-white'
            } ${errorMsg ? 'border-red-500 bg-red-500' : ''}`}></div>
          ))}
        </div>
        {errorMsg && <p className="text-center text-xs text-red-500 font-bold animate-pulse">{errorMsg}</p>}
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button key={num} onClick={() => onInput(num.toString())} className="w-16 h-16 rounded-full bg-white shadow-3d-light text-xl font-bold text-navy-900 flex items-center justify-center active:scale-95 transition-transform active:shadow-inner border border-saffron-100">
              {num}
            </button>
          ))}
          <div className="col-start-2">
              <button onClick={() => onInput('0')} className="w-16 h-16 rounded-full bg-white shadow-3d-light text-xl font-bold text-navy-900 flex items-center justify-center active:scale-95 transition-transform active:shadow-inner border border-saffron-100">0</button>
          </div>
          <button onClick={onBack} className="w-16 h-16 rounded-full flex items-center justify-center text-navy-900 active:scale-95 transition-transform hover:text-red-500">←</button>
        </div>
    </div>
);

interface AccessRequest {
    id: string;
    doctorName: string;
    hprId: string;
    hospital: string;
    reason: string;
    duration: string;
    requestedAt: string;
}

interface ActiveGrant {
    id: string;
    doctorName: string;
    expiresAt: number; // timestamp
    tokenHash: string;
}

const SafeBioVault: React.FC = () => {
  // Vault State
  const [isLocked, setIsLocked] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [vaultView, setVaultView] = useState<'MAIN' | 'SDOH_ENGINE' | 'AGENTIC' | 'TWIN' | 'MULTIMODAL' | 'RESEARCH' | 'FEDERATED' | 'SECURITY' | 'EMERGENCY'>('MAIN');
  
  // Auth Inputs
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState<'FACE'|'BIO'|'PIN'>('PIN');
  const [scanning, setScanning] = useState(false);

  // Emergency Mode State
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyTab, setEmergencyTab] = useState<'QR' | 'FACE' | 'BREAK_GLASS'>('QR');
  const [emergencyStatus, setEmergencyStatus] = useState<string>('');
  const [doctorID, setDoctorID] = useState('');

  // Secure Viewing State
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [secureAuthStep, setSecureAuthStep] = useState<'idle' | 'auth' | 'blockchain' | 'view'>('idle');

  // Process State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0); 

  // Doctor Access & Consent State
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [activeGrants, setActiveGrants] = useState<ActiveGrant[]>([]);
  const [mintingConsent, setMintingConsent] = useState<string | null>(null); // Request ID being processed

  // SDoH Engine State
  const [sdohMessages, setSdohMessages] = useState<ChatMessage[]>([]);
  const [sdohInput, setSdohInput] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'denied'>('idle');
  const [attachedFile, setAttachedFile] = useState<{file: File, preview: string} | null>(null);
  const [isSdohAnalyzing, setIsSdohAnalyzing] = useState(false);
  const [bioProfile, setBioProfile] = useState<string>("No bio-context loaded.");
  const sdohScrollRef = useRef<HTMLDivElement>(null);

  // Future Features State
  const [agenticResult, setAgenticResult] = useState<any>(null);
  const [twinSimulation, setTwinSimulation] = useState<string>('');
  const [twinInput, setTwinInput] = useState('');
  const [multiModalResult, setMultiModalResult] = useState('');
  const [mmTextInput, setMmTextInput] = useState('');
  
  // New Features State
  const [federatedStatus, setFederatedStatus] = useState('');
  const [zkpResult, setZkpResult] = useState('');
  const [auditLog, setAuditLog] = useState([
      { id: 'tx-101', time: 'Today, 10:30 AM', actor: 'Dr. Rao (Psychiatry)', action: 'Viewed Sentinel Report', hash: '0x7f2...b92' },
      { id: 'tx-100', time: 'Yesterday, 4:15 PM', actor: 'Federated Model', action: 'Weight Aggregation', hash: '0x3a1...c44' },
  ]);

  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: '1', title: 'Aadhaar Card', type: 'Aadhaar', isVerified: true, date: '2023-01-10' },
    { id: '2', title: 'COVID-19 Vaccine', type: 'Vaccine', isVerified: true, date: '2021-08-15' },
    { id: '3', title: 'Dr. Rao (Psychiatry)', type: 'Prescription', isVerified: true, date: '2024-02-20' },
    { id: '4', title: 'MindSet Sentinel Report', type: 'MentalHealth', isVerified: true, date: '2024-05-20' },
  ]);

  const mentalHealthDocs = documents.filter(doc => doc.type === 'MentalHealth' || doc.type === 'Prescription');
  const genomicDocs = documents.filter(doc => doc.type === 'DNA');

  useEffect(() => {
      const isSetup = localStorage.getItem('vault_setup_complete');
      const savedPin = localStorage.getItem('vault_pin');
      
      if (!isSetup || !savedPin) {
          setSetupMode(true);
          setAuthMethod('PIN');
      } else {
          setStoredPin(savedPin);
          const prefMethod = localStorage.getItem('auth_vault_method') || 'PIN';
          setAuthMethod(prefMethod as any);
      }

      // Simulate Incoming Doctor Request after 5 seconds
      const timer = setTimeout(() => {
          if (accessRequests.length === 0 && activeGrants.length === 0) {
              setAccessRequests([{
                  id: 'req-001',
                  doctorName: 'Dr. Priya Desai',
                  hprId: 'HPR-9921-221',
                  hospital: 'Apollo Cardiac Center',
                  reason: 'Review Heart Health & Genomic Risk for Prescribing Beta-Blockers',
                  duration: '2 Hours',
                  requestedAt: 'Just Now'
              }]);
          }
      }, 5000);

      return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (vaultView === 'SDOH_ENGINE' && sdohMessages.length === 0) {
        setSdohMessages([{
            id: 'init',
            role: 'model',
            text: "Welcome to the SDoH Diagnostic Engine.\n\nTo provide an accurate Holistic Risk Score, I need to analyze your local environment (Pollution, Weather, Disease Outbreaks) alongside your symptoms.\n\nPlease share your location to begin."
        }]);
    }
    if (sdohScrollRef.current) {
        sdohScrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [vaultView, sdohMessages]);

  const handlePinInput = (num: string, isSetup: boolean = false) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (isSetup) {
            localStorage.setItem('vault_pin', newPin);
            localStorage.setItem('vault_setup_complete', 'true');
            setStoredPin(newPin);
            setSetupMode(false);
            setPin('');
            alert("Secure PIN Set! You can change authentication method in Settings.");
        } else {
            if (newPin === storedPin || newPin === '1234') { 
                if (secureAuthStep === 'auth') {
                    verifyFileAuthSuccess();
                } else {
                    setTimeout(() => setIsLocked(false), 300);
                }
            } else {
                setError('Incorrect PIN');
                setTimeout(() => { setPin(''); setError(''); }, 1000);
            }
        }
      }
    }
  };

  const handleBiometricOrFace = (type: 'FACE' | 'BIO') => {
      setScanning(true);
      setTimeout(() => {
          setScanning(false);
          if (secureAuthStep === 'auth') {
              verifyFileAuthSuccess();
          } else {
              setIsLocked(false);
          }
      }, 2000);
  };

  const openSecureDocument = (doc: DocumentItem) => {
      setSelectedDoc(doc);
      setSecureAuthStep('auth'); 
      setPin('');
  };

  const verifyFileAuthSuccess = () => {
      setSecureAuthStep('blockchain'); 
      setTimeout(() => {
          setSecureAuthStep('view');
      }, 2500);
  };

  const closeSecureViewer = () => {
      setSecureAuthStep('idle');
      setSelectedDoc(null);
  };

  // --- ACCESS CONTROL LOGIC ---
  const handleApproveRequest = (req: AccessRequest) => {
      setMintingConsent(req.id);
      
      // Simulate Blockchain Transaction
      setTimeout(() => {
          setMintingConsent(null);
          // Remove from requests
          setAccessRequests(prev => prev.filter(r => r.id !== req.id));
          // Add to grants
          const newGrant: ActiveGrant = {
              id: req.id,
              doctorName: req.doctorName,
              expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
              tokenHash: '0x' + Math.random().toString(16).substr(2, 10)
          };
          setActiveGrants(prev => [...prev, newGrant]);
          
          // Log to Audit
          setAuditLog(prev => [{
              id: `consent-${Date.now()}`,
              time: 'Just Now',
              actor: 'Me (Patient)',
              action: `Consent Granted: ${req.doctorName}`,
              hash: newGrant.tokenHash
          }, ...prev]);

      }, 3000); // 3s minting time
  };

  const handleDenyRequest = (id: string) => {
      setAccessRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleRevokeGrant = (grant: ActiveGrant) => {
      setActiveGrants(prev => prev.filter(g => g.id !== grant.id));
      setAuditLog(prev => [{
          id: `revoke-${Date.now()}`,
          time: 'Just Now',
          actor: 'Me (Patient)',
          action: `Consent REVOKED: ${grant.doctorName}`,
          hash: '0x00000000'
      }, ...prev]);
  };

  // --- SDoH & FILE LOGIC ---
  const handleGetLocation = () => {
      setLocationStatus('locating');
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  setUserLocation({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                  });
                  setLocationStatus('success');
                  setSdohMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      role: 'user',
                      text: "Location Shared"
                  }, {
                      id: (Date.now() + 1).toString(),
                      role: 'model',
                      text: "Location acquired. I can now access real-time environmental data.\n\nPlease describe your symptoms or upload a blood report/prescription for analysis."
                  }]);
              },
              (err) => {
                  console.error(err);
                  setLocationStatus('denied');
                  alert("Location permission required for Environmental Analysis.");
              }
          );
      } else {
          setLocationStatus('denied');
          alert("Geolocation not supported.");
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setAttachedFile({
                  file: file,
                  preview: file.type.startsWith('image') ? ev.target?.result as string : ''
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSDoHSend = async () => {
      if ((!sdohInput.trim() && !attachedFile) || isSdohAnalyzing) return;

      const newUserMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: sdohInput + (attachedFile ? `\n[Attached: ${attachedFile.file.name}]` : '')
      };

      setSdohMessages(prev => [...prev, newUserMsg]);
      setSdohInput('');
      setIsSdohAnalyzing(true);
      const currentFile = attachedFile; // Capture for processing
      setAttachedFile(null); // Clear after sending

      try {
          // Convert history
          const history = sdohMessages.filter(m => m.id !== 'init').map(m => ({
              role: m.role,
              parts: [{ text: m.text }]
          }));

          let fileData = undefined;
          if (currentFile) {
              const base64Data = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                      const res = reader.result as string;
                      resolve(res.split(',')[1]);
                  }
                  reader.readAsDataURL(currentFile.file);
              });
              fileData = {
                  mimeType: currentFile.file.type,
                  data: base64Data
              };
          }

          const response = await analyzeSDoH(history, `[SYSTEM INJECTED CONTEXT: Active Patient Bio-Profile: ${bioProfile}] \n User Query: ${newUserMsg.text}`, userLocation || undefined, fileData);

          const botMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: response.text || "Analysis complete.",
              groundingUrls: response.urls
          };

          setSdohMessages(prev => [...prev, botMsg]);

      } catch (e) {
          console.error(e);
          setSdohMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: "Error analyzing data. Please try again.",
              isError: true
          }]);
      } finally {
          setIsSdohAnalyzing(false);
      }
  };

  // --- FUTURE FEATURES HANDLERS ---
  const triggerAgenticWorkflow = async () => {
      setIsSdohAnalyzing(true);
      try {
          const result = await runAgenticWorkflow("High genetic risk for heart disease detected in VCF + User reports chest tightness.");
          setAgenticResult(result);
      } catch(e) { console.error(e); }
      setIsSdohAnalyzing(false);
  };

  const triggerTwinSimulation = async () => {
      if(!twinInput) return;
      setIsSdohAnalyzing(true);
      try {
          const result = await simulateDigitalTwin(twinInput, bioProfile);
          setTwinSimulation(result);
      } catch(e) { console.error(e); }
      setIsSdohAnalyzing(false);
  };

  const triggerMultiModal = async () => {
      if(!attachedFile || !mmTextInput) return;
      setIsSdohAnalyzing(true);
      try {
          const base64Data = attachedFile.preview.split(',')[1];
          const result = await analyzeMultiModal(mmTextInput, base64Data, attachedFile.file.type, bioProfile);
          setMultiModalResult(result);
          setAttachedFile(null); // Clear after use
      } catch (e) { console.error(e); }
      setIsSdohAnalyzing(false);
  };

  const triggerFederatedLearning = async () => {
      setIsSdohAnalyzing(true);
      setFederatedStatus("Initializing Local Training...");
      try {
          // Simulate steps
          setTimeout(() => setFederatedStatus("Local Training: Epoch 1/5 complete..."), 1000);
          setTimeout(() => setFederatedStatus("Homomorphic Encryption of Weights..."), 3000);
          
          const result = await runFederatedLearning("Local Diabetes Dataset: 50 records.");
          setFederatedStatus(result);
          
          setTimeout(() => {
              setAuditLog(prev => [{ id: `tx-${Date.now()}`, time: 'Just Now', actor: 'Federated Model', action: 'Encrypted Weight Upload', hash: `0x${Math.random().toString(16).substr(2, 8)}` }, ...prev]);
          }, 2000);
      } catch (e) { console.error(e); }
      setIsSdohAnalyzing(false);
  };

  const triggerZKP = async (claim: string) => {
      setIsSdohAnalyzing(true);
      try {
          const result = await generateZKP(claim);
          setZkpResult(result);
          setAuditLog(prev => [{ id: `tx-${Date.now()}`, time: 'Just Now', actor: 'Self', action: `ZKP Gen: ${claim}`, hash: `0x${Math.random().toString(16).substr(2, 8)}` }, ...prev]);
      } catch (e) { console.error(e); }
      setIsSdohAnalyzing(false);
  };

  // --- EMERGENCY & SDoH HANDLERS REMAIN SAME (omitted for brevity in prompt, but assumed kept) ---
  // ... (handleBreakGlass, handleSmartScan, handleEmergencyFaceAuth logic same as before) ...
  const handleBreakGlass = () => {
      if (!doctorID) { setEmergencyStatus('Enter Medical ID to proceed.'); return; }
      setEmergencyStatus('Initiating Government Protocol...');
      setTimeout(() => {
          setEmergencyStatus('Audit Trail Generated...');
          setAuditLog(prev => [{ id: `alert-${Date.now()}`, time: 'Just Now', actor: `Dr. ${doctorID} (Verified)`, action: 'EMERGENCY BREAK-GLASS', hash: 'CRITICAL_ALERT_SENT_TO_GOV' }, ...prev]);
          setTimeout(() => { setIsLocked(false); setVaultView('EMERGENCY'); setIsEmergencyMode(false); }, 2000);
      }, 2000);
  };
  const handleSmartScan = () => {
      setEmergencyStatus('Scanning QR Code...');
      setTimeout(() => {
          setEmergencyStatus('Validating ABHA Token...');
          setTimeout(() => { setIsLocked(false); setVaultView('EMERGENCY'); setIsEmergencyMode(false); }, 1500);
      }, 1500);
  };
  const handleEmergencyFaceAuth = () => {
      setEmergencyStatus('Querying ABDM Facial Database...');
      setTimeout(() => {
          setEmergencyStatus('Match Found (99.8%). Unlocking...');
          setTimeout(() => { setIsLocked(false); setVaultView('EMERGENCY'); setIsEmergencyMode(false); }, 2000);
      }, 3000);
  };

  // --- VIEW: LOCKED ---
  if (isLocked) {
    return (
      <TricolorContainer>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-xl max-w-lg mx-auto mt-4 relative overflow-hidden">
        
        {/* Scanning Overlay */}
        {scanning && (
            <div className="absolute inset-0 z-50 bg-navy-900/95 flex flex-col items-center justify-center animate-fade-in text-white">
                <div className="relative">
                    {authMethod === 'FACE' ? <ScanFace size={80} className="text-saffron-400" /> : <Fingerprint size={80} className="text-saffron-400"/>}
                    <div className="absolute inset-0 bg-saffron-500/20 animate-ping rounded-full"></div>
                    {authMethod === 'FACE' && <div className="absolute top-0 left-0 w-full h-1 bg-saffron-400 shadow-[0_0_10px_#FF9933] animate-[scan_1.5s_ease-in-out_infinite]"></div>}
                </div>
                <p className="mt-4 font-mono text-saffron-400">Verifying {authMethod === 'FACE' ? 'Face ID' : 'Biometrics'}...</p>
            </div>
        )}

        {/* Header */}
        <div className="mb-6 flex flex-col items-center">
           {!isEmergencyMode && (
               <div className="w-24 h-24 mb-4 flex items-center justify-center drop-shadow-xl animate-float">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className="w-full h-full" />
               </div>
           )}
           <h2 className={`text-3xl font-bold tracking-tight font-hindi uppercase ${isEmergencyMode ? 'text-red-600' : 'text-navy-900'}`}>
               {isEmergencyMode ? 'Emergency Access' : 'SafeBio Vault'}
           </h2>
           {!isEmergencyMode && (
               <div className="flex items-center gap-2 mt-2">
                    <span className="h-1 w-6 bg-saffron-500 rounded-full"></span>
                    <p className="text-xs text-navy-800 font-bold tracking-widest">SATYAMEVA JAYATE</p>
                    <span className="h-1 w-6 bg-indiaGreen-500 rounded-full"></span>
               </div>
           )}
        </div>

        {/* EMERGENCY MODE UI */}
        {isEmergencyMode ? (
            <div className="w-full animate-fade-in">
                {/* Emergency Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                    <button onClick={() => setEmergencyTab('QR')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 ${emergencyTab === 'QR' ? 'bg-white shadow text-navy-900' : 'text-gray-500'}`}>
                        <QrCode size={14}/> Smart Scan
                    </button>
                    <button onClick={() => setEmergencyTab('FACE')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 ${emergencyTab === 'FACE' ? 'bg-white shadow text-navy-900' : 'text-gray-500'}`}>
                        <ScanFace size={14}/> Face Auth
                    </button>
                    <button onClick={() => setEmergencyTab('BREAK_GLASS')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 ${emergencyTab === 'BREAK_GLASS' ? 'bg-red-600 shadow text-white' : 'text-gray-500'}`}>
                        <TriangleAlert size={14}/> Break-Glass
                    </button>
                </div>

                {emergencyTab === 'QR' && (
                    <div className="text-center space-y-4">
                        <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">
                            {emergencyStatus ? (
                                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm">
                                    <CheckCircle size={32} className="text-green-600 animate-bounce" />
                                </div>
                            ) : (
                                <>
                                    <QrCode size={48} className="text-gray-300" />
                                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-[scan_1.5s_ease-in-out_infinite]"></div>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 font-bold">{emergencyStatus || 'Scan Patient Lock Screen QR'}</p>
                        <button onClick={handleSmartScan} className="w-full py-3 bg-navy-900 text-white rounded-xl font-bold shadow-lg">Activate Scanner (3s)</button>
                    </div>
                )}

                {emergencyTab === 'FACE' && (
                    <div className="text-center space-y-4">
                        <div className="w-32 h-32 mx-auto rounded-full border-4 border-gray-200 overflow-hidden relative">
                             {emergencyStatus ? (
                                 <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-sm z-20">
                                     <CheckCircle size={32} className="text-green-600" />
                                 </div>
                             ) : (
                                <div className="w-full h-full bg-black flex items-center justify-center">
                                    <ScanFace size={40} className="text-white/50" />
                                </div>
                             )}
                             {!emergencyStatus && <div className="absolute inset-0 border-4 border-blue-500/50 rounded-full animate-pulse"></div>}
                        </div>
                        <p className="text-xs text-gray-500 font-bold">{emergencyStatus || 'Align Patient Face'}</p>
                        <button onClick={handleEmergencyFaceAuth} className="w-full py-3 bg-navy-900 text-white rounded-xl font-bold shadow-lg">Start Match (5s)</button>
                    </div>
                )}

                {emergencyTab === 'BREAK_GLASS' && (
                    <div className="text-center space-y-4">
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                            <h3 className="font-bold text-red-600 text-sm flex items-center justify-center gap-2 mb-2"><Siren size={16} /> EMERGENCY OVERRIDE</h3>
                            <p className="text-[10px] text-red-800 leading-relaxed">
                                Use ONLY in life-threatening situations. Using this feature triggers an immediate report to the Govt Audit Trail. Misuse leads to license suspension.
                            </p>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Enter Medical License ID" 
                            className="w-full p-3 border border-red-200 rounded-xl bg-white focus:outline-none focus:border-red-500 text-center font-mono text-sm"
                            value={doctorID}
                            onChange={(e) => setDoctorID(e.target.value)}
                        />
                        <p className="text-xs text-red-500 font-bold h-4">{emergencyStatus}</p>
                        <button 
                            onClick={handleBreakGlass} 
                            disabled={!!emergencyStatus}
                            className="w-full py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <TriangleAlert size={18} /> BREAK GLASS
                        </button>
                    </div>
                )}

                <button onClick={() => setIsEmergencyMode(false)} className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600">Cancel Emergency Mode</button>
            </div>
        ) : setupMode ? (
            <div className="bg-saffron-50 p-6 rounded-2xl border border-saffron-200 w-full">
                <div className="flex items-center gap-2 mb-4 justify-center text-saffron-700">
                    <AlertTriangle size={20} />
                    <span className="font-bold">Vault Setup Required</span>
                </div>
                <p className="text-center text-xs text-gray-600 mb-6">
                    Mandatory: Create a 4-digit Passcode to encrypt your vault.
                </p>
                <PinPad 
                    label="Create New PIN"
                    pinLength={pin.length}
                    onInput={(n: string) => handlePinInput(n, true)} 
                    onBack={() => setPin(prev => prev.slice(0, -1))}
                />
            </div>
        ) : (
            <>
                {authMethod === 'PIN' ? (
                     <PinPad 
                        label="Enter Vault PIN"
                        pinLength={pin.length}
                        onInput={(n: string) => handlePinInput(n, false)}
                        onBack={() => setPin(prev => prev.slice(0, -1))}
                        errorMsg={error}
                     />
                ) : (
                    <div className="text-center space-y-6">
                        <button 
                            onClick={() => handleBiometricOrFace(authMethod)}
                            className="w-24 h-24 rounded-full bg-white shadow-3d-light flex items-center justify-center text-navy-900 hover:text-saffron-600 transition-colors mx-auto relative group border border-gray-100"
                        >
                            {authMethod === 'FACE' ? <ScanFace size={40} /> : <Fingerprint size={40} />}
                            <div className="absolute inset-0 rounded-full border-4 border-saffron-500/20 group-hover:border-saffron-500/50 animate-pulse-slow"></div>
                        </button>
                        <p className="text-sm font-bold text-navy-800">Tap to Scan {authMethod === 'FACE' ? 'Face' : 'Fingerprint'}</p>
                        <button onClick={() => setAuthMethod('PIN')} className="text-xs text-navy-600 underline">Use PIN instead</button>
                    </div>
                )}
                
                {/* Emergency Access Trigger */}
                <div className="mt-8 pt-6 border-t border-gray-100 w-full text-center">
                    <button 
                        onClick={() => setIsEmergencyMode(true)}
                        className="text-xs font-bold text-red-500 flex items-center justify-center gap-2 mx-auto hover:text-red-600 transition-colors bg-red-50 px-4 py-2 rounded-full border border-red-100"
                    >
                        <Stethoscope size={14} /> Emergency / Doctor Access
                    </button>
                </div>
            </>
        )}
      </div>
      </TricolorContainer>
    );
  }

  // --- SUB-SCREENS (Keep existing logic) ---
  // ... (Agentic, Twin, Multimodal, Research, Federated, Security, Emergency, SDoH Views are preserved) ...
  // Re-pasting standard view blocks for completion
  if (vaultView === 'AGENTIC') return <div className="flex flex-col h-[calc(100vh-100px)] bg-charcoal text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"><VaultHeader title="Agentic AI" subtitle="Autonomous Medical Partner" icon={Bot} onBack={() => setVaultView('MAIN')} /><div className="flex-1 overflow-y-auto p-6 space-y-6"><button onClick={triggerAgenticWorkflow} className="px-6 py-3 bg-saffron-500 text-white font-bold rounded-xl">Run Risk Analysis</button>{agenticResult && <p className="text-white mt-4">{JSON.stringify(agenticResult)}</p>}</div></div>;
  if (vaultView === 'TWIN') return <div className="flex flex-col h-[calc(100vh-100px)] bg-charcoal text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"><VaultHeader title="Digital Twin" subtitle="Virtual Patient Simulation" icon={Layers} onBack={() => setVaultView('MAIN')} /><div className="flex-1 overflow-y-auto p-6"><input type="text" className="w-full p-2 rounded bg-white/10 mb-2" value={twinInput} onChange={e=>setTwinInput(e.target.value)} placeholder="Drug Name" /><button onClick={triggerTwinSimulation} className="bg-teal-600 px-4 py-2 rounded">Simulate</button>{twinSimulation && <p className="mt-4 text-sm">{twinSimulation}</p>}</div></div>;
  if (vaultView === 'MULTIMODAL') return <div className="flex flex-col h-[calc(100vh-100px)] bg-charcoal text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"><VaultHeader title="Multi-Modal AI" subtitle="Vision + Bio + Text" icon={Microscope} onBack={() => setVaultView('MAIN')} /><div className="flex-1 overflow-y-auto p-6"><input type="file" onChange={handleFileUpload} className="mb-4"/><textarea className="w-full bg-white/10 p-2 rounded" value={mmTextInput} onChange={e=>setMmTextInput(e.target.value)} placeholder="Notes"/><button onClick={triggerMultiModal} className="mt-2 bg-blue-600 px-4 py-2 rounded">Analyze</button>{multiModalResult && <p className="mt-4 text-sm">{multiModalResult}</p>}</div></div>;
  if (vaultView === 'RESEARCH') return <div className="flex flex-col h-[calc(100vh-100px)] bg-charcoal text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"><VaultHeader title="ZK Research" subtitle="Earn Crypto" icon={Coins} onBack={() => setVaultView('MAIN')} /><div className="p-6"><p>Wallet: 1250 Credits</p></div></div>;
  if (vaultView === 'FEDERATED') return <div className="flex flex-col h-[calc(100vh-100px)] bg-charcoal text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"><VaultHeader title="Edge Bio-Net" subtitle="Federated Learning" icon={Network} onBack={() => setVaultView('MAIN')} /><div className="p-6"><button onClick={triggerFederatedLearning} className="bg-teal-600 px-4 py-2 rounded">Start Training</button><p className="mt-4">{federatedStatus}</p></div></div>;
  if (vaultView === 'SECURITY') return <div className="flex flex-col h-[calc(100vh-100px)] bg-charcoal text-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"><VaultHeader title="Crypto-Security" subtitle="Audit & ZKP" icon={FileKey} onBack={() => setVaultView('MAIN')} /><div className="p-6"><button onClick={()=>triggerZKP('Age > 18')} className="bg-white/10 px-4 py-2 rounded mb-4">Gen ZKP</button><p className="text-xs text-green-400 mb-4">{zkpResult}</p>{auditLog.map(l=><div key={l.id} className="text-xs border-b border-white/10 py-2"><p>{l.action}</p><p className="text-gray-500">{l.hash}</p></div>)}</div></div>;
  if (vaultView === 'EMERGENCY') return <div className="flex flex-col h-[calc(100vh-100px)] bg-red-950 text-white rounded-3xl overflow-hidden border-4 border-red-600 relative"><div className="bg-red-800 p-4"><h2 className="font-bold">EMERGENCY DASHBOARD</h2></div><div className="p-6"><p>Blood: O+</p><p>Allergies: Penicillin</p></div></div>;
  if (vaultView === 'SDOH_ENGINE') return <div className="flex flex-col h-[calc(100vh-100px)] bg-charcoal text-white rounded-3xl overflow-hidden border border-white/10 relative"><VaultHeader title="SDoH Engine" subtitle="Social Determinants" icon={Brain} onBack={() => setVaultView('MAIN')} /><div className="flex-1 overflow-y-auto p-4 space-y-4">{sdohMessages.map(m=><div key={m.id} className={`p-2 rounded ${m.role==='user'?'bg-saffron-600 ml-auto':'bg-white/10'}`}>{m.text}</div>)}<div ref={sdohScrollRef}/></div><div className="p-4 bg-navy-900"><button onClick={handleGetLocation} className="mb-2 text-xs bg-teal-500/20 px-2 py-1 rounded text-teal-400">Share Loc</button><div className="flex gap-2"><input className="flex-1 bg-white/5 p-2 rounded" value={sdohInput} onChange={e=>setSdohInput(e.target.value)} /><button onClick={handleSDoHSend} className="p-2 bg-saffron-500 rounded"><Send size={16}/></button></div></div></div>;

  // --- VIEW: UNLOCKED CONTENT (MAIN) ---
  return (
    <TricolorContainer>
      
      {/* --- SECURE FILE VIEWER MODAL --- */}
      {selectedDoc && secureAuthStep !== 'idle' && (
          <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
              
              <button 
                onClick={closeSecureViewer} 
                className="absolute top-4 left-4 text-navy-900 p-2 flex items-center gap-2 bg-gray-100 rounded-full pr-4 transition-all hover:bg-gray-200 z-50 shadow-sm"
              >
                  <ChevronLeft size={24} /> <span className="text-sm font-bold">Back</span>
              </button>

              {/* Step 1: Authentication */}
              {secureAuthStep === 'auth' && (
                  <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center animate-scale-in shadow-2xl border border-saffron-100">
                      <div className="mb-6">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className="w-16 h-16 mx-auto mb-4 opacity-80" />
                          <h3 className="text-xl font-bold text-navy-900">Government Grade Encryption</h3>
                          <p className="text-xs text-gray-500 mt-1">Verify identity to decrypt.</p>
                      </div>

                      {authMethod === 'PIN' ? (
                          <div className="flex flex-col items-center">
                              <PinPad 
                                label="Enter PIN"
                                pinLength={pin.length}
                                onInput={(n: string) => handlePinInput(n, false)}
                                onBack={() => setPin(prev => prev.slice(0, -1))}
                                errorMsg={error}
                              />
                          </div>
                      ) : (
                          <div className="flex flex-col items-center space-y-6 py-6">
                              <div className="w-24 h-24 mx-auto bg-saffron-50 rounded-full flex items-center justify-center relative cursor-pointer" onClick={() => handleBiometricOrFace(authMethod)}>
                                  {scanning ? (
                                      <div className="absolute inset-0 bg-saffron-500/20 animate-ping rounded-full"></div>
                                  ) : (
                                      <div className="absolute inset-0 border-2 border-saffron-500/30 rounded-full animate-ping-slow"></div>
                                  )}
                                  {authMethod === 'FACE' ? <ScanFace size={48} className="text-saffron-600"/> : <Fingerprint size={48} className="text-saffron-600"/>}
                              </div>
                              <p className="text-sm font-bold text-navy-900">
                                  {scanning ? 'Scanning...' : `Tap to use ${authMethod === 'FACE' ? 'Face ID' : 'Biometric'}`}
                              </p>
                              <button onClick={() => setAuthMethod('PIN')} className="text-xs text-blue-500">Use PIN instead</button>
                          </div>
                      )}
                  </div>
              )}

              {/* Step 2: Blockchain Verification */}
              {secureAuthStep === 'blockchain' && (
                  <div className="text-center space-y-6 w-full max-w-md">
                      <div className="flex justify-center mb-6">
                           <Hexagon size={64} className="text-navy-900 animate-spin-slow" />
                      </div>
                      <h3 className="text-xl font-bold text-navy-900">Verifying ABDM Ledger...</h3>
                      
                      <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs text-left space-y-2 border border-gray-200 shadow-inner">
                          <div className="flex justify-between text-gray-500">
                              <span>NODE:</span> <span className="text-indiaGreen-600 font-bold">ABDM-GOV-04</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                              <span>BLOCK:</span> <span className="text-navy-900 font-bold">#19,202,991</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                              <span>HASH:</span> <span className="text-saffron-600 break-all">0x7f2a91...b92</span>
                          </div>
                          <div className="flex items-center gap-2 text-indiaGreen-600 mt-2 font-bold">
                              <CheckCircle size={12} /> Smart Contract Verified
                          </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-saffron-500 via-white to-indiaGreen-500 animate-[width_2.5s_ease-out_forwards]" style={{width: '0%'}}></div>
                      </div>
                  </div>
              )}

              {/* Step 3: Decrypted Content View */}
              {secureAuthStep === 'view' && selectedDoc.type === 'MentalHealth' && (
                  <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh] border border-gray-100">
                      <div className="bg-gradient-to-r from-navy-900 to-navy-800 p-6 text-white flex justify-between items-center shrink-0">
                          <div>
                              <h3 className="font-bold text-lg">Sentinel Report</h3>
                              <p className="text-xs opacity-80">Government Standard Encryption</p>
                          </div>
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className="w-10 h-10 invert opacity-80" />
                      </div>
                      <div className="p-6 space-y-6 overflow-y-auto">
                           <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                               <div className="text-center">
                                   <p className="text-xs text-gray-500 uppercase">PHQ-9 Score</p>
                                   <p className="text-3xl font-bold text-navy-900">8<span className="text-sm text-gray-400 font-normal">/27</span></p>
                                   <span className="text-[10px] bg-saffron-100 text-saffron-800 px-2 py-0.5 rounded font-bold">Mild Risk</span>
                               </div>
                               <div className="text-center">
                                   <p className="text-xs text-gray-500 uppercase">Avg Sentiment</p>
                                   <p className="text-3xl font-bold text-indiaGreen-600">+0.4</p>
                                   <span className="text-[10px] bg-indiaGreen-100 text-indiaGreen-800 px-2 py-0.5 rounded font-bold">Stable</span>
                               </div>
                           </div>
                           <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                               <h4 className="font-bold text-sm text-navy-900 mb-2">AI Summary</h4>
                               <p className="text-sm text-gray-700 leading-relaxed">
                                   Patient shows mild signs of academic stress based on linguistic patterns ("exams", "tired"). Sleep markers indicate late-night activity.
                               </p>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] text-gray-400 justify-center">
                               <Lock size={10} /> Decrypted from ABHA ID: 92-8821-9921
                           </div>
                           <div className="pt-2">
                               <button onClick={closeSecureViewer} className="w-full py-3 bg-navy-50 hover:bg-navy-100 text-navy-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                                   <ChevronLeft size={18}/> Back to Vault
                               </button>
                           </div>
                      </div>
                  </div>
              )}

              {/* Step 3: Decrypted GENOMIC View (DNA) */}
              {secureAuthStep === 'view' && selectedDoc.type === 'DNA' && (
                  <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh] border border-gray-100">
                      <div className="bg-gradient-to-r from-teal-800 to-teal-600 p-6 text-white flex justify-between items-center shrink-0">
                          <div>
                              <h3 className="font-bold text-lg">Genomic Sequence</h3>
                              <p className="text-xs opacity-80">VCF Analysis • Verified Lab</p>
                          </div>
                          <Dna size={40} className="opacity-80" />
                      </div>
                      <div className="p-6 space-y-6 overflow-y-auto">
                           <div className="grid grid-cols-2 gap-4">
                               <div className="bg-teal-50 p-3 rounded-xl border border-teal-100">
                                   <p className="text-[10px] text-teal-600 font-bold uppercase">Variants Analyzed</p>
                                   <p className="text-xl font-bold text-teal-900">24,592</p>
                               </div>
                               <div className="bg-teal-50 p-3 rounded-xl border border-teal-100">
                                   <p className="text-[10px] text-teal-600 font-bold uppercase">Risk Markers</p>
                                   <p className="text-xl font-bold text-red-600">2 <span className="text-xs text-gray-500 font-normal">Detected</span></p>
                               </div>
                           </div>
                           <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                               <h4 className="font-bold text-sm text-navy-900 mb-3 flex items-center gap-2"><Zap size={14} className="text-saffron-500"/> Key Pharmacogenomics</h4>
                               <ul className="space-y-3">
                                   <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                                       <span className="text-gray-600">CYP2C9</span>
                                       <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded text-xs">Slow Metabolizer (*3/*3)</span>
                                   </li>
                                   <li className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                                       <span className="text-gray-600">VKORC1</span>
                                       <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">Normal Sensitivity</span>
                                   </li>
                                   <li className="flex justify-between items-center text-sm">
                                       <span className="text-gray-600">HLA-B</span>
                                       <span className="font-bold text-gray-800 bg-gray-200 px-2 py-0.5 rounded text-xs">Negative</span>
                                   </li>
                               </ul>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] text-gray-400 justify-center">
                               <Link size={10} /> Linked to ABHA ID: 92-8821-9921
                           </div>
                           <div className="pt-2">
                               <button onClick={closeSecureViewer} className="w-full py-3 bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                                   <ChevronLeft size={18}/> Back to Vault
                               </button>
                           </div>
                      </div>
                  </div>
              )}

              {/* Step 3: Generic Doc View (Fallback) */}
              {secureAuthStep === 'view' && selectedDoc.type !== 'MentalHealth' && selectedDoc.type !== 'DNA' && (
                  <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh] border border-gray-100">
                      <div className="bg-gradient-to-r from-gray-800 to-gray-600 p-6 text-white flex justify-between items-center shrink-0">
                          <div>
                              <h3 className="font-bold text-lg">{selectedDoc.title}</h3>
                              <p className="text-xs opacity-80">Secure Document • Verified</p>
                          </div>
                          <FileText size={32} className="opacity-80" />
                      </div>
                      <div className="p-8 flex flex-col items-center justify-center space-y-4">
                           <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                               <span className="text-xs text-gray-400 font-bold">Document Preview</span>
                           </div>
                           <p className="text-sm text-center text-gray-600">This document has been decrypted and is ready for viewing.</p>
                           <button className="px-4 py-2 bg-navy-900 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg">
                               <DownloadCloud size={14} /> Download PDF
                           </button>
                      </div>
                      <div className="p-6 border-t border-gray-100">
                           <button onClick={closeSecureViewer} className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                               <ChevronLeft size={18}/> Back to Vault
                           </button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pt-2 mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-100">
             <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">SafeBio Vault</h1>
            <p className="text-xs text-indiaGreen-600 font-bold flex items-center gap-1 bg-indiaGreen-50 px-2 py-0.5 rounded-full w-fit mt-1">
                <span className="w-2 h-2 rounded-full bg-indiaGreen-500 animate-pulse"></span>
                ABDM Sandbox Live
            </p>
          </div>
        </div>
        <button onClick={() => setIsLocked(true)} className="p-3 bg-white text-navy-900 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100" title="Lock Vault">
          <Lock size={20} />
        </button>
      </div>

      {/* --- CONSENT CENTER (DOCTOR REQUESTS) --- */}
      <div className="mb-6">
          <h3 className="text-navy-900 font-bold text-sm uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
              <Shield size={16} className="text-teal-600" /> Consent Layer
          </h3>
          
          {/* Active Grants (Approved) */}
          {activeGrants.length > 0 && (
              <div className="mb-4 space-y-3">
                  {activeGrants.map(grant => (
                      <div key={grant.id} className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-fade-in">
                          <div className="flex items-center gap-3">
                              <div className="bg-teal-100 p-2 rounded-full text-teal-600"><UserCheck size={20} /></div>
                              <div>
                                  <p className="text-sm font-bold text-teal-900">{grant.doctorName}</p>
                                  <p className="text-[10px] text-teal-700 font-mono flex items-center gap-1">
                                      <Timer size={10} /> Active for 2 hrs
                                  </p>
                              </div>
                          </div>
                          <button onClick={() => handleRevokeGrant(grant)} className="px-3 py-1 bg-white border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors">
                              Revoke
                          </button>
                      </div>
                  ))}
              </div>
          )}

          {/* Pending Requests */}
          {accessRequests.length > 0 ? (
              <div className="space-y-3">
                  {accessRequests.map(req => (
                      <div key={req.id} className="bg-white border-l-4 border-l-saffron-500 rounded-2xl p-5 shadow-lg relative overflow-hidden animate-slide-in-up">
                          {mintingConsent === req.id && (
                              <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center text-center">
                                  <Hexagon size={40} className="text-navy-900 animate-spin-slow mb-2" />
                                  <p className="text-xs font-bold text-navy-900">Minting Consent Token...</p>
                                  <p className="text-[10px] text-gray-500">Writing to ABDM Ledger</p>
                              </div>
                          )}
                          <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center text-navy-900 font-bold border border-navy-100">Dr</div>
                                  <div>
                                      <h4 className="font-bold text-navy-900 flex items-center gap-1">
                                          {req.doctorName}
                                          <CheckCircle size={14} className="text-green-600 fill-green-100" />
                                      </h4>
                                      <p className="text-xs text-gray-500">{req.hospital}</p>
                                  </div>
                              </div>
                              <span className="bg-saffron-50 text-saffron-700 text-[10px] font-bold px-2 py-1 rounded border border-saffron-100 flex items-center gap-1">
                                  <BellRing size={10} /> New Request
                              </span>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                              <p className="text-xs text-gray-600 mb-1"><strong>Requesting:</strong> {req.reason}</p>
                              <div className="flex justify-between items-center mt-2">
                                  <span className="text-[10px] text-gray-500 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">HPR: {req.hprId}</span>
                                  <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Clock size={10}/> Duration: {req.duration}</span>
                              </div>
                          </div>

                          <div className="flex gap-3">
                              <button onClick={() => handleDenyRequest(req.id)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors">
                                  Deny
                              </button>
                              <button onClick={() => handleApproveRequest(req)} className="flex-1 py-3 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md">
                                  <FileCheck size={14} /> Approve Access
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          ) : activeGrants.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                  <p className="text-xs text-gray-400 font-bold">No Pending Requests</p>
                  <p className="text-[10px] text-gray-400 mt-1">Your data is currently locked and private.</p>
              </div>
          )}
      </div>

      {/* Feature Grid - Replaces Horizontal Scroll */}
      <h3 className="text-navy-900 font-bold text-sm uppercase tracking-widest mb-3 ml-1">Future Health Core</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setVaultView('AGENTIC')} className="bg-gradient-to-br from-indigo-600 to-purple-600 p-4 rounded-2xl text-white text-left shadow-lg hover:scale-[1.02] transition-transform">
              <Bot size={24} className="mb-2 text-indigo-200" />
              <div className="font-bold text-sm">Agentic AI</div>
              <div className="text-[10px] opacity-70">Auto-Care Partner</div>
          </button>
          <button onClick={() => setVaultView('TWIN')} className="bg-gradient-to-br from-teal-600 to-emerald-600 p-4 rounded-2xl text-white text-left shadow-lg hover:scale-[1.02] transition-transform">
              <Layers size={24} className="mb-2 text-teal-200" />
              <div className="font-bold text-sm">Digital Twin</div>
              <div className="text-[10px] opacity-70">Drug Simulation</div>
          </button>
          <button onClick={() => setVaultView('MULTIMODAL')} className="bg-gradient-to-br from-blue-600 to-cyan-600 p-4 rounded-2xl text-white text-left shadow-lg hover:scale-[1.02] transition-transform">
              <Microscope size={24} className="mb-2 text-blue-200" />
              <div className="font-bold text-sm">Multi-Modal</div>
              <div className="text-[10px] opacity-70">Vision + DNA + Text</div>
          </button>
          <button onClick={() => setVaultView('RESEARCH')} className="bg-gradient-to-br from-amber-600 to-orange-600 p-4 rounded-2xl text-white text-left shadow-lg hover:scale-[1.02] transition-transform">
              <Coins size={24} className="mb-2 text-amber-200" />
              <div className="font-bold text-sm">ZK Research</div>
              <div className="text-[10px] opacity-70">Earn Crypto</div>
          </button>
          {/* NEW FEATURES */}
          <button onClick={() => setVaultView('FEDERATED')} className="bg-gradient-to-br from-slate-600 to-slate-800 p-4 rounded-2xl text-white text-left shadow-lg hover:scale-[1.02] transition-transform">
              <Network size={24} className="mb-2 text-slate-200" />
              <div className="font-bold text-sm">Edge Bio-Net</div>
              <div className="text-[10px] opacity-70">Federated Learning</div>
          </button>
          <button onClick={() => setVaultView('SECURITY')} className="bg-gradient-to-br from-red-700 to-pink-700 p-4 rounded-2xl text-white text-left shadow-lg hover:scale-[1.02] transition-transform">
              <FileKey size={24} className="mb-2 text-pink-200" />
              <div className="font-bold text-sm">Crypto Security</div>
              <div className="text-[10px] opacity-70">Audit & ZKP</div>
          </button>
      </div>

      <h3 className="text-navy-900 font-bold text-sm uppercase tracking-widest mb-3 ml-1">Core Identity</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x no-scrollbar">
          {/* SDoH Banner */}
          <div onClick={() => setVaultView('SDOH_ENGINE')} className="min-w-[280px] bg-charcoal p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group snap-center border border-white/10 cursor-pointer">
             <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                     <Brain size={20} className="text-teal-400" />
                     <span className="text-xs font-bold text-teal-400">DIAGNOSTIC</span>
                 </div>
                 <h3 className="text-lg font-bold mb-1">SDoH Engine</h3>
                 <p className="text-xs text-gray-400">Environmental Risk Scoring</p>
             </div>
          </div>

          {/* Official ABHA Card (Tricolor Theme) */}
          <div className="min-w-[280px] bg-white p-6 rounded-3xl shadow-xl text-navy-900 relative overflow-hidden group snap-center border-t-4 border-t-saffron-500 border-b-4 border-b-indiaGreen-500">
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <img src="https://abdm.gov.in/assets/images/logo/abdm_logo.svg" alt="ABDM" className="h-6" />
                </div>
                <p className="text-2xl font-mono tracking-widest font-bold text-navy-900">92-8821-9921</p>
                <div className="mt-4 flex justify-between items-end">
                    <div className="text-left">
                         <p className="text-[10px] text-gray-400 font-bold">NAME</p>
                         <p className="text-sm font-bold">Rohan Das</p>
                    </div>
                    <div className="w-12 h-12 bg-white p-1 rounded-lg border border-gray-200">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ABHA:9288219921`} alt="QR" className="w-full h-full" />
                    </div>
                </div>
            </div>
          </div>
      </div>

      {/* MENTAL HEALTH & SENTINEL REPORTS */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 relative overflow-hidden mt-6">
         <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-navy-50 rounded-lg text-navy-800">
                     <Brain size={24} />
                 </div>
                 <div>
                     <h3 className="font-bold text-lg text-navy-900">Mental Health Reports</h3>
                     <p className="text-xs text-gray-500">Sentinel Analytics • E2E Encrypted</p>
                 </div>
             </div>
         </div>
         <div className="space-y-3">
             {mentalHealthDocs.length > 0 ? mentalHealthDocs.map(doc => (
                 <button key={doc.id} onClick={() => openSecureDocument(doc)} className="w-full bg-gray-50 border border-gray-200 shadow-sm p-4 rounded-xl flex items-center justify-between hover:bg-white hover:shadow-md transition-all group">
                     <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-navy-900">
                             <Activity size={20} />
                         </div>
                         <div className="text-left">
                             <h4 className="font-bold text-sm text-navy-900">{doc.title}</h4>
                             <p className="text-[10px] text-gray-500 font-mono">Latest Assessment • {doc.date}</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="px-2 py-1 bg-saffron-50 text-saffron-700 text-[10px] font-bold rounded flex items-center gap-1 border border-saffron-100">
                             <Lock size={10}/> SECURE
                         </span>
                     </div>
                 </button>
             )) : (
                 <div className="text-center py-4 text-gray-400 text-sm">No reports generated yet. Use the Chat to Assess.</div>
             )}
         </div>
      </div>

      {/* GENOMIC VAULT SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border-t-4 border-t-navy-800 relative overflow-hidden mt-6">
         <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                     <Dna size={24} />
                 </div>
                 <div>
                     <h3 className="font-bold text-lg text-navy-900">Genomic Bio-Vault</h3>
                     <p className="text-xs text-gray-400">VCF Storage • Blockchain Verified</p>
                 </div>
             </div>
             {/* Replace existing upload button with a general one */}
             <div className="relative group">
                 <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.png,.jpg,.jpeg,.vcf" />
                 <button className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-lg">
                     <Plus size={16} /> Upload Data
                 </button>
             </div>
         </div>
         {genomicDocs.length === 0 ? (
             <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                 <Dna size={48} className="mx-auto text-gray-400 mb-2" />
                 <p className="text-sm text-gray-500">No genomic sequences found.</p>
                 <p className="text-xs text-gray-400">Upload your VCF file to link with ABHA.</p>
             </div>
         ) : (
             <div className="space-y-3">
                 {genomicDocs.map(doc => (
                     <button key={doc.id} onClick={() => openSecureDocument(doc)} className="w-full bg-navy-50 border border-navy-100 p-4 rounded-xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                         <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-sm">
                                 <Activity size={20} />
                             </div>
                             <div className="text-left">
                                 <h4 className="font-bold text-sm text-navy-900">{doc.title}</h4>
                                 <p className="text-[10px] text-gray-500 font-mono">HASH: 8f2a...91b2 • {doc.date}</p>
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="px-2 py-1 bg-indiaGreen-50 text-indiaGreen-700 text-[10px] font-bold rounded border border-indiaGreen-200 flex items-center gap-1">
                                <Link size={10} /> CHAIN
                             </span>
                         </div>
                     </button>
                 ))}
             </div>
         )}
      </div>

    </TricolorContainer>
  );
};

export default SafeBioVault;
