import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { UserSession } from '../types';
import { InfluencerOnboarding } from './InfluencerOnboarding';
import { Button, Card, Modal, Input } from '../components/ui/core';
import { Shield, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Settings = () => {
  const { user } = useOutletContext<{ user: UserSession }>();
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);

    try {
        // 1. Delete Influencer Data (if exists)
        if (user.role === 'influencer') {
             const { error: infError } = await supabase
                .from('influencers')
                .delete()
                .eq('id', user.id);
             
             if (infError) console.warn("Influencer deletion error:", infError);
        }

        // 2. Delete Profile Data
        const { error: profError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);
            
        if (profError) console.warn("Profile deletion error:", profError);

        // 3. Sign Out (Triggers app state cleanup via listener in App.tsx)
        await supabase.auth.signOut();
        
        // 4. Force reload/redirect to ensure clean state
        window.location.href = '/';
        
    } catch (e) {
        console.error("Account deletion failed", e);
        alert("Failed to delete account data. Please try again.");
        setIsDeleting(false);
    }
  };

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

        {/* Danger Zone */}
        <div className="space-y-4 pt-4">
             <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
             <Card className="border border-red-500/20 bg-red-500/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-500" />
                        Delete Account
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1 max-w-md">
                        Permanently remove your profile, stats, and contest entries. This action cannot be undone.
                    </p>
                </div>
                <Button 
                    variant="danger" 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="shrink-0"
                >
                    <Trash2 size={16} className="mr-2" />
                    Delete Account
                </Button>
             </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Account"
      >
        <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="text-red-500 shrink-0" size={24} />
                <div className="text-sm text-zinc-300">
                    <p className="font-bold text-white mb-1">Are you absolutely sure?</p>
                    <p>This will permanently delete your account, <b>{user.email}</b>, and all associated data from our servers.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-zinc-400">
                    Type <span className="text-white font-bold select-none">DELETE</span> to confirm.
                </label>
                <Input 
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="border-red-500/30 focus:border-red-500 focus:ring-red-500/20"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button 
                    variant="ghost" 
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                >
                    Cancel
                </Button>
                <Button 
                    variant="danger" 
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                    isLoading={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};