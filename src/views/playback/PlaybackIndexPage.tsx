import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import { historyService } from '../../api/services/historyService';
import GeoUtils from '../../utils/geoUtils';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import DatePicker from '../../components/ui/forms/DatePicker';
import Select from '../../components/ui/forms/Select';
import Button from '../../components/ui/buttons/Button';
import Spinner from '../../components/ui/common/Spinner';
import GoogleMapContainer from '../../components/maps/GoogleMapContainer';
import { handleVehicleAction, VEHICLE_ACTIONS } from '../../utils/vehicleActionUtils';
import type { Vehicle } from '../../types/vehicle';
import type { History, Trip, PlaybackState } from '../../types/history';

const PlaybackIndexPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Data state
  const [historyData, setHistoryData] = useState<History[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedVehicleData, setSelectedVehicleData] = useState<Vehicle | null>(null);
  const [tripSegments, setTripSegments] = useState<Array<{
    startTime: string;
    endTime: string;
    startLocation: string;
    endLocation: string;
    distance: number;
    duration: number;
    avgSpeed: number;
    maxSpeed: number;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
  }>>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Playback state
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentIndex: 0,
    currentSpeed: 0,
    progress: 0
  });

  const animationRef = useRef<number>();

  useEffect(() => {
    loadVehicles();
    initializeDates();
  }, []);


  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getLightVehicles();
      
      if (response.success && response.data) {
        setVehicles(response.data);
      } else {
        console.error('Failed to load vehicles:', response.error);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
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

  // Get today's date in YYYY-MM-DD format for max date validation
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Handle start date change
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    
    // If end date is before new start date, reset end date to start date
    if (endDate && date && endDate < date) {
      setEndDate(date);
    }
  };

  // Handle end date change
  const handleEndDateChange = (date: string) => {
    setEndDate(date);
  };

  // Handle vehicle selection with inactive check
  const handleVehicleChange = (vehicleImei: string) => {
    const vehicle = vehicles.find(v => v.imei === vehicleImei);
    if (vehicle) {
      handleVehicleAction(
        vehicle,
        VEHICLE_ACTIONS.HISTORY,
        () => {
          setSelectedVehicle(vehicleImei);
          setSelectedVehicleData(vehicle);
        }
      );
    }
  };

  const fetchHistoryData = useCallback(async () => {
    if (!selectedVehicle || !startDate || !endDate) {
      return;
    }

    const calculateTrips = async (history: History[]) => {
      // Simple trip calculation based on ignition status
      const locationData = history.filter(h => h.type === 'location' && h.latitude && h.longitude);

      const trips: Trip[] = [];
      const segments: Array<{
        startTime: string;
        endTime: string;
        startLocation: string;
        endLocation: string;
        distance: number;
        duration: number;
        avgSpeed: number;
        maxSpeed: number;
        startLat: number;
        startLng: number;
        endLat: number;
        endLng: number;
      }> = [];

      let currentTrip: History[] = [];
      let tripNumber = 1;

      for (let i = 0; i < locationData.length; i++) {
        const currentPoint = locationData[i];
        currentTrip.push(currentPoint);

        // Check if this is the end of a trip (next point is far away or ignition off)
        const nextPoint = locationData[i + 1];
        if (!nextPoint ||
          (nextPoint.createdAt && currentPoint.createdAt &&
            new Date(nextPoint.createdAt).getTime() - new Date(currentPoint.createdAt).getTime() > 5 * 60 * 1000)) {

          if (currentTrip.length > 1) {
            const startPoint = currentTrip[0];
            const endPoint = currentTrip[currentTrip.length - 1];

            // Calculate distance (simplified)
            const distance = calculateDistance(
              startPoint.latitude!, startPoint.longitude!,
              endPoint.latitude!, endPoint.longitude!
            );

            // Calculate duration
            const duration = startPoint.createdAt && endPoint.createdAt ?
              (new Date(endPoint.createdAt).getTime() - new Date(startPoint.createdAt).getTime()) / (1000 * 60) : 0;

            // Calculate average and max speed
            const speeds = currentTrip.map(point => point.speed || 0).filter(speed => speed > 0);
            const avgSpeed = speeds.length > 0 ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length : 0;
            const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

            trips.push({
              tripNumber,
              startTime: startPoint.createdAt || '',
              endTime: endPoint.createdAt || '',
              startLatitude: startPoint.latitude!,
              startLongitude: startPoint.longitude!,
              endLatitude: endPoint.latitude!,
              endLongitude: endPoint.longitude!,
              distance,
              duration,
              avgSpeed,
              maxSpeed,
              tripPoints: currentTrip
            });

            // Create segment for detailed view
            segments.push({
              startTime: startPoint.createdAt || '',
              endTime: endPoint.createdAt || '',
              startLocation: 'Loading...',
              endLocation: 'Loading...',
              distance,
              duration,
              avgSpeed,
              maxSpeed,
              startLat: startPoint.latitude!,
              startLng: startPoint.longitude!,
              endLat: endPoint.latitude!,
              endLng: endPoint.longitude!
            });

            tripNumber++;
          }
          currentTrip = [];
        }
      }

      setTrips(trips);
      setTripSegments(segments);

      // Load addresses for segments
      setLoadingAddresses(true);
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        try {
          const startAddress = await GeoUtils.getReverseGeoCode(segment.startLat, segment.startLng);
          const endAddress = await GeoUtils.getReverseGeoCode(segment.endLat, segment.endLng);
          
          setTripSegments(prev => prev.map((s, index) => 
            index === i 
              ? { ...s, startLocation: startAddress, endLocation: endAddress }
              : s
          ));
        } catch (error) {
          console.error('Error loading address for segment:', error);
        }
      }
      setLoadingAddresses(false);
    };

    try {
      setLoadingHistory(true);

      // Find the selected vehicle data
      const vehicleData = vehicles.find(v => v.imei === selectedVehicle);
      if (vehicleData) {
        setSelectedVehicleData(vehicleData);
      }

      const response = await historyService.getCombinedHistoryByDateRange(selectedVehicle, startDate, endDate);

      if (response.success && response.data) {
        setHistoryData(response.data);
        await calculateTrips(response.data);
      } else {
        console.error('Failed to load history:', response.error);
        setHistoryData([]);
        setTrips([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistoryData([]);
      setTrips([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedVehicle, startDate, endDate, vehicles]);

  // Handle URL parameters for pre-selecting vehicle
  useEffect(() => {
    const vehicleImei = searchParams.get('vehicle');
    if (vehicleImei && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.imei === vehicleImei);
      if (vehicle) {
        // Check if vehicle is inactive
        if (!vehicle.is_active) {
          handleVehicleAction(
            vehicle,
            VEHICLE_ACTIONS.HISTORY,
            () => {
              // This won't be called since the vehicle is inactive
            }
          );
          return;
        }
        
        setSelectedVehicle(vehicleImei);
        setSelectedVehicleData(vehicle);
        
        // Auto-load data when vehicle is pre-selected
        if (startDate && endDate) {
          console.log('🚀 Auto-loading playback data for vehicle:', vehicleImei);
          setTimeout(() => {
            fetchHistoryData();
          }, 100);
        }
      }
    }
  }, [searchParams, vehicles, startDate, endDate, fetchHistoryData]);


  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
    setHistoryData(trip.tripPoints);
  };

  const handlePlayback = () => {
    if (playbackState.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    if (historyData.length === 0) return;

    setPlaybackState(prev => ({ ...prev, isPlaying: true, currentIndex: 0 }));

    const animate = () => {
      setPlaybackState(prev => {
        if (prev.currentIndex >= historyData.length - 1) {
          return { ...prev, isPlaying: false, currentIndex: 0 };
        }

        const nextIndex = prev.currentIndex + 1;
        const progress = nextIndex / (historyData.length - 1);

        animationRef.current = requestAnimationFrame(animate);

        let currentDateTime = '';
        const createdAt = historyData[nextIndex]?.createdAt;
        if (createdAt) {
          const dateObj = new Date(createdAt);
          if (!isNaN(dateObj.getTime())) {
            const [date, timeWithMs] = dateObj.toISOString().split('T');
            const time = timeWithMs?.split('.')[0] || '';
            currentDateTime = `${date} ${time}`;
          }
        }

        return {
          ...prev,
          currentIndex: nextIndex,
          progress,
          currentSpeed: historyData[nextIndex]?.speed || 0,
          currentDateTime: currentDateTime,
        };
      });
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const stopPlayback = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
  };

  const vehicleOptions = [
    { value: '', label: '-- SELECT VEHICLE --' },
    ...vehicles.map(vehicle => ({
      value: vehicle.imei,
      label: `${vehicle.vehicleNo} - ${vehicle.name}`
    }))
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Playback History</h1>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Vehicle
              </label>
              <Select
                options={vehicleOptions}
                value={selectedVehicle}
                onChange={handleVehicleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <DatePicker
                value={startDate}
                onChange={handleStartDateChange}
                max={getTodayString()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <DatePicker
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || undefined}
                max={getTodayString()}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                onClick={fetchHistoryData}
                loading={loadingHistory}
                disabled={!selectedVehicle || !startDate || !endDate}
                className="w-full"
              >
                GO
              </Button>
              {historyData.length > 0 && (
                <Button
                  variant={playbackState.isPlaying ? "danger" : "primary"}
                  onClick={handlePlayback}
                  disabled={loadingHistory}
                >
                  {playbackState.isPlaying ? 'Stop' : 'Play'}
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content */}
      {historyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          {/* Trip List Sidebar */}
          <div className="lg:col-span-1 h-full">
            <Card>
              {/* <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Trip List</h3>
                <p className="text-sm text-gray-600">{trips.length} trips found</p>
              </CardHeader> */}
              <div className="space-y-0 h-[69vh] overflow-y-auto">
                {loadingAddresses && (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                    <span className="ml-2 text-sm text-gray-600">Loading addresses...</span>
                </div>
                )}

                {tripSegments.map((segment, index) => (
                  <div
                    key={index}
                    className={`relative cursor-pointer m-2 transition-colors border-b border-gray-100 last:border-b-0 ${selectedTrip?.tripNumber === index + 1
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                      }`}
                    onClick={() => {
                      const trip = trips[index];
                      if (trip) handleTripSelect(trip);
                    }}
                  >
                    <Card>
                    {/* Timeline connector line */}
                    {index < tripSegments.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-300 z-0"></div>
                    )}

                    <div className="relative flex items-start p-4">
                      {/* Timeline dot */}
                      <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${selectedTrip?.tripNumber === index + 1 ? 'bg-blue-500' : 'bg-orange-500'
                        }`}></div>

                      {/* Trip content */}
                      <div className="ml-4 flex-1">
                        {/* Start time and location */}
                        <div className="mb-3">
                          <div className="text-sm font-bold text-gray-800">
                            {new Date(segment.startTime).toISOString().split('T')[0]},
                            {new Date(segment.startTime).toISOString().split('T')[1].split('.')[0]}
              </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {segment.startLocation}
                  </div>
                  </div>

                        {/* End time and location */}
                        <div className="mb-3">
                          <div className="text-sm font-bold text-gray-800">
                            {new Date(segment.endTime).toISOString().split('T')[0]},
                            {new Date(segment.endTime).toISOString().split('T')[1].split('.')[0]}
                  </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {segment.endLocation}
                  </div>
                </div>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {/* Distance */}
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {segment.distance < 1
                                ? `${(segment.distance * 1000).toFixed(0)} M`
                                : `${segment.distance.toFixed(2)} KM`
                              }
                            </span>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {Math.round(segment.duration)} Min
                            </span>
                          </div>

                          {/* Average Speed */}
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {Math.round(segment.avgSpeed)} KM/H
                            </span>
                  </div>

                          {/* Max Speed */}
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 flex items-center justify-center">
                              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {Math.round(segment.maxSpeed)} KM/H
                            </span>
                          </div>
                        </div>
                </div>
              </div>
                    </Card>
                  </div>
        ))}
      </div>
            </Card>
          </div>

          {/* Map and Controls */}
          <div className="lg:col-span-3 h-[69vh]">
            <Card className="h-full">
              <div className="h-full">
                <GoogleMapContainer
                  historyData={historyData}
                  vehicle={selectedVehicleData || undefined}
                  playbackState={playbackState}
                  className="w-full h-full"
                />
              </div>

              {/* Playback Info */}
              {playbackState.isPlaying && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current Time:</span>
                      <p className="font-medium">
                        {playbackState.currentDateTime ?
                          new Date(playbackState.currentDateTime).toISOString().split('T')[0] + ' ' + new Date(playbackState.currentDateTime).toISOString().split('T')[1].split('.')[0] : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Speed:</span>
                      <p className="font-medium">{playbackState.currentSpeed.toFixed(1)} km/h</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Progress:</span>
                      <p className="font-medium">
                        {playbackState.currentIndex + 1} / {historyData.length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${playbackState.progress * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!loadingHistory && selectedVehicle && startDate && endDate && historyData.length === 0 && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
              <p className="text-gray-600">No location data found for the selected vehicle and date range.</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default PlaybackIndexPage;
