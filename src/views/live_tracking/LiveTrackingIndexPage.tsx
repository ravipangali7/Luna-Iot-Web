import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleMapReact from 'google-map-react';
import { vehicleService } from '../../api/services/vehicleService';
import type { Vehicle } from '../../types/vehicle';
import VehicleUtils, { VehicleState, VehicleImageState } from '../../utils/vehicleUtils';
import type { VehicleStateType } from '../../utils/vehicleUtils';
import VehicleCard from '../../components/VehicleCard';
import Pagination from '../../components/ui/pagination/Pagination';
import { useSocketUpdates } from '../../hooks/useSocketUpdates';
import { showError } from '../../utils/sweetAlert';
import './LiveTrackingIndexPage.css';

interface StatusCounts {
  all: number;
  stop: number;
  running: number;
  overspeed: number;
  idle: number;
  inactive: number;
  nodata: number;
}

// Map Marker Component
const MapMarker: React.FC<{
  lat: number;
  lng: number;
  vehicle: Vehicle;
  onClick: (vehicle: Vehicle) => void;
}> = ({ vehicle, onClick }) => {
  const vehicleState = VehicleUtils.getState(vehicle);
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

// Google Maps Component
const MapComponent: React.FC<{
  center: { lat: number; lng: number };
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
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
        bootstrapURLKeys={{ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '' }}
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

const LiveTrackingIndexPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchResults, setSearchResults] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<VehicleStateType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    stop: 0,
    running: 0,
    overspeed: 0,
    idle: 0,
    inactive: 0,
    nodata: 0
  });
  const [mapCenter] = useState<{ lat: number; lng: number }>({ lat: 28.3949, lng: 84.1240 }); // Nepal country center
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 25,
    has_next: false,
    has_previous: false,
    next_page: null,
    previous_page: null
  });

  // Use socket updates hook
  const { isConnected } = useSocketUpdates({ setVehicles });

  const calculateStatusCounts = useCallback((vehicleList: Vehicle[]) => {
    const counts: StatusCounts = {
      all: vehicleList.length,
      stop: 0,
      running: 0,
      overspeed: 0,
      idle: 0,
      inactive: 0,
      nodata: 0
    };

    vehicleList.forEach(vehicle => {
      const state = VehicleUtils.getState(vehicle);
      switch (state) {
        case VehicleState.STOPPED:
          counts.stop++;
          break;
        case VehicleState.RUNNING:
          counts.running++;
          break;
        case VehicleState.OVERSPEED:
          counts.overspeed++;
          break;
        case VehicleState.IDLE:
          counts.idle++;
          break;
        case VehicleState.INACTIVE:
          counts.inactive++;
          break;
        case VehicleState.NO_DATA:
          counts.nodata++;
          break;
      }
    });

    setStatusCounts(counts);
  }, []);

  // Load all vehicles for status counts (not paginated)
  const loadAllVehiclesForCounts = useCallback(async () => {
    try {
      const response = await vehicleService.getAllVehicles();
      if (response.success && response.data) {
        const vehiclesWithFallbacks = response.data.map(vehicle => ({
          ...vehicle,
          latestStatus: vehicle.latestStatus || null,
          latestLocation: vehicle.latestLocation || null
        }));
        calculateStatusCounts(vehiclesWithFallbacks);
      }
    } catch (error) {
      console.error('Error loading all vehicles for counts:', error);
    }
  }, [calculateStatusCounts]);

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehiclesPaginated(currentPage);
      
      if (response.success && response.data) {
        const vehiclesWithFallbacks = response.data.vehicles.map(vehicle => ({
          ...vehicle,
          latestStatus: vehicle.latestStatus || null,
          latestLocation: vehicle.latestLocation || null
        }));
        setVehicles(vehiclesWithFallbacks);
        setPagination(response.data.pagination);
        setIsSearchMode(false);
      } else {
        console.error('Failed to load vehicles:', response.error);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const loadSearchResults = useCallback(async (query: string, page: number = 1) => {
    try {
      setLoading(true);
      const response = await vehicleService.searchVehicles(query.trim(), page);
      
      if (response.success && response.data) {
        const vehiclesWithFallbacks = response.data.vehicles.map(vehicle => ({
          ...vehicle,
          latestStatus: vehicle.latestStatus || null,
          latestLocation: vehicle.latestLocation || null
        }));
        setSearchResults(vehiclesWithFallbacks);
        setPagination(response.data.pagination);
        setIsSearchMode(true);
      } else {
        console.error('Failed to search vehicles:', response.error);
      }
    } catch (error) {
      console.error('Error searching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterVehicles = useCallback(() => {
    const sourceVehicles = isSearchMode ? searchResults : vehicles;
    if (selectedFilter === 'all') {
      setFilteredVehicles(sourceVehicles);
    } else {
      const filtered = sourceVehicles.filter(vehicle => VehicleUtils.getState(vehicle) === selectedFilter);
      setFilteredVehicles(filtered);
    }
  }, [vehicles, searchResults, selectedFilter, isSearchMode]);

  // Load vehicles on component mount
  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Load vehicles when currentPage changes (only in normal mode)
  useEffect(() => {
    if (!isSearchMode) {
      loadVehicles();
    }
  }, [currentPage, loadVehicles, isSearchMode]);

  useEffect(() => {
    filterVehicles();
  }, [filterVehicles]);

  // Update filtered vehicles when switching between search and normal mode
  useEffect(() => {
    filterVehicles();
  }, [isSearchMode, filterVehicles]);

  // Load all vehicles for status counts on component mount
  useEffect(() => {
    loadAllVehiclesForCounts();
  }, [loadAllVehiclesForCounts]);

  const handleFilterClick = (filter: VehicleStateType | 'all') => {
    setSelectedFilter(filter);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchPageChange = async (page: number) => {
    if (!searchQuery) return;
    setCurrentPage(page);
    loadSearchResults(searchQuery, page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setSearchQuery('');
      setIsSearchMode(false);
      return;
    }
    
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to first page when searching
    loadSearchResults(searchInput, 1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setIsSearchMode(false);
    setCurrentPage(1);
    // Load default pagination data when clearing search
    loadVehicles();
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    // Check if vehicle is inactive
    if (!vehicle.is_active) {
      showError('Vehicle is inactive', 'This vehicle has been deactivated and cannot be accessed.');
      return;
    }
    
    // Navigate to live tracking show page
    navigate(`/live-tracking/${vehicle.imei}`);
  };

  const handleNavigate = (route: string, vehicle?: Vehicle) => {
    if (!vehicle) return;
    
    // Check if vehicle is inactive
    if (!vehicle.is_active) {
      showError('Vehicle is inactive', 'This vehicle has been deactivated and cannot be accessed.');
      return;
    }
    
    if (route === 'live-tracking' && vehicle) {
      navigate(`/live-tracking/${vehicle.imei}`);
    } else if (route === 'playback' && vehicle) {
      // Navigate to playback page with vehicle IMEI as query parameter
      navigate(`/playback?vehicle=${vehicle.imei}`);
    } else if (route === 'report' && vehicle) {
      // Navigate to reports page with vehicle IMEI as query parameter
      navigate(`/reports?vehicle=${vehicle.imei}`);
    }
  };

  const handleFindVehicle = (vehicle: Vehicle) => {
    if (vehicle.latestLocation?.latitude && vehicle.latestLocation?.longitude) {
      // Open Google Maps with vehicle location
      const url = `https://www.google.com/maps?q=${vehicle.latestLocation.latitude},${vehicle.latestLocation.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleWeather = (vehicle: Vehicle) => {
    console.log('Show weather for vehicle:', vehicle);
    // Add weather modal logic here
  };

  const handleRelayControl = (vehicle: Vehicle) => {
    console.log('Show relay control for vehicle:', vehicle);
    // Add relay control modal logic here
  };

  const handleDelete = (vehicle: Vehicle) => {
    console.log('Delete vehicle:', vehicle);
    // Add delete confirmation logic here
  };

  const handleNearby = (vehicle: Vehicle) => {
    console.log('Show nearby places for vehicle:', vehicle);
    // Add nearby places modal logic here
  };

  const getFilterButtonClass = (filter: VehicleStateType | 'all') => {
    const baseClass = 'filter-button';
    const activeClass = selectedFilter === filter ? 'active' : '';
    const stateClass = filter !== 'all' ? filter.toLowerCase() : '';
    return `${baseClass} ${activeClass} ${stateClass}`.trim();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading vehicles...</div>
      </div>
    );
  }

  return (
    <div className="live-tracking-container">
      {/* Header */}
      <div className="live-tracking-header">
        <div className="header-title">
          <span className="title-icon">🟢</span>
          <h3>Live Tracking</h3>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="search-container">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchInput}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="search-clear-btn"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              <button type="submit" className="search-submit-btn" title="Search">
                🔍
              </button>
            </div>
          </form>
        </div>
        
        {/* Status filters */}
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
            NO DATA: {statusCounts.nodata}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="live-tracking-content">
        {/* Vehicle list */}
        <div className="vehicle-list">
          <div className="vehicle-list-scrollable">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.imei}
                vehicle={vehicle}
                onVehicleClick={() => handleVehicleClick(vehicle)}
                showLocation={true}
                showAltitude={true}
                compact={true}
                onNavigate={handleNavigate}
                onFindVehicle={handleFindVehicle}
                onWeather={handleWeather}
                onRelayControl={handleRelayControl}
                onDelete={handleDelete}
                onNearby={handleNearby}
              />
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="map-container">
          <MapComponent
            center={mapCenter}
            vehicles={filteredVehicles}
            onVehicleClick={handleVehicleClick}
          />
        </div>
      </div>

      {/* Pagination at bottom */}
      {pagination.total_pages > 1 && (
        <div className="pagination-container">
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.total_pages}
            onPageChange={isSearchMode ? handleSearchPageChange : handlePageChange}
            hasNext={pagination.has_next}
            hasPrevious={pagination.has_previous}
            totalItems={pagination.total_items}
            pageSize={pagination.page_size}
          />
        </div>
      )}
    </div>
  );
};

export default LiveTrackingIndexPage;
