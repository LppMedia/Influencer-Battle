import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import { Card, Button, Input } from '../components/ui/core';
import { mockService } from '../lib/supabase';
import { Influencer, UserSession } from '../types';
import { formatNumber } from '../lib/utils';
import ProfileCard from '../components/ProfileCard';

export const Influencers = () => {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState('');
  const navigate = useNavigate();
  const { user } = useOutletContext<{ user: UserSession }>();

  useEffect(() => {
    const loadData = async () => {
      const data = await mockService.getInfluencers();
      setInfluencers(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredInfluencers = influencers.filter(inf => 
    inf.name.toLowerCase().includes(filterCountry.toLowerCase()) || 
    inf.country.toLowerCase().includes(filterCountry.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Influencer Vault</h1>
          <p className="text-secondary mt-1">Manage and track your global influencer network.</p>
        </div>
        
        {/* Only admins can create new influencers */}
        {user.role === 'admin' && (
          <Button onClick={() => navigate('/admin')}>
            Add New Influencer
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <Input 
            placeholder="Search by name or country..." 
            icon={<Search size={16} />}
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button variant="secondary" size="sm" className="whitespace-nowrap">
            <Filter size={14} className="mr-2" /> All Niches
          </Button>
          <Button variant="secondary" size="sm" className="whitespace-nowrap">
            Sort: Followers (High)
          </Button>
        </div>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-muted">Loading vault data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4 md:px-0">
          {filteredInfluencers.map((influencer) => (
             <div key={influencer.id} className="h-full flex justify-center">
                <ProfileCard 
                  name={influencer.name}
                  handle={influencer.handle_tiktok}
                  avatarUrl={influencer.avatar_url}
                  followersCount={formatNumber(influencer.tiktok_followers)}
                  isVerified={influencer.is_verified}
                  campaignStreak={influencer.campaign_streak}
                  onActionClick={() => navigate(`/influencers/${influencer.id}`)}
                />
             </div>
          ))}
        </div>
      )}
    </div>
  );
};