import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Calendar, Trophy, Loader2 } from 'lucide-react';
import { Card, Badge, Button } from '../components/ui/core';
import { mockService } from '../lib/supabase';
import { Contest, UserSession } from '../types';
import { formatDate } from '../lib/utils';

export const Contests = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user: UserSession }>();

  useEffect(() => {
    setLoading(true);
    mockService.getContests()
      .then((data) => {
        setContests(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user, navigate]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Campaigns</h1>
          <p className="text-secondary mt-1">Active music challenges and leaderboards.</p>
        </div>
        
        {/* Only admins can create campaigns */}
        {user.role === 'admin' && (
          <Button onClick={() => navigate('/admin')}>Create Campaign</Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Loading active campaigns...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contests.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-zinc-400">No active campaigns found.</p>
            </div>
          ) : (
            contests.map((contest) => (
              <div 
                key={contest.id}
                onClick={() => navigate(`/contests/${contest.id}`)}
                className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all shadow-lg"
              >
                <div className="absolute inset-0">
                  <img src={contest.cover_url} alt={contest.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                </div>

                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={contest.status === 'active' ? 'active' : 'inactive'} className="uppercase tracking-wider font-bold">
                      {contest.status}
                    </Badge>
                    {contest.status === 'active' && (
                      <div className="bg-red-500/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-red-400 text-xs font-bold border border-red-500/30 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        LIVE
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">{contest.title}</h2>
                  <p className="text-zinc-300 text-sm line-clamp-2 mb-4 max-w-lg">
                    {contest.description}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-zinc-400">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} /> {formatDate(contest.end_date)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Trophy size={14} /> {contest.prize_pool}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};