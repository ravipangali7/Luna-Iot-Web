import React, { useState, useEffect, useRef, useCallback } from 'react';
import GoogleMapReact from 'google-map-react';
import { vehicleMonitoringService, type VehicleWithLatestData } from '../api/services/vehicleMonitoringService';
import socketService from '../services/socketService';
import { MAPS_CONFIG } from '../config/config';
import VehicleUtils, { VehicleState, VehicleImageState } from '../utils/vehicleUtils';
import type { VehicleStateType } from '../utils/vehicleUtils';
import type { Vehicle } from '../types/vehicle';
import './VehicleMonitoringPage.css';

// Map Marker Component (same as live tracking)
const MapMarker: React.FC<{
  lat: number;
  lng: number;
  vehicle: VehicleWithLatestData;
  onClick: (vehicle: VehicleWithLatestData) => void;
}> = ({ vehicle, onClick }) => {
  const vehicleState = VehicleUtils.getState(vehicle as unknown as Vehicle);
  const imagePath = VehicleUtils.getImagePath(
    vehicle.vehicleType || 'car',
    vehicleState,
    VehicleImageState.LIVE
  );

  return (
    <div
      className="map-marker"
      style={{
        width: '32px',
        height: '32px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
      }}
      onClick={() => onClick(vehicle)}
      title={`${vehicle.name} - ${vehicle.vehicleNo}`}
    >
      <img
        src={imagePath}
        alt={`${vehicle.vehicleType} - ${vehicleState}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          // Fallback to a simple colored circle if image fails to load
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.style.backgroundColor = VehicleUtils.getStateColor(vehicleState);
            parent.style.borderRadius = '50%';
            parent.style.border = '2px solid white';
            parent.style.width = '16px';
            parent.style.height = '16px';
            parent.style.fontSize = '10px';
            parent.style.fontWeight = 'bold';
            parent.style.color = 'white';
            parent.textContent = vehicle.vehicleNo.charAt(0);
          }
        }}
      />
    </div>
  );
};

// Google Maps Component (same as live tracking)
const MapComponent: React.FC<{
  center: { lat: number; lng: number };
  vehicles: VehicleWithLatestData[];
  onVehicleClick: (vehicle: VehicleWithLatestData) => void;
}> = ({ center, vehicles, onVehicleClick }) => {
  const mapRef = useRef<GoogleMapReact | null>(null);

  const handleMapChange = (map: unknown) => {
    mapRef.current = map as GoogleMapReact;
  };

  const defaultProps = {
    center: {
      lat: 28.3949,
      lng: 84.1240
    },
    zoom: 7
  };

  // Ensure center is always valid
  const validCenter = center && 
    typeof center.lat === 'number' && 
    typeof center.lng === 'number' && 
    !isNaN(center.lat) && 
    !isNaN(center.lng) 
    ? center 
    : defaultProps.center;

  return (
    <div className="map">
      <GoogleMapReact
        bootstrapURLKeys={{ key: MAPS_CONFIG.GOOGLE_MAPS_API_KEY }}
        defaultCenter={defaultProps.center}
        center={validCenter}
        defaultZoom={defaultProps.zoom}
        onChange={handleMapChange}
        options={{
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          mapTypeId: 'roadmap'
        }}
      >
        {vehicles.map((vehicle) => {
          if (vehicle.latestLocation?.latitude && vehicle.latestLocation?.longitude) {
            return (
              <MapMarker
                key={vehicle.imei}
                lat={vehicle.latestLocation.latitude}
                lng={vehicle.latestLocation.longitude}
                vehicle={vehicle}
                onClick={onVehicleClick}
              />
            );
          }
          return null;
        })}
      </GoogleMapReact>
    </div>
  );
};

const VehicleMonitoringPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleWithLatestData[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithLatestData[]>([]);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    stop: 0,
    running: 0,
    overspeed: 0,
    idle: 0,
    inactive: 0,
    no_data: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState<VehicleStateType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: 'Loading vehicles...' });
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Map center for Nepal
  const mapCenter = {
    lat: 28.3949,
    lng: 84.1240,
  };

  // Load remaining pages in background
  const loadRemainingPagesInBackground = useCallback(async (totalPages: number, initialVehicles: VehicleWithLatestData[], totalItems: number) => {
    try {
      let allVehicles = [...initialVehicles];
      const maxConcurrentPages = 3; // Load 3 pages at a time in background
      
      for (let page = 2; page <= totalPages; page += maxConcurrentPages) {
        const batchPromises = [];
        
        // Create batch of pages to load
        for (let i = 0; i < maxConcurrentPages && (page + i) <= totalPages; i++) {
          const currentPage = page + i;
          batchPromises.push(
            vehicleMonitoringService.loadPageData(currentPage).then(pageVehicles => {
              // Append new vehicles to existing array
              allVehicles = [...allVehicles, ...pageVehicles];
              
              // Update vehicles state with new data
              setVehicles([...allVehicles]);
              
              // Recalculate status counts with all vehicles
              const newStatusCounts = vehicleMonitoringService.calculateStatusCounts(allVehicles);
              setStatusCounts(newStatusCounts);
              
              // Update progress
              setLoadingProgress({ 
                current: currentPage, 
                total: totalPages, 
                message: `Loaded ${allVehicles.length}/${totalItems} vehicles` 
              });
              
              console.log(`Background loaded page ${currentPage}/${totalPages} (${allVehicles.length}/${totalItems} vehicles)`);
            })
          );
        }
        
        // Wait for current batch to complete
        await Promise.all(batchPromises);
        
        // Small delay between batches to be server-friendly
        if (page + maxConcurrentPages <= totalPages) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`Background loading complete: ${allVehicles.length} vehicles loaded`);
      setLoadingProgress({ 
        current: totalPages, 
        total: totalPages, 
        message: `All ${allVehicles.length} vehicles loaded` 
      });
      
    } catch (error) {
      console.error('Error in background loading:', error);
    } finally {
      setBackgroundLoading(false);
    }
  }, []);

  // Load vehicle data progressively
  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingProgress({ current: 0, total: 0, message: 'Loading first page...' });

      // Step 1: Load first page immediately
      const firstPageResult = await vehicleMonitoringService.loadFirstPage();
      
      if (firstPageResult.success && firstPageResult.data) {
        const firstPageVehicles = firstPageResult.data.vehicles;
        const totalPages = firstPageResult.data.totalPages;
        const totalItems = firstPageResult.data.totalItems;
        
        // Show first page data immediately
        setVehicles(firstPageVehicles);
        setStatusCounts(firstPageResult.data.statusCounts);
        setLoading(false); // Hide loading screen, show map with first 25 vehicles
        
        console.log(`First page loaded: ${firstPageVehicles.length} vehicles. Total: ${totalItems} across ${totalPages} pages`);
        
        // Step 2: Load remaining pages in background
        if (totalPages > 1) {
          setBackgroundLoading(true);
          setLoadingProgress({ 
            current: 1, 
            total: totalPages, 
            message: `Loading remaining pages in background...` 
          });
          
          // Load remaining pages progressively
          await loadRemainingPagesInBackground(totalPages, firstPageVehicles, totalItems);
        }
      } else {
        throw new Error(firstPageResult.message || 'Failed to load first page');
      }
    } catch (err) {
      setError('Failed to load vehicle data');
      console.error('Error loading vehicles:', err);
      setLoading(false);
    }
  }, [loadRemainingPagesInBackground]);

  // Filter vehicles based on selected filter
  const filterVehicles = useCallback(() => {
    if (selectedFilter === 'all') {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle => {
        const vehicleState = VehicleUtils.getState(vehicle as unknown as Vehicle);
        return vehicleState === selectedFilter;
      });
      setFilteredVehicles(filtered);
    }
  }, [vehicles, selectedFilter]);

  // Load data on component mount
  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Filter vehicles when vehicles or selectedFilter changes
  useEffect(() => {
    filterVehicles();
  }, [filterVehicles]);

  // Set up socket updates for real-time vehicle data
  useEffect(() => {
    const handleVehicleUpdate = () => {
      // Update vehicle data when socket receives updates
      loadVehicles();
    };

    // Set up connection status
    setIsConnected(socketService.getConnectionStatus());
    
    socketService.subscribeToVehicleUpdates(handleVehicleUpdate);

    return () => {
      socketService.unsubscribeFromVehicleUpdates(handleVehicleUpdate);
    };
  }, [loadVehicles]);

  const handleFilterClick = (filter: VehicleStateType | 'all') => {
    setSelectedFilter(filter);
  };

  const handleVehicleClick = (vehicle: VehicleWithLatestData) => {
    console.log('Vehicle clicked:', vehicle);
    // You can add navigation or modal logic here
  };

  const getFilterButtonClass = (filter: VehicleStateType | 'all') => {
    const baseClass = 'filter-button';
    const activeClass = selectedFilter === filter ? 'active' : '';
    const stateClass = filter !== 'all' ? filter.toLowerCase() : '';
    return `${baseClass} ${activeClass} ${stateClass}`.trim();
  };

  if (loading) {
    const progressPercentage = loadingProgress.total > 0 ? (loadingProgress.current / loadingProgress.total) * 100 : 0;
    
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">{loadingProgress.message}</div>
        {loadingProgress.total > 0 && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {loadingProgress.current} / {loadingProgress.total} pages loaded
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{error}</div>
        <button
          onClick={() => loadVehicles()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="vehicle-monitoring-container">
      {/* Header - exact same as live tracking */}
      <div className="live-tracking-header">
        <div className="header-title">
          <span className="title-icon">🟢</span>
          <h3>Vehicle Monitoring</h3>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {backgroundLoading && (
            <div className="background-loading-indicator">
              <div className="loading-spinner-small"></div>
              <span className="loading-text-small">
                Loading more vehicles... ({loadingProgress.current}/{loadingProgress.total})
              </span>
            </div>
          )}
        </div>
        
        {/* Status filters - exact same as live tracking */}
        <div className="status-filters">
          <button
            className={getFilterButtonClass('all')}
            onClick={() => handleFilterClick('all')}
          >
            ALL: {statusCounts.all}
          </button>
          <button
            className={getFilterButtonClass(VehicleState.STOPPED)}
            onClick={() => handleFilterClick(VehicleState.STOPPED)}
          >
            STOP: {statusCounts.stop}
          </button>
          <button
            className={getFilterButtonClass(VehicleState.RUNNING)}
            onClick={() => handleFilterClick(VehicleState.RUNNING)}
          >
            RUNNING: {statusCounts.running}
          </button>
          <button
            className={getFilterButtonClass(VehicleState.OVERSPEED)}
            onClick={() => handleFilterClick(VehicleState.OVERSPEED)}
          >
            OVERSPEED: {statusCounts.overspeed}
          </button>
          <button
            className={getFilterButtonClass(VehicleState.IDLE)}
            onClick={() => handleFilterClick(VehicleState.IDLE)}
          >
            IDLE: {statusCounts.idle}
          </button>
          <button
            className={getFilterButtonClass(VehicleState.INACTIVE)}
            onClick={() => handleFilterClick(VehicleState.INACTIVE)}
          >
            INACTIVE: {statusCounts.inactive}
          </button>
          <button
            className={getFilterButtonClass(VehicleState.NO_DATA)}
            onClick={() => handleFilterClick(VehicleState.NO_DATA)}
          >
            NO DATA: {statusCounts.no_data}
          </button>
        </div>
      </div>

      {/* Main content - only map, no vehicle list */}
      <div className="vehicle-monitoring-content">
        {/* Map - full width */}
        <div className="map-container-full">
          <MapComponent
            center={mapCenter}
            vehicles={filteredVehicles}
            onVehicleClick={handleVehicleClick}
          />
        </div>
      </div>
    </div>
  );
};

export default VehicleMonitoringPage;