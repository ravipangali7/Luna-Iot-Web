import React, { useEffect, useRef } from 'react';
import type { History } from '../../types/history';

interface MapContainerProps {
  historyData: History[];
  playbackState?: {
    currentIndex: number;
    isPlaying: boolean;
  };
  className?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  historyData, 
  playbackState,
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || historyData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Get location data
    const locationData = historyData.filter(h => h.type === 'location' && h.latitude && h.longitude);
    
    if (locationData.length === 0) return;

    // Calculate bounds
    const lats = locationData.map(h => h.latitude!);
    const lngs = locationData.map(h => h.longitude!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    // Convert lat/lng to canvas coordinates
    const latToY = (lat: number) => 
      canvas.height - ((lat - (minLat - latPadding)) / ((maxLat + latPadding) - (minLat - latPadding))) * canvas.height;
    
    const lngToX = (lng: number) => 
      ((lng - (minLng - lngPadding)) / ((maxLng + lngPadding) - (minLng - lngPadding))) * canvas.width;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw route
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    locationData.forEach((point, index) => {
      const x = lngToX(point.longitude!);
      const y = latToY(point.latitude!);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw start point
    if (locationData.length > 0) {
      const startX = lngToX(locationData[0].longitude!);
      const startY = latToY(locationData[0].latitude!);
      
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(startX, startY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('S', startX, startY + 4);
    }

    // Draw end point
    if (locationData.length > 1) {
      const endX = lngToX(locationData[locationData.length - 1].longitude!);
      const endY = latToY(locationData[locationData.length - 1].latitude!);
      
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(endX, endY, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('E', endX, endY + 4);
    }

    // Draw current position if playing
    if (playbackState?.isPlaying && playbackState.currentIndex < locationData.length) {
      const currentPoint = locationData[playbackState.currentIndex];
      const currentX = lngToX(currentPoint.longitude!);
      const currentY = latToY(currentPoint.latitude!);
      
      // Draw vehicle marker
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(currentX, currentY, 10, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🚗', currentX, currentY + 5);
    }

  }, [historyData, playbackState]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full border border-gray-300 rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-sm">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Start Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>End Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Route</span>
          </div>
          {playbackState?.isPlaying && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Current Position</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overlay */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-sm">
        <div className="text-sm space-y-1">
          <div>Total Points: {historyData.filter(h => h.type === 'location').length}</div>
          <div>Date Range: {historyData.length > 0 ? new Date(historyData[0].createdAt || '').toLocaleDateString() : 'N/A'}</div>
          {playbackState?.isPlaying && (
            <div>Current: {playbackState.currentIndex + 1}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapContainer;
