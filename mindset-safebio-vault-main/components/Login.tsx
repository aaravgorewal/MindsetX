import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const [error, setError] = useState<string>('');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsSigningIn(true);
      await signIn();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Another popup opened
      } else {
        setError(err?.message || 'Failed to sign in with Google. Please check your connection.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-charcoal flex flex-col items-center justify-center p-6 text-white overflow-hidden select-none">
      {/* Ambient background glow matching MindSet theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-saffron-500/15 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[15%] -right-[10%] w-[50%] h-[50%] bg-teal-500/15 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-saffron-500/20 to-teal-500/20 border border-white/10 shadow-xl mb-4 backdrop-blur-md">
            <Shield size={32} className="text-teal-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-saffron-400 to-teal-400 bg-clip-text text-transparent mb-2">
            MindSet X
          </h1>
          <p className="text-gray-400 text-sm font-medium">
            AI-Powered Holistic Mental Health & Bio-Vault
          </p>
        </div>

        {/* Card Container */}
        <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="w-full text-center mb-6">
            <h2 className="text-lg font-bold text-white mb-1">Welcome</h2>
            <p className="text-xs text-gray-400">Sign in to access your secure encrypted vault</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="w-full mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Continue with Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold text-sm rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.42 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.58 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Security & Privacy Badge */}
          <div className="mt-6 pt-5 border-t border-white/10 w-full flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <Sparkles size={13} className="text-teal-400" />
            <span>Hardware Encrypted • Zero Cloud Leakage</span>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-gray-500 mt-6 text-center">
          By continuing, you verify biometric consent under SafeBio Protocol.
        </p>
      </div>
    </div>
  );
};

export default Login;
