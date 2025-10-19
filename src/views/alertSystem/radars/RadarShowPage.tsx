import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { alertRadarService, alertHistoryService, type AlertRadar, type AlertHistory } from '../../../api/services/alertSystemService';
import { API_CONFIG } from '../../../config/config';
import { socketService, type AlertNotificationData } from '../../../services/socketService';
import GeoUtils from '../../../utils/geoUtils';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import GeofenceMap from '../../../components/maps/GeofenceMap';
import RadarAnimation from '../../../components/maps/RadarAnimation';
import AlertLocationMap from '../../../components/maps/AlertLocationMap';

const RadarShowPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [radar, setRadar] = useState<AlertRadar | null>(null);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [alertAddresses, setAlertAddresses] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Alert popup state
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<AlertNotificationData['alert_data'] | null>(null);
  const [alertAddress, setAlertAddress] = useState<string>('Loading address...');
  const [updatingAlert, setUpdatingAlert] = useState(false);
  const [alertStatus, setAlertStatus] = useState<string>('');
  const [alertRemarks, setAlertRemarks] = useState<string>('');
  
  // Audio ref for emergency siren
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInitializedRef = useRef(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Fetch addresses for all alerts
  const fetchAlertAddresses = useCallback(async (alerts: AlertHistory[]) => {
    const addressMap = new Map<number, string>();
    
    // Fetch all addresses in parallel
    await Promise.all(
      alerts.map(async (alert) => {
        try {
          const address = await GeoUtils.getReverseGeoCode(
            Number(alert.latitude),
            Number(alert.longitude)
          );
          addressMap.set(alert.id, address);
        } catch (error) {
          console.error(`Error fetching address for alert ${alert.id}:`, error);
          addressMap.set(alert.id, 'Location unavailable');
        }
      })
    );
    
    setAlertAddresses(addressMap);
  }, []);

  // Fetch radar data by token
  const fetchRadarData = useCallback(async () => {
    if (!token) {
      setError('Invalid radar token');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const radarData = await alertRadarService.getByToken(token);
      setRadar(radarData);

      // Public access - no authentication required

      // Fetch alert history for this radar
      try {
        const historyData = await alertHistoryService.getByRadar(radarData.id);
        setAlertHistory(historyData || []);
        // Load geocoded addresses in background (non-blocking)
        if (historyData && historyData.length > 0) {
          fetchAlertAddresses(historyData).catch(error => 
            console.warn('Error fetching addresses in background:', error)
          );
        }
      } catch (historyError) {
        console.warn('Could not fetch alert history:', historyError);
        setAlertHistory([]);
      }
    } catch (err: unknown) {
      console.error('Error fetching radar data:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load radar data. Please check the token.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, fetchAlertAddresses]);

  // Fetch alert history for a specific radar
  const fetchAlertHistory = useCallback(async (radarId: number) => {
    try {
      const historyData = await alertHistoryService.getByRadar(radarId);
      setAlertHistory(historyData || []);
      // Load geocoded addresses in background (non-blocking)
      if (historyData && historyData.length > 0) {
        fetchAlertAddresses(historyData).catch(error => 
          console.warn('Error fetching addresses in background:', error)
        );
      }
    } catch (historyError) {
      console.warn('Could not fetch alert history:', historyError);
    }
  }, [fetchAlertAddresses]);


  useEffect(() => {
    fetchRadarData();
  }, [fetchRadarData]);

  // Initialize siren audio
  useEffect(() => {
    audioRef.current = new Audio('/sound/siren.mp3');
    audioRef.current.volume = 1; // 70% volume
    
    // Try to enable audio immediately on page load
    const tryEnableImmediately = async () => {
      if (audioRef.current) {
        try {
          audioRef.current.volume = 0;
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.volume = 0.7;
          audioRef.current.currentTime = 0;
          setAudioEnabled(true);
          audioInitializedRef.current = true;
          console.log('Audio enabled immediately on page load');
          return true;
        } catch (err) {
          console.log('Immediate audio enable failed:', err);
          return false;
        }
      }
      return false;
    };
    
    // Try to enable audio on any user interaction
    const enableAudioOnInteraction = async () => {
      if (!audioInitializedRef.current && audioRef.current) {
        try {
          audioRef.current.volume = 0;
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.volume = 0.7;
          audioRef.current.currentTime = 0;
          setAudioEnabled(true);
          audioInitializedRef.current = true;
          console.log('Audio enabled on user interaction');
          // Remove listeners after successful enable
          document.removeEventListener('click', enableAudioOnInteraction);
          document.removeEventListener('touchstart', enableAudioOnInteraction);
          document.removeEventListener('keydown', enableAudioOnInteraction);
          document.removeEventListener('mousemove', enableAudioOnInteraction);
        } catch (err) {
          console.log('Audio enable failed:', err);
        }
      }
    };
    
    // Try to enable immediately
    tryEnableImmediately();
    
    // Set up listeners for user interaction - more aggressive approach
    document.addEventListener('click', enableAudioOnInteraction);
    document.addEventListener('touchstart', enableAudioOnInteraction);
    document.addEventListener('keydown', enableAudioOnInteraction);
    document.addEventListener('mousemove', enableAudioOnInteraction);
    
    // Also try to enable on radar page specific interactions
    const radarContainer = document.querySelector('.fixed.inset-0');
    if (radarContainer) {
      radarContainer.addEventListener('click', enableAudioOnInteraction);
      radarContainer.addEventListener('touchstart', enableAudioOnInteraction);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
      document.removeEventListener('keydown', enableAudioOnInteraction);
      document.removeEventListener('mousemove', enableAudioOnInteraction);
      if (radarContainer) {
        radarContainer.removeEventListener('click', enableAudioOnInteraction);
        radarContainer.removeEventListener('touchstart', enableAudioOnInteraction);
      }
    };
  }, []);


  // Socket connection and alert handling
  useEffect(() => {
    if (!token || !radar) return;

    // Connect to socket if not already connected
    if (!socketService.connected) {
      socketService.connect();
    }

    // Join radar room
    socketService.joinRadarRoom(token);

    // Set up alert notification handler
    const handleNewAlert = (alertData: AlertNotificationData) => {
      console.log('New alert received:', alertData);
      
      // Try to enable audio if not already enabled
      const tryEnableAudio = async () => {
        if (!audioInitializedRef.current && audioRef.current) {
          try {
            audioRef.current.volume = 0;
            await audioRef.current.play();
            audioRef.current.pause();
            audioRef.current.volume = 0.7;
            audioRef.current.currentTime = 0;
            setAudioEnabled(true);
            audioInitializedRef.current = true;
            console.log('Audio enabled on alert');
            return true;
          } catch (err) {
            console.log('Audio enable failed on alert:', err);
            return false;
          }
        }
        return audioInitializedRef.current;
      };
      
      // Try to enable audio and play siren
      tryEnableAudio().then(audioReady => {
        if (audioReady && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => {
            console.error('Error playing alert sound:', err);
            // Show visual alert as fallback
            document.title = '🚨 NEW ALERT! - Radar';
          });
        } else {
          // Audio not ready yet, show visual alert
          console.log('Audio not ready yet, showing visual alert');
          document.title = '🚨 NEW ALERT! - Radar';
        }
      });
      
      // Show popup with alert details
      setCurrentAlert(alertData.alert_data);
      setShowAlertPopup(true);
      
      // Refresh alert history
      if (radar) {
        fetchAlertHistory(radar.id);
      }
    };

    // Register the alert handler
    socketService.onNewAlert(handleNewAlert);

    // Cleanup on unmount
    return () => {
      socketService.leaveRadarRoom(token);
    };
  }, [token, radar, fetchAlertHistory, audioEnabled]);

  // Fetch reverse geocoded address when alert is shown
  useEffect(() => {
    if (currentAlert) {
      setAlertStatus(currentAlert.status);
      setAlertRemarks(currentAlert.remarks || '');
      
      // Fetch address
      GeoUtils.getReverseGeoCode(currentAlert.latitude, currentAlert.longitude)
        .then(address => setAlertAddress(address))
        .catch(() => setAlertAddress('Address unavailable'));
    }
  }, [currentAlert]);

  // Handle alert status/remarks update
  const handleAlertUpdate = async () => {
    if (!currentAlert) return;
    
    try {
      setUpdatingAlert(true);
      
      // Update status if changed
      if (alertStatus !== currentAlert.status) {
        await alertHistoryService.updateStatus(currentAlert.id, { status: alertStatus });
      }
      
      // Update remarks if changed
      if (alertRemarks !== (currentAlert.remarks || '')) {
        await alertHistoryService.updateRemarks(currentAlert.id, { remarks: alertRemarks });
      }
      
      showSuccess('Alert updated successfully!');
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setShowAlertPopup(false);
      
      // Refresh alert history
      if (radar) {
        fetchAlertHistory(radar.id);
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      showError('Failed to update alert');
    } finally {
      setUpdatingAlert(false);
    }
  };

  // Calculate geofence center for radar animation
  const getGeofenceCenter = useCallback(() => {
    if (!radar?.alert_geofences || radar.alert_geofences.length === 0) {
      return { lat: 27.7172, lng: 85.3240 }; // Default to Kathmandu
    }

    // Calculate center from first geofence
    const firstGeofence = radar.alert_geofences[0];
    if (firstGeofence.boundary && firstGeofence.boundary.coordinates) {
      const coordinates = firstGeofence.boundary.coordinates[0];
      if (Array.isArray(coordinates) && coordinates.length > 0) {
        const latSum = coordinates.reduce((sum, coord) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            return sum + (coord[1] as number);
          }
          return sum;
        }, 0);
        const lngSum = coordinates.reduce((sum, coord) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            return sum + (coord[0] as number);
          }
          return sum;
        }, 0);
        return {
          lat: latSum / coordinates.length,
          lng: lngSum / coordinates.length
        };
      }
    }

    return { lat: 27.7172, lng: 85.3240 };
  }, [radar]);

  // Format datetime for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading radar data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!radar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Alert variant="danger" className="mb-4">
            Radar not found
          </Alert>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const geofenceCenter = getGeofenceCenter();

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Full Screen Map */}
      <div className="absolute inset-0 w-full h-full">
        {radar.alert_geofences && radar.alert_geofences.length > 0 ? (
          <>
            <GeofenceMap
              center={{ lat: 28.3949, lng: 84.1240 }}
              zoom={9}
              boundary={radar.alert_geofences[0].boundary}
              readOnly={true}
              fitToBounds={false}
              height="100vh"
              onBoundaryChange={() => {}} // Empty function for read-only mode
            />
            
            {/* Radar Animation - Fixed size at geofence center */}
            <div className="absolute ml-[15rem] inset-0 pointer-events-none z-10 flex items-center justify-center">
              <RadarAnimation
                center={geofenceCenter}
                duration={3000}
              />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">No geofences configured for this radar</p>
          </div>
        )}
      </div>

      {/* Floating Header Card - Same width as sidebar */}
      <div 
        className="absolute top-4 left-4 z-20"
        style={{ width: '300px', maxWidth: 'calc(100vw - 2rem)' }}
      >
        <Card className="shadow-xl">
          <div className="px-4 py-3">
            <div className="flex items-center space-x-3">
              {radar.institute.logo && (
                <img
                  src={`${API_CONFIG.BASE_URL}${radar.institute.logo}`}
                  alt={`${radar.institute.name} logo`}
                  className="h-12 w-12 object-cover rounded-lg shadow-md flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {radar.institute.name}
                </h1>
                <p className="text-xs text-gray-600">Alert System</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Floating Sidebar Card - Alert History */}
      <div 
        className="absolute left-4 bottom-4 z-20"
        style={{ 
          width: '300px', 
          maxWidth: 'calc(100vw - 2rem)',
          top: 'calc(1rem + 92px)' // Position below header
        }}
      >
        <Card className="h-full shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Alert History</h2>
            <p className="text-sm text-gray-600">
              {alertHistory.length} alerts found
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {alertHistory.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="font-medium">No alerts found</p>
                <p className="text-sm mt-1">Alerts will appear here when triggered</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {alertHistory.map((alert) => (
                  <Card key={alert.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={getStatusVariant(alert.status)}>
                        {alert.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(alert.datetime)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {alert.alert_type_name}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {alert.name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {alert.primary_phone}
                      </p>
                      {alertAddresses.get(alert.id) && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="line-clamp-2">{alertAddresses.get(alert.id)}</span>
                        </p>
                      )}
                      {alert.remarks && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2 italic">
                          {alert.remarks}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Alert Popup Modal */}
      {showAlertPopup && currentAlert && (
        <div style={{backgroundColor: 'rgba(0,0,0,0.7)'}} className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Alert Details</h3>
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.currentTime = 0;
                    }
                    setShowAlertPopup(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Address Section */}
              <div className="mb-4">
                <p className="text-base text-gray-900">{alertAddress}</p>
              </div>
              
              {/* Badges Row */}
              <div className="flex gap-3 mb-4">
                <Badge variant="danger" className="px-3 py-2 text-sm font-medium">
                  {currentAlert.alert_type_name}
                </Badge>
                <Badge variant="primary" className="px-3 py-2 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {currentAlert.name}
                </Badge>
                <Badge variant="primary" className="px-3 py-2 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {currentAlert.primary_phone}
                </Badge>
              </div>
              
              {/* Coordinates */}
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {Number(currentAlert.latitude).toFixed(6)}, {Number(currentAlert.longitude).toFixed(6)}
              </div>
              
              {/* Map */}
              <div className="mb-4">
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <AlertLocationMap 
                    latitude={Number(currentAlert.latitude)} 
                    longitude={Number(currentAlert.longitude)} 
                    height="200px" 
                  />
                </div>
              </div>
              
              {/* Image Section - Show for non-app sources */}
              {currentAlert.source !== 'app' && currentAlert.image && (
                <div className="mb-4">
                  <img
                    src={`${API_CONFIG.BASE_URL}${currentAlert.image}`}
                    alt="Alert image"
                    className="w-full h-auto rounded-md border border-gray-200"
                  />
                </div>
              )}
              
              {/* Review SOS Request Section */}
              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900">Review SOS Request</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={alertRemarks}
                    onChange={(e) => setAlertRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add remarks..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="approved"
                        checked={alertStatus === 'approved'}
                        onChange={(e) => setAlertStatus(e.target.value)}
                        className="mr-2"
                      />
                      Approve
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="rejected"
                        checked={alertStatus === 'rejected'}
                        onChange={(e) => setAlertStatus(e.target.value)}
                        className="mr-2"
                      />
                      Disapprove
                    </label>
                  </div>
                </div>
                
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAlertUpdate}
                  disabled={updatingAlert}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updatingAlert ? (
                    <>
                      <Spinner size="sm" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Submit Action</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.currentTime = 0;
                    }
                    setShowAlertPopup(false);
                  }}
                  disabled={updatingAlert}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes flash {
          0%, 100% { background-color: white; }
          50% { background-color: #fee; }
        }
      `}</style>
    </div>
  );
};

export default RadarShowPage;
