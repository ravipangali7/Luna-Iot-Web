import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GoogleMapReact from 'google-map-react';
import { vehicleService } from '../../api/services/vehicleService';
import socketService from '../../services/socketService';
import { showError, showInfo } from '../../utils/sweetAlert';
import type { Vehicle } from '../../types/vehicle';
import VehicleUtils, { VehicleImageState } from '../../utils/vehicleUtils';
import type { VehicleStateType } from '../../utils/vehicleUtils';
import GeoUtils from '../../utils/geoUtils';
import SpeedIcon from '@mui/icons-material/Speed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import LandscapeIcon from '@mui/icons-material/Landscape';
import HistoryIcon from '@mui/icons-material/History';
import './LiveTrackingShowPage.css';

interface LiveTrackingShowPageProps {
  imei?: string;
  onBack?: () => void;
}

interface LocationData {
  id: number;
  imei: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  satellite: number;
  realTimeGps: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fixed Center Marker Component (like Flutter)
const FixedCenterMarker: React.FC<{
  vehicle: Vehicle;
  vehicleState: VehicleStateType;
  rotation: number;
}> = ({ vehicle, vehicleState, rotation }) => {
  const imagePath = VehicleUtils.getImagePath(
    vehicle.vehicleType || 'car',
    vehicleState,
    VehicleImageState.LIVE
  );

  return (
    <div
      className="fixed-center-marker"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60px',
        height: '60px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
        zIndex: 1000
      }}
      title={`${vehicle.name} - ${vehicle.vehicleNo}`}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center',
          transition: 'transform 0.3s ease'
        }}
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
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.style.backgroundColor = VehicleUtils.getStateColor(vehicleState);
              parent.style.borderRadius = '50%';
              parent.style.border = '3px solid white';
              parent.style.width = '40px';
              parent.style.height = '40px';
              parent.style.fontSize = '12px';
              parent.style.fontWeight = 'bold';
              parent.style.color = 'white';
              parent.textContent = vehicle.vehicleNo.charAt(0);
            }
          }}
        />
      </div>
    </div>
  );
};

