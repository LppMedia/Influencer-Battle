import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { BadgeCheck, Share2, User } from 'lucide-react';
import './ProfileCard.css';

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180
};

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) => 
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

interface ProfileCardProps {
  avatarUrl?: string;
  name?: string;
  handle?: string; // TikTok Handle
  followersCount?: string; // Pre-formatted
  isVerified?: boolean;
  campaignStreak?: number; // Used for hover tooltip on verification
  onActionClick?: () => void;
  className?: string;
  enableTilt?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  avatarUrl = 'https://picsum.photos/400/500',
  name = 'Influencer Name',
  handle = '@username',
  followersCount = '0',
  isVerified = false,
  campaignStreak = 0,
  onActionClick,
  className = '',
  enableTilt = true,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const enterTimerRef = useRef<number | null>(null);
  const leaveRafRef = useRef<number | null>(null);

  // --- TILT LOGIC ---
  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;
    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
    const DEFAULT_TAU = 0.12; 

    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties: Record<string, string> = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--rotate-x': `${round(-(centerX / 15))}deg`, 
        '--rotate-y': `${round(centerY / 15)}deg`
      };

      for (const [k, v] of Object.entries(properties)) {
        wrap.style.setProperty(k, v);
      }
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const k = 1 - Math.exp(-dt / DEFAULT_TAU);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillFar) rafId = requestAnimationFrame(step);
      else { running = false; lastTs = 0; if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setTarget(x: number, y: number) { targetX = x; targetY = y; start(); },
      toCenter() { 
          if(shellRef.current) this.setTarget(shellRef.current.clientWidth / 2, shellRef.current.clientHeight / 2); 
      },
      getCurrent() { return { x: currentX, y: currentY, tx: targetX, ty: targetY }; },
      cancel() { if (rafId) cancelAnimationFrame(rafId); running = false; }
    };
  }, [enableTilt]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!shellRef.current || !tiltEngine) return;
    const rect = shellRef.current.getBoundingClientRect();
    tiltEngine.setTarget(e.clientX - rect.left, e.clientY - rect.top);
  }, [tiltEngine]);

  const handlePointerEnter = useCallback((e: React.PointerEvent) => {
    if (!shellRef.current || !tiltEngine) return;
    shellRef.current.classList.add('active');
    const rect = shellRef.current.getBoundingClientRect();
    tiltEngine.setTarget(e.clientX - rect.left, e.clientY - rect.top);
  }, [tiltEngine]);

  const handlePointerLeave = useCallback(() => {
    if (!shellRef.current || !tiltEngine) return;
    tiltEngine.toCenter();
    const checkSettle = () => {
        const { x, y, tx, ty } = tiltEngine.getCurrent();
        if (Math.hypot(tx - x, ty - y) < 0.6) {
            shellRef.current?.classList.remove('active');
            leaveRafRef.current = null;
        } else {
            leaveRafRef.current = requestAnimationFrame(checkSettle);
        }
    };
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine]);

  useEffect(() => {
      if(tiltEngine) tiltEngine.toCenter();
  }, [tiltEngine]);

  // Clean TikTok handle for display: remove @ and url
  const displayHandle = handle?.replace('https://www.tiktok.com/', '').replace(/\/$/, '').replace('@', '') || name;

  return (
    <div 
      ref={wrapRef} 
      className={`pc-card-wrapper ${className}`.trim()}
      onClick={onActionClick}
      style={{ cursor: onActionClick ? 'pointer' : 'default' }}
    >
      <div 
        ref={shellRef} 
        className="pc-card-shell"
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div className="pc-card">
          <div className="pc-shine" />
          <div className="pc-glare" />

          {/* 1. Large Top Photo (Inset) */}
          <div className="pc-photo-container">
            <img 
              src={avatarUrl} 
              alt={name} 
              className="pc-photo"
              loading="lazy"
            />
          </div>

          {/* 2. Info Block */}
          <div className="pc-info-container">
            
            {/* Identity Row (Handle + Badge) - Centered & Large */}
            <div className="pc-name-row">
              <span className="pc-name">{displayHandle}</span>
              {isVerified && (
                <BadgeCheck 
                   size={22} 
                   className="text-blue-500 fill-blue-500/10" 
                   aria-label="Verified Influencer"
                />
              )}
            </div>

            {/* Subtext: Verification Requirement or Title */}
            <div className="pc-role-container">
              {!isVerified ? (
                  <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-md border border-zinc-700/50">
                     {Math.max(0, 3 - campaignStreak)} more campaigns to verify
                  </span>
              ) : (
                  <span className="text-xs text-purple-400 font-medium tracking-wide uppercase">
                      Official Creator
                  </span>
              )}
            </div>

            {/* Stats + Button */}
            <div className="pc-stats-row">
              <div className="pc-stats-group">
                <div className="pc-stat-item" title="TikTok Followers">
                   <User size={16} /> 
                   {followersCount}
                </div>
              </div>

              <button 
                className="pc-action-btn"
                onClick={(e) => { e.stopPropagation(); onActionClick?.(); }}
              >
                View <span className="text-lg leading-none mb-0.5">+</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProfileCard);