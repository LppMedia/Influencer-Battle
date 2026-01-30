import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Play, Eye, Heart, ExternalLink, RefreshCw, Upload, Link as LinkIcon, Loader2, Music4, CheckCircle, AlertCircle, MessageSquare, Share2, Award, Clock, LayoutDashboard, List, TrendingUp, Users, Activity, BarChart3 } from 'lucide-react';
import { Card, Button, Badge, Modal, Input } from '../components/ui/core';
import { mockService } from '../lib/supabase';
import { Contest, ContestEntry, UserSession } from '../types';
import { formatNumber, formatTimeAgo, formatDate } from '../lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';

export const ContestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [entries, setEntries] = useState<ContestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useOutletContext<{ user: UserSession }>();

  // Admin View State
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'analytics'>('leaderboard');

  // Submission State
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [submissionError, setSubmissionError] = useState('');

  // Derived state to check if current user has already joined
  const hasUserJoined = entries.some(entry => entry.influencer_id === user.id);
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    refreshData();
  }, [id, user, navigate]);

  const refreshData = () => {
    if (id) {
      setLoading(true);
      Promise.all([
        mockService.getContestById(id),
        mockService.getContestEntries(id)
      ]).then(([c, e]) => {
        setContest(c || null);
        setEntries(e);
        setLoading(false);
      });
    }
  };

  const handleUseSound = () => {
    if (!contest?.song_url) return;
    let url = contest.song_url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank');
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !videoUrl) return;

    setSubmissionStatus('verifying');
    setSubmissionError('');

    try {
        await mockService.submitEntry(id, videoUrl, user);
        
        // Success State
        setSubmissionStatus('success');
        
        // Close modal after delay and refresh
        setTimeout(() => {
            setIsJoinModalOpen(false);
            setVideoUrl('');
            setSubmissionStatus('idle');
            // Refresh entries to show new submission
            mockService.getContestEntries(id).then(setEntries);
        }, 1500);

    } catch (error: any) {
        setSubmissionStatus('error');
        setSubmissionError(error.message || "Failed to submit entry.");
    }
  };

  // --- ANALYTICS CALCULATIONS ---
  const analytics = useMemo(() => {
    if (!entries.length) return null;

    const totalViews = entries.reduce((acc, e) => acc + (e.views || 0), 0);
    const totalLikes = entries.reduce((acc, e) => acc + (e.likes || 0), 0);
    const totalComments = entries.reduce((acc, e) => acc + (e.comments || 0), 0);
    const totalShares = entries.reduce((acc, e) => acc + (e.shares || 0), 0);
    
    // Engagement Rate: (Likes + Comments + Shares) / Views
    const engagementRate = totalViews > 0 
        ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 
        : 0;

    // Timeline Data (Accumulated Views based on submission date)
    // In a real app, you'd likely have a separate 'daily_stats' table. 
    // Here we simulate accumulation based on when the entry was submitted.
    const sortedEntries = [...entries].sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());
    let runningViews = 0;
    const timelineData = sortedEntries.map(e => {
        runningViews += e.views;
        return {
            date: new Date(e.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            views: runningViews,
            entryName: e.influencer?.name
        };
    });

    // Top Niches
    const nicheMap: Record<string, number> = {};
    entries.forEach(e => {
        e.influencer?.niches?.forEach(n => {
            nicheMap[n] = (nicheMap[n] || 0) + e.views; // Weight by views
        });
    });
    const nicheData = Object.entries(nicheMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Top Performers for Bar Chart
    const topPerformers = [...entries]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(e => ({
            name: e.influencer?.name || 'Unknown',
            score: e.score,
            likes: e.likes,
            shares: e.shares
        }));

    return {
        totalViews,
        totalLikes,
        totalEntries: entries.length,
        engagementRate,
        timelineData,
        nicheData,
        topPerformers
    };
  }, [entries]);


  // Render modal content based on status
  const renderModalContent = () => {
    if (submissionStatus === 'verifying') {
        return (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
                    <div className="relative bg-surface border border-white/10 p-4 rounded-full">
                         <Music4 className="w-8 h-8 text-purple-400 animate-pulse" />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-white">Analyzing Audio Fingerprint...</h3>
                <p className="text-sm text-zinc-400 text-center max-w-xs">
                    Verifying that your video uses the official campaign sound.
                </p>
            </div>
        );
    }

    if (submissionStatus === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="bg-green-500/20 p-4 rounded-full text-green-400">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Entry Verified!</h3>
                <p className="text-sm text-zinc-400">You are now live on the leaderboard.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmitEntry} className="space-y-6">
            <p className="text-sm text-zinc-400">
                Paste the link to your TikTok video using the official sound 
                <span className="text-white font-medium"> "{contest?.title}"</span>.
            </p>

            {submissionStatus === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                         <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                         <p className="text-sm text-red-400">{submissionError}</p>
                    </div>
                    {/* Provide quick fix link if the error is about missing profile */}
                    {(submissionError.includes("onboarding") || submissionError.includes("Profile not found")) && (
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            className="self-end mt-1 text-xs"
                            onClick={() => {
                                setIsJoinModalOpen(false);
                                navigate('/onboarding');
                            }}
                        >
                            Fix Profile &rarr;
                        </Button>
                    )}
                </div>
            )}
            
            <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-secondary">TikTok Video URL</label>
                <Input 
                    placeholder="https://www.tiktok.com/@user/video/..." 
                    icon={<LinkIcon size={16} />}
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    required
                    autoFocus
                />
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    * Must include sound metadata
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => {
                        setIsJoinModalOpen(false);
                        setSubmissionStatus('idle');
                        setSubmissionError('');
                    }}
                >
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                >
                    Submit Entry
                </Button>
            </div>
        </form>
    );
  };

  if (loading && !contest) return <div>Loading leaderboard...</div>;
  if (!contest) return <div>Contest not found</div>;

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/contests')} 
          className="flex items-center text-sm text-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Campaigns
        </button>
        
        <div className="flex gap-3">
            {isAdmin && (
                <div className="flex bg-surfaceHighlight rounded-lg p-1 mr-2 border border-white/5">
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${activeTab === 'leaderboard' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <List size={14} /> Leaderboard
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-all ${activeTab === 'analytics' ? 'bg-purple-500/20 text-purple-300 shadow-sm border border-purple-500/20' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <LayoutDashboard size={14} /> Smart Dashboard
                    </button>
                </div>
            )}
            <Button variant="secondary" size="sm" className="gap-2" onClick={refreshData}>
            <RefreshCw size={14} /> Refresh Stats
            </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 h-64 shadow-2xl">
        <img src={contest.cover_url} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent flex flex-col justify-center p-12">
          <Badge variant="active" className="w-fit mb-4">Official Campaign</Badge>
          <h1 className="text-4xl font-bold text-white mb-2">{contest.title}</h1>
          <p className="text-xl text-zinc-300 max-w-2xl">{contest.description}</p>
          
          <div className="mt-6 flex flex-wrap gap-4">
             <Button 
               className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
               onClick={handleUseSound}
               disabled={!contest.song_url || contest.song_url === '#'}
             >
               <Play size={16} className="mr-2 fill-current" /> Use Sound
             </Button>

             {/* Only Influencers can join */}
             {user.role === 'influencer' && (
                 hasUserJoined ? (
                    <Button 
                        disabled
                        className="bg-green-600/20 text-green-400 border border-green-600/30 cursor-default"
                    >
                        <CheckCircle size={16} className="mr-2" /> Entry Submitted
                    </Button>
                 ) : (
                    <Button 
                        className="bg-purple-600 text-white hover:bg-purple-700 border-none shadow-glow"
                        onClick={() => setIsJoinModalOpen(true)}
                    >
                        <Upload size={16} className="mr-2" /> Submit Entry
                    </Button>
                 )
             )}
          </div>
        </div>
      </div>

      {/* --- ADMIN DASHBOARD --- */}
      {isAdmin && activeTab === 'analytics' && analytics && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* 1. KPI Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <Card className="p-5 border-l-4 border-l-purple-500 bg-gradient-to-br from-surface to-[#252528] relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-muted uppercase font-bold tracking-wider">Total Reach</p>
                            <Eye className="text-purple-500 opacity-50" size={18} />
                        </div>
                        <p className="text-3xl font-extrabold text-white">{formatNumber(analytics.totalViews)}</p>
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <TrendingUp size={12} /> +12% vs last week
                        </p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:scale-110 transition-transform">
                        <Eye size={80} />
                    </div>
                 </Card>

                 <Card className="p-5 border-l-4 border-l-pink-500 bg-gradient-to-br from-surface to-[#252528] relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-muted uppercase font-bold tracking-wider">Engagement Rate</p>
                            <Activity className="text-pink-500 opacity-50" size={18} />
                        </div>
                        <p className="text-3xl font-extrabold text-white">{analytics.engagementRate.toFixed(2)}%</p>
                        <p className="text-xs text-zinc-500 mt-1">Industry avg: 3.5%</p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:scale-110 transition-transform">
                        <Activity size={80} />
                    </div>
                 </Card>

                 <Card className="p-5 border-l-4 border-l-blue-500 bg-gradient-to-br from-surface to-[#252528] relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-muted uppercase font-bold tracking-wider">Total Entries</p>
                            <Users className="text-blue-500 opacity-50" size={18} />
                        </div>
                        <p className="text-3xl font-extrabold text-white">{analytics.totalEntries}</p>
                        <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                            Pending verification: 0
                        </p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:scale-110 transition-transform">
                        <Users size={80} />
                    </div>
                 </Card>

                 <Card className="p-5 border-l-4 border-l-yellow-500 bg-gradient-to-br from-surface to-[#252528] relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-muted uppercase font-bold tracking-wider">Total Likes</p>
                            <Heart className="text-yellow-500 opacity-50" size={18} />
                        </div>
                        <p className="text-3xl font-extrabold text-white">{formatNumber(analytics.totalLikes)}</p>
                        <p className="text-xs text-yellow-500/70 mt-1 font-medium">Viral Potential: High</p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:scale-110 transition-transform">
                        <Award size={80} />
                    </div>
                 </Card>
             </div>

             {/* 2. Main Charts Row */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign Velocity */}
                <Card className="lg:col-span-2 p-6 h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <TrendingUp size={18} className="text-purple-400" />
                                Campaign Velocity
                            </h3>
                            <p className="text-xs text-zinc-500">Cumulative views over submission timeline</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.timelineData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7928CA" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#7928CA" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} dx={-10} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#FAFAFA' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#7928CA" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Top Niches Pie Chart */}
                <Card className="p-6 h-[400px] flex flex-col">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart3 size={18} className="text-pink-400" />
                            Niche Dominance
                        </h3>
                        <p className="text-xs text-zinc-500">Reach distribution by category</p>
                    </div>
                    <div className="flex-1 w-full min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.nicheData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {analytics.nicheData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#7928CA', '#FF0080', '#4F46E5', '#10B981', '#F59E0B'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
             </div>

             {/* 3. Performance Breakdown */}
             <Card className="p-6 h-[350px]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Top Performer Analysis</h3>
                        <p className="text-xs text-zinc-500">Comparing Likes vs Shares for top 5 entries</p>
                    </div>
                </div>
                <div className="w-full h-full pb-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.topPerformers} layout="vertical" barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" stroke="#52525B" fontSize={12} tickFormatter={formatNumber} />
                            <YAxis dataKey="name" type="category" stroke="#FAFAFA" fontSize={12} width={100} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.1)' }} />
                            <Legend />
                            <Bar dataKey="likes" name="Likes" stackId="a" fill="#FF0080" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="shares" name="Shares" stackId="a" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </Card>
          </div>
      )}

      {/* Leaderboard (Only shown if NOT in Admin Analytics Tab) */}
      {(!isAdmin || activeTab === 'leaderboard') && (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Live Leaderboard</h2>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs uppercase text-muted font-medium">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Influencer</th>
                  <th className="px-6 py-4 text-center" title="Views"><Eye size={14} className="mx-auto" /></th>
                  <th className="px-6 py-4 text-center" title="Likes"><Heart size={14} className="mx-auto" /></th>
                  <th className="px-6 py-4 text-center" title="Comments"><MessageSquare size={14} className="mx-auto" /></th>
                  <th className="px-6 py-4 text-center" title="Shares"><Share2 size={14} className="mx-auto" /></th>
                  <th className="px-6 py-4 text-center" title="Score"><Award size={14} className="mx-auto text-yellow-500" /></th>
                  <th className="px-6 py-4 text-right" title="Last Updated"><Clock size={14} className="ml-auto" /></th>
                  <th className="px-6 py-4 text-right">Entry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.length === 0 ? (
                    <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-zinc-500">
                            No entries yet. Be the first to join!
                        </td>
                    </tr>
                ) : (
                    entries.map((entry, index) => (
                    <tr key={entry.id} className={`transition-colors ${entry.influencer_id === user.id ? 'bg-purple-500/10' : 'hover:bg-white/5'}`}>
                        {/* Rank */}
                        <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' :
                            index === 1 ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/50' :
                            index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/50' :
                            'text-muted'
                        }`}>
                            {index + 1}
                        </div>
                        </td>
                        
                        {/* Influencer */}
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <img 
                            src={entry.influencer?.avatar_url || 'https://picsum.photos/50'} 
                            className="w-10 h-10 rounded-full border border-white/10" 
                            alt={entry.influencer?.name}
                            />
                            <div>
                            <div className="font-medium text-white">
                                {entry.influencer?.name || 'Unknown User'}
                                {entry.influencer_id === user.id && (
                                    <span className="ml-2 text-[10px] bg-purple-500 px-1.5 py-0.5 rounded text-white">YOU</span>
                                )}
                            </div>
                            <div className="text-xs text-muted">{entry.influencer?.handle_tiktok || '@user'}</div>
                            </div>
                        </div>
                        </td>

                        {/* Stats Metrics */}
                        <td className="px-6 py-4 text-center font-mono text-zinc-300">
                           {formatNumber(entry.views)}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-zinc-300">
                           {formatNumber(entry.likes)}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-zinc-300">
                           {formatNumber(entry.comments)}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-zinc-300">
                           {formatNumber(entry.shares)}
                        </td>

                        {/* Score (Highlighted) */}
                        <td className="px-6 py-4 text-center font-mono">
                            <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20 font-bold">
                                {entry.score?.toFixed(2) || '0.00'}
                            </span>
                        </td>

                        {/* Updated At */}
                        <td className="px-6 py-4 text-right text-xs text-muted">
                           {formatTimeAgo(entry.updated_at)}
                        </td>

                        {/* Link */}
                        <td className="px-6 py-4 text-right">
                        <a 
                            href={entry.video_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-muted hover:text-white transition-colors"
                        >
                            <ExternalLink size={16} />
                        </a>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      )}

      {/* Join Modal */}
      <Modal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        title={submissionStatus === 'success' ? '' : "Submit your entry"}
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
};