const LiveTrackingShowPage: React.FC<LiveTrackingShowPageProps> = ({ imei: propImei, onBack }) => {
  const { imei: urlImei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  
  // Use IMEI from URL params if available, otherwise use prop
  const imei = urlImei || propImei;
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [vehicleState, setVehicleState] = useState<VehicleStateType>('no_data');
  const [mapRotation, setMapRotation] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [currentAddress, setCurrentAddress] = useState<string>('Loading address...');
  
  // Floating buttons state
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [altitude, setAltitude] = useState<string>('...');
  const [loadingAltitude, setLoadingAltitude] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const mapControllerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const locationUpdateHandlerRef = useRef<((data: any) => void) | null>(null);
  const statusUpdateHandlerRef = useRef<((data: any) => void) | null>(null);
  
  // Throttling for map pan updates
  const lastMapPanRef = useRef<number>(0);
  const MAP_PAN_THROTTLE_MS = 200; // Throttle to max once per 200ms

  // Animation state variables
  const animationFrameRef = useRef<number | null>(null);
  const currentAnimatedPositionRef = useRef<LocationData | null>(null);


  // Load vehicle data
  const loadVehicleData = useCallback(async () => {
    if (!imei) {
      showError('Invalid IMEI', 'No IMEI provided for vehicle tracking.');
      return;
    }
    
    try {
      setLoading(true);
      const response = await vehicleService.getVehicleByImei(imei);
      
      if (response.success && response.data) {
        const vehicleData = response.data;
        
        // Check if vehicle is inactive
        if (!vehicleData.is_active) {
          showError('Vehicle is inactive', 'This vehicle has been deactivated and cannot be tracked live.');
          navigate('/live-tracking');
          return;
        }
        
        setVehicle(vehicleData);
        
        // Initialize location
        if (vehicleData.latestLocation) {
          // Convert string coordinates to numbers
          const locationData: LocationData = {
            id: vehicleData.latestLocation.id,
            imei: vehicleData.latestLocation.imei,
            latitude: parseFloat(vehicleData.latestLocation.latitude.toString()),
            longitude: parseFloat(vehicleData.latestLocation.longitude.toString()),
            speed: parseFloat(vehicleData.latestLocation.speed.toString()) || 0,
            course: parseFloat(vehicleData.latestLocation.course.toString()) || 0,
            satellite: parseFloat(vehicleData.latestLocation.satellite.toString()) || 0,
            realTimeGps: vehicleData.latestLocation.realTimeGps,
            createdAt: vehicleData.latestLocation.createdAt,
            updatedAt: vehicleData.latestLocation.updatedAt
          };
          setCurrentLocation(locationData);
          setMapRotation(locationData.course);
          currentAnimatedPositionRef.current = locationData; // Initialize ref
          // Fetch address for initial location
          fetchAddress(locationData.latitude, locationData.longitude);
        } else {
          console.warn('No latest location found for vehicle');
          // Set a default location for testing
          const defaultLocation = {
            id: 0,
            imei: imei || '',
            latitude: 27.7172,
            longitude: 85.3240,
            speed: 0,
            course: 0,
            satellite: 0,
            realTimeGps: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setCurrentLocation(defaultLocation);
          currentAnimatedPositionRef.current = defaultLocation; // Initialize ref
        }
        
        // Set initial vehicle state
        const initialState = VehicleUtils.getState(vehicleData);
        setVehicleState(initialState);
        
      } else {
        console.error('Failed to load vehicle:', response.error);
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
    } finally {
      setLoading(false);
    }
  }, [imei, navigate]);

  // Fetch address for current location
  const fetchAddress = useCallback(async (latitude: number, longitude: number) => {
    try {
      setCurrentAddress('Loading address...');
      const address = await GeoUtils.getReverseGeoCode(latitude, longitude);
      setCurrentAddress(address);
    } catch (error) {
      console.error('Error fetching address:', error);
      setCurrentAddress('Address unavailable');
    }
  }, []);

  // Interpolation function for smooth position calculation
  const interpolateLocation = useCallback((
    start: LocationData,
    end: LocationData,
    progress: number // 0 to 1
  ): LocationData => {
    return {
      ...end,
      latitude: start.latitude + (end.latitude - start.latitude) * progress,
      longitude: start.longitude + (end.longitude - start.longitude) * progress,
      course: end.course, // Use target course for rotation
    };
  }, []);

  // Animation function using requestAnimationFrame
  const animateVehicleMovement = useCallback((
    startLocation: LocationData,
    endLocation: LocationData,
    duration: number = 5000 // 5 seconds
  ) => {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1); // 0 to 1
      
      // Easing function for smooth acceleration/deceleration
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const interpolated = interpolateLocation(startLocation, endLocation, eased);
      setCurrentLocation(interpolated);
      currentAnimatedPositionRef.current = interpolated; // Track animated position
      
      // Rotate marker smoothly
      setMapRotation(interpolated.course);
      
      // Pan map smoothly
      if (mapControllerRef.current && isTracking) {
        mapControllerRef.current.panTo({
          lat: interpolated.latitude,
          lng: interpolated.longitude
        });
      }
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - set final position
        setCurrentLocation(endLocation);
        currentAnimatedPositionRef.current = endLocation;
      }
    };
    
    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isTracking, interpolateLocation]);

  // Toggle map type (satellite/roadmap)
  const toggleMapType = useCallback(() => {
    setMapType(prev => prev === 'roadmap' ? 'satellite' : 'roadmap');
  }, []);

  // Handle weather button click
  const handleWeatherClick = useCallback(async () => {
    if (!currentLocation) {
      showInfo('No Location Data', 'No location data available for weather');
      return;
    }

    try {
      setShowWeatherModal(true);
      const weather = await GeoUtils.getWeatherData(currentLocation.latitude, currentLocation.longitude);
      setWeatherData(weather);
    } catch (error) {
      console.error('Error fetching weather:', error);
      showError('Weather Error', 'Failed to load weather data');
    }
  }, [currentLocation]);

  // Handle altitude button click
  const handleAltitudeClick = useCallback(async () => {
    if (!currentLocation || loadingAltitude) return;

    try {
      setLoadingAltitude(true);
      const alt = await GeoUtils.getAltitude(currentLocation.latitude, currentLocation.longitude);
      setAltitude(alt);
    } catch (error) {
      console.error('Error fetching altitude:', error);
      setAltitude('N/A');
    } finally {
      setLoadingAltitude(false);
    }
  }, [currentLocation, loadingAltitude]);

  // Handle playback button click
  const handlePlaybackClick = useCallback(() => {
    if (!vehicle) return;
    navigate(`/playback?vehicle=${vehicle.imei}`);
  }, [vehicle, navigate]);

  // Handle location updates from socket
  const handleLocationUpdate = useCallback((data: any) => {
    if (!vehicle || data.imei !== vehicle.imei) return;
    
    try {
      const newLocation: LocationData = {
        id: data.id || currentAnimatedPositionRef.current?.id || 0,
        imei: data.imei,
        latitude: parseFloat(data.latitude?.toString() || '0'),
        longitude: parseFloat(data.longitude?.toString() || '0'),
        speed: parseFloat(data.speed?.toString() || '0'),
        course: parseFloat(data.course?.toString() || '0'),
        satellite: parseFloat(data.satellite?.toString() || '0'),
        realTimeGps: data.realTimeGps || false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Get the actual current position from ref only
      const actualCurrentPosition = currentAnimatedPositionRef.current;
      
      // Only start animation if we have a current position and it changed
      if (actualCurrentPosition && (
        actualCurrentPosition.latitude !== newLocation.latitude || 
        actualCurrentPosition.longitude !== newLocation.longitude
      )) {
        // Cancel any existing animation before starting new one
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Start animation from actual current position
        animateVehicleMovement(actualCurrentPosition, newLocation, 5000);
      } else {
        // First location or same position - set immediately
        setCurrentLocation(newLocation);
        setMapRotation(newLocation.course);
        currentAnimatedPositionRef.current = newLocation; // Update ref
      }
      
      // Fetch address for new location
      fetchAddress(newLocation.latitude, newLocation.longitude);
      
      // Add new point to route
      setRoutePoints(prevPoints => [
        ...prevPoints,
        { lat: newLocation.latitude, lng: newLocation.longitude }
      ]);

      // Update vehicle with new location
      setVehicle(prevVehicle => {
        if (!prevVehicle) return prevVehicle;
        return {
          ...prevVehicle,
          latestLocation: {
            id: newLocation.id,
            imei: newLocation.imei,
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            speed: newLocation.speed,
            course: newLocation.course,
            satellite: newLocation.satellite,
            realTimeGps: newLocation.realTimeGps,
            createdAt: newLocation.createdAt,
            updatedAt: newLocation.updatedAt
          }
        };
      });

    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }, [vehicle, fetchAddress, animateVehicleMovement]);

  // Handle status updates from socket
  const handleStatusUpdate = useCallback((data: any) => {
    if (!vehicle || data.imei !== vehicle.imei) return;
    
    try {
      const newStatus = {
        id: data.id || vehicle.latestStatus?.id || 0,
        imei: data.imei,
        battery: data.battery ?? vehicle.latestStatus?.battery ?? 0,
        signal: data.signal ?? vehicle.latestStatus?.signal ?? 0,
        ignition: data.ignition ?? vehicle.latestStatus?.ignition ?? false,
        charging: data.charging ?? vehicle.latestStatus?.charging ?? false,
        relay: data.relay ?? vehicle.latestStatus?.relay ?? false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update vehicle with new status
      const updatedVehicle = {
        ...vehicle,
        latestStatus: newStatus
      };

      setVehicle(updatedVehicle);

      // Update vehicle state based on new status
      const newVehicleState = VehicleUtils.getState(updatedVehicle);
      setVehicleState(newVehicleState);

    } catch (error) {
      console.error('Error handling status update:', error);
    }
  }, [vehicle]);

  // Start real-time tracking
  const startRealTimeTracking = useCallback(() => {
    if (!vehicle || isTracking) return;

    // Ensure socket is connected first
    if (!socketService.getConnectionStatus()) {
      socketService.connect();
    }

    setIsTracking(true);

    // Create handlers
    const locationHandler = (data: any) => handleLocationUpdate(data);
    const statusHandler = (data: any) => handleStatusUpdate(data);

    // Store handlers in refs for cleanup
    locationUpdateHandlerRef.current = locationHandler;
    statusUpdateHandlerRef.current = statusHandler;

    // Subscribe to socket updates
    socketService.subscribeToVehicleLocation(locationHandler);
    socketService.subscribeToVehicleStatus(statusHandler);

  }, [vehicle, isTracking, handleLocationUpdate, handleStatusUpdate]);

  // Stop real-time tracking
  const stopRealTimeTracking = useCallback(() => {
    if (!isTracking) return;

    setIsTracking(false);

    // Unsubscribe from socket updates
    if (locationUpdateHandlerRef.current) {
      socketService.unsubscribeFromVehicleLocation(locationUpdateHandlerRef.current);
      locationUpdateHandlerRef.current = null;
    }
    if (statusUpdateHandlerRef.current) {
      socketService.unsubscribeFromVehicleStatus(statusUpdateHandlerRef.current);
      statusUpdateHandlerRef.current = null;
    }

  }, [isTracking]);

  // Initialize map
  const handleMapChange = useCallback(({ map }: any) => {
    mapControllerRef.current = map;
    mapRef.current = map;
    
    // Center map on vehicle location initially
    if (currentLocation && map) {
      setTimeout(() => {
        try {
          if (typeof map.panTo === 'function') {
            map.panTo({
              lat: currentLocation.latitude,
              lng: currentLocation.longitude
            });
          }
        } catch (error) {
          console.warn('Error centering map on initial load:', error);
        }
      }, 1000);
    }
  }, [currentLocation]);

  // Update polyline when route points change
  const updatePolyline = useCallback(() => {
    if (!mapRef.current || !window.google || routePoints.length < 2) return;

    try {
      // Remove existing polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }

      // Create new polyline
      const path = routePoints.map(point => ({
        lat: point.lat,
        lng: point.lng
      }));

      polylineRef.current = new window.google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: 'purple',
        strokeOpacity: 1,
        strokeWeight: 6
      });

      polylineRef.current.setMap(mapRef.current);
    } catch (error) {
      console.warn('Error updating polyline:', error);
    }
  }, [routePoints]);

  // Update polyline when route points change
  useEffect(() => {
    updatePolyline();
  }, [updatePolyline]);



  // Note: Map animation is now handled directly in handleLocationUpdate callback
  // This removes the duplicate useEffect that was causing redundant animations

  // Get map center - prioritize vehicle location
  const getMapCenter = () => {
    if (currentLocation && 
        typeof currentLocation.latitude === 'number' && 
        typeof currentLocation.longitude === 'number' && 
        !isNaN(currentLocation.latitude) && 
        !isNaN(currentLocation.longitude) &&
        currentLocation.latitude !== 0 &&
        currentLocation.longitude !== 0) {
      return {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude
      };
    }
    return { lat: 28.3949, lng: 84.1240 }; // Nepal center as fallback
  };


  useEffect(() => {
    loadVehicleData();
    
    // Join socket room for this vehicle
    if (imei) {
      socketService.joinVehicleRoom(imei);
    }

    // Leave room on unmount
    return () => {
      if (imei) {
        socketService.leaveVehicleRoom(imei);
      }
    };
  }, [loadVehicleData, imei]);

  // Set up socket connection status monitoring (run once only)
  useEffect(() => {
    // Set up connection status listener
    const connectionHandler = (connected: boolean) => {
      setIsSocketConnected(connected);
    };
    
    socketService.onConnectionChange(connectionHandler);

    // Initial connection status
    setIsSocketConnected(socketService.getConnectionStatus());
    
    // Cleanup is handled by socketService itself
  }, []);

  // Start real-time tracking when vehicle is loaded
  useEffect(() => {
    if (vehicle && !isTracking) {
      startRealTimeTracking();
    }
  }, [vehicle, isTracking, startRealTimeTracking]);

  // Load altitude when location changes
  useEffect(() => {
    if (currentLocation && !loadingAltitude) {
      handleAltitudeClick();
    }
  }, [currentLocation, handleAltitudeClick, loadingAltitude]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeTracking();
      // Cancel any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Cleanup polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [stopRealTimeTracking]);

  // Validate IMEI
  if (!imei) {
    return (
      <div className="live-tracking-error">
        <h3>Invalid Vehicle</h3>
        <p>No vehicle IMEI provided</p>
        <button onClick={() => navigate('/live-tracking')} className="back-button">
          Go to Live Tracking
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="live-tracking-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading vehicle data...</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="live-tracking-error">
        <h3>Vehicle not found</h3>
        <p>Unable to load vehicle with IMEI: {imei}</p>
        <button 
          onClick={onBack || (() => navigate('/live-tracking'))} 
          className="back-button"
        >
          Go Back
        </button>
      </div>
    );
  }


  return (
    <div className="live-tracking-show">
      {/* Minimal Top Panel */}
      <div className="minimal-top-panel">
        <div className="vehicle-info">
          <span className="vehicle-info-item"><DirectionsCarIcon   /> {vehicle.vehicleNo}</span>
          <span className="vehicle-info-item"><LocationOnIcon /> {currentAddress}</span>
          <span className="vehicle-info-item"><SpeedIcon /> {currentLocation?.speed?.toFixed(0) || 0} KM/H</span>
          <span className={`tracking-status ${isSocketConnected ? 'tracking-active' : 'tracking-inactive'}`}>
            {isSocketConnected ? '🟢 LIVE' : '🔴 DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="map-container">
        <GoogleMapReact
          key={`map-${vehicle?.id}`}
          bootstrapURLKeys={{ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '' }}
          center={getMapCenter()}
          defaultCenter={{ lat: 28.3949, lng: 84.1240 }}
          defaultZoom={17}
          zoom={17}
          onGoogleApiLoaded={handleMapChange}
          options={{
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            rotateControl: true,
            scaleControl: true,
            gestureHandling: 'greedy',
            disableDefaultUI: false,
            mapTypeId: mapType,
          }}
        >
        </GoogleMapReact>
        
        {/* Fixed Center Marker */}
        {vehicle && (
          <FixedCenterMarker
            vehicle={vehicle}
            vehicleState={vehicleState}
            rotation={mapRotation}
          />
        )}

        {/* Floating Buttons */}
        <div className="floating-buttons">
          {/* Satellite Button */}
          <button
            className="floating-button satellite-button"
            onClick={toggleMapType}
            title={mapType === 'roadmap' ? 'Switch to Satellite' : 'Switch to Roadmap'}
          >
            <img 
              src="/assets/satellite_view_icon.png" 
              alt="Satellite View"
              className="satellite-icon"
            />
          </button>

          {/* Playback Button */}
          <button
            className="floating-button playback-button"
            onClick={handlePlaybackClick}
            title="View Playback History"
          >
            <HistoryIcon />
          </button>

          {/* Weather Button */}
          <button
            className="floating-button weather-button"
            onClick={handleWeatherClick}
            title="Show Weather"
          >
            <WbSunnyIcon />
          </button>

          {/* Altitude Button */}
          <button
            className="floating-button altitude-button"
            onClick={handleAltitudeClick}
            title="Show Altitude"
            disabled={loadingAltitude}
          >
            <LandscapeIcon />
            <span className="altitude-text">
              {loadingAltitude ? '...' : `${altitude}m`}
            </span>
          </button>
        </div>

        {/* Weather Modal */}
        {showWeatherModal && (
          <div className="weather-modal-overlay" onClick={() => setShowWeatherModal(false)}>
            <div className="weather-modal" onClick={(e) => e.stopPropagation()}>
              <div className="weather-modal-header">
                <h3>Weather Information</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowWeatherModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="weather-modal-content">
                {weatherData ? (
                  <div className="weather-data">
                    <div className="weather-item">
                      <span className="weather-label">Temperature:</span>
                      <span className="weather-value">{weatherData.temperature}</span>
                    </div>
                    <div className="weather-item">
                      <span className="weather-label">Description:</span>
                      <span className="weather-value">{weatherData.description}</span>
                    </div>
                    <div className="weather-item">
                      <span className="weather-label">Humidity:</span>
                      <span className="weather-value">{weatherData.humidity}</span>
                    </div>
                    <div className="weather-item">
                      <span className="weather-label">Pressure:</span>
                      <span className="weather-value">{weatherData.pressure}</span>
                    </div>
                    <div className="weather-item">
                      <span className="weather-label">Wind Speed:</span>
                      <span className="weather-value">{weatherData.wind_speed}</span>
                    </div>
                  </div>
                ) : (
                  <div className="weather-loading">Loading weather data...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingShowPage;