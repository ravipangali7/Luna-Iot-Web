import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../types/vehicle';
import VehicleUtils, { VehicleImageState } from '../utils/vehicleUtils';
import GeoUtils from '../utils/geoUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faMapPin,
  faPlay,
  faFileAlt,
  faRuler,
  faMountain,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
// import VehicleCardAccordion from './VehicleCardAccordion';
import './VehicleCard.css';

interface VehicleCardProps {
  vehicle: Vehicle;
  onVehicleClick: (vehicle: Vehicle) => void;
  showLocation?: boolean;
  showAltitude?: boolean;
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
  compact = false,
  onNavigate,
  // onFindVehicle,
  // onWeather,
  // onRelayControl,
  // onDelete,
  // onNearby
}) => {
  // const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [address, setAddress] = useState<string>('Loading...');
  const [altitude, setAltitude] = useState<string>('0');
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  const vehicleState = VehicleUtils.getState(vehicle);
  const lastUpdateTime = vehicle.latestStatus?.createdAt || vehicle.latestLocation?.createdAt || vehicle.updatedAt;
  const isInactive = !vehicle.is_active;
  
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


  const cardClass = `vehicle-card ${compact ? 'compact' : ''} ${isInactive ? 'inactive' : ''}`;

  return (
    <div className={cardClass} onClick={() => !isInactive && onVehicleClick(vehicle)}>
      {/* Header badges */}
      <div className="vehicle-card-header">
        {isInactive && (
          <div className="vehicle-badge inactive-badge">
            INACTIVE
          </div>
        )}
        {!isInactive && vehicle.ownershipType && (
          <div className="vehicle-badge ownership-badge">
            {vehicle.ownershipType.toUpperCase()}
          </div>
        )}
        {!isInactive && vehicle.latestStatus?.charging !== undefined && (
          <>
            {
              vehicle.latestStatus.charging ? <></> : (
                <div className={`vehicle-badge power-badge ${vehicle.latestStatus.charging ? 'connected' : 'disconnected'}`}>
                  {vehicle.latestStatus.charging ? 'POWER CONNECTED' : 'POWER DISCONNECTED'}
                </div>
              )
            }
          </>
        )}
      </div>

      {/* Main content */}
      <div className="vehicle-card-content">
        {/* First Item - Battery, Signal and Satellite Status */}
        <div className="status-row">
          <div className="status-icon" title="Battery">
            {VehicleUtils.getBattery(vehicle.latestStatus?.battery || 0)}
          </div>
          <div className="status-icon" title="Signal">
            {VehicleUtils.getSignal(vehicle.latestStatus?.signal || 0)}
          </div>
          <div className="status-icon" title="Satellite">
            {VehicleUtils.getSatellite(vehicle.latestLocation?.satellite || 0)}
          </div>
        </div>

        {/* Second Item - Vehicle Details Column */}
        <div className="vehicle-details-column">
          {/* First Row - Vehicle Info + Buttons + Data */}
          <div className="vehicle-info-row">
            {/* Vehicle Image and Details */}
            <div className="vehicle-info-section">
              <div className="vehicle-image-container">
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
                    target.src = '/assets/icon/status/car_stop.png';
                    target.onerror = null; // Prevent infinite loop
                  }}
                />
              </div>
              <div className="vehicle-details">
                <div className="vehicle-number">{vehicle.vehicleNo}</div>
                <div className="vehicle-name">{vehicle.name}</div>
              </div>
            </div>

            {/* Buttons and Data - Only show for active vehicles */}
            {!isInactive && (
              <div className="buttons-data-section">
                {/* Three Action Buttons */}
                <div className="action-buttons">
                  <button className="action-button live-tracking-btn" onClick={() => onNavigate?.('live-tracking', vehicle)}>
                    <FontAwesomeIcon icon={faMapPin} />
                  </button>
                  <button className="action-button playback-btn" onClick={() => onNavigate?.('playback', vehicle)}>
                    <FontAwesomeIcon icon={faPlay} />
                  </button>
                  <button className="action-button report-btn" onClick={() => onNavigate?.('report', vehicle)}>
                    <FontAwesomeIcon icon={faFileAlt} />
                  </button>
                </div>

                {/* Data Items */}
                <div className="data-items">
                  <div className="data-item">
                    <FontAwesomeIcon icon={faRuler} className="data-icon" />
                    <span className="data-text">{(vehicle.todayKm || 0).toFixed(2)} km</span>
                  </div>
                  <div className="data-item">
                    <FontAwesomeIcon icon={faMountain} className="data-icon" />
                    <span className="data-text">{altitude} m</span>
                  </div>
                  <div className="data-item">
                    <FontAwesomeIcon icon={faBolt} className="data-icon" />
                    <span className="data-text">{VehicleUtils.getDisplaySpeed(vehicle, vehicleState)} km/h</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Second Row - Geo Code and Last Data - Only show for active vehicles */}
          {!isInactive && (
            <div className="geo-data-row">
              <div className="geo-code">
                <FontAwesomeIcon icon={faMapPin} className="geo-icon" />
                <span className="geo-text">{isLoadingAddress ? 'Loading...' : address}</span>
              </div>
              <div className="last-data">
                <FontAwesomeIcon icon={faClock} className="last-data-icon" />
                <span className="last-data-text">
                  {lastUpdateTime ? VehicleUtils.getTimeAgoFromUTC(lastUpdateTime) : 'No data'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accordion */}
      {/* {onNavigate && (
        <VehicleCardAccordion
          vehicle={vehicle}
          isOpen={isAccordionOpen}
          onToggle={() => setIsAccordionOpen(!isAccordionOpen)}
          onNavigate={onNavigate}
          onFindVehicle={onFindVehicle || (() => { })}
          onWeather={onWeather || (() => { })}
          onRelayControl={onRelayControl || (() => { })}
          onDelete={onDelete || (() => { })}
          onNearby={onNearby || (() => { })}
        />
      )} */}
    </div>
  );
};

export default VehicleCard;