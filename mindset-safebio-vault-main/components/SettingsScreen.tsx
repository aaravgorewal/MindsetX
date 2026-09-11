
import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, ScanFace, Fingerprint, Lock, ChevronLeft, Check } from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  // Simulated Persisted Settings
  const [appLockMethod, setAppLockMethod] = useState<'FACE' | 'BIO' | 'PIN'>('FACE');
  const [vaultLockMethod, setVaultLockMethod] = useState<'FACE' | 'BIO' | 'PIN'>('PIN');

  useEffect(() => {
    const savedAppMethod = localStorage.getItem('auth_app_method');
    if (savedAppMethod) setAppLockMethod(savedAppMethod as any);

    const savedVaultMethod = localStorage.getItem('auth_vault_method');
    if (savedVaultMethod) setVaultLockMethod(savedVaultMethod as any);
  }, []);

  const handleSaveAppMethod = (method: 'FACE' | 'BIO' | 'PIN') => {
    setAppLockMethod(method);
    localStorage.setItem('auth_app_method', method);
  };

  const handleSaveVaultMethod = (method: 'FACE' | 'BIO' | 'PIN') => {
    setVaultLockMethod(method);
    localStorage.setItem('auth_vault_method', method);
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-24">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
         <button onClick={onBack} className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors shadow-sm">
            <ChevronLeft size={24} />
         </button>
         <div className="flex items-center space-x-3">
            <div className="p-2 bg-navy-900 rounded-xl shadow-lg shadow-navy-900/50">
                <Shield className="text-white" size={20} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-white">Security Settings</h1>
                <p className="text-[10px] text-gray-400 font-bold">Manage Access & Encryption Methods</p>
            </div>
         </div>
      </div>

      {/* App Access Section */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Smartphone size={18} className="text-saffron-500" /> App Entry Lock
          </h2>
          <div className="space-y-3">
              {[
                  { id: 'FACE', label: 'Face Recognition', icon: ScanFace },
                  { id: 'BIO', label: 'Fingerprint Biometric', icon: Fingerprint },
                  { id: 'PIN', label: 'Passcode (PIN)', icon: Lock },
              ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => handleSaveAppMethod(opt.id as any)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        appLockMethod === opt.id 
                        ? 'bg-saffron-500/20 border-saffron-500 text-saffron-400 shadow-sm' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                      <div className="flex items-center gap-3">
                          <opt.icon size={20} />
                          <span className="font-medium">{opt.label}</span>
                      </div>
                      {appLockMethod === opt.id && <Check size={18} />}
                  </button>
              ))}
          </div>
      </div>

      {/* Vault Access Section */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-teal-400" /> Bio-Vault & Encrypted Files
          </h2>
          <p className="text-xs text-gray-400 mb-4">
              Choose how you want to decrypt sensitive DNA and Mental Health reports.
          </p>
          <div className="space-y-3">
              {[
                  { id: 'FACE', label: 'Face Recognition', icon: ScanFace },
                  { id: 'BIO', label: 'Fingerprint Biometric', icon: Fingerprint },
                  { id: 'PIN', label: 'Passcode (PIN)', icon: Lock },
              ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => handleSaveVaultMethod(opt.id as any)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        vaultLockMethod === opt.id 
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400 shadow-sm' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                      <div className="flex items-center gap-3">
                          <opt.icon size={20} />
                          <span className="font-medium">{opt.label}</span>
                      </div>
                      {vaultLockMethod === opt.id && <Check size={18} />}
                  </button>
              ))}
          </div>
      </div>

      <div className="text-center pt-8">
          <p className="text-xs text-gray-500 font-medium">
              End-to-End Encryption Keys are secured by your chosen method.
          </p>
      </div>
    </div>
  );
};

export default SettingsScreen;
