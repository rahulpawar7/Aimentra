'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, Pause } from 'lucide-react';

type SecureVideoPlayerProps = {
  manifestUrl?: string;
  progressiveUrl?: string;
  watermarkText: string;
  poster?: string;
  initialTime?: number;
  onProgress?: (payload: { currentTime: number; duration: number; percentage: number }) => void;
  onEnded?: () => void;
};

function detectDevtools(): boolean {
  const threshold = 160;
  const widthDiff = Math.abs(window.outerWidth - window.innerWidth) > threshold;
  const heightDiff = Math.abs(window.outerHeight - window.innerHeight) > threshold;
  return widthDiff || heightDiff;
}

export default function SecureVideoPlayer({
  manifestUrl,
  progressiveUrl,
  watermarkText,
  poster,
  initialTime = 0,
  onProgress,
  onEnded,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [wmOffset, setWmOffset] = useState({ x: 8, y: 12 });

  const pauseForSecurity = useCallback(() => {
    const v = videoRef.current;
    if (v && !v.paused) v.pause();
    setBlocked(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J')) ||
        e.key === 'F12' ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        pauseForSecurity();
      }
    };
    const onContext = (e: Event) => e.preventDefault();
    window.addEventListener('keydown', onKey);
    document.addEventListener('contextmenu', onContext);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('contextmenu', onContext);
    };
  }, [pauseForSecurity]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (detectDevtools()) pauseForSecurity();
    }, 1200);
    return () => clearInterval(id);
  }, [pauseForSecurity]);

  // Moving watermark
  useEffect(() => {
    const id = window.setInterval(() => {
      setWmOffset({
        x: 5 + Math.random() * 70,
        y: 5 + Math.random() * 70,
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (manifestUrl && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: (xhr) => {
          xhr.withCredentials = true;
        },
      });
      hlsRef.current = hls;
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialTime > 0) video.currentTime = initialTime;
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal && progressiveUrl) {
          hls.destroy();
          video.src = progressiveUrl;
        }
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (manifestUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifestUrl;
    } else if (progressiveUrl) {
      video.src = progressiveUrl;
    }

    if (initialTime > 0) {
      const setTime = () => {
        video.currentTime = initialTime;
        video.removeEventListener('loadedmetadata', setTime);
      };
      video.addEventListener('loadedmetadata', setTime);
    }
  }, [manifestUrl, progressiveUrl, initialTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      if (!video.duration) return;
      onProgress?.({
        currentTime: video.currentTime,
        duration: video.duration,
        percentage: Math.round((video.currentTime / video.duration) * 100),
      });
    };
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('ended', () => onEnded?.());
    return () => {
      video.removeEventListener('timeupdate', onTime);
    };
  }, [onProgress, onEnded]);

  return (
    <div
      className="relative w-full aspect-video bg-black overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        playsInline
        poster={poster}
        onPause={() => undefined}
      />

      {/* Dynamic watermark overlay */}
      <div
        className="pointer-events-none absolute text-white/35 text-xs md:text-sm font-medium tracking-wide whitespace-nowrap"
        style={{ left: `${wmOffset.x}%`, top: `${wmOffset.y}%`, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {watermarkText}
      </div>

      {blocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-center px-6">
          <AlertTriangle className="w-10 h-10 text-amber-600 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">Playback paused</h3>
          <p className="text-sm text-white/70 max-w-sm mb-4">
            Developer tools or restricted shortcuts were detected. Close them and resume to continue learning.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium"
            onClick={() => {
              if (!detectDevtools()) {
                setBlocked(false);
                videoRef.current?.play().catch(() => undefined);
              }
            }}
          >
            <Pause className="w-4 h-4" /> Resume
          </button>
        </div>
      )}
    </div>
  );
}
