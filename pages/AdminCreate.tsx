import React, { useState, useEffect } from 'react';
import { Save, User, Trophy, Calendar, Music, Image as ImageIcon, Link as LinkIcon, AlignLeft, DollarSign } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Card, Input, Button } from '../components/ui/core';
import { UserSession } from '../types';
import { mockService } from '../lib/supabase';

export const AdminCreate = () => {
  const [activeTab, setActiveTab] = useState<'contest' | 'influencer'>('contest');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user: UserSession }>();

  // Contest Form State
  const [contestData, setContestData] = useState({
    title: '',
    description: '',
    cover_url: '',
    song_url: '',
    prize_pool: '',
    end_date: ''
  });

  // Influencer Form State
  const [influencerData, setInfluencerData] = useState({
    name: '',
    tiktok: '',
    instagram: '',
    country: ''
  });

  // Security redirect for non-admins
  useEffect(() => {
    if (user.role !== 'admin') {
      navigate('/influencers');
    }
  }, [user, navigate]);

  if (user.role !== 'admin') return null;

  const handleContestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mockService.createContest({
          title: contestData.title,
          description: contestData.description,
          cover_url: contestData.cover_url || 'https://picsum.photos/800/400',
          song_url: contestData.song_url,
          prize_pool: contestData.prize_pool,
          end_date: contestData.end_date,
      }, user);

      navigate('/contests');
    } catch (err: any) {
      console.error('Error creating contest:', err);
      alert('Failed to create campaign: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInfluencerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await mockService.createInfluencer({
        name: influencerData.name,
        handle_tiktok: influencerData.tiktok,
        handle_instagram: influencerData.instagram,
        country: influencerData.country,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(influencerData.name)}&background=random`,
      }, user);

      navigate('/influencers');
    } catch (err: any) {
      console.error('Error creating influencer:', err);
      alert('Failed to create influencer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Console</h1>
        <p className="text-secondary mt-1">Create and manage your ecosystem.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-surfaceHighlight rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('contest')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'contest'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Trophy size={16} /> New Campaign
        </button>
        <button
          onClick={() => setActiveTab('influencer')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'influencer'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <User size={16} /> New Influencer
        </button>
      </div>

      <Card className="p-8">
        {activeTab === 'contest' ? (
          <form onSubmit={handleContestSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Campaign Name</label>
              <Input
                value={contestData.title}
                onChange={e => setContestData({ ...contestData, title: e.target.value })}
                placeholder="e.g. Summer Vibe Challenge"
                icon={<Trophy size={16} />}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Campaign Brief (Description)</label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-zinc-500">
                  <AlignLeft size={16} />
                </div>
                <textarea
                  className="w-full bg-surface/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all min-h-[120px]"
                  placeholder="Describe the challenge instructions, requirements, and goals..."
                  value={contestData.description}
                  onChange={e => setContestData({ ...contestData, description: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">End Date</label>
                <Input
                  type="date"
                  value={contestData.end_date}
                  onChange={e => setContestData({ ...contestData, end_date: e.target.value })}
                  icon={<Calendar size={16} />}
                  required
                  className="[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Prize Pool</label>
                <Input
                  value={contestData.prize_pool}
                  onChange={e => setContestData({ ...contestData, prize_pool: e.target.value })}
                  placeholder="$10,000"
                  icon={<DollarSign size={16} />}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Cover Image URL</label>
              <Input
                value={contestData.cover_url}
                onChange={e => setContestData({ ...contestData, cover_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                icon={<ImageIcon size={16} />}
              />
              <p className="text-xs text-zinc-600">Leave empty for a random gradient cover.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Sound URL</label>
              <Input
                value={contestData.song_url}
                onChange={e => setContestData({ ...contestData, song_url: e.target.value })}
                placeholder="https://tiktok.com/music/..."
                icon={<Music size={16} />}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" size="lg" className="w-full md:w-auto" isLoading={loading}>
                <Save size={18} className="mr-2" /> Launch Campaign
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleInfluencerSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Full Name</label>
                <Input
                  value={influencerData.name}
                  onChange={e => setInfluencerData({ ...influencerData, name: e.target.value })}
                  placeholder="Jane Doe"
                  icon={<User size={16} />}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Country</label>
                <Input
                  value={influencerData.country}
                  onChange={e => setInfluencerData({ ...influencerData, country: e.target.value })}
                  placeholder="United Kingdom"
                  icon={<LinkIcon size={16} />} // Using LinkIcon temporarily as generic location marker replacement if MapPin isn't imported
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">TikTok Handle</label>
              <Input
                value={influencerData.tiktok}
                onChange={e => setInfluencerData({ ...influencerData, tiktok: e.target.value })}
                placeholder="@username"
                icon={<LinkIcon size={16} />}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">Instagram Handle</label>
              <Input
                value={influencerData.instagram}
                onChange={e => setInfluencerData({ ...influencerData, instagram: e.target.value })}
                placeholder="username"
                icon={<LinkIcon size={16} />}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" size="lg" className="w-full md:w-auto" isLoading={loading}>
                <Save size={18} className="mr-2" /> Save Profile
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};