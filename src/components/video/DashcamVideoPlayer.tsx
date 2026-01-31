import { useEffect, forwardRef } from 'react';
import Spinner from '../ui/common/Spinner';

interface DashcamVideoPlayerProps {
  isLoading?: boolean;
  error?: string | null;
  onFullscreen?: () => void;
  onPiP?: () => void;
  label?: string;
  className?: string;
}

const DashcamVideoPlayer = forwardRef<HTMLVideoElement, DashcamVideoPlayerProps>(
  ({ isLoading, error, onFullscreen, onPiP, label, className = '' }, ref) => {
    // Handle autoplay when stream starts
    useEffect(() => {
      const video = ref && 'current' in ref ? ref.current : null;
      if (video) {
        video.play().catch((e) => {
          console.log('[DashcamVideoPlayer] Autoplay failed:', e);
        });
      }
    }, [ref]);

    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        {/* Video Element */}
        <video
          ref={ref}
          className="w-full h-full object-contain"
          autoPlay
          muted
          playsInline
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Spinner size="lg" />
              <p className="mt-2">Connecting to stream...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75">
            <div className="text-center text-white p-4">
              <svg className="w-12 h-12 mx-auto text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Label */}
        {label && (
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {label}
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          {onPiP && (
            <button
              onClick={onPiP}
              className="bg-black/50 hover:bg-black/75 text-white p-2 rounded transition-colors"
              title="Picture-in-Picture"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
                <rect x="12" y="9" width="8" height="6" rx="1" strokeWidth="2" fill="currentColor" />
              </svg>
            </button>
          )}
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="bg-black/50 hover:bg-black/75 text-white p-2 rounded transition-colors"
              title="Fullscreen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

DashcamVideoPlayer.displayName = 'DashcamVideoPlayer';

export default DashcamVideoPlayer;
