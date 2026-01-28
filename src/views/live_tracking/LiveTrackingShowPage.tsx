import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import socketService from '../../services/socketService';
import { showError, showInfo } from '../../utils/sweetAlert';
import type { Vehicle } from '../../types/vehicle';
import VehicleUtils, { VehicleImageState } from '../../utils/vehicleUtils';
import type { VehicleStateType } from '../../utils/vehicleUtils';
import GeoUtils from '../../utils/geoUtils';
import { GOOGLE_MAPS_CONFIG } from '../../config/maps';

// Extend the Window interface to include google
declare global {
  interface Window {
    google: any;
  }
}
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

function getAbsoluteIconUrl(path: string): string {
  if (typeof window === 'undefined' || !path.startsWith('/')) return path;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return window.location.origin + base + path;
}

// Map-bound vehicle marker overlay: stays at LatLng and moves with the map
class VehicleMarkerOverlay {
  private position: any = null;
  private rotation = 0;
  private fallbackColor = '#F5F5F5';
  private fallbackLetter = '';
  private div: HTMLDivElement | null = null;
  private innerDiv: HTMLDivElement | null = null;
  private img: HTMLImageElement | null = null;
  private overlay: any;

  constructor() {
    const self = this;
    const g = typeof window !== 'undefined' ? window.google : undefined;
    const OverlayViewClass = g && g.maps && (g.maps as any).OverlayView;
    if (!OverlayViewClass) throw new Error('Google Maps OverlayView not available');
    this.overlay = new OverlayViewClass();
    this.overlay.onAdd = function (this: any) {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.width = '60px';
      div.style.height = '60px';
      div.style.pointerEvents = 'none';
      div.style.left = '0';
      div.style.top = '0';
      div.style.transform = 'translate(-50%, -50%)';
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'center';
      div.style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))';
      div.style.zIndex = '1000';
      div.style.border = 'none';
      div.style.overflow = 'visible';
      div.style.boxSizing = 'border-box';

      const innerDiv = document.createElement('div');
      innerDiv.style.width = '100%';
      innerDiv.style.height = '100%';
      innerDiv.style.minWidth = '60px';
      innerDiv.style.minHeight = '60px';
      innerDiv.style.transition = 'transform 0.3s ease';
      innerDiv.style.transformOrigin = 'center';
      innerDiv.style.display = 'flex';
      innerDiv.style.alignItems = 'center';
      innerDiv.style.justifyContent = 'center';

      const img = document.createElement('img');
      img.style.width = '60px';
      img.style.height = '60px';
      img.style.minWidth = '60px';
      img.style.minHeight = '60px';
      img.style.display = 'block';
      img.style.border = 'none';
      img.style.objectFit = 'contain';
      img.onerror = () => {
        if (self.innerDiv) {
          self.innerDiv.style.display = 'flex';
          self.innerDiv.style.alignItems = 'center';
          self.innerDiv.style.justifyContent = 'center';
          self.innerDiv.style.backgroundColor = self.fallbackColor;
          self.innerDiv.style.borderRadius = '50%';
          self.innerDiv.style.border = '3px solid white';
          self.innerDiv.style.width = '40px';
          self.innerDiv.style.height = '40px';
          self.innerDiv.style.fontSize = '12px';
          self.innerDiv.style.fontWeight = 'bold';
          self.innerDiv.style.color = 'white';
          self.innerDiv.textContent = self.fallbackLetter;
        }
        if (self.img) self.img.style.display = 'none';
      };
      innerDiv.appendChild(img);
      div.appendChild(innerDiv);

      self.div = div;
      self.innerDiv = innerDiv;
      self.img = img;

