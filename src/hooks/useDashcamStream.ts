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

  const initMediaSource = useCallback((codec: string) => {
    const video = videoRef.current;
    if (!video) {
      console.error('[useDashcamStream] Video element not found');
      return;
    }

    // Clean up existing MediaSource
    if (mediaSourceRef.current) {
      try {
        if (mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
      } catch (e) {
        console.warn('[useDashcamStream] Error ending previous stream:', e);
      }
    }

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    
    video.src = URL.createObjectURL(mediaSource);
    
    mediaSource.addEventListener('sourceopen', () => {
      console.log('[useDashcamStream] MediaSource opened');
      
      try {
        const mimeType = `video/mp4; codecs="${codec}"`;
        if (!MediaSource.isTypeSupported(mimeType)) {
          console.error(`[useDashcamStream] Codec not supported: ${mimeType}`);
          setState(prev => ({ ...prev, error: `Codec not supported: ${codec}` }));
          return;
        }
        
        const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
        sourceBufferRef.current = sourceBuffer;
        
        sourceBuffer.addEventListener('updateend', processQueue);
        
        setState(prev => ({ ...prev, codec, isStreaming: true }));
        console.log(`[useDashcamStream] SourceBuffer created with codec: ${codec}`);
      } catch (error) {
        console.error('[useDashcamStream] Error creating SourceBuffer:', error);
        setState(prev => ({ ...prev, error: String(error) }));
      }
    });

    mediaSource.addEventListener('sourceended', () => {
      console.log('[useDashcamStream] MediaSource ended');
    });

    mediaSource.addEventListener('error', (e) => {
      console.error('[useDashcamStream] MediaSource error:', e);
      setState(prev => ({ ...prev, error: 'MediaSource error' }));
    });
  }, [processQueue]);

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
        
        switch (message.type) {
          case 'init_segment':
            console.log('[useDashcamStream] Received init segment, codec:', message.codec);
            if (message.codec) {
              initMediaSource(message.codec);
              // Append init segment after MediaSource is ready
              setTimeout(() => {
                const data = base64ToArrayBuffer(message.data);
                queueRef.current.push(data);
                processQueue();
              }, 100);
            }
            break;
            
          case 'video':
            const videoData = base64ToArrayBuffer(message.data);
            queueRef.current.push(videoData);
            processQueue();
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
    
    // Clean up
    queueRef.current = [];
    
    if (sourceBufferRef.current) {
      sourceBufferRef.current.removeEventListener('updateend', processQueue);
      sourceBufferRef.current = null;
    }
    
    if (mediaSourceRef.current) {
      try {
        if (mediaSourceRef.current.readyState === 'open') {
          mediaSourceRef.current.endOfStream();
        }
      } catch (e) {
        console.warn('[useDashcamStream] Error ending stream:', e);
      }
      mediaSourceRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.src = '';
    }
    
    setState(prev => ({ ...prev, isStreaming: false, codec: null }));
  }, [processQueue]);

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
