import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Badge from '../../components/ui/common/Badge';
import Alert from '../../components/ui/common/Alert';
import { useDashcamStream } from '../../hooks/useDashcamStream';
import DashcamVideoPlayer from '../../components/video/DashcamVideoPlayer';

type CameraChannel = 1 | 2;
type ViewMode = 'single' | 'dual' | 'pip';

const DashcamLiveStreamPage: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  
  const [activeChannel, setActiveChannel] = useState<CameraChannel>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [streamQuality, setStreamQuality] = useState<0 | 1>(0); // 0=HD, 1=SD
  
  // Stream hooks for both cameras
  const frontStream = useDashcamStream();
  const rearStream = useDashcamStream();
  
  const containerRef = useRef<HTMLDivElement>(null);
  // Track if initial mount has completed to prevent duplicate startStream calls
  // hasInitializedRef: set to true after first effect runs
  // isFirstRenderCycleRef: stays true until after all effects in the first render complete
  const hasInitializedRef = useRef(false);
  const isFirstRenderCycleRef = useRef(true);
  
  // Start stream when component mounts
  useEffect(() => {
    if (!imei) return;
    
    // Mark as initialized immediately (before starting streams)
    hasInitializedRef.current = true;
    
    // Start the active camera stream
    if (viewMode === 'dual' || viewMode === 'pip') {
      // Start both streams
      frontStream.startStream({ phone: imei, channel: 1, streamType: streamQuality });
      rearStream.startStream({ phone: imei, channel: 2, streamType: streamQuality });
    } else {
      // Single mode - start only active channel
      const currentStream = activeChannel === 1 ? frontStream : rearStream;
      currentStream.startStream({ phone: imei, channel: activeChannel, streamType: streamQuality });
    }
    
    // After all effects in this render cycle complete, clear the first render flag
    // This ensures the second useEffect doesn't run during initial mount
    const timeoutId = setTimeout(() => {
      isFirstRenderCycleRef.current = false;
    }, 0);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId);
      frontStream.stopStream();
      rearStream.stopStream();
      hasInitializedRef.current = false;
      isFirstRenderCycleRef.current = true;
    };
  }, [imei]); // Only run on mount/unmount
  
  // Handle view mode changes - ONLY after initial mount is fully complete
  useEffect(() => {
    // Skip during initial mount cycle - the first useEffect handles that
    // Both conditions must pass: initialized AND not in first render cycle
    if (!hasInitializedRef.current || isFirstRenderCycleRef.current || !imei) return;
    
    if (viewMode === 'dual' || viewMode === 'pip') {
      // Ensure both streams are running
      if (!frontStream.state.isStreaming) {
        frontStream.startStream({ phone: imei, channel: 1, streamType: streamQuality });
      }
      if (!rearStream.state.isStreaming) {
        rearStream.startStream({ phone: imei, channel: 2, streamType: streamQuality });
      }
    } else {
      // Single mode - stop the inactive stream
      const activeStream = activeChannel === 1 ? frontStream : rearStream;
      const inactiveStream = activeChannel === 1 ? rearStream : frontStream;
      
      inactiveStream.stopStream();
      
      if (!activeStream.state.isStreaming) {
        activeStream.startStream({ phone: imei, channel: activeChannel, streamType: streamQuality });
      }
    }
  }, [viewMode, activeChannel, streamQuality]);
  
  const handleChannelSwitch = (channel: CameraChannel) => {
    if (viewMode === 'single') {
      const currentStream = activeChannel === 1 ? frontStream : rearStream;
      const newStream = channel === 1 ? frontStream : rearStream;
      
      currentStream.stopStream();
      setActiveChannel(channel);
      
      if (imei) {
        newStream.startStream({ phone: imei, channel, streamType: streamQuality });
      }
    } else {
      setActiveChannel(channel);
    }
  };
  
  const handleQualityChange = (quality: 0 | 1) => {
    setStreamQuality(quality);
    
    if (!imei) return;
    
    // Restart streams with new quality
    if (viewMode === 'dual' || viewMode === 'pip') {
      frontStream.stopStream();
      rearStream.stopStream();
      
      setTimeout(() => {
        frontStream.startStream({ phone: imei, channel: 1, streamType: quality });
        rearStream.startStream({ phone: imei, channel: 2, streamType: quality });
      }, 500);
    } else {
      const currentStream = activeChannel === 1 ? frontStream : rearStream;
      currentStream.stopStream();
      
      setTimeout(() => {
        currentStream.startStream({ phone: imei, channel: activeChannel, streamType: quality });
      }, 500);
    }
  };
  
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };
  
  const handlePiP = async (videoRef: React.RefObject<HTMLVideoElement>) => {
    try {
      if (videoRef.current) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };
  
  const currentStream = activeChannel === 1 ? frontStream : rearStream;
  const isLoading = currentStream.state.isConnected && !currentStream.state.isStreaming;
  const error = frontStream.state.error || rearStream.state.error;
  
  return (
    <Container>
      <div className="space-y-4" ref={containerRef}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Stream</h1>
              <p className="text-gray-600 font-mono text-sm">{imei}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Connection Status */}
            <Badge variant={currentStream.state.isConnected ? 'success' : 'secondary'}>
              {currentStream.state.isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            
            {currentStream.state.codec && (
              <Badge variant="info" size="sm">
                {currentStream.state.codec}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible>
            {error}
          </Alert>
        )}
        
        {/* Controls */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center gap-4">
              {/* Camera Selection */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Camera:</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={activeChannel === 1 ? 'primary' : 'secondary'}
                    onClick={() => handleChannelSwitch(1)}
                  >
                    Front
                  </Button>
                  <Button
                    size="sm"
                    variant={activeChannel === 2 ? 'primary' : 'secondary'}
                    onClick={() => handleChannelSwitch(2)}
                  >
                    Rear
                  </Button>
                </div>
              </div>
              
              {/* View Mode */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">View:</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={viewMode === 'single' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('single')}
                    title="Single Camera"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                    </svg>
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'dual' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('dual')}
                    title="Dual Camera"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="8" height="18" rx="1" strokeWidth="2" />
                      <rect x="13" y="3" width="8" height="18" rx="1" strokeWidth="2" />
                    </svg>
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'pip' ? 'primary' : 'secondary'}
                    onClick={() => setViewMode('pip')}
                    title="Picture-in-Picture"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="14" rx="2" strokeWidth="2" />
                      <rect x="12" y="9" width="7" height="5" rx="1" strokeWidth="2" fill="currentColor" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              {/* Quality Selection */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Quality:</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={streamQuality === 0 ? 'primary' : 'secondary'}
                    onClick={() => handleQualityChange(0)}
                  >
                    HD
                  </Button>
                  <Button
                    size="sm"
                    variant={streamQuality === 1 ? 'primary' : 'secondary'}
                    onClick={() => handleQualityChange(1)}
                  >
                    SD
                  </Button>
                </div>
              </div>
              
              {/* Fullscreen */}
              <Button
                size="sm"
                variant="secondary"
                onClick={handleFullscreen}
                title="Fullscreen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </Button>
              
              {/* Reconnect */}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (viewMode === 'dual' || viewMode === 'pip') {
                    frontStream.reconnect();
                    rearStream.reconnect();
                  } else {
                    currentStream.reconnect();
                  }
                }}
                title="Reconnect"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            </div>
          </CardBody>
        </Card>
        
        {/* Video Players */}
        <Card>
          <CardBody className="p-2 md:p-4">
            {viewMode === 'single' && (
              <div className="aspect-video">
                <DashcamVideoPlayer
                  ref={activeChannel === 1 ? frontStream.videoRef : rearStream.videoRef}
                  isLoading={isLoading}
                  error={currentStream.state.error}
                  label={activeChannel === 1 ? 'Front Camera' : 'Rear Camera'}
                  onFullscreen={handleFullscreen}
                  onPiP={() => handlePiP(activeChannel === 1 ? frontStream.videoRef : rearStream.videoRef)}
                  className="w-full h-full"
                />
              </div>
            )}
            
            {viewMode === 'dual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                <div className="aspect-video">
                  <DashcamVideoPlayer
                    ref={frontStream.videoRef}
                    isLoading={frontStream.state.isConnected && !frontStream.state.isStreaming}
                    error={frontStream.state.error}
                    label="Front Camera"
                    onFullscreen={handleFullscreen}
                    onPiP={() => handlePiP(frontStream.videoRef)}
                    className={`w-full h-full ${activeChannel === 1 ? 'ring-2 ring-primary-500' : ''}`}
                  />
                </div>
                <div className="aspect-video">
                  <DashcamVideoPlayer
                    ref={rearStream.videoRef}
                    isLoading={rearStream.state.isConnected && !rearStream.state.isStreaming}
                    error={rearStream.state.error}
                    label="Rear Camera"
                    onFullscreen={handleFullscreen}
                    onPiP={() => handlePiP(rearStream.videoRef)}
                    className={`w-full h-full ${activeChannel === 2 ? 'ring-2 ring-primary-500' : ''}`}
                  />
                </div>
              </div>
            )}
            
            {viewMode === 'pip' && (
              <div className="relative aspect-video">
                {/* Main video */}
                <DashcamVideoPlayer
                  ref={activeChannel === 1 ? frontStream.videoRef : rearStream.videoRef}
                  isLoading={currentStream.state.isConnected && !currentStream.state.isStreaming}
                  error={currentStream.state.error}
                  label={activeChannel === 1 ? 'Front Camera' : 'Rear Camera'}
                  onFullscreen={handleFullscreen}
                  onPiP={() => handlePiP(activeChannel === 1 ? frontStream.videoRef : rearStream.videoRef)}
                  className="w-full h-full"
                />
                
                {/* PiP video */}
                <div 
                  className="absolute bottom-4 right-4 w-1/4 aspect-video shadow-lg rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                  onClick={() => setActiveChannel(activeChannel === 1 ? 2 : 1)}
                  title="Click to swap"
                >
                  <DashcamVideoPlayer
                    ref={activeChannel === 1 ? rearStream.videoRef : frontStream.videoRef}
                    label={activeChannel === 1 ? 'Rear' : 'Front'}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </CardBody>
        </Card>
        
        {/* Device Info */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Stream Information</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-500">IMEI</span>
                <p className="font-mono text-sm">{imei}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Quality</span>
                <p className="text-sm">{streamQuality === 0 ? 'HD (Main)' : 'SD (Sub)'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Front Camera</span>
                <Badge 
                  variant={frontStream.state.isStreaming ? 'success' : 'secondary'}
                  size="sm"
                >
                  {frontStream.state.isStreaming ? 'Streaming' : 'Idle'}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Rear Camera</span>
                <Badge 
                  variant={rearStream.state.isStreaming ? 'success' : 'secondary'}
                  size="sm"
                >
                  {rearStream.state.isStreaming ? 'Streaming' : 'Idle'}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default DashcamLiveStreamPage;
