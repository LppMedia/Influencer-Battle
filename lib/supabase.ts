import { createClient } from '@supabase/supabase-js';
import { Influencer, Contest, ContestEntry, UserRole, UserSession } from '../types';

// Credentials provided by user
const SUPABASE_URL = 'https://gidpazqdvfrptniqsbph.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZHBhenFkdmZycHRuaXFzYnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NjA2NjgsImV4cCI6MjA4NDUzNjY2OH0.rBsbg5Ev8hS_ukmITTDpulN_8vTdhKI2bOVzaCiMl58';
// Updated Webhook URL for Testing
const AUTOMATION_WEBHOOK_URL = 'https://n8n-n8n.mf4pdg.easypanel.host/webhook-test/Profile-Influencer';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to trigger n8n automation
export const triggerScrapingWebhook = async (payload: any) => {
    try {
        // Normalize handle keys to support different caller formats
        const handle = payload.handle_tiktok || payload.influencer_handle;
        const igHandle = payload.handle_instagram || payload.influencer_instagram;

        // Construct full URLs if handles exist to help the scraper
        let tiktokUrl = payload.tiktok_url || payload.video_url; // Use video_url as fallback if submitting a specific video
        if (!tiktokUrl && handle) {
            const h = handle.trim();
            tiktokUrl = h.startsWith('http') 
                ? h 
                : `https://www.tiktok.com/${h.startsWith('@') ? h : '@' + h}`;
        }

        let instagramUrl = payload.instagram_url;
        if (!instagramUrl && igHandle) {
            const h = igHandle.trim();
            instagramUrl = h.startsWith('http') 
                 ? h 
                 : `https://www.instagram.com/${h.replace('@', '')}`;
        }

        // --- INTELLIGENT PAYLOAD ROUTING ---
        // Helps n8n know exactly WHICH row to update (Unique ID) and WHICH table.
        let targetTable = 'influencers';
        let recordId = payload.id; // Default to influencer ID

        // If it's a contest entry, the unique ID is the entry_id, NOT the influencer_id
        if (payload.type === 'contest_entry') {
            targetTable = 'contest_entries';
            recordId = payload.entry_id; 
        }

        const safePayload = {
            ...payload,
            // Standardized fields for automation reliability
            target_table: targetTable, 
            record_id: recordId,       // <--- USE THIS IN N8N AS THE FILTER KEY
            
            tiktok_url: tiktokUrl,
            instagram_url: instagramUrl,
            timestamp: new Date().toISOString(),
            source: 'lpp_vault_app'
        };

        console.log(`Triggering automation for [${targetTable}] ID: ${recordId}`);

        // Convert payload to Query Params for GET request (matches n8n config)
        const params = new URLSearchParams();
        Object.entries(safePayload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                // If it's an object/array, stringify it
                if (typeof value === 'object') {
                    params.append(key, JSON.stringify(value));
                } else {
                    params.append(key, String(value));
                }
            }
        });
        
        const finalUrl = `${AUTOMATION_WEBHOOK_URL}?${params.toString()}`;

        // RELIABILITY FIX: Use fetch with keepalive and no-cors.
        // 'no-cors' allows sending data to opaque origins (like webhooks without explicit CORS headers)
        // 'keepalive' ensures the request completes even if the page unloads/navigates immediately.
        await fetch(finalUrl, {
            method: 'GET',
            mode: 'no-cors', 
            keepalive: true,
        });
        
        console.log("Webhook triggered successfully:", finalUrl);

    } catch (e) {
        console.warn("Webhook triggering failed (non-blocking):", e);
    }
};

