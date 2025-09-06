import { useEffect, useCallback } from 'react';
import type { Vehicle } from '../types/vehicle';
import socketService from '../services/socketService';

interface UseSocketUpdatesProps {
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
}

export const useSocketUpdates = ({ setVehicles }: UseSocketUpdatesProps) => {
  const handleVehicleUpdate = useCallback((data: unknown) => {
    console.log('Received vehicle update:', data);
    
    // Type guard to ensure data has the expected structure
    if (typeof data !== 'object' || data === null) return;
    
    const updateData = data as {
      imei?: string;
      status?: any;
      location?: any;
      vehicle?: Vehicle;
    };
    
    setVehicles(prevVehicles => {
      const updatedVehicles = [...prevVehicles];
      
      if (updateData.imei) {
        const vehicleIndex = updatedVehicles.findIndex(v => v.imei === updateData.imei);
        
        if (vehicleIndex !== -1) {
          // Update existing vehicle
          const currentVehicle = updatedVehicles[vehicleIndex];
          updatedVehicles[vehicleIndex] = {
            ...currentVehicle,
            latestStatus: updateData.status ? {
              ...currentVehicle.latestStatus,
              ...updateData.status,
              createdAt: updateData.status.createdAt || new Date().toISOString()
            } : currentVehicle.latestStatus,
            latestLocation: updateData.location ? {
              ...currentVehicle.latestLocation,
              ...updateData.location,
              createdAt: updateData.location.createdAt || new Date().toISOString()
            } : currentVehicle.latestLocation,
          };
        }
      } else if (updateData.vehicle) {
        // Add new vehicle
        updatedVehicles.push(updateData.vehicle);
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
