import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../types/vehicle';
import VehicleUtils, { VehicleImageState } from '../utils/vehicleUtils';
import GeoUtils from '../utils/geoUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBolt, 
  faClock, 
  faCalendarDay, 
  faGasPump, 
  faRuler, 
  faMountain,
  faSatelliteDish,
  faBatteryHalf,
  faSignal,
  faMapPin
} from '@fortawesome/free-solid-svg-icons';
import VehicleCardAccordion from './VehicleCardAccordion';
import './VehicleCard.css';

interface VehicleCardProps {
  vehicle: Vehicle;
  onVehicleClick: (vehicle: Vehicle) => void;
  showLocation?: boolean;
  showAltitude?: boolean;
  showStats?: boolean;
  compact?: boolean;
  onNavigate?: (route: string, vehicle?: Vehicle) => void;
  onFindVehicle?: (vehicle: Vehicle) => void;
  onWeather?: (vehicle: Vehicle) => void;
  onRelayControl?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
  onNearby?: (vehicle: Vehicle) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ 
  vehicle, 
  onVehicleClick,
  showLocation = true,
  showAltitude = true,
  showStats = true,
  compact = false,
  onNavigate,
  onFindVehicle,
  onWeather,
  onRelayControl,
  onDelete,
  onNearby
}) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [address, setAddress] = useState<string>('Loading...');
  const [altitude, setAltitude] = useState<string>('0');
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  const vehicleState = VehicleUtils.getState(vehicle);
  const stateColor = VehicleUtils.getStateColor(vehicleState);
  const displaySpeed = VehicleUtils.getDisplaySpeed(vehicle, vehicleState);
  const fuelConsumption = VehicleUtils.getFuelConsumption(vehicle.todayKm || 0, vehicle.mileage || 1);
  const lastUpdateTime = vehicle.latestStatus?.createdAt || vehicle.latestLocation?.createdAt || vehicle.updatedAt;

  useEffect(() => {
    const loadLocationData = async () => {
      if (vehicle.latestLocation?.latitude && vehicle.latestLocation?.longitude) {
        try {
          const promises = [];
          
          if (showLocation) {
            promises.push(
              GeoUtils.getReverseGeoCode(vehicle.latestLocation.latitude, vehicle.latestLocation.longitude)
            );
          }
          
          if (showAltitude) {
            promises.push(
              GeoUtils.getAltitude(vehicle.latestLocation.latitude, vehicle.latestLocation.longitude)
            );
          }

          const results = await Promise.all(promises);
          
          if (showLocation) {
            setAddress(results[0] as string);
          }
          
          if (showAltitude) {
            setAltitude(results[showLocation ? 1 : 0] as string);
          }
        } catch (error) {
          console.error('Error loading location data:', error);
          setAddress('Location unavailable');
        } finally {
          setIsLoadingAddress(false);
        }
      } else {
        setAddress('No location data');
        setIsLoadingAddress(false);
      }
    };

    loadLocationData();
  }, [vehicle.latestLocation, showLocation, showAltitude]);


  const cardClass = `vehicle-card ${compact ? 'compact' : ''}`;

  return (
    <div className={cardClass} onClick={() => onVehicleClick(vehicle)}>
      {/* Header badges */}
      <div className="vehicle-card-header">
        {vehicle.ownershipType && (
          <div className="vehicle-badge ownership-badge">
            {vehicle.ownershipType.toUpperCase()}
          </div>
        )}
        {vehicle.latestStatus?.charging !== undefined && (
          <div className={`vehicle-badge power-badge ${vehicle.latestStatus.charging ? 'connected' : 'disconnected'}`}>
            {vehicle.latestStatus.charging ? 'POWER CONNECTED' : 'POWER DISCONNECTED'}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="vehicle-card-content">
        <div className="vehicle-info">
          {/* Vehicle image and details */}
          <div className="vehicle-image-section">
            <img
              src={VehicleUtils.getImagePath(
                vehicle.vehicleType || 'car',
                vehicleState,
                VehicleImageState.STATUS
              )}
              alt={vehicle.vehicleType}
              className="vehicle-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/src/assets/icon/status/car_stop.png';
                target.onerror = null; // Prevent infinite loop
              }}
            />
            <div className="vehicle-details">
              <div className="vehicle-number">{vehicle.vehicleNo}</div>
              <div className="vehicle-name">({vehicle.name})</div>
            </div>
          </div>

          {/* Speed and status */}
          <div className="speed-section">
            <div className="speed-display" style={{ backgroundColor: stateColor }}>
              <div className="speed-info">
                <FontAwesomeIcon icon={faBolt} className="speed-icon" />
                <span className="speed-value">{displaySpeed} km/h</span>
              </div>
              <div className="status-text">{vehicleState.toUpperCase()}</div>
            </div>

            {/* Status icons */}
            <div className="status-icons">
              <div className="status-icon" title="Satellite">
                <FontAwesomeIcon 
                  icon={faSatelliteDish} 
                  style={{ color: VehicleUtils.getSatelliteColor(vehicle.latestLocation?.satellite || 0) }}
                />
              </div>
              <div className="status-icon" title="Battery">
                <FontAwesomeIcon 
                  icon={faBatteryHalf} 
                  style={{ color: VehicleUtils.getBatteryColor(vehicle.latestStatus?.battery || 0) }}
                />
              </div>
              <div className="status-icon" title="Signal">
                <FontAwesomeIcon 
                  icon={faSignal} 
                  style={{ color: VehicleUtils.getSignalColor(vehicle.latestStatus?.signal || 0) }}
                />
              </div>
            </div>
          </div>

          {/* Stats - only show if showStats is true */}
          {showStats && (
            <div className="stats-section">
              <div className="stats-row">
                <div className="stat-card">
                  <FontAwesomeIcon icon={faCalendarDay} className="stat-icon" />
                  <div className="stat-label">Today</div>
                  <div className="stat-value">{(vehicle.todayKm || 0).toFixed(2)}Km</div>
                </div>
                <div className="stat-card">
                  <FontAwesomeIcon icon={faGasPump} className="stat-icon" />
                  <div className="stat-label">Fuel</div>
                  <div className="stat-value">{fuelConsumption.toFixed(2)}L</div>
                </div>
              </div>
              <div className="stats-row">
                <div className="stat-card">
                  <FontAwesomeIcon icon={faRuler} className="stat-icon" />
                  <div className="stat-label">ODO</div>
                  <div className="stat-value">{vehicle.odometer}Km</div>
                </div>
                {showAltitude && (
                  <div className="stat-card">
                    <FontAwesomeIcon icon={faMountain} className="stat-icon" />
                    <div className="stat-label">Altitude</div>
                    <div className="stat-value">{altitude}m</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Last update */}
        <div className="last-update">
          <FontAwesomeIcon icon={faClock} className="update-icon" />
          <span className="update-text">
            {lastUpdateTime ? VehicleUtils.getTimeAgo(new Date(lastUpdateTime)) : 'No data available'}
          </span>
        </div>

        {/* Location - only show if showLocation is true */}
        {showLocation && (
          <div className="location-info">
            <FontAwesomeIcon icon={faMapPin} className="location-icon" />
            <span className="location-text">
              {isLoadingAddress ? 'Loading...' : address}
            </span>
          </div>
        )}

        {/* Accordion */}
        {onNavigate && (
          <VehicleCardAccordion
            vehicle={vehicle}
            isOpen={isAccordionOpen}
            onToggle={() => setIsAccordionOpen(!isAccordionOpen)}
            onNavigate={onNavigate}
            onFindVehicle={onFindVehicle || (() => {})}
            onWeather={onWeather || (() => {})}
            onRelayControl={onRelayControl || (() => {})}
            onDelete={onDelete || (() => {})}
            onNearby={onNearby || (() => {})}
          />
        )}
      </div>
    </div>
  );
};

export default VehicleCard;
