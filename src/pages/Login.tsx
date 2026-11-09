import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  AlertCircle,
  ScanLine,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const Login: React.FC = () => {
  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    loginAsDemoGuard, 
    loading 
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<{ title: string; desc: string; domain?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const code = err.code || '';
      
      if (code === 'auth/unauthorized-domain') {
        setErrorMsg({
          title: 'Domain Hindi Pa Naka-Authorized sa Firebase',
          desc: `Kailangan idagdag ang domain na ito sa Firebase Console:`,
          domain: currentHostname
        });
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg({
          title: 'Na-block ang Google Pop-up Window',
          desc: 'Paki-allow ang pop-ups sa iyong browser, o gamitin ang Instant Admin Sign-In button sa ibaba.'
        });
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg({
          title: 'Google Sign-in Not Enabled',
          desc: 'Pumunta sa Firebase Console > Authentication > Sign-in method at i-toggle ang "Google" to Enable.'
        });
      } else {
        setErrorMsg({
          title: 'Hindi Nakumpleto ang Google Sign-In',
          desc: err.message || 'Subukan muling i-click, o gamitin ang Instant Admin button.'
        });
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (authMode === 'signup') {
        if (!fullName.trim()) throw new Error('Mangyaring ilagay ang iyong buong pangalan.');
        await signUpWithEmail(email.trim(), password, fullName.trim(), 'GUARD');
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      setErrorMsg({
        title: 'Authentication Error',
        desc: err.message || 'Maling email o password. Pakisuri ang iyong credentials.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden select-none">
      {/* Background Campus Photo */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-100"
        style={{ backgroundImage: `url('/campus-bg.png')` }}
      />
      
      {/* Cinematic Dark Gradient & Frost Vignette Overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/85 backdrop-blur-[2px]" />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 my-auto">
        <div className="w-full max-w-xl">
          
          {/* School Header & Branding */}
          <div className="text-center mb-6 space-y-3">
            {/* Prominent High-Resolution Logo */}
            <div className="inline-block relative">
              {/* Outer decorative ring */}
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white p-1.5 shadow-2xl shadow-black/80 ring-4 ring-amber-400 ring-offset-4 ring-offset-slate-950 mx-auto flex items-center justify-center">
                <img 
                  src="/school-logo.png" 
                  alt="Madapdap Resettlement High School Official Seal"
                  className="w-full h-full object-contain rounded-full" 
                />
              </div>
            </div>

            {/* School Name & Titles */}
            <div className="space-y-1 pt-1">
              <span className="inline-block px-3 py-1 text-[11px] font-black tracking-widest uppercase bg-amber-400 text-slate-950 rounded-full shadow-md font-sans">
                FIAT LUX &bull; FOUNDED 1996
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight uppercase drop-shadow-lg">
                Madapdap Resettlement High School
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-300 font-semibold tracking-wider uppercase drop-shadow">
                Mabalacat City, Pampanga
              </p>

              {/* Large & Prominent Automated Student System Title */}
              <div className="pt-2">
                <div className="inline-block bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent text-sm sm:text-base lg:text-lg font-black tracking-wide uppercase drop-shadow-md">
                  AUTOMATED STUDENT ATTENDANCE &amp; PARENT NOTIFICATION GATEWAY
                </div>
                <p className="text-[12px] text-amber-200/90 font-medium italic mt-0.5">
                  "Mabuhay ka! Sumulong ka! Itataas namin ang ngalan mo't dangal."
                </p>
              </div>
            </div>
          </div>

          {/* Clean Glassmorphic Card */}
          <div className="bg-slate-900/85 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 text-slate-100">
            
            {/* Error Message with Clear Actionable Help */}
            {errorMsg && (
              <div className="mb-5 p-4 bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs rounded-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg.title}</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {errorMsg.desc}
                </p>
                {errorMsg.domain && (
                  <div className="p-2 bg-black/50 rounded-xl font-mono text-[10px] text-amber-300 flex items-center justify-between">
                    <span className="truncate">{errorMsg.domain}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(errorMsg.domain || '')}
                      className="ml-2 px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded hover:bg-amber-400 shrink-0 text-[10px]"
                    >
                      Copy Domain
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Secure Sign-In Section */}
            <div className="space-y-3">
              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Account</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-transparent px-2">
                <span className="bg-slate-900 px-3 py-0.5 rounded-full border border-white/10">or sign in with staff account</span>
              </div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name &amp; Title
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Officer Juan Dela Cruz"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/60 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alvindelacruz9120@gmail.com o guard@marhs.edu.ph"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/60 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950/60 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/10 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Verifying...' : authMode === 'signup' ? 'Create Guard Account' : 'Sign In with Email'}
              </button>
            </form>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                }}
                className="text-xs text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-4 cursor-pointer"
              >
                {authMode === 'signup' ? 'Already have an account? Sign In' : 'Need a guard account? Register here'}
              </button>
            </div>

            {/* Quick Demo Gate Guard Scanner */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={loginAsDemoGuard}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <ScanLine className="w-4 h-4 text-emerald-400" />
                <span>Instant Gate Guard Access (One-Click Scanner)</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Buksan agad ang mobile camera QR scanner nang walang login
              </p>
            </div>
          </div>

          {/* Simple Bottom Footer Badge */}
          <p className="text-center text-[11px] text-slate-400 mt-4 drop-shadow">
            &copy; {new Date().getFullYear()} Madapdap Resettlement High School &bull; Gate Entry &amp; Parent Alert System
          </p>
        </div>
      </main>
    </div>
  );
};
