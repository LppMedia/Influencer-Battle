import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Feed } from './pages/Feed';
import { Influencers } from './pages/Influencers';
import { InfluencerDetail } from './pages/InfluencerDetail';
import { Contests } from './pages/Contests';
import { ContestDetail } from './pages/ContestDetail';
import { AdminCreate } from './pages/AdminCreate';
import { InfluencerOnboarding } from './pages/InfluencerOnboarding';
import { Settings } from './pages/Settings';
import { UserSession } from './types';
import { supabase, getUserProfile } from './lib/supabase';

const App: React.FC = () => {
  // Store full user session including role
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch with cache to prevent role flicker
  const fetchUserWithCache = async (userId: string, email: string): Promise<UserSession> => {
    try {
        // 1. Try Live Fetch
        const profile = await getUserProfile(userId);
        if (profile) {
            localStorage.setItem(`lpp_user_${userId}`, JSON.stringify(profile));
            return profile;
        }

        // 2. Try Cache if Live Fetch failed (returned null)
        const cachedStr = localStorage.getItem(`lpp_user_${userId}`);
        if (cachedStr) {
            const cached = JSON.parse(cachedStr);
            if (cached.id === userId) {
                // console.debug("Using cached profile due to fetch failure");
                return cached;
            }
        }
    } catch (e) {
        console.warn("Cache retrieval failed", e);
    }

    // 3. Final Fallback (Safest default is influencer, but this is what causes the downgrade if admin fetch fails)
    return {
        id: userId,
        email: email,
        role: 'influencer',
        hasProfile: true
    };
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Check active session immediately
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
           const profile = await fetchUserWithCache(session.user.id, session.user.email!);
           setUser(profile);
        }
      } catch (error) {
        console.warn('Auth initialization warning:', error);
      } finally {
        if (mounted) {
            setLoading(false);
        }
      }
    };

    // 2. Set up listener for future changes (Sign In/Out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 'INITIAL_SESSION' is handled by initializeAuth to prevent double-fetch/loading flicker
      if (event === 'INITIAL_SESSION') return;

      if (session?.user) {
        // If we already have the correct user loaded, don't re-fetch/re-render unnecessarily
        if (user?.id === session.user.id) return;

        setLoading(true); // Show loader during transition
        const profile = await fetchUserWithCache(session.user.id, session.user.email!);
        if (mounted) {
            setUser(profile);
            setLoading(false);
        }
      } else {
        if (mounted) {
            setUser(null);
            setLoading(false);
        }
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (userSession: UserSession) => {
    setUser(userSession);
    // Cache manual logins (e.g. demo users) too so they persist better across reloads if session exists
    if (userSession.id) {
        localStorage.setItem(`lpp_user_${userSession.id}`, JSON.stringify(userSession));
    }
  };

  const handleLogout = async () => {
    try {
        if (user?.id) {
            localStorage.removeItem(`lpp_user_${user.id}`);
        }
        await supabase.auth.signOut();
    } catch (e) {
        console.error("Sign out error", e);
    }
    setUser(null);
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-medium animate-pulse">Loading LPP Vault...</div>
        </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/home" />} />
        
        {/* Protected Routes */}
        <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/influencers" element={<Influencers />} />
          <Route path="/influencers/:id" element={<InfluencerDetail />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/contests/:id" element={<ContestDetail />} />
          <Route path="/admin" element={<AdminCreate />} />
          <Route path="/onboarding" element={<InfluencerOnboarding />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;