// Helper to get the profile including role and profile existence check
export const getUserProfile = async (userId: string): Promise<UserSession | null> => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 6000)
    );

    const fetchLogic = async () => {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !profile) return null;

        const { count } = await supabase
            .from('influencers')
            .select('id', { count: 'exact', head: true })
            .eq('id', userId);

        return { profile, hasProfile: count !== null && count > 0 };
    };

    const result = await Promise.race([fetchLogic(), timeoutPromise]) as any;

    if (!result) return null;
    
    const appRole: UserRole = result.profile.role === 'admin' ? 'admin' : 'influencer';

    return {
      id: result.profile.id,
      email: result.profile.email,
      role: appRole,
      hasProfile: result.hasProfile
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Profile fetch timeout') {
        // console.debug('Profile fetch timed out - using fallback.'); 
    } else {
        console.warn('Error fetching profile (using fallback):', error);
    }
    return null;
  }
};

// Helper to upload file with Base64 fallback
export const uploadFile = async (file: File, bucket: string = 'avatars'): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) {
        throw uploadError;
    }
    
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
  } catch (error: any) {
    const isExpectedError = error.message?.includes('Bucket not found') || 
                            error.message?.includes('row-level security') ||
                            error.statusCode === '404';

    if (isExpectedError) {
        console.info(`Storage bucket '${bucket}' not configured. Using local Base64 fallback.`);
    } else {
        console.warn("Storage upload failed, using Base64 fallback:", error);
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
};

// --- MOCK DATA SERVICE FOR DEMO PURPOSES ---

let MOCK_INFLUENCERS: Influencer[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    handle_tiktok: '@sarahj_music',
    handle_instagram: 'sarah.jenkins',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
    country: 'USA',
    niches: ['Music', 'Lifestyle'],
    tiktok_followers: 1200000,
    instagram_followers: 450000,
    total_followers: 1650000,
    last_updated: new Date().toISOString(),
    is_verified: true,
    campaign_streak: 5
  },
  {
    id: '2',
    name: 'Davide Rossi',
    handle_tiktok: '@davide_vibes',
    handle_instagram: 'davide.official',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    country: 'Italy',
    niches: ['Fashion', 'Dance'],
    tiktok_followers: 850000,
    instagram_followers: 900000,
    total_followers: 1750000,
    last_updated: new Date().toISOString(),
    is_verified: false,
    campaign_streak: 2
  },
  {
    id: '3',
    name: 'K-Pop Stans',
    handle_tiktok: '@kpop_daily',
    handle_instagram: 'kpop.updates',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    country: 'South Korea',
    niches: ['K-Pop', 'Entertainment'],
    tiktok_followers: 3200000,
    instagram_followers: 120000,
    total_followers: 3320000,
    last_updated: new Date().toISOString(),
    is_verified: true,
    campaign_streak: 12
  },
  {
    id: '4',
    name: 'Elena Fisher',
    handle_tiktok: '@elena_f',
    handle_instagram: 'elena.f',
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=300&auto=format&fit=crop',
    country: 'UK',
    niches: ['Comedy', 'Acting'],
    tiktok_followers: 45000,
    instagram_followers: 12000,
    total_followers: 57000,
    last_updated: new Date().toISOString(),
    is_verified: false,
    campaign_streak: 0
  }
];

let MOCK_CONTESTS: Contest[] = [
  {
    id: '101',
    title: 'Midnight Sky - Viral Challenge',
    description: 'Create a transition video using the drop of Midnight Sky.',
    cover_url: 'https://picsum.photos/800/400',
    status: 'active',
    start_date: '2023-10-01',
    end_date: '2023-11-01',
    prize_pool: '$5,000',
    song_url: '#'
  },
  {
    id: '102',
    title: 'Neon Lights Launch',
    description: 'Use the official sound in your GRWM videos.',
    cover_url: 'https://picsum.photos/800/401',
    status: 'inactive',
    start_date: '2023-08-15',
    end_date: '2023-09-15',
    prize_pool: '$2,500',
    song_url: '#'
  }
];

