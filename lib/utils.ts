import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '—'; // Return dash for null/undefined
  const n = Number(num);
  if (isNaN(n)) return '0';

  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M';
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K';
  }
  return n.toLocaleString(); // Adds commas for thousands
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'TBD';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

export function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return '—';
  
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Cleans social media URLs by removing query parameters (tracking codes).
 * e.g. https://www.tiktok.com/@user?lang=en -> https://www.tiktok.com/@user
 */
export function cleanSocialUrl(url: string): string {
  if (!url) return '';
  try {
    // 1. If it's just a handle (@user), assume TikTok and format it
    if (url.startsWith('@')) {
        return `https://www.tiktok.com/${url}`;
    }

    // 2. Parse URL to strip query params
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // 3. Clear all search parameters (tracking, lang, etc.)
    urlObj.search = '';
    
    // 4. Remove trailing slash
    let clean = urlObj.toString();
    if (clean.endsWith('/')) {
        clean = clean.slice(0, -1);
    }
    
    return clean;
  } catch (e) {
    // If invalid URL, return original trimmed
    return url.trim();
  }
}

/**
 * Compresses an image file using browser Canvas API.
 * Resizes to max 800px width/height and converts to JPEG at 0.7 quality.
 */
export async function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            reject(new Error('Browser does not support image compression'));
            return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Recreate file object with compressed blob
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = (err) => reject(new Error('Failed to read file'));
  });
}