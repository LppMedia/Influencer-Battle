import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  Settings, 
  LogOut, 
  Menu, 
  Search, 
  Bell,
  Home
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button, Modal } from './ui/core';
import { UserSession } from '../types';
import { InfluencerOnboarding } from '../pages/InfluencerOnboarding';

interface LayoutProps {
  user: UserSession;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  // Mandatory Onboarding Logic:
  // 1. Admins are exempt. (Case insensitive check for safety)
  // 2. Influencers must have a profile (`hasProfile` check from DB).
  const isAdmin = user.role.toLowerCase() === 'admin';
  const isMandatoryOnboarding = !isAdmin && !user.hasProfile;

  const navItems = [
    { icon: <Home size={20} />, label: 'Home', path: '/home', roles: ['admin', 'influencer'] },
    { icon: <Users size={20} />, label: 'Influencers', path: '/influencers', roles: ['admin', 'influencer'] },
    { icon: <Trophy size={20} />, label: 'Contests', path: '/contests', roles: ['admin', 'influencer'] },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings', roles: ['admin', 'influencer'] },
  ];

  // Filter items based on user role
  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-background text-primary flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-white/5 flex flex-col items-center justify-center gap-6 text-center">
            <div className="relative group cursor-pointer" onClick={() => window.location.href = '/'}>
              <div className="absolute -inset-4 bg-gradient-brand rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <img 
                src="https://res.cloudinary.com/dmkx2uowd/image/upload/v1769202435/Influencer_Battle_upwuue.png" 
                alt="Logo" 
                className="relative w-32 h-32 rounded-3xl object-cover shadow-2xl ring-1 ring-white/10 transform transition duration-500 group-hover:scale-105" 
              />
            </div>
            <h1 className="text-2xl font-black bg-gradient-brand bg-clip-text text-transparent leading-none tracking-tight">
              INFLUENCER<br/>BATTLE
            </h1>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-white/5 text-white shadow-glow border border-white/5" 
                    : "text-muted hover:text-white hover:bg-white/5"
                )}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-white/5 bg-background/50 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-muted hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-medium text-secondary capitalize">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-surface border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <button className="p-2 text-muted hover:text-white relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-brand p-[1px]">
              <div className="w-full h-full rounded-full bg-surface overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="User" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto relative">
          {/* We pass the user object to all child routes */}
          <Outlet context={{ user }} />
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MANDATORY ONBOARDING MODAL */}
      <Modal 
        isOpen={isMandatoryOnboarding} 
        onClose={() => {}} // Empty function prevents closing
        hideClose={true}   // Hides the X button
        title="Complete Your Profile"
      >
        <div className="text-center mb-6">
          <p className="text-sm text-zinc-400">
            Welcome to the Arena. You must set up your influencer profile to access campaigns and tracking.
          </p>
        </div>
        <InfluencerOnboarding 
          user={user} 
          isEmbedded={true}
          onSuccess={() => window.location.reload()} 
        />
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button 
              onClick={onLogout}
              className="text-xs text-muted hover:text-red-400 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <LogOut size={12} />
              Sign Out / Switch Account
            </button>
        </div>
      </Modal>

    </div>
  );
};