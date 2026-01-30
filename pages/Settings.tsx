import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { UserSession } from '../types';
import { InfluencerOnboarding } from './InfluencerOnboarding';
import { Button, Card } from '../components/ui/core';
import { Shield } from 'lucide-react';

export const Settings = () => {
  const { user } = useOutletContext<{ user: UserSession }>();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-secondary mt-1">Manage your account and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Influencer Profile Settings - Only for Influencers */}
        {user.role === 'influencer' && (
           <div className="space-y-4">
             <h2 className="text-xl font-semibold text-white">Public Profile</h2>
             <Card className="border-t border-purple-500/30">
               <InfluencerOnboarding isEmbedded={false} />
             </Card>
           </div>
        )}

        {/* Admin Settings */}
        {user.role === 'admin' && (
           <Card className="p-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Admin Controls</h2>
                <p className="text-sm text-zinc-400">Manage contests, users, and platform settings.</p>
              </div>
              <Button onClick={() => navigate('/admin')}>
                <Shield size={16} className="mr-2" /> Open Admin Console
              </Button>
           </Card>
        )}
      </div>
    </div>
  );
};