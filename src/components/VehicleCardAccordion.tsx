import React from 'react';
import type { Vehicle } from '../types/vehicle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faHistory,
  faChartBar,
  faBook,
  faEdit,
  faMap,
  faFlag,
  faSearch,
  faTools,
  faTrash,
  faDesktop,
  faSun,
  faShield,
  faPowerOff
} from '@fortawesome/free-solid-svg-icons';
import './VehicleCardAccordion.css';

interface VehicleCardAccordionProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (route: string, vehicle?: Vehicle) => void;
  onFindVehicle: (vehicle: Vehicle) => void;
  onWeather: (vehicle: Vehicle) => void;
  onRelayControl: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onNearby: (vehicle: Vehicle) => void;
}

const VehicleCardAccordion: React.FC<VehicleCardAccordionProps> = ({
  vehicle,
  isOpen,
  onToggle,
  onNavigate,
  onFindVehicle,
  onWeather,
  onRelayControl,
  onDelete,
  onNearby
}) => {
  const handleFeatureClick = (action: string) => {
    switch (action) {
      case 'live-tracking':
        onNavigate('/live-tracking/' + vehicle.imei);
        break;
      case 'history':
        onNavigate('/history/' + vehicle.imei, vehicle);
        break;
      case 'report':
        onNavigate('/report/' + vehicle.imei, vehicle);
        break;
      case 'vehicle-profile':
        onNavigate('/vehicle-profile/' + vehicle.imei, vehicle);
        break;
      case 'vehicle-edit':
        onNavigate('/vehicle-edit/' + vehicle.imei, vehicle);
        break;
      case 'geofence':
        onNavigate('/geofence');
        break;
      case 'nearby':
        onNearby(vehicle);
        break;
      case 'find-vehicle':
        onFindVehicle(vehicle);
        break;
      case 'fleet-record':
        onNavigate('/fleet-record/' + vehicle.imei, vehicle);
        break;
      case 'delete':
        onDelete(vehicle);
        break;
      case 'monitoring':
        onNavigate('/monitoring/' + vehicle.imei, vehicle);
        break;
      case 'weather':
        onWeather(vehicle);
        break;
      case 'relay':
        onRelayControl(vehicle);
        break;
      default:
        break;
    }
  };

  return (
    <div className="vehicle-accordion">
      {/* Accordion Header */}
      <div className="accordion-header" onClick={onToggle}>
        <div className="accordion-handle">
          <div className="handle-bar"></div>
        </div>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="accordion-content">
          {/* Vehicle Details & Top Row */}
          <div className="vehicle-details-section">
            <div className="vehicle-info">
              <img
                src={`/src/assets/icon/status/${vehicle.vehicleType?.toLowerCase()}_${vehicle.latestStatus?.ignition ? 'running' : 'stop'}.png`}
                alt="Vehicle"
                className="vehicle-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/icon/status/car_stop.png';
                }}
              />
              <div className="vehicle-text">
                <div className="vehicle-name">{vehicle.name}</div>
                <div className="vehicle-number">{vehicle.vehicleNo}</div>
              </div>
            </div>

            {/* Top Row Icons */}
            <div className="top-row-icons">
              <div 
                className="top-icon weather-icon"
                onClick={() => handleFeatureClick('weather')}
                title="Weather"
              >
                <FontAwesomeIcon icon={faSun} />
              </div>
              <div 
                className="top-icon shield-icon"
                onClick={() => handleFeatureClick('shield')}
                title="Shield"
              >
                <FontAwesomeIcon icon={faShield} />
              </div>
              <div 
                className="top-icon relay-icon"
                onClick={() => handleFeatureClick('relay')}
                title="Relay Control"
              >
                <FontAwesomeIcon icon={faPowerOff} />
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="feature-grid">
            {/* Row 1 */}
            <div className="feature-row">
              <div 
                className="feature-card live-tracking"
                onClick={() => handleFeatureClick('live-tracking')}
              >
                <FontAwesomeIcon icon={faLocationDot} />
                <span>Live Tracking</span>
              </div>
              <div 
                className="feature-card history"
                onClick={() => handleFeatureClick('history')}
              >
                <FontAwesomeIcon icon={faHistory} />
                <span>History</span>
              </div>
              <div 
                className="feature-card report"
                onClick={() => handleFeatureClick('report')}
              >
                <FontAwesomeIcon icon={faChartBar} />
                <span>Report</span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="feature-row">
              <div 
                className="feature-card vehicle-profile"
                onClick={() => handleFeatureClick('vehicle-profile')}
              >
                <FontAwesomeIcon icon={faBook} />
                <span>Vehicle Profile</span>
              </div>
              <div 
                className="feature-card vehicle-edit"
                onClick={() => handleFeatureClick('vehicle-edit')}
              >
                <FontAwesomeIcon icon={faEdit} />
                <span>Vehicle Edit</span>
              </div>
              <div 
                className="feature-card geofence"
                onClick={() => handleFeatureClick('geofence')}
              >
                <FontAwesomeIcon icon={faMap} />
                <span>Geofence</span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="feature-row">
              <div 
                className="feature-card nearby"
                onClick={() => handleFeatureClick('nearby')}
              >
                <FontAwesomeIcon icon={faFlag} />
                <span>Near By</span>
              </div>
              <div 
                className="feature-card find-vehicle"
                onClick={() => handleFeatureClick('find-vehicle')}
              >
                <FontAwesomeIcon icon={faSearch} />
                <span>Find Vehicle</span>
              </div>
              <div 
                className="feature-card fleet-record"
                onClick={() => handleFeatureClick('fleet-record')}
              >
                <FontAwesomeIcon icon={faTools} />
                <span>Fleet Record</span>
              </div>
            </div>

            {/* Row 4 - Admin Only */}
            <div className="feature-row admin-row">
              <div 
                className="feature-card delete"
                onClick={() => handleFeatureClick('delete')}
              >
                <FontAwesomeIcon icon={faTrash} />
                <span>Delete</span>
              </div>
              <div 
                className="feature-card monitoring"
                onClick={() => handleFeatureClick('monitoring')}
              >
                <FontAwesomeIcon icon={faDesktop} />
                <span>Monitoring</span>
              </div>
              <div className="feature-card empty"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleCardAccordion;