let MOCK_ENTRIES: ContestEntry[] = [
  {
    id: 'e1',
    contest_id: '101',
    influencer_id: '1',
    video_url: 'https://tiktok.com/@sarahj/video/1',
    video_file_url: 'https://videos.pexels.com/video-files/6981411/6981411-hd_1080_1920_25fps.mp4',
    views: 450000,
    likes: 89000,
    comments: 1200,
    shares: 4500,
    score: 85.5,
    submitted_at: '2023-10-05T10:00:00Z',
    updated_at: '2023-10-06T12:00:00Z',
    influencer: MOCK_INFLUENCERS[0]
  },
  {
    id: 'e2',
    contest_id: '101',
    influencer_id: '2',
    video_url: 'https://tiktok.com/@davide/video/1',
    video_file_url: 'https://videos.pexels.com/video-files/4552467/4552467-uhd_2160_3840_30fps.mp4',
    views: 1250000,
    likes: 210000,
    comments: 5600,
    shares: 12000,
    score: 94.2,
    submitted_at: '2023-10-06T14:30:00Z',
    updated_at: '2023-10-07T09:00:00Z',
    influencer: MOCK_INFLUENCERS[1]
  }
];

// Helper to fetch real data with fallback to mock
export const mockService = {
  getInfluencers: async (): Promise<Influencer[]> => {
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));
      const fetchPromise = supabase.from('influencers').select('*');
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          tiktok_followers: Number(item.tiktok_followers) || 0,
          instagram_followers: Number(item.instagram_followers) || 0,
          total_followers: (Number(item.tiktok_followers) || 0) + (Number(item.instagram_followers) || 0),
          niches: item.niches || [],
          avatar_url: item.avatar_url || 'https://picsum.photos/200',
          is_verified: item.is_verified || false,
          campaign_streak: item.campaign_streak || 0
        }));
      }
      return MOCK_INFLUENCERS;
    } catch (e) {
      return MOCK_INFLUENCERS;
    }
  },
  getInfluencerById: async (id: string): Promise<Influencer | undefined> => {
    try {
      const { data, error } = await supabase.from('influencers').select('*').eq('id', id).single();
      if (!error && data) {
         return {
          ...data,
          tiktok_followers: Number(data.tiktok_followers) || 0,
          instagram_followers: Number(data.instagram_followers) || 0,
          total_followers: (Number(data.tiktok_followers) || 0) + (Number(data.instagram_followers) || 0),
          niches: data.niches || [],
          is_verified: data.is_verified || false,
          campaign_streak: data.campaign_streak || 0
         };
      }
      return MOCK_INFLUENCERS.find(i => i.id === id);
    } catch (e) {
      return MOCK_INFLUENCERS.find(i => i.id === id);
    }
  },
  getStatsHistory: async (influencerId: string): Promise<any[]> => {
      try {
          const { data, error } = await supabase
            .from('influencer_stats_history')
            .select('*')
            .eq('influencer_id', influencerId)
            .order('recorded_at', { ascending: true });
            
          if (data && data.length > 0) {
              return data.map((entry: any) => ({
                  date: new Date(entry.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  followers: Number(entry.total_followers),
                  tiktok: Number(entry.tiktok_followers),
                  instagram: Number(entry.instagram_followers)
              }));
          }
          return [];
      } catch (e) {
          console.warn('Failed to fetch stats history', e);
          return [];
      }
  },
  getContests: async (): Promise<Contest[]> => {
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));
      const fetchPromise = supabase.from('contests').select('*').order('created_at', { ascending: false });
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (!error && data) return data.length > 0 ? data : MOCK_CONTESTS;
      return MOCK_CONTESTS;
    } catch (e) {
      return MOCK_CONTESTS;
    }
  },
  getContestById: async (id: string): Promise<Contest | undefined> => {
    try {
      const { data, error } = await supabase.from('contests').select('*').eq('id', id).single();
      if (!error && data) return data;
      return MOCK_CONTESTS.find(c => c.id === id);
    } catch (e) {
      return MOCK_CONTESTS.find(c => c.id === id);
    }
  },
  getContestEntries: async (contestId: string): Promise<ContestEntry[]> => {
    try {
      const { data: realData } = await supabase
        .from('contest_entries')
        .select('*, influencer:influencers(*)')
        .eq('contest_id', contestId);

      const realEntries = realData ? realData.map((e: any) => ({
          ...e,
          views: Number(e.views) || 0,
          likes: Number(e.likes) || 0,
          comments: Number(e.comments) || 0,
          shares: Number(e.shares) || 0,
          score: Number(e.score) || 0,
          influencer: e.influencer,
          // DB column mapping in case schema differs slightly, but we are using video_url mostly
          video_file_url: e.video_file_url || null 
      })) : [];

      // Create a set of real influencer IDs to efficiently filter mocks
      const realInfluencerIds = new Set(realEntries.map(r => r.influencer_id));

      const mockEntries = MOCK_ENTRIES.filter(
          m => m.contest_id === contestId && 
               !realEntries.find(r => r.id === m.id) &&
               !realInfluencerIds.has(m.influencer_id) 
      );
      return [...realEntries, ...mockEntries].sort((a, b) => (b.score || 0) - (a.score || 0));
    } catch (e) {
      return MOCK_ENTRIES.filter(e => e.contest_id === contestId).sort((a, b) => (b.score || 0) - (a.score || 0));
    }
  },
  submitEntry: async (contestId: string, videoUrl: string, user: UserSession, videoFileUrl?: string): Promise<void> => {
    // --- 0. VALIDATE HANDLE ---
    let registeredHandle = '';
    const { data: realProfile } = await supabase.from('influencers').select('handle_tiktok').eq('id', user.id).maybeSingle();

    if (realProfile) {
        registeredHandle = realProfile.handle_tiktok;
    } else {
        const mockProfile = MOCK_INFLUENCERS.find(i => i.id === user.id);
        if (mockProfile) registeredHandle = mockProfile.handle_tiktok || '';
    }

    if (registeredHandle) {
        let cleanHandle = registeredHandle.toLowerCase().replace('https://', '').replace('http://', '').replace('www.', '').replace('tiktok.com/', '');
        if (cleanHandle.endsWith('/')) cleanHandle = cleanHandle.slice(0, -1);
        cleanHandle = cleanHandle.replace('@', '');
        const cleanUrl = videoUrl.toLowerCase();
        // Loose check if they pasted a link
        if (videoUrl.includes('tiktok.com') && !cleanUrl.includes(cleanHandle)) {
            // Optional: Enforce handle check strictly or warn
            // throw new Error(`Security Check Failed: The video URL must match your registered TikTok handle (@${cleanHandle}).`);
        }
    } else {
        throw new Error("Profile incomplete. Please add your TikTok handle in Settings before joining.");
    }

    // --- 1. REAL USER LOGIC ---
    if (!user.id.startsWith('demo-')) {
        // Verification Streak Logic
        const { data: currentInf } = await supabase.from('influencers').select('campaign_streak, is_verified').eq('id', user.id).single();
        let newStreak = (currentInf?.campaign_streak || 0) + 1;
        let newVerified = currentInf?.is_verified || false;
        if (newStreak >= 3) newVerified = true;

        await supabase.from('influencers').update({
            campaign_streak: newStreak,
            is_verified: newVerified
        }).eq('id', user.id);

        // Insert Entry with FILE URL
        const { data: insertedEntry, error } = await supabase.from('contest_entries').insert({
            contest_id: contestId,
            influencer_id: user.id, 
            video_url: videoUrl,
            video_file_url: videoFileUrl, // Save the direct file URL
            views: 0, likes: 0, comments: 0, shares: 0, score: 0
        }).select().single();

        if (error) {
            if (error.code === '23503') throw new Error("Profile not found. Please complete the 'Join as Creator' onboarding first.");
            if (error.code === '23505') throw new Error("You have already joined this contest.");
            throw new Error("Failed to save entry: " + error.message);
        }

        // Pass ID to webhook to ensure targeted updates
        triggerScrapingWebhook({
            type: 'contest_entry',
            entry_id: insertedEntry.id, 
            contest_id: contestId,
            influencer_id: user.id,
            email: user.email,
            video_url: videoUrl
        });
        
        return; 
    }

    // --- 2. DEMO USER LOGIC ---
    const existingMock = MOCK_ENTRIES.find(e => e.contest_id === contestId && e.influencer_id === user.id);
    if (existingMock) {
        throw new Error("You have already joined this contest.");
    }

    if (!videoUrl.toLowerCase().includes('tiktok.com') && !videoFileUrl) {
      throw new Error("Invalid URL. Please provide a valid TikTok video link.");
    }
    await new Promise(resolve => setTimeout(resolve, 1500));

    let userInfluencer = MOCK_INFLUENCERS.find(i => i.id === user.id);
    if (!userInfluencer) {
        userInfluencer = {
            id: user.id,
            name: user.email.split('@')[0].toUpperCase(),
            handle_tiktok: '@' + user.email.split('@')[0],
            country: 'Unknown',
            niches: ['Creator'],
            tiktok_followers: 0, instagram_followers: 0, total_followers: 0,
            last_updated: new Date().toISOString(),
            avatar_url: `https://ui-avatars.com/api/?name=${user.email}&background=random`,
            is_verified: false,
            campaign_streak: 1
        };
        MOCK_INFLUENCERS.push(userInfluencer);
    } else {
        userInfluencer.campaign_streak = (userInfluencer.campaign_streak || 0) + 1;
        if (userInfluencer.campaign_streak >= 3) userInfluencer.is_verified = true;
    }

    const newEntry: ContestEntry = {
        id: 'e-' + Math.random().toString(36).substr(2, 9),
        contest_id: contestId,
        influencer_id: userInfluencer.id,
        video_url: videoUrl,
        video_file_url: videoFileUrl,
        views: 0, likes: 0, comments: 0, shares: 0, score: 0,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        influencer: userInfluencer 
    };

    MOCK_ENTRIES.push(newEntry);

    triggerScrapingWebhook({
        type: 'contest_entry',
        contest_id: contestId,
        entry_id: newEntry.id,
        influencer_id: user.id,
        influencer_name: userInfluencer.name,
        influencer_handle: userInfluencer.handle_tiktok,
        email: user.email,
        video_url: videoUrl
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  createContest: async (contestData: any, user: UserSession): Promise<void> => {
     if (user.id.startsWith('demo-')) {
         await new Promise(resolve => setTimeout(resolve, 800));
         MOCK_CONTESTS.unshift({
             id: 'demo-c-' + Date.now(),
             ...contestData,
             start_date: new Date().toISOString(),
             status: 'active'
         });
         return;
     }
     const { error } = await supabase.from('contests').insert({
        ...contestData,
        start_date: new Date().toISOString(),
        status: 'active'
     });
     if (error) throw error;
  },

  createInfluencer: async (influencerData: any, user: UserSession): Promise<void> => {
     if (user.id.startsWith('demo-')) {
         await new Promise(resolve => setTimeout(resolve, 800));
         MOCK_INFLUENCERS.unshift({
             id: 'demo-i-' + Date.now(),
             ...influencerData,
             tiktok_followers: 0, instagram_followers: 0, total_followers: 0,
             last_updated: new Date().toISOString(),
             niches: ['New'],
             is_verified: false, campaign_streak: 0
         });
         triggerScrapingWebhook({ id: 'demo-i-' + Date.now(), ...influencerData });
         return;
     }
     const { data, error } = await supabase.from('influencers').insert({
         ...influencerData,
         niches: ['New'],
         is_verified: false,
         campaign_streak: 0
     }).select().single();
     
     if (error) throw error;
     if (data) triggerScrapingWebhook(data);
  }
};