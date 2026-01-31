import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Heart, MessageSquare, Share2, Music2, Plus, Volume2, VolumeX, User, Loader2, Play, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../lib/supabase';
import { ContestEntry } from '../types';
import { formatNumber } from '../lib/utils';

interface VideoItemProps {
    entry: ContestEntry;
    isActive: boolean;
    shouldPreload: boolean;
    toggleMute: () => void;
    isMuted: boolean;
}

const VideoItem = ({ entry, isActive, shouldPreload, toggleMute, isMuted }: VideoItemProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [liked, setLiked] = useState(false);
    const [followed, setFollowed] = useState(false);
    const [likesCount, setLikesCount] = useState(entry.likes || 0);
    
    // Playback States
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    
    const navigate = useNavigate();

    // --- SOURCE PRIORITY LOGIC ---
    // 1. Direct File (Best Experience - Luxury)
    // 2. Fallback to TikTok Embed (Compatible but ugly)
    const { type, src, tiktokId } = useMemo(() => {
        // A. Check for High Quality Direct Upload
        if (entry.video_file_url) {
            return { type: 'DIRECT', src: entry.video_file_url, tiktokId: null };
        }

        // B. Check if video_url is actually a direct file (legacy)
        if (entry.video_url?.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
             return { type: 'DIRECT', src: entry.video_url, tiktokId: null };
        }

        // C. Check for TikTok Link
        const tiktokMatch = entry.video_url?.match(/\/video\/(\d+)/);
        if (tiktokMatch && tiktokMatch[1]) {
            return { type: 'TIKTOK', src: entry.video_url, tiktokId: tiktokMatch[1] };
        }

        // D. Fallback (Stock)
        return { type: 'STOCK', src: "https://videos.pexels.com/video-files/853800/853800-hd_1920_1080_25fps.mp4", tiktokId: null };
    }, [entry.video_url, entry.video_file_url, entry.id]);

    // Handle Active State for Direct Videos
    useEffect(() => {
        const video = videoRef.current;
        if (!video || type === 'TIKTOK') return;

        if (isActive) {
            if (hasError) {
                video.load(); 
                setHasError(false);
            }
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => { setIsPlaying(true); setHasError(false); })
                    .catch(() => setIsPlaying(false));
            }
        } else {
            video.pause();
            setIsPlaying(false);
        }
    }, [isActive, hasError, type]);

    const handlePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().then(() => setIsPlaying(true)).catch(e => {
                if (video.error) setHasError(true);
            });
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
    };

    const handleFollow = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFollowed(!followed);
    };

    const goToProfile = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/influencers/${entry.influencer_id}`);
    };

    return (
        <div 
            className="relative w-full h-full bg-black snap-start shrink-0 flex items-center justify-center overflow-hidden"
            onClick={type !== 'TIKTOK' ? handlePlayPause : undefined}
        >
            {/* --- TIKTOK EMBED RENDERER (FALLBACK) --- */}
            {type === 'TIKTOK' && tiktokId && (
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-black overflow-hidden">
                     {/* Standard embed for fallback */}
                     <div className="w-full h-full flex items-center justify-center pointer-events-auto">
                        <iframe 
                            src={`https://www.tiktok.com/embed/v2/${tiktokId}?lang=en-US`}
                            className="w-full h-full"
                            style={{ border: 'none' }}
                            title={`TikTok ${tiktokId}`}
                            onLoad={() => setIsLoading(false)}
                            allow="encrypted-media;"
                        />
                     </div>
                </div>
            )}

            {/* --- DIRECT VIDEO RENDERER (LUXURY) --- */}
            {(type === 'DIRECT' || type === 'STOCK') && (
                <>
                    {isLoading && !hasError && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/50 pointer-events-none">
                            <Loader2 size={40} className="text-white/50 animate-spin" />
                        </div>
                    )}

                    {hasError && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 gap-2">
                            <AlertCircle size={40} />
                            <p className="text-sm">Video Stream Interrupted</p>
                        </div>
                    )}

                    {!isPlaying && !isLoading && !hasError && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                            <div className="bg-white/20 p-6 rounded-full backdrop-blur-md hover:scale-110 transition-transform cursor-pointer animate-in fade-in zoom-in duration-200">
                                <Play size={40} fill="white" className="text-white ml-1" />
                            </div>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        src={src}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        loop
                        muted={isMuted}
                        playsInline
                        preload={isActive || shouldPreload ? "auto" : "none"}
                        onLoadedData={() => { setIsLoading(false); setHasError(false); }}
                        onWaiting={() => setIsLoading(true)}
                        onPlaying={() => { setIsPlaying(true); setIsLoading(false); setHasError(false); }}
                        onPause={() => setIsPlaying(false)}
                        onError={() => { setHasError(true); setIsLoading(false); }}
                    />
                </>
            )}

            {/* --- LUXURY UI OVERLAY --- */}
            
            {/* Gradient Overlay - Crucial for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

            {/* Right Action Sidebar (z-30) */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-30 pointer-events-auto" onClick={e => e.stopPropagation()}>
                <div className="relative cursor-pointer group" onClick={goToProfile}>
                    <div className="w-12 h-12 rounded-full border-2 border-white p-0.5 overflow-hidden transition-transform group-hover:scale-110 shadow-lg">
                        <img 
                            src={entry.influencer?.avatar_url || `https://ui-avatars.com/api/?name=${entry.influencer?.name}`} 
                            className="w-full h-full rounded-full object-cover" 
                            alt="Profile" 
                        />
                    </div>
                    {!followed && (
                        <button onClick={handleFollow} className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-500 rounded-full p-0.5 text-white hover:scale-125 transition-transform shadow-lg border border-black">
                            <Plus size={12} strokeWidth={4} />
                        </button>
                    )}
                </div>

                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleLike}>
                    <div className={`p-2 rounded-full transition-all duration-300 backdrop-blur-sm ${liked ? 'text-red-500 scale-110 bg-white/10' : 'text-white bg-black/20 hover:bg-black/40'}`}>
                        <Heart size={30} fill={liked ? "currentColor" : "rgba(0,0,0,0.1)"} strokeWidth={liked ? 0 : 2} className="drop-shadow-lg" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-md">{formatNumber(likesCount)}</span>
                </div>

                <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="p-2 rounded-full text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all">
                        <MessageSquare size={30} className="drop-shadow-lg" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-md">{formatNumber(entry.comments)}</span>
                </div>

                <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="p-2 rounded-full text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all">
                        <Share2 size={30} className="drop-shadow-lg" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-md">{formatNumber(entry.shares)}</span>
                </div>

                <div className="mt-4 animate-[spin_6s_linear_infinite]">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border-[6px] border-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
                        <div className="w-6 h-6 rounded-full bg-cover" style={{ backgroundImage: `url(${entry.influencer?.avatar_url})` }}></div>
                    </div>
                </div>
            </div>

            {/* Bottom Info Area (z-30) */}
            <div className="absolute left-4 bottom-8 right-16 z-30 text-white space-y-3 pointer-events-none">
                <div onClick={goToProfile} className="pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity w-fit">
                    <h3 className="font-bold text-lg drop-shadow-lg flex items-center gap-2">
                        {entry.influencer?.handle_tiktok || entry.influencer?.name || '@creator'}
                        {entry.influencer?.is_verified && (
                             <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm">✓</span>
                        )}
                    </h3>
                </div>
                
                <p className="text-sm text-zinc-100 line-clamp-2 drop-shadow-md pr-4 leading-relaxed font-light">
                    <span className="font-medium text-white">Joining the #Challenge!</span> Check this out 🔥 #{entry.influencer?.niches?.[0] || 'viral'} #fyp
                </p>

                <div className="flex items-center gap-2 text-sm font-medium opacity-90">
                    <Music2 size={14} className="animate-pulse" />
                    <div className="w-40 overflow-hidden relative h-5">
                        <div className="whitespace-nowrap absolute animate-marquee">
                             Original Sound - {entry.influencer?.name} • Trending Viral Hits 2024 •
                        </div>
                    </div>
                </div>
            </div>

            {/* Mute Indicator */}
            {type !== 'TIKTOK' && isMuted && isActive && isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 animate-[ping_1s_ease-out_reverse] z-30">
                   <div className="bg-black/60 backdrop-blur-sm p-4 rounded-full border border-white/10">
                       <VolumeX size={32} className="text-white" />
                   </div>
                </div>
            )}
        </div>
    );
};

