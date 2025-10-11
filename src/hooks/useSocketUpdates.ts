import { useEffect, useCallback, useState, useRef } from 'react';
import type { Vehicle } from '../types/vehicle';
import socketService from '../services/socketService';

interface UseSocketUpdatesProps {
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
}

export const useSocketUpdates = ({ setVehicles }: UseSocketUpdatesProps) => {
  const [isConnected, setIsConnected] = useState(false);
  
  // Use refs to store stable callback references
  const handleStatusUpdateRef = useRef<(data: unknown) => void>();
  const handleLocationUpdateRef = useRef<(data: unknown) => void>();

  const handleStatusUpdate = useCallback((data: unknown) => {
    // Type guard to ensure data has the expected structure
    if (typeof data !== 'object' || data === null) return;
    
    const updateData = data as {
      imei?: string;
      battery?: number;
      signal?: number;
      ignition?: boolean;
      charging?: boolean;
      relay?: boolean;
      createdAt?: string;
    };
    
    if (!updateData.imei) {
      return;
    }
    
    setVehicles(prevVehicles => {
      // Create a Set of IMEIs for faster lookup
      const imeiSet = new Set(prevVehicles.map(v => v.imei));
      
      // Only process updates for vehicles that exist in the current list
      if (!imeiSet.has(updateData.imei!)) {
        return prevVehicles; // Return unchanged vehicles
      }
      
      const updatedVehicles = [...prevVehicles];
      const vehicleIndex = updatedVehicles.findIndex(v => v.imei === updateData.imei);
      
      if (vehicleIndex !== -1) {
        const currentVehicle = updatedVehicles[vehicleIndex];
        
        updatedVehicles[vehicleIndex] = {
          ...currentVehicle,
          latestStatus: {
            id: currentVehicle.latestStatus?.id || 0,
            imei: updateData.imei!,
            battery: updateData.battery ?? currentVehicle.latestStatus?.battery ?? 0,
            signal: updateData.signal ?? currentVehicle.latestStatus?.signal ?? 0,
            ignition: updateData.ignition ?? currentVehicle.latestStatus?.ignition ?? false,
            charging: updateData.charging ?? currentVehicle.latestStatus?.charging ?? false,
            relay: updateData.relay ?? currentVehicle.latestStatus?.relay ?? false,
            createdAt: updateData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
        
      }
      
      return updatedVehicles;
    });
  }, [setVehicles]);

  // Store callbacks in refs for stable references
  handleStatusUpdateRef.current = handleStatusUpdate;

  const handleLocationUpdate = useCallback((data: unknown) => {
    // Type guard to ensure data has the expected structure
    if (typeof data !== 'object' || data === null) return;
    
    const updateData = data as {
      imei?: string;
      latitude?: number;
      longitude?: number;
      speed?: number;
      course?: number;
      satellite?: number;
      realTimeGps?: boolean;
      createdAt?: string;
    };
    
    if (!updateData.imei) {
      return;
    }
    
    setVehicles(prevVehicles => {
      // Create a Set of IMEIs for faster lookup
      const imeiSet = new Set(prevVehicles.map(v => v.imei));
      
      // Only process updates for vehicles that exist in the current list
      if (!imeiSet.has(updateData.imei!)) {
        return prevVehicles; // Return unchanged vehicles
      }
      
      const updatedVehicles = [...prevVehicles];
      const vehicleIndex = updatedVehicles.findIndex(v => v.imei === updateData.imei);
      
      if (vehicleIndex !== -1) {
        const currentVehicle = updatedVehicles[vehicleIndex];
        
        updatedVehicles[vehicleIndex] = {
          ...currentVehicle,
          latestLocation: {
            id: currentVehicle.latestLocation?.id || 0,
            imei: updateData.imei!,
            latitude: updateData.latitude ?? currentVehicle.latestLocation?.latitude ?? 0,
            longitude: updateData.longitude ?? currentVehicle.latestLocation?.longitude ?? 0,
            speed: updateData.speed ?? currentVehicle.latestLocation?.speed ?? 0,
            course: updateData.course ?? currentVehicle.latestLocation?.course ?? 0,
            satellite: updateData.satellite ?? currentVehicle.latestLocation?.satellite ?? 0,
            realTimeGps: updateData.realTimeGps ?? currentVehicle.latestLocation?.realTimeGps ?? false,
            createdAt: updateData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
        
      }
      
      return updatedVehicles;
    });
  }, [setVehicles]);

  // Store callbacks in refs for stable references
  handleLocationUpdateRef.current = handleLocationUpdate;

  useEffect(() => {
    // Connect to socket
    socketService.connect();
    
    // Set up connection status listener
    socketService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    // Subscribe to status and location updates using stable refs
    const statusHandler = (data: unknown) => handleStatusUpdateRef.current?.(data);
    const locationHandler = (data: unknown) => handleLocationUpdateRef.current?.(data);
    
    socketService.subscribeToVehicleStatus(statusHandler);
    socketService.subscribeToVehicleLocation(locationHandler);

    // Cleanup on unmount
    return () => {
      socketService.unsubscribeFromVehicleStatus(statusHandler);
      socketService.unsubscribeFromVehicleLocation(locationHandler);
    };
  }, []); // Empty dependency array - run once only

  return {
    isConnected,
    reconnect: () => socketService.reconnect(),
    disconnect: () => socketService.disconnect()
  };
};
