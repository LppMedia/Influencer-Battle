import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { User, MapPin, Link as LinkIcon, Instagram, Sparkles, CheckCircle, AlertCircle, UploadCloud, Loader2, Users, Mail } from 'lucide-react';
import { Card, Input, Button } from '../components/ui/core';
import { supabase, uploadFile, triggerScrapingWebhook } from '../lib/supabase';
import { compressImage, cleanSocialUrl } from '../lib/utils';
import { UserSession } from '../types';

interface Props {
  user?: UserSession; // Optional prop for when used in Modal/Settings
  onSuccess?: () => void;
  isEmbedded?: boolean;
}

export const InfluencerOnboarding: React.FC<Props> = ({ user: propUser, onSuccess, isEmbedded = false }) => {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<{ user: UserSession } | null>();
  
  // Use prop user if available (Modal mode), otherwise fallback to outlet context
  const user = propUser || outletCtx?.user;

  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(''); 
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    tiktok: '',
    instagram: '',
    followers: '',
    avatar_url: ''
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load existing data if updating
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        setFetchingProfile(true);

        // DEMO BYPASS: Return fake data if demo user
        if (user.id.startsWith('demo-')) {
            setFormData({
                name: 'Demo Influencer',
                country: 'Demo Land',
                tiktok: '@demo_user',
                instagram: 'demo.user',
                followers: '10000',
                avatar_url: ''
            });
            setFetchingProfile(false);
            return;
        }

        const { data, error } = await supabase
          .from('influencers')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); 

        if (data && !error) {
          setFormData({
            name: data.name || '',
            country: data.country || '',
            tiktok: data.handle_tiktok || '',
            instagram: data.handle_instagram || '',
            followers: data.tiktok_followers ? String(data.tiktok_followers) : '',
            avatar_url: data.avatar_url || ''
          });
        }
      } catch (err) {
        console.error("Error fetching existing profile", err);
      } finally {
        setFetchingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      setAvatarFile(file);
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      // Clear manual URL input if file is selected
      setFormData(prev => ({ ...prev, avatar_url: '' }));
      setErrorMsg(''); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setErrorMsg('');

    try {
      // 0. Handle File Upload if present
      let finalAvatarUrl = formData.avatar_url;
      
      // DEMO BYPASS for file upload (Skip compression/upload)
      if (avatarFile && !user.id.startsWith('demo-')) {
        try {
            setLoadingStatus('Compressing image...');
            // Compress image to ensure it is small enough for upload/base64
            const compressedFile = await compressImage(avatarFile);
            
            setLoadingStatus('Uploading...');
            finalAvatarUrl = await uploadFile(compressedFile, 'avatars');
        } catch (uploadErr) {
            console.error("Avatar processing failed", uploadErr);
            throw new Error("Failed to process image. Please try a different one.");
        }
      }

      setLoadingStatus('Saving profile...');

      // Default avatar if none provided
      if (!finalAvatarUrl) {
        finalAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`;
      }

      // Format Followers (strip non-numeric chars)
      const numericFollowers = formData.followers 
        ? parseInt(formData.followers.replace(/[^0-9]/g, '')) 
        : 0;

      // CLEAN URLs
      const cleanTikTok = cleanSocialUrl(formData.tiktok);
      const cleanInsta = cleanSocialUrl(formData.instagram);

      // DEMO BYPASS for DB Insert
      if (user.id.startsWith('demo-')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Trigger Webhook for Demo too to test integration
          await triggerScrapingWebhook({
            id: user.id,
            name: formData.name,
            handle_tiktok: cleanTikTok,
            handle_instagram: cleanInsta,
            followers: numericFollowers
          });

          if (onSuccess) onSuccess();
          else navigate('/home'); // Replaced reload with navigation
          return;
      }

      // 1. Check for duplicate handles (Basic client-side check)
      const { data: existingTikTok } = await supabase
        .from('influencers')
        .select('id')
        .eq('handle_tiktok', cleanTikTok)
        .neq('id', user.id)
        .maybeSingle();
        
      if (existingTikTok) {
        throw new Error('This TikTok handle is already registered.');
      }

      // 2. Insert or Update (Upsert) into influencers table
      const { error: insertError } = await supabase.from('influencers').upsert({
        id: user.id, 
        name: formData.name,
        country: formData.country,
        handle_tiktok: cleanTikTok,
        handle_instagram: cleanInsta,
        avatar_url: finalAvatarUrl,
        tiktok_followers: numericFollowers,
        niches: ['Creator'],
      });

      if (insertError) {
        throw new Error(insertError.message || "Failed to save profile.");
      }

      // 3. Update the user's profile role to 'influencer' only if not admin
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (currentProfile && currentProfile.role !== 'admin') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'influencer' })
            .eq('id', user.id);

          if (updateError) console.warn("Profile role update warning:", updateError);
      }

      // 4. Trigger External Automation
      setLoadingStatus('Syncing stats...');
      await triggerScrapingWebhook({
        id: user.id,
        name: formData.name,
        handle_tiktok: cleanTikTok,
        handle_instagram: cleanInsta,
        followers: numericFollowers
      });

      // 5. Safety Delay to ensure beacon/keepalive fetch has definitely initiated
      await new Promise(resolve => setTimeout(resolve, 800));

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/home'); 
        window.location.reload(); 
      }

    } catch (err: any) {
      console.error('Onboarding error:', err);
      setErrorMsg(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  if (!user) return null;

  if (fetchingProfile) {
    return (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
    );
  }

  const Container = isEmbedded ? 'div' : Card;
  const containerClasses = isEmbedded ? '' : 'p-8 border-t border-purple-500/30 shadow-glow';

  return (
    <div className={isEmbedded ? "" : "max-w-2xl mx-auto space-y-8 py-10"}>
      {!isEmbedded && (
        <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 mb-2">
            <Sparkles size={32} />
            </div>
            <h1 className="text-3xl font-bold text-white">
                {user.hasProfile ? 'Edit Your Profile' : 'Join the Creator Vault'}
            </h1>
            <p className="text-secondary max-w-md mx-auto">
                {user.hasProfile 
                    ? 'Update your public details for the leaderboard and campaigns.'
                    : 'Create your official influencer profile to participate in exclusive campaigns, track your growth, and win prizes.'
                }
            </p>
        </div>
      )}

      <Container className={containerClasses}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Account Email</label>
              <Input
                value={user.email || ''}
                disabled
                icon={<Mail size={16} />}
                className="opacity-50 cursor-not-allowed bg-surfaceHighlight"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Full Name / Stage Name</label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                icon={<User size={16} />}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Country</label>
              <Input
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g. USA"
                icon={<MapPin size={16} />}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Total Followers (Approx)</label>
              <Input
                type="number"
                value={formData.followers}
                onChange={e => setFormData({ ...formData, followers: e.target.value })}
                placeholder="10000"
                icon={<Users size={16} />}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">TikTok Handle</label>
              <Input
                value={formData.tiktok}
                onChange={e => setFormData({ ...formData, tiktok: e.target.value })}
                placeholder="@username"
                icon={<LinkIcon size={16} />}
                required
              />
              <p className="text-[10px] text-zinc-500">Paste your profile link, we'll auto-format it.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Instagram Handle (Optional)</label>
              <Input
                value={formData.instagram}
                onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="username"
                icon={<Instagram size={16} />}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-secondary block">Profile Picture</label>
            
            <div className="flex items-center gap-6">
                <div className="relative w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {previewUrl || formData.avatar_url ? (
                        <img 
                            src={previewUrl || formData.avatar_url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="text-zinc-600" size={24} />
                    )}
                </div>

                <div className="flex-1 space-y-3">
                    <div className="relative">
                        <input 
                            type="file" 
                            accept="image/*"
                            id="avatar-upload"
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        <label 
                            htmlFor="avatar-upload"
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-surfaceHighlight border border-white/10 rounded-lg text-sm text-zinc-300 cursor-pointer hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <UploadCloud size={16} />
                            Upload from Device
                        </label>
                    </div>
                    {avatarFile && (
                        <p className="text-xs text-zinc-500">
                           Selected: {avatarFile.name} ({(avatarFile.size / 1024 / 1024).toFixed(1)}MB)
                        </p>
                    )}
                </div>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-gradient-brand hover:opacity-90 text-white border-0"
              isLoading={loading}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    {loadingStatus}
                </span>
              ) : (
                <>
                    <CheckCircle size={18} className="mr-2" /> 
                    {user.hasProfile ? 'Save Changes' : 'Complete Profile'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
};