export const Feed = () => {
    const [entries, setEntries] = useState<ContestEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeindex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadFeed = async () => {
            setLoading(true);
            try {
                const contests = await mockService.getContests();
                let allEntries: ContestEntry[] = [];
                for (const contest of contests.slice(0, 4)) {
                    const cEntries = await mockService.getContestEntries(contest.id);
                    allEntries = [...allEntries, ...cEntries];
                }
                if (allEntries.length > 0) {
                    setEntries(allEntries.sort(() => 0.5 - Math.random()));
                } else {
                    setEntries([]); 
                }
            } catch (e) {
                console.error("Feed load failed", e);
            } finally {
                setLoading(false);
            }
        };
        loadFeed();
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleScroll = () => {
            const index = Math.round(container.scrollTop / container.clientHeight);
            if (index !== activeindex) setActiveIndex(index);
        };
        let timeoutId: any = null;
        const debouncedScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleScroll, 50);
        };
        container.addEventListener('scroll', debouncedScroll);
        return () => container.removeEventListener('scroll', debouncedScroll);
    }, [activeindex]);

    const toggleMute = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsMuted(!isMuted);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-zinc-500 gap-4">
                <Loader2 size={40} className="animate-spin text-purple-500" />
                <p className="text-sm font-medium animate-pulse">Curating your feed...</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-black relative flex justify-center overflow-hidden">
            <div 
                ref={containerRef}
                className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black"
                style={{ scrollBehavior: 'smooth' }}
            >
                {entries.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                            <User size={32} className="opacity-50" />
                        </div>
                        <p>No videos available yet. Be the first!</p>
                    </div>
                ) : (
                    entries.map((entry, index) => (
                        <VideoItem 
                            key={`${entry.id}-${index}`} 
                            entry={entry} 
                            isActive={index === activeindex}
                            shouldPreload={index === activeindex + 1}
                            isMuted={isMuted}
                            toggleMute={toggleMute}
                        />
                    ))
                )}
            </div>

            {/* Mute Button - Only prioritize showing if playing native video, embeds handle their own sound mostly */}
            <button 
                onClick={toggleMute}
                className="absolute top-6 right-6 z-40 bg-black/40 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-black/60 transition-colors border border-white/10 shadow-lg"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
    );
};