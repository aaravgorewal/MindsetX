import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import MindSetFeed from './components/MindSetFeed';
import ChatInterface from './components/ChatInterface';
import SafeBioVault from './components/SafeBioVault';
import Studio from './components/Studio';
import LiveSession from './components/LiveSession';
import SentinelDashboard from './components/SentinelDashboard';
import SettingsScreen from './components/SettingsScreen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { Screen } from './types';
import { useAuth } from './context/AuthContext';
import { Lock, ScanFace, Fingerprint, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [pendingConsentCount, setPendingConsentCount] = useState<number>(1);
  
  // App Lock State
  const [authMethod, setAuthMethod] = useState<'FACE'|'BIO'|'PIN'>('FACE');
  const [scanStatus, setScanStatus] = useState<'idle'|'scanning'|'success'|'fail'>('idle');
  const [pin, setPin] = useState('');

  // Vault Light Mode check
  const isLightMode = currentScreen === Screen.VAULT;

  useEffect(() => {
     // Load App Auth Preference
     const savedMethod = localStorage.getItem('auth_app_method');
     if (savedMethod) setAuthMethod(savedMethod as any);
     
     // Simulate Auto-Scan if Face or Bio
     if (savedMethod !== 'PIN' && isAppLocked) {
         setScanStatus('scanning');
         setTimeout(() => {
             setScanStatus('success');
             setTimeout(() => setIsAppLocked(false), 800);
         }, 2000);
     }
  }, [isAppLocked]);

  const handleUnlock = () => {
      if (authMethod === 'PIN') {
          if (pin === '1234') {
              setScanStatus('success');
              setTimeout(() => setIsAppLocked(false), 500);
          } else {
              setScanStatus('fail');
              setPin('');
              setTimeout(() => setScanStatus('idle'), 1000);
          }
      } else {
          // Trigger Manual Scan
          setScanStatus('scanning');
          setTimeout(() => {
             setScanStatus('success');
             setTimeout(() => setIsAppLocked(false), 800);
         }, 1500);
      }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.HOME:
        return <MindSetFeed />;
      case Screen.CHAT:
        return <ChatInterface />;
      case Screen.VAULT:
        return <SafeBioVault onPendingRequestsChange={setPendingConsentCount} />;
      case Screen.STUDIO:
        return <Studio />;
      case Screen.SENTINEL:
        return <SentinelDashboard />;
      case Screen.LIVE:
        return <LiveSession onEnd={() => setCurrentScreen(Screen.HOME)} />;
      case Screen.SETTINGS:
        return <SettingsScreen onBack={() => setCurrentScreen(Screen.HOME)} />;
      case Screen.PROFILE:
        return <Dashboard onNavigate={setCurrentScreen} pendingConsentCount={pendingConsentCount} />;
      default:
        return <MindSetFeed />;
    }
  };

  // --- 1. AUTH LOADING SPINNER ---
  if (loading) {
      return (
          <div className="fixed inset-0 z-[100] bg-charcoal flex flex-col items-center justify-center p-8 text-white">
              <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Loading MindSet X...</p>
          </div>
      );
  }

  // --- 2. UNAUTHENTICATED STATE: GOOGLE LOGIN ---
  if (!user) {
      return <Login />;
  }

  // --- 3. SECONDARY APP LOCK SCREEN (PIN/BIO/FACE) ---
  if (isAppLocked) {
      return (
          <div className="fixed inset-0 z-[100] bg-charcoal flex flex-col items-center justify-center p-8 text-white">
              <div className="mb-10 text-center">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-saffron-400 to-teal-400 bg-clip-text text-transparent mb-2">MindSet X</h1>
                  <p className="text-gray-500 text-sm">Secure Mental Health & Bio Vault</p>
              </div>

              {/* AUTH CONTAINER */}
              <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
                  
                  {/* Status Indicator */}
                  {scanStatus === 'scanning' && <div className="absolute inset-0 bg-teal-500/10 animate-pulse"></div>}
                  {scanStatus === 'success' && <div className="absolute inset-0 bg-green-500/20"></div>}
                  {scanStatus === 'fail' && <div className="absolute inset-0 bg-red-500/20"></div>}

                  {authMethod === 'FACE' && (
                      <div className="relative mb-6 cursor-pointer" onClick={handleUnlock}>
                          <ScanFace size={64} className={`text-gray-200 ${scanStatus === 'scanning' ? 'animate-pulse opacity-50' : ''}`} />
                          {scanStatus === 'scanning' && (
                              <div className="absolute top-0 left-0 w-full h-1 bg-teal-400 shadow-[0_0_15px_#2dd4bf] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                          )}
                      </div>
                  )}

                  {authMethod === 'BIO' && (
                       <div className="relative mb-6 cursor-pointer" onClick={handleUnlock}>
                          <Fingerprint size={64} className={`text-gray-200 ${scanStatus === 'scanning' ? 'animate-pulse text-teal-400' : ''}`} />
                          {scanStatus === 'scanning' && <div className="absolute inset-0 border-2 border-teal-500 rounded-full animate-ping"></div>}
                       </div>
                  )}

                  {authMethod === 'PIN' && (
                      <div className="mb-6 w-full text-center">
                          <Lock size={48} className="mx-auto mb-4 text-gray-300" />
                          <div className="flex justify-center gap-2 mb-4">
                              {[0, 1, 2, 3].map(i => (
                                  <div key={i} className={`w-3 h-3 rounded-full ${pin.length > i ? 'bg-saffron-500' : 'bg-gray-600'}`}></div>
                              ))}
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                              {[1,2,3,4,5,6,7,8,9].map(num => (
                                  <button key={num} onClick={() => setPin(p => (p.length < 4 ? p + num : p))} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">{num}</button>
                              ))}
                              <div className="col-start-2">
                                  <button onClick={() => setPin(p => (p.length < 4 ? p + '0' : p))} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold">0</button>
                              </div>
                              <button onClick={() => setPin(p => p.slice(0, -1))} className="flex items-center justify-center text-red-400">Del</button>
                          </div>
                          <button onClick={handleUnlock} className="mt-4 w-full py-2 bg-saffron-500 text-black rounded-lg font-bold">Unlock</button>
                      </div>
                  )}

                  <h3 className="text-lg font-bold mt-2">
                      {scanStatus === 'scanning' ? 'Verifying...' : scanStatus === 'success' ? 'Welcome Back' : scanStatus === 'fail' ? 'Try Again' : authMethod === 'FACE' ? 'Face ID' : authMethod === 'BIO' ? 'Touch ID' : 'Enter PIN'}
                  </h3>
              </div>
          </div>
      );
  }

  return (
    <div className={`flex h-screen w-full font-sans transition-colors duration-500 overflow-hidden ${
      isLightMode 
        ? 'bg-gray-50 text-slate-800' 
        : 'bg-charcoal text-warmWhite'
    }`}>
      
      {/* Dashboard Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        currentScreen={currentScreen} 
        onNavigate={setCurrentScreen} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        
        {/* Dashboard Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onProfileClick={() => setCurrentScreen(Screen.PROFILE)}
          userName={user.displayName || user.email?.split('@')[0]}
          userAvatar={user.photoURL}
        />

        {/* Scrollable Main View */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative ${
          // Add padding bottom on mobile for Bottom Nav
          currentScreen !== Screen.LIVE ? 'pb-24 md:pb-6' : ''
        }`}>
           
           {/* Background Ambience (Relative to Content) */}
           <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
             {isLightMode ? (
               <>
                 <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]"></div>
                 <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-indiaGreen-500/5 rounded-full blur-[100px]"></div>
               </>
             ) : (
               <>
                 <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-saffron-500/5 rounded-full blur-[80px]"></div>
                 <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[80px]"></div>
               </>
             )}
           </div>

           {/* Content Wrapper */}
           <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto w-full">
              {renderScreen()}
           </div>

           {/* Dashboard Footer (Hidden on Live Screen) */}
           {currentScreen !== Screen.LIVE && <Footer />}
        </main>

        {/* Mobile Bottom Navigation (Hidden on Desktop) */}
        {currentScreen !== Screen.LIVE && (
          <div className="md:hidden">
             <Navigation 
               currentScreen={currentScreen} 
               onNavigate={setCurrentScreen} 
               isLightMode={isLightMode}
             />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;