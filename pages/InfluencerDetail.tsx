
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Instagram, TrendingUp, Music, Mail, MapPin, BadgeCheck } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/core';
import { mockService } from '../lib/supabase';
import { Influencer, InfluencerMetrics } from '../types';
import { formatNumber, formatDate } from '../lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export const InfluencerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Default Mock History Data for Chart (Fallback)
  const defaultMockHistory = [
    { date: 'Sep 1', followers: 1600000 },
    { date: 'Sep 8', followers: 1610000 },
    { date: 'Sep 15', followers: 1625000 },
    { date: 'Sep 22', followers: 1630000 },
    { date: 'Oct 1', followers: 1650000 },
  ];

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        mockService.getInfluencerById(id),
        mockService.getStatsHistory(id)
      ]).then(([data, history]) => {
        setInfluencer(data || null);
        
        // If we have real history from DB, use it. Otherwise use mock for demo.
        if (history && history.length > 0) {
            setHistoryData(history);
        } else {
            setHistoryData(defaultMockHistory);
        }
        
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!influencer) return <div>Influencer not found</div>;

  // Clean handle for display (remove @ and domain/url structure)
  // Replaces https://tiktok.com/@user -> user
  const displayHandle = influencer.handle_tiktok
    ? influencer.handle_tiktok.replace(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?|@/g, '').split('?')[0]
    : influencer.name;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-sm text-muted hover:text-white transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Vault
      </button>

      {/* Header Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-8 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-brand opacity-20" />
          <div className="w-32 h-32 rounded-full p-1 bg-surface relative z-10 mb-4 shadow-xl">
            <img 
              src={influencer.avatar_url} 
              alt={influencer.name} 
              className="w-full h-full rounded-full object-cover border-4 border-surface" 
            />
          </div>
          
          {/* Identity Section: Handle + Verified Badge */}
          <div className="flex items-center gap-2 justify-center w-full">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {displayHandle}
            </h1>
            {influencer.is_verified && (
               <BadgeCheck className="text-blue-500 fill-blue-500/10" size={26} />
            )}
          </div>

          {/* Verification Status - ONLY IF VERIFIED */}
          {influencer.is_verified && (
            <p className="text-purple-400 font-medium mt-1">Verified Creator</p>
          )}
          
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {influencer.niches.map(n => (
              <Badge key={n} variant="default">{n}</Badge>
            ))}
          </div>

          <div className="mt-8 w-full space-y-4 text-left">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <span className="flex items-center text-sm text-muted">
                <MapPin size={14} className="mr-2" /> Country
              </span>
              <span className="text-white font-medium">{influencer.country}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <span className="flex items-center text-sm text-muted">
                <Mail size={14} className="mr-2" /> Contact
              </span>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-400 hover:text-blue-300">Reveal</Button>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-gradient-to-br from-surface to-surfaceHighlight border-l-4 border-pink-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Music size={64} />
              </div>
              <div className="relative z-10">
                <p className="text-xs text-muted uppercase tracking-wider font-semibold">Total Reach</p>
                <p className="text-3xl font-bold text-white mt-1">{formatNumber(influencer.total_followers)}</p>
              </div>
            </Card>
            <Card className="p-5 bg-gradient-to-br from-surface to-surfaceHighlight border-l-4 border-purple-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <TrendingUp size={64} />
              </div>
              <div className="relative z-10">
                <p className="text-xs text-muted uppercase tracking-wider font-semibold">Engagement</p>
                <p className="text-3xl font-bold text-white mt-1">4.2%</p>
              </div>
            </Card>
            <Card className="p-5 bg-gradient-to-br from-surface to-surfaceHighlight border-l-4 border-indigo-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Instagram size={64} />
              </div>
              <div className="relative z-10">
                <p className="text-xs text-muted uppercase tracking-wider font-semibold">Avg Views</p>
                <p className="text-3xl font-bold text-white mt-1">245K</p>
              </div>
            </Card>
          </div>

          {/* Growth Chart */}
          <Card className="p-6 h-[400px] flex flex-col border-white/5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Growth Trajectory</h3>
                <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    <span className="text-xs text-zinc-400">Followers</span>
                </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7928CA" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7928CA" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#52525B" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#52525B" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={formatNumber} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181B', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#FAFAFA' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="followers" 
                    stroke="#7928CA" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorFollowers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
