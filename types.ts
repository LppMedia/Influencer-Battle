
export type UserRole = 'admin' | 'influencer';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  hasProfile: boolean; // Tracks if they have a row in the influencers table
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
}

export interface InfluencerMetrics {
  id: string;
  influencer_id: string;
  date: string;
  followers_tiktok: number;
  followers_instagram: number;
  views_avg: number;
  engagement_rate: number;
}

export interface Influencer {
  id: string;
  handle_tiktok?: string;
  handle_instagram?: string;
  name: string;
  avatar_url?: string;
  country: string;
  niches: string[];
  tiktok_followers: number;
  instagram_followers: number;
  total_followers: number; // Computed
  last_updated: string;
  metrics_history?: InfluencerMetrics[]; // Joined
  // New Verification Logic
  is_verified: boolean;
  campaign_streak: number;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  cover_url?: string;
  status: 'active' | 'inactive' | 'draft';
  start_date: string;
  end_date: string;
  prize_pool: string;
  song_url?: string;
}

export interface ContestEntry {
  id: string;
  contest_id: string;
  influencer_id: string;
  video_url: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  score: number;
  updated_at?: string;
  submitted_at: string;
  influencer?: Influencer; // Joined
}