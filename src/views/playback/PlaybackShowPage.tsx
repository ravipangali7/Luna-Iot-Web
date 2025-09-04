import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import { historyService } from '../../api/services/historyService';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import Input from '../../components/ui/forms/Input';
import Button from '../../components/ui/buttons/Button';
import Spinner from '../../components/ui/common/Spinner';
import Badge from '../../components/ui/common/Badge';
import GoogleMapContainer from '../../components/maps/GoogleMapContainer';
import type { Vehicle } from '../../types/vehicle';
import type { History, PlaybackState } from '../../types/history';

const PlaybackShowPage: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<History[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Date selection
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentIndex: 0,
    currentSpeed: 0,
    progress: 0
  });
  
  const animationRef = useRef<number>();

  useEffect(() => {
    if (imei) {
      loadVehicle();
      initializeDates();
    }
  }, [imei]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const loadVehicle = async () => {
    if (!imei) return;

    try {
      setLoading(true);
      const response = await vehicleService.getVehicleByImei(imei);
      
      if (response.success && response.data) {
        setVehicle(response.data);
      } else {
        console.error('Failed to load vehicle:', response.error);
        navigate('/playback');
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      navigate('/playback');
    } finally {
      setLoading(false);
    }
  };

  const initializeDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    setStartDate(yesterday.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const fetchHistoryData = async () => {
    if (!imei || !startDate || !endDate) return;

    try {
      setLoadingHistory(true);
      const response = await historyService.getCombinedHistoryByDateRange(
        imei,
        startDate,
        endDate
      );
      
      if (response.success && response.data) {
        setHistoryData(response.data);
        console.log('Fetched history data:', response.data.length, 'records');
        
        if (response.data.length === 0) {
          alert('No data found for selected date range');
        }
      } else {
        console.error('Failed to fetch history data:', response.error);
        alert('Failed to fetch history data: ' + response.error);
      }
    } catch (error) {
      console.error('Error fetching history data:', error);
      alert('Error fetching history data');
    } finally {
      setLoadingHistory(false);
    }
  };

  const startPlayback = () => {
    if (historyData.length === 0) {
      alert('No history data to play');
      return;
    }

    setPlaybackState(prev => ({
      ...prev,
      isPlaying: true,
      currentIndex: 0,
      progress: 0
    }));

    animatePlayback();
  };

  const stopPlayback = () => {
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: false
    }));

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const animatePlayback = () => {
    if (!playbackState.isPlaying || historyData.length === 0) return;

    const totalDuration = 30000; // 30 seconds for full playback
    const startTime = Date.now();
    const totalPoints = historyData.filter(h => h.type === 'location').length;

    const animate = () => {
      if (!playbackState.isPlaying) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      const currentIndex = Math.floor(progress * (totalPoints - 1));

      const currentHistory = historyData.filter(h => h.type === 'location')[currentIndex];
      
      setPlaybackState(prev => ({
        ...prev,
        currentIndex,
        progress,
        currentDateTime: currentHistory?.createdAt,
        currentSpeed: currentHistory?.speed || 0
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setPlaybackState(prev => ({
          ...prev,
          isPlaying: false
        }));
      }
    };

    animate();
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusBadge = (vehicle: Vehicle) => {
    if (!vehicle.latestStatus) {
      return <Badge variant="secondary">No Status</Badge>;
    }

    const ignition = vehicle.latestStatus.ignition;
    const speed = vehicle.latestStatus.speed || 0;

    if (ignition && speed > 0) {
      return <Badge variant="success">Running</Badge>;
    } else if (ignition && speed === 0) {
      return <Badge variant="warning">Idle</Badge>;
    } else {
      return <Badge variant="danger">Stopped</Badge>;
    }
  };

  const getAssignedUsers = (vehicle: Vehicle) => {
    if (vehicle.userVehicle && vehicle.userVehicle.user) {
      return vehicle.userVehicle.user.name;
    }
    return 'Unassigned';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Vehicle not found</p>
        <Button variant="primary" onClick={() => navigate('/playback')} className="mt-4">
          Back to Playback
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Playback: {vehicle.name}
          </h1>
          <p className="text-gray-600">{vehicle.vehicleNo} • {vehicle.imei}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/playback')}>
          Back to Playback
        </Button>
      </div>

      {/* Vehicle Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{vehicle.name}</h3>
              <p className="text-sm text-gray-600">{vehicle.vehicleNo}</p>
            </div>
            {getStatusBadge(vehicle)}
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">IMEI:</span>
              <p className="font-medium">{vehicle.imei}</p>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <p className="font-medium">{vehicle.vehicleType}</p>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <p className="font-medium">{vehicle.device?.phone || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Assigned to:</span>
              <p className="font-medium">{getAssignedUsers(vehicle)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Date Selection and Controls */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Date Range Selection</h3>
        </CardHeader>
        <CardBody>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(value) => setStartDate(value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(value) => setEndDate(value)}
              />
            </div>
            <Button
              variant="primary"
              onClick={fetchHistoryData}
              loading={loadingHistory}
              disabled={!startDate || !endDate}
            >
              Load History
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Map Container */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Route Playback</h3>
            <div className="flex gap-2">
              <Button
                variant={playbackState.isPlaying ? "danger" : "success"}
                onClick={playbackState.isPlaying ? stopPlayback : startPlayback}
                disabled={historyData.length === 0}
              >
                {playbackState.isPlaying ? 'Stop' : 'Play'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {/* Google Map Container */}
            {historyData.length > 0 ? (
              <GoogleMapContainer 
                historyData={historyData}
                playbackState={playbackState}
                className="h-96"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">No history data loaded</p>
                  <p className="text-sm text-gray-400">
                    Select a date range and click "Load History" to see the route
                  </p>
                </div>
              </div>
            )}

            {/* Playback Info */}
            {playbackState.isPlaying && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Current Time:</span>
                    <p className="text-gray-900">
                      {playbackState.currentDateTime 
                        ? new Date(playbackState.currentDateTime).toLocaleString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Speed:</span>
                    <p className="text-gray-900">{playbackState.currentSpeed.toFixed(1)} km/h</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Progress:</span>
                    <p className="text-gray-900">{(playbackState.progress * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Position:</span>
                    <p className="text-gray-900">{playbackState.currentIndex + 1} / {historyData.filter(h => h.type === 'location').length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* History Stats */}
            {historyData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-500">Total Records:</span>
                  <p className="font-medium text-lg">{historyData.length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-500">Location Points:</span>
                  <p className="font-medium text-lg">{historyData.filter(h => h.type === 'location').length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-500">Status Events:</span>
                  <p className="font-medium text-lg">{historyData.filter(h => h.type === 'status').length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-500">Date Range:</span>
                  <p className="font-medium text-lg">
                    {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default PlaybackShowPage;
