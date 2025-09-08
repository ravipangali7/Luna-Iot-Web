import { useEffect, useCallback } from 'react';
import type { Vehicle } from '../types/vehicle';
import socketService from '../services/socketService';

interface UseSocketUpdatesProps {
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
}

export const useSocketUpdates = ({ setVehicles }: UseSocketUpdatesProps) => {
  const handleVehicleUpdate = useCallback((data: unknown) => {
    // No logging for received updates - only log when we actually process them
    
    // Type guard to ensure data has the expected structure
    if (typeof data !== 'object' || data === null) return;
    
    const updateData = data as {
      imei?: string;
      battery?: number;
      signal?: number;
      ignition?: boolean;
      charging?: boolean;
      relay?: boolean;
      latitude?: number;
      longitude?: number;
      speed?: number;
      course?: number;
      satellite?: number;
      realTimeGps?: boolean;
      createdAt?: string;
    };
    
    if (!updateData.imei) {
      console.warn('⚠️ Received update without IMEI:', data);
      return;
    }
    
    setVehicles(prevVehicles => {
      // Create a Set of IMEIs for faster lookup
      const imeiSet = new Set(prevVehicles.map(v => v.imei));
      
      // Only process updates for vehicles that exist in the current list
      if (!imeiSet.has(updateData.imei!)) {
        // Silently ignore updates for vehicles not in the current list
        // This is normal - the server broadcasts all updates, but we only care about loaded vehicles
        return prevVehicles; // Return unchanged vehicles
      }
      
      const updatedVehicles = [...prevVehicles];
      const vehicleIndex = updatedVehicles.findIndex(v => v.imei === updateData.imei);
      
      if (vehicleIndex !== -1) {
        // Update existing vehicle
        const currentVehicle = updatedVehicles[vehicleIndex];
        
        // Determine if this is a status update or location update
        const isStatusUpdate = updateData.battery !== undefined || 
                              updateData.signal !== undefined || 
                              updateData.ignition !== undefined || 
                              updateData.charging !== undefined || 
                              updateData.relay !== undefined;
        
        const isLocationUpdate = updateData.latitude !== undefined || 
                                updateData.longitude !== undefined || 
                                updateData.speed !== undefined || 
                                updateData.course !== undefined || 
                                updateData.satellite !== undefined;
        
        updatedVehicles[vehicleIndex] = {
          ...currentVehicle,
          latestStatus: isStatusUpdate ? {
            id: currentVehicle.latestStatus?.id || 0,
            imei: updateData.imei!,
            battery: updateData.battery ?? currentVehicle.latestStatus?.battery ?? 0,
            signal: updateData.signal ?? currentVehicle.latestStatus?.signal ?? 0,
            ignition: updateData.ignition ?? currentVehicle.latestStatus?.ignition ?? false,
            charging: updateData.charging ?? currentVehicle.latestStatus?.charging ?? false,
            relay: updateData.relay ?? currentVehicle.latestStatus?.relay ?? false,
            createdAt: updateData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } : currentVehicle.latestStatus,
          latestLocation: isLocationUpdate ? {
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
          } : currentVehicle.latestLocation,
        };
        
        console.log(`✅ Updated vehicle ${updateData.imei}:`, {
          statusUpdate: isStatusUpdate,
          locationUpdate: isLocationUpdate,
          data: updateData,
          updatedVehicle: updatedVehicles[vehicleIndex]
        });
      }
      
      return updatedVehicles;
    });
  }, [setVehicles]);

  useEffect(() => {
    // Subscribe to vehicle updates
    socketService.subscribeToVehicleUpdates(handleVehicleUpdate);

    // Cleanup on unmount
    return () => {
      socketService.unsubscribeFromVehicleUpdates(handleVehicleUpdate);
    };
  }, [handleVehicleUpdate]);

  return {
    isConnected: socketService.getConnectionStatus(),
    reconnect: () => socketService.reconnect(),
    disconnect: () => socketService.disconnect()
  };
};
