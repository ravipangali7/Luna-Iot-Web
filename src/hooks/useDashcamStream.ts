import { useState, useEffect, useRef, useCallback } from 'react';
import { DASHCAM_CONFIG } from '../config/config';

interface StreamConfig {
  phone: string;
  channel: 1 | 2;  // 1=Front, 2=Rear
  streamType?: 0 | 1;  // 0=Main (HD), 1=Sub (SD)
}

interface StreamState {
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  codec: string | null;
}

interface UseDashcamStreamReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  state: StreamState;
  startStream: (config: StreamConfig) => void;
  stopStream: () => void;
  reconnect: () => void;
}

const WS_BASE_URL = DASHCAM_CONFIG.WS_URL;

export function useDashcamStream(): UseDashcamStreamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<ArrayBuffer[]>([]);
  const currentConfigRef = useRef<StreamConfig | null>(null);
  
  // New refs for initialization lock and codec tracking
  const isInitializingRef = useRef(false);
  const currentCodecRef = useRef<string | null>(null);
  const pendingInitDataRef = useRef<ArrayBuffer | null>(null);
  
  const [state, setState] = useState<StreamState>({
    isConnected: false,
    isStreaming: false,
    error: null,
    codec: null,
  });

  const processQueue = useCallback(() => {
    const sourceBuffer = sourceBufferRef.current;
    if (!sourceBuffer || sourceBuffer.updating || queueRef.current.length === 0) {
      return;
    }

    try {
      const data = queueRef.current.shift();
      if (data) {
        sourceBuffer.appendBuffer(data);
      }
    } catch (error) {
      console.error('[useDashcamStream] Error appending buffer:', error);
      // Try to recover by clearing queue and removing old data
      if (sourceBuffer && !sourceBuffer.updating) {
        try {
          const video = videoRef.current;
          if (video && video.buffered.length > 0) {
            const start = video.buffered.start(0);
            const end = video.buffered.end(0) - 5; // Keep last 5 seconds
            if (end > start) {
              sourceBuffer.remove(start, end);
            }
          }
        } catch (e) {
          console.error('[useDashcamStream] Error removing buffer:', e);
        }
      }
    }
  }, []);

  // Clean up MediaSource and related resources
  const cleanupMediaSource = useCallback(() => {
    // Remove updateend listener from source buffer
    if (sourceBufferRef.current) {
      try {
        sourceBufferRef.current.removeEventListener('updateend', processQueue);
      } catch (e) {
        // Ignore
      }
      sourceBufferRef.current = null;
    }
    
    // End and cleanup MediaSource
    if (mediaSourceRef.current) {
      try {
        if (mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
      } catch (e) {
        console.warn('[useDashcamStream] Error ending previous stream:', e);
      }
      mediaSourceRef.current = null;
    }
    
    // Revoke object URL if video has one
    if (videoRef.current && videoRef.current.src) {
      try {
        URL.revokeObjectURL(videoRef.current.src);
      } catch (e) {
        // Ignore
      }
      videoRef.current.src = '';
    }
  }, [processQueue]);

  const initMediaSource = useCallback((codec: string, initData: ArrayBuffer) => {
    const video = videoRef.current;
    if (!video) {
      console.error('[useDashcamStream] Video element not found');
      return;
    }

    // Guard against duplicate initialization
    if (isInitializingRef.current) {
      console.log('[useDashcamStream] Already initializing, storing data for later');
      pendingInitDataRef.current = initData;
      return;
    }

    // Skip if same codec and SourceBuffer exists and MediaSource is open
    if (currentCodecRef.current === codec && 
        sourceBufferRef.current && 
        mediaSourceRef.current?.readyState === 'open') {
      console.log('[useDashcamStream] Same codec, reusing existing MediaSource');
      // Just queue the init data
      queueRef.current.push(initData);
      processQueue();
      return;
    }

    console.log('[useDashcamStream] Initializing MediaSource with codec:', codec);
    isInitializingRef.current = true;
    currentCodecRef.current = codec;
    pendingInitDataRef.current = initData;

    // Clean up existing MediaSource
    cleanupMediaSource();
    
    // Clear the queue for fresh start
    queueRef.current = [];

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    
    const handleSourceOpen = () => {
      console.log('[useDashcamStream] MediaSource opened');
      
      // Verify this is still the current MediaSource (guard against race condition)
      if (mediaSourceRef.current !== mediaSource) {
        console.warn('[useDashcamStream] MediaSource changed, skipping setup');
        isInitializingRef.current = false;
        return;
      }
      
      // Verify MediaSource is in the correct state
      if (mediaSource.readyState !== 'open') {
        console.warn('[useDashcamStream] MediaSource not open, state:', mediaSource.readyState);
        isInitializingRef.current = false;
        return;
      }
      
      try {
        const mimeType = `video/mp4; codecs="${codec}"`;
        if (!MediaSource.isTypeSupported(mimeType)) {
          console.error(`[useDashcamStream] Codec not supported: ${mimeType}`);
          setState(prev => ({ ...prev, error: `Codec not supported: ${codec}` }));
          isInitializingRef.current = false;
          return;
        }
        
        const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
        sourceBufferRef.current = sourceBuffer;
        
        sourceBuffer.addEventListener('updateend', processQueue);
        
        // Queue the pending init data
        if (pendingInitDataRef.current) {
          queueRef.current.push(pendingInitDataRef.current);
          pendingInitDataRef.current = null;
          processQueue();
        }
        
        setState(prev => ({ ...prev, codec, isStreaming: true, error: null }));
        console.log(`[useDashcamStream] SourceBuffer created with codec: ${codec}`);
      } catch (error) {
        console.error('[useDashcamStream] Error creating SourceBuffer:', error);
        setState(prev => ({ ...prev, error: String(error) }));
      } finally {
        isInitializingRef.current = false;
      }
    };

    const handleSourceEnded = () => {
      console.log('[useDashcamStream] MediaSource ended');
    };

    const handleSourceError = (e: Event) => {
      console.error('[useDashcamStream] MediaSource error:', e);
      setState(prev => ({ ...prev, error: 'MediaSource error' }));
      isInitializingRef.current = false;
    };

    // Use { once: true } to automatically remove the listener after it fires
    mediaSource.addEventListener('sourceopen', handleSourceOpen, { once: true });
    mediaSource.addEventListener('sourceended', handleSourceEnded);
    mediaSource.addEventListener('error', handleSourceError);
    
    video.src = URL.createObjectURL(mediaSource);
  }, [processQueue, cleanupMediaSource]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(`${WS_BASE_URL}/ws/dashcam/`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[useDashcamStream] WebSocket connected');
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    };

    ws.onclose = (event) => {
      console.log('[useDashcamStream] WebSocket closed:', event.code, event.reason);
      setState(prev => ({ ...prev, isConnected: false, isStreaming: false }));
    };

    ws.onerror = (error) => {
      console.error('[useDashcamStream] WebSocket error:', error);
      setState(prev => ({ ...prev, error: 'WebSocket connection error' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const config = currentConfigRef.current;
        
        switch (message.type) {
          case 'init_segment':
            console.log('[useDashcamStream] Received init segment, codec:', message.codec, 'msg_channel:', message.channel, 'config_channel:', config?.channel);
            // Only process if channel matches this hook's configured channel
            // Use == for loose comparison in case types differ (string vs number)
            if (config && message.channel == config.channel) {
              if (message.codec && message.data) {
                const initData = base64ToArrayBuffer(message.data);
                initMediaSource(message.codec, initData);
              }
            } else {
              console.log('[useDashcamStream] Skipping init_segment - channel mismatch or no config');
            }
            break;
            
          case 'video':
            // Only process if channel matches this hook's configured channel
            // Use == for loose comparison in case types differ (string vs number)
            if (config && message.channel == config.channel) {
              // Only process video if we have a valid SourceBuffer
              if (sourceBufferRef.current && mediaSourceRef.current?.readyState === 'open') {
                const videoData = base64ToArrayBuffer(message.data);
                queueRef.current.push(videoData);
                processQueue();
              } else if (isInitializingRef.current) {
                // Queue data while initializing
                const videoData = base64ToArrayBuffer(message.data);
                queueRef.current.push(videoData);
              }
            }
            break;
            
          case 'error':
            console.error('[useDashcamStream] Server error:', message.message);
            setState(prev => ({ ...prev, error: message.message }));
            break;
            
          case 'response':
            console.log('[useDashcamStream] Response:', message);
            break;
            
          default:
            console.log('[useDashcamStream] Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[useDashcamStream] Error parsing message:', error);
      }
    };
  }, [initMediaSource, processQueue]);

  const startStream = useCallback((config: StreamConfig) => {
    currentConfigRef.current = config;
    
    // Ensure WebSocket is connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket();
      // Wait for connection then send start
      const checkConnection = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(checkConnection);
          wsRef.current.send(JSON.stringify({
            action: 'start_live',
            phone: config.phone,
            channel: config.channel,
            stream_type: config.streamType || 0,
          }));
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => clearInterval(checkConnection), 5000);
    } else {
      wsRef.current.send(JSON.stringify({
        action: 'start_live',
        phone: config.phone,
        channel: config.channel,
        stream_type: config.streamType || 0,
      }));
    }
  }, [connectWebSocket]);

  const stopStream = useCallback(() => {
    const config = currentConfigRef.current;
    
    if (wsRef.current?.readyState === WebSocket.OPEN && config) {
      wsRef.current.send(JSON.stringify({
        action: 'stop_live',
        phone: config.phone,
        channel: config.channel,
      }));
    }
    
    // Reset initialization state
    isInitializingRef.current = false;
    currentCodecRef.current = null;
    pendingInitDataRef.current = null;
    
    // Clean up queue
    queueRef.current = [];
    
    // Clean up MediaSource
    cleanupMediaSource();
    
    setState(prev => ({ ...prev, isStreaming: false, codec: null }));
  }, [cleanupMediaSource]);

  const reconnect = useCallback(() => {
    stopStream();
    
    // Close existing WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Reconnect after short delay
    setTimeout(() => {
      const config = currentConfigRef.current;
      if (config) {
        startStream(config);
      }
    }, 1000);
  }, [startStream, stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [stopStream]);

  return {
    videoRef,
    state,
    startStream,
    stopStream,
    reconnect,
  };
}

// Helper function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default useDashcamStream;