      const panes = (this as any).getPanes?.();
      const pane = panes?.markerLayer || panes?.overlayMouseTarget;
      if (pane) {
        pane.appendChild(div);
      }
    };
    this.overlay.draw = function (this: any) {
      if (!self.position || !self.div) return;
      const projection = this.getProjection?.();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(self.position);
      if (!point) return;
      self.div.style.left = point.x + 'px';
      self.div.style.top = point.y + 'px';
      if (self.innerDiv) {
        self.innerDiv.style.transform = `rotate(${self.rotation}deg)`;
      }
    };
    this.overlay.onRemove = function () {
      if (self.div?.parentNode) {
        self.div.parentNode.removeChild(self.div);
      }
      self.div = null;
      self.innerDiv = null;
      self.img = null;
    };
  }

  setMap(map: any) {
    this.overlay.setMap(map);
  }

  setPosition(latLng: any) {
    this.position = latLng;
    if (this.overlay.getMap()) (this.overlay as any).draw();
  }

  setRotation(degrees: number) {
    this.rotation = degrees;
    if (this.innerDiv) this.innerDiv.style.transform = `rotate(${degrees}deg)`;
  }

  setIcon(url: string) {
    if (this.img) {
      const resolvedUrl =
        typeof window !== 'undefined' && url.startsWith('/')
          ? window.location.origin + (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + url
          : url;
      this.img.src = resolvedUrl;
      this.img.style.display = 'block';
      this.img.alt = 'vehicle';
      if (this.innerDiv) {
        this.innerDiv.style.display = 'flex';
        this.innerDiv.style.alignItems = 'center';
        this.innerDiv.style.justifyContent = 'center';
        this.innerDiv.style.width = '100%';
        this.innerDiv.style.height = '100%';
        this.innerDiv.style.backgroundColor = '';
        this.innerDiv.style.borderRadius = '';
        this.innerDiv.style.border = '';
        this.innerDiv.style.fontSize = '';
        this.innerDiv.style.fontWeight = '';
        this.innerDiv.style.color = '';
        this.innerDiv.textContent = '';
      }
    }
  }

  setFallback(color: string, letter: string) {
    this.fallbackColor = color;
    this.fallbackLetter = letter;
  }

  showFallback() {
    if (this.innerDiv) {
      this.innerDiv.style.display = 'flex';
      this.innerDiv.style.alignItems = 'center';
      this.innerDiv.style.justifyContent = 'center';
      this.innerDiv.style.backgroundColor = this.fallbackColor;
      this.innerDiv.style.borderRadius = '50%';
      this.innerDiv.style.border = '3px solid white';
      this.innerDiv.style.width = '40px';
      this.innerDiv.style.height = '40px';
      this.innerDiv.style.fontSize = '12px';
      this.innerDiv.style.fontWeight = 'bold';
      this.innerDiv.style.color = 'white';
      this.innerDiv.textContent = this.fallbackLetter;
    }
    if (this.img) this.img.style.display = 'none';
  }
}

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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const vehicleMarkerOverlayRef = useRef<VehicleMarkerOverlay | null>(null);
  const polylineRef = useRef<any>(null);
  const locationUpdateHandlerRef = useRef<((data: any) => void) | null>(null);
  const statusUpdateHandlerRef = useRef<((data: any) => void) | null>(null);

  // Animation state variables
  const animationFrameRef = useRef<number | null>(null);
  const currentAnimatedPositionRef = useRef<LocationData | null>(null);
  const hasStartedTrackingRef = useRef<boolean>(false);
  const isFetchingAddressRef = useRef<boolean>(false);

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=geometry,places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });
  }, []);

  // Initialize Google Maps
  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      return;
    }
    
    if (mapInstanceRef.current) {
      return;
    }

    // Always use default center for initialization - will be updated when location loads
    const center = new window.google.maps.LatLng(GOOGLE_MAPS_CONFIG.defaultCenter.lat, GOOGLE_MAPS_CONFIG.defaultCenter.lng);

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 17,
      center: center,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      rotateControl: true,
      scaleControl: true,
      gestureHandling: 'greedy',
      disableDefaultUI: false,
    });

    mapInstanceRef.current = map;
    setMapLoaded(true);
  }, []); // Remove currentLocation dependency

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
    // Prevent multiple simultaneous address fetches
    if (isFetchingAddressRef.current) {
      return;
    }
    
    try {
      isFetchingAddressRef.current = true;
      setCurrentAddress('Loading address...');
      const address = await GeoUtils.getReverseGeoCode(latitude, longitude);
      setCurrentAddress(address);
    } catch (error) {
      console.error('Error fetching address:', error);
      setCurrentAddress('Address unavailable');
    } finally {
      isFetchingAddressRef.current = false;
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
      if (mapInstanceRef.current && isTracking) {
        mapInstanceRef.current.panTo({
          lat: interpolated.latitude,
          lng: interpolated.longitude
        });
      }
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - set final position
        setCurrentLocation(endLocation);
        currentAnimatedPositionRef.current = null; // Clear ref like SharedTrackPage
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
    if (!mapInstanceRef.current || !window.google) return;
    
    const currentMapType = mapInstanceRef.current.getMapTypeId();
    const newMapType = currentMapType === window.google.maps.MapTypeId.ROADMAP
      ? window.google.maps.MapTypeId.SATELLITE
      : window.google.maps.MapTypeId.ROADMAP;
    
    mapInstanceRef.current.setMapTypeId(newMapType);
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

  // Internal location update handler (without dependencies to avoid circular reference)
  const handleLocationUpdateInternal = useCallback((data: any) => {
    // Only accept data for the specific vehicle IMEI
    if (!vehicle || !data.imei || data.imei !== vehicle.imei) return;
    
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

    } catch {
      // Silent error handling like SharedTrackPage
    }
  }, [vehicle, fetchAddress, animateVehicleMovement]);

  // Handle location updates from socket
  const handleLocationUpdate = useCallback((data: any) => {
    
    // Only accept data for the specific vehicle IMEI
    if (!vehicle || !data.imei || data.imei !== vehicle.imei) {
      return;
    }
    
    // Check for duplicate data to prevent unnecessary updates
    if (currentLocation && 
        data.latitude === currentLocation.latitude && 
        data.longitude === currentLocation.longitude &&
        data.speed === currentLocation.speed &&
        data.course === currentLocation.course) {
      return; // Skip duplicate data
    }
    
    handleLocationUpdateInternal(data);
  }, [vehicle, currentLocation, handleLocationUpdateInternal]);

  // Handle status updates from socket
  const handleStatusUpdate = useCallback((data: any) => {
    
    if (!vehicle || data.imei !== vehicle.imei) {
      return;
    }
    
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

  // Polling fallback for location updates
  const startPolling = useCallback(() => {
    if (!vehicle || pollingInterval) return;

    const poll = async () => {
      try {
        const response = await vehicleService.getVehicleByImei(vehicle.imei);
        
        if (response.success && response.data?.latestLocation) {
          const locationData = response.data.latestLocation;
          
          // Check if location has changed
          if (currentLocation && 
              locationData.latitude === currentLocation.latitude && 
              locationData.longitude === currentLocation.longitude &&
              locationData.speed === currentLocation.speed &&
              locationData.course === currentLocation.course) {
            return; // No change, skip update
          }
          
          // Simulate socket data format
          const socketData = {
            imei: vehicle.imei,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            speed: locationData.speed,
            course: locationData.course,
            satellite: locationData.satellite,
            realTimeGps: locationData.realTimeGps,
            createdAt: locationData.createdAt,
            id: Date.now() // Use timestamp as ID
          };

          // Call handleLocationUpdateInternal directly instead of using dependency
          handleLocationUpdateInternal(socketData);
        }
      } catch {
        // Silent error handling
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(poll, 10000);
    setPollingInterval(interval);
    
    // Initial poll
    poll();
  }, [vehicle, currentLocation, handleLocationUpdateInternal, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);


  // Center map on vehicle location
  const centerMapOnLocation = useCallback((location: LocationData) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({
        lat: location.latitude,
        lng: location.longitude
      });
    }
  }, []);

  // Update polyline when route points change
  const updatePolyline = useCallback(() => {
    if (!mapInstanceRef.current || !window.google || routePoints.length < 2) return;

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

      polylineRef.current.setMap(mapInstanceRef.current);
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



  useEffect(() => {
    loadVehicleData();
  }, [loadVehicleData]);

  // Load Google Maps script and initialize map
  useEffect(() => {
    const loadMap = async () => {
      try {
        await loadGoogleMapsScript();
        
        // Try to initialize map, with retry if ref not ready
        const tryInitializeMap = (attempt = 1) => {
          if (mapRef.current) {
            initializeMap();
          } else if (attempt < 5) {
            setTimeout(() => tryInitializeMap(attempt + 1), 100);
          } else {
          }
        };
        
        tryInitializeMap();
      } catch (error) {
        console.error('❌ Failed to load Google Maps:', error);
      }
    };

    loadMap();
  }, [loadGoogleMapsScript, initializeMap]);

  // Fallback: Initialize map when component is fully rendered
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && window.google && window.google.maps) {
      initializeMap();
    }
  }, [initializeMap]);

  // Connect socket early on component mount
  useEffect(() => {
    if (!socketService.getConnectionStatus()) {
      socketService.connect();
    } else {
    }
  }, []);

  // Set up socket connection status monitoring (run once only)
  useEffect(() => {
    // Set up connection status listener
    const connectionHandler = (connected: boolean) => {
      setIsSocketConnected(connected);
    };
    
    socketService.onConnectionChange(connectionHandler);

    // Initial connection status
    const initialStatus = socketService.getConnectionStatus();
    setIsSocketConnected(initialStatus);
    
    // Cleanup is handled by socketService itself
  }, []);

  // Start real-time tracking when vehicle is loaded (socket connection handled internally)
  useEffect(() => {
    if (vehicle && !isTracking && !hasStartedTrackingRef.current) {
      hasStartedTrackingRef.current = true;
      
      // Call startRealTimeTracking directly to avoid dependency issues
      if (!socketService.getConnectionStatus()) {
        socketService.connect();
        
        setTimeout(() => {
          if (socketService.getConnectionStatus()) {
            setupSocketTracking();
          } else {
            startPolling();
          }
        }, 2000);
      } else {
        setupSocketTracking();
      }

      function setupSocketTracking() {
        if (!vehicle) return;
        
        
        // Set tracking IMEI to filter updates for this specific vehicle
        socketService.setTrackingImei(vehicle.imei);
        
        // Join vehicle room for targeted updates
        socketService.joinVehicleRoom(vehicle.imei);
        
        setIsTracking(true);

        // Create handlers
        const locationHandler = (data: any) => {
          handleLocationUpdate(data);
        };
        const statusHandler = (data: any) => {
          handleStatusUpdate(data);
        };

        // Store handlers in refs for cleanup
        locationUpdateHandlerRef.current = locationHandler;
        statusUpdateHandlerRef.current = statusHandler;

        // Subscribe to socket updates
        socketService.subscribeToVehicleLocation(locationHandler);
        socketService.subscribeToVehicleStatus(statusHandler);
      }
    }
  }, [vehicle, isTracking, handleLocationUpdate, handleStatusUpdate, startPolling]);

  // Load altitude when location changes
  useEffect(() => {
    if (currentLocation && !loadingAltitude) {
      handleAltitudeClick();
    }
  }, [currentLocation, handleAltitudeClick, loadingAltitude]);

  // Center map when location changes
  useEffect(() => {
    if (currentLocation && mapLoaded) {
      centerMapOnLocation(currentLocation);
    }
  }, [currentLocation, mapLoaded, centerMapOnLocation]);

  // Create and attach vehicle marker overlay when map, vehicle, and location are ready
  useEffect(() => {
    if (!mapLoaded || !currentLocation || !vehicle || !window.google?.maps) return;
    if (vehicleMarkerOverlayRef.current) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    const overlay = new VehicleMarkerOverlay();
    overlay.setMap(map);
    const latLng = new window.google.maps.LatLng(currentLocation.latitude, currentLocation.longitude);
    overlay.setPosition(latLng);
    overlay.setRotation(mapRotation);
    overlay.setFallback(VehicleUtils.getStateColor(vehicleState), vehicle.vehicleNo.charAt(0));
    const imagePath = VehicleUtils.getImagePath(
      vehicle.vehicleType || 'car',
      vehicleState,
      VehicleImageState.LIVE
    );
    const absoluteUrl = getAbsoluteIconUrl(imagePath);
    const preloadImg = new Image();
    preloadImg.onload = () => overlay.setIcon(absoluteUrl);
    preloadImg.onerror = () => overlay.showFallback();
    preloadImg.src = absoluteUrl;
    vehicleMarkerOverlayRef.current = overlay;
  }, [mapLoaded, currentLocation, vehicle]);

  // Keep vehicle marker overlay in sync with state
  useEffect(() => {
    const overlay = vehicleMarkerOverlayRef.current;
    if (!overlay || !currentLocation || !vehicle) return;
    const latLng = new window.google.maps.LatLng(currentLocation.latitude, currentLocation.longitude);
    overlay.setPosition(latLng);
    overlay.setRotation(mapRotation);
    overlay.setFallback(VehicleUtils.getStateColor(vehicleState), vehicle.vehicleNo.charAt(0));
    const imagePath = VehicleUtils.getImagePath(
      vehicle.vehicleType || 'car',
      vehicleState,
      VehicleImageState.LIVE
    );
    const absoluteUrl = getAbsoluteIconUrl(imagePath);
    const preloadImg = new Image();
    preloadImg.onload = () => overlay.setIcon(absoluteUrl);
    preloadImg.onerror = () => overlay.showFallback();
    preloadImg.src = absoluteUrl;
  }, [currentLocation, mapRotation, vehicleState, vehicle]);

  // Stop tracking when component unmounts
  useEffect(() => {
    return () => {
      // Always cleanup tracking on unmount
      setIsTracking(false);
      hasStartedTrackingRef.current = false;
      
      // Stop polling
      stopPolling();
      
      // Clear tracking IMEI filter
      socketService.clearTrackingImei();
      
      // Leave vehicle room
      if (vehicle?.imei) {
        socketService.leaveVehicleRoom(vehicle.imei);
      }
      
      // Unsubscribe from socket updates
      if (locationUpdateHandlerRef.current) {
        socketService.unsubscribeFromVehicleLocation(locationUpdateHandlerRef.current);
        locationUpdateHandlerRef.current = null;
      }
      if (statusUpdateHandlerRef.current) {
        socketService.unsubscribeFromVehicleStatus(statusUpdateHandlerRef.current);
        statusUpdateHandlerRef.current = null;
      }
    };
  }, [vehicle?.imei, stopPolling]); // Only depend on vehicle IMEI, not entire vehicle object

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Cleanup vehicle marker overlay
      if (vehicleMarkerOverlayRef.current) {
        vehicleMarkerOverlayRef.current.setMap(null);
        vehicleMarkerOverlayRef.current = null;
      }
      
      // Cleanup polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      
      // Cleanup map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      
      // Stop polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]); // Include pollingInterval dependency

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
    <div className="live-tracking-show" key={`live-tracking-${imei}`}>
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
        <div 
          ref={mapRef}
          style={{ width: '100%', height: '100%' }}
        />

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