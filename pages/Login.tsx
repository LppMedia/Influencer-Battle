import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, CheckCircle, AlertCircle, Shield, ArrowRight, Star } from 'lucide-react';
import { Input, Button } from '../components/ui/core';
import { supabase, getUserProfile } from '../lib/supabase';
import { UserSession } from '../types';

interface LoginProps {
  onLogin: (user: UserSession) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailCheck, setShowEmailCheck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });

        if (error) {
            // Friendly error handling for password complexity
            if (error.message.includes("Password should contain")) {
                throw new Error("Password must include at least: 1 uppercase, 1 lowercase, 1 number.");
            }
            throw error;
        }
        
        if (data.user && !data.session) {
          setShowEmailCheck(true);
        } else if (data.user && data.session) {
          const profile = await getUserProfile(data.user.id);
          finishLogin(profile || createOptimisticUser(data.user));
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Email not confirmed")) throw new Error("Please verify your email address.");
          if (error.message.includes("Invalid login credentials")) throw new Error("Invalid email or password.");
          throw error;
        }

        if (data.user) {
          const profile = await getUserProfile(data.user.id);
          finishLogin(profile || createOptimisticUser(data.user));
        }
      }
    } catch (error: any) {
      console.error('Auth failed', error);
      setErrorMsg(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const createOptimisticUser = (user: any): UserSession => ({
    id: user.id,
    email: user.email!,
    role: 'influencer',
    hasProfile: true
  });

  const finishLogin = (user: UserSession) => {
    onLogin(user);
    navigate(user.role === 'admin' ? '/admin' : '/influencers');
  };

  const handleDemoLogin = (role: 'admin' | 'influencer') => {
    const demoUser: UserSession = {
      id: `demo-${role}-${Math.random().toString(36).substr(2, 9)}`,
      email: `demo.${role}@lpp.com`,
      role: role,
      hasProfile: true
    };
    finishLogin(demoUser);
  };

  // --- Email Check View ---
  if (showEmailCheck) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-400 mb-2 ring-1 ring-green-500/20">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Check your email</h2>
          <p className="text-zinc-400">
            We've sent a confirmation link to <span className="text-white font-medium">{email}</span>.
          </p>
          <Button variant="secondary" className="w-full h-12" onClick={() => { setShowEmailCheck(false); setIsSignUp(false); }}>
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // --- Main Split Layout ---
  return (
    <div className="min-h-screen w-full flex bg-[#09090B] text-white selection:bg-purple-500/30">
      
      {/* Left Panel: Form */}
      <div className="flex-1 flex flex-col justify-between px-6 sm:px-12 lg:px-24 py-8 lg:py-12 relative z-10">
        
        {/* Top Bar - Simplified */}
        <div className="flex items-center justify-end">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>

        {/* Center Content */}
        <div className="w-full max-w-sm mx-auto space-y-8">
          
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-brand rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                <img 
                  src="https://res.cloudinary.com/dmkx2uowd/image/upload/v1769202435/Influencer_Battle_upwuue.png" 
                  alt="Influencer Battle Logo" 
                  className="relative w-24 h-24 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10" 
                />
            </div>
            
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white">
                  Influencer Battle
                </h1>
                <p className="text-zinc-400 text-lg font-medium tracking-wide uppercase">
                  Arena de influencer
                </p>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
                <Input 
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe" icon={<User size={18} />} className="h-12 bg-surface/50 border-white/5 rounded-xl"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Email</label>
              <Input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com" icon={<Mail size={18} />} className="h-12 bg-surface/50 border-white/5 rounded-xl"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">
                 Password
                 {isSignUp && <span className="ml-1 text-zinc-600 normal-case tracking-normal font-normal">(Min 6 chars, 1 Upper, 1 Lower, 1 Num)</span>}
              </label>
              <Input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" icon={<Lock size={18} />} className="h-12 bg-surface/50 border-white/5 rounded-xl"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-surface text-purple-600 focus:ring-purple-500/50 transition-colors" />
                <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full h-12 bg-gradient-brand text-white rounded-xl text-base font-semibold shadow-glow hover:scale-[1.02] active:scale-95 transition-all" isLoading={loading}>
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#09090B] px-3 text-zinc-500">Or continue with demo</span></div>
          </div>

          {/* Demo Buttons */}
          <div className="space-y-3">
             <button 
                onClick={() => handleDemoLogin('influencer')}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-surface/50 hover:bg-white/5 text-white font-medium transition-all hover:border-purple-500/30 group"
             >
                <div className="p-1 rounded bg-purple-500/10 text-purple-400 group-hover:text-purple-300"><Star size={16} /></div>
                <span>Demo Influencer</span>
             </button>
             <button 
                onClick={() => handleDemoLogin('admin')}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-surface/50 hover:bg-white/5 text-white font-medium transition-all hover:border-blue-500/30 group"
             >
                <div className="p-1 rounded bg-blue-500/10 text-blue-400 group-hover:text-blue-300"><Shield size={16} /></div>
                <span>Demo Admin</span>
             </button>
          </div>

        </div>

        {/* Footer */}
        <div className="text-xs text-center text-zinc-600">
          © 2024 Influencer Battle. Protected by Enterprise Security.
        </div>
      </div>

      {/* Right Panel: Image/Visual */}
      <div className="hidden lg:flex flex-1 relative bg-[#18181B] items-center justify-center overflow-hidden">
         {/* Abstract Gradients */}
         <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px]" />
         <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-[#FF0080]/20 rounded-full blur-[100px]" />
         
         {/* Background Card Effect from reference */}
         <div className="absolute inset-4 rounded-3xl bg-gradient-brand opacity-90 overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Texture/Noise overlay if desired */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            
            {/* Logo Image */}
            <img 
              src="https://res.cloudinary.com/dmkx2uowd/image/upload/v1769235775/Dise%C3%B1o_sin_t%C3%ADtulo_13_d0bfsk.png" 
              alt="Influencer Battle Visual"
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out"
            />
         </div>
      </div>

    </div>
  );
};