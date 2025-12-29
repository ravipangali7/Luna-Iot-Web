import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import { historyService } from '../../api/services/historyService';
import GeoUtils from '../../utils/geoUtils';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import DateTimePicker from '../../components/ui/forms/DateTimePicker';
import Select from '../../components/ui/forms/Select';
import Button from '../../components/ui/buttons/Button';
import Spinner from '../../components/ui/common/Spinner';
import GoogleMapContainer from '../../components/maps/GoogleMapContainer';
import StopPointModal from '../../components/modals/StopPointModal';
import { handleVehicleAction, VEHICLE_ACTIONS } from '../../utils/vehicleActionUtils';
import type { Vehicle } from '../../types/vehicle';
import type { History, Trip, PlaybackState } from '../../types/history';

const PlaybackIndexPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');

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
  const animationTimerRef = useRef<number | null>(null);

  // Speed multiplier options
  const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4, 8, 16];
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  
  // Interpolated route for smooth animation
  const [interpolatedRoute, setInterpolatedRoute] = useState<Array<{
    latitude: number;
    longitude: number;
    speed?: number;
    course?: number;
    createdAt?: string;
  }>>([]);
  
  // Interpolation steps per segment (how many mini points between two GPS points)
  // Adjust steps based on speed for optimal performance
  const getInterpolationSteps = (speedMultiplier: number): number => {
    if (speedMultiplier >= 16) return 2; // 16x speed: minimal steps
    if (speedMultiplier >= 8) return 3; // 8x speed: very few steps
    if (speedMultiplier >= 4) return 4; // 4x speed: few steps
    if (speedMultiplier >= 2) return 5; // 2x speed: moderate steps
    if (speedMultiplier >= 1.5) return 7; // 1.5x-1.75x: medium steps
    if (speedMultiplier >= 1) return 10; // 1x-1.25x: standard steps
    if (speedMultiplier >= 0.5) return 12; // 0.5x-0.75x: more steps for smoothness
    return 15; // 0.25x: maximum steps for very smooth slow motion
  };

  // Stop points state
  const [stopPoints, setStopPoints] = useState<Array<{
    trip: Trip;
    nextTrip: Trip | null;
    arrivalTime: string | null;
    departureTime: string | null;
    duration: number; // in minutes
    lat: number;
    lng: number;
  }>>([]);
  const [selectedStopPoint, setSelectedStopPoint] = useState<{
    trip: Trip;
    nextTrip: Trip | null;
    arrivalTime: string | null;
    departureTime: string | null;
    duration: number;
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    loadVehicles();
    initializeDates();
  }, []);


  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
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
    
    // Set start datetime to yesterday 00:00
    const startDateStr = yesterday.toISOString().split('T')[0];
    const startDateTimeStr = `${startDateStr}T00:00`;
    
    // Set end datetime to today 23:59
    const endDateStr = today.toISOString().split('T')[0];
    const endDateTimeStr = `${endDateStr}T23:59`;

    setStartDateTime(startDateTimeStr);
    setEndDateTime(endDateTimeStr);
  };

  // Get today's datetime in YYYY-MM-DDTHH:mm format for max datetime validation
  const getTodayDateTimeString = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0].substring(0, 5); // HH:mm
    return `${dateStr}T${timeStr}`;
  };


  // Handle start datetime change
  const handleStartDateTimeChange = (datetime: string) => {
    setStartDateTime(datetime);
    
    // If end datetime is before new start datetime, reset end datetime
    if (endDateTime && datetime && endDateTime < datetime) {
      // Set end datetime to same date but with 23:59 time
      const datePart = datetime.split('T')[0];
      setEndDateTime(`${datePart}T23:59`);
    }
  };

  // Handle end datetime change
  const handleEndDateTimeChange = (datetime: string) => {
    setEndDateTime(datetime);
  };

  // Filter history data by datetime range (similar to Flutter app)
  const filterHistoryByDateTime = (
    allHistoryData: History[],
    startDateTimeStr: string,
    endDateTimeStr: string
  ): History[] => {
    if (!startDateTimeStr || !endDateTimeStr) {
      return allHistoryData;
    }

    // Parse datetime strings (YYYY-MM-DDTHH:mm format)
    const startDateTime = new Date(startDateTimeStr);
    const endDateTime = new Date(endDateTimeStr);

    return allHistoryData.filter((history) => {
      if (!history.createdAt) return false;

      const historyDateTime = new Date(history.createdAt);

      // Check if history is within the selected datetime range
      return historyDateTime >= startDateTime && historyDateTime <= endDateTime;
    });
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
    if (!selectedVehicle || !startDateTime || !endDateTime) {
      return;
    }

    // Extract date parts from datetime for API call
    const startDate = startDateTime.split('T')[0];
    const endDate = endDateTime.split('T')[0];

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

      // Step 1: Calculate timestamps for all trip pairs using the same method as stop points
      // This ensures trips use the exact same accurate times that stop points use
      const tripTimestamps: Array<{
        arrivalTime: string | null;
        departureTime: string | null;
      }> = [];

      for (let i = 0; i < trips.length - 1; i++) {
        const trip = trips[i];
        const nextTrip = trips[i + 1];
        const timestamps = getStopPointTimestamps(trip, nextTrip, history);
        tripTimestamps.push(timestamps);
      }

      // Step 2: Update trips IMMEDIATELY after timestamp calculation (matching Flutter logic)
      // This ensures trip times match stop point times exactly, just like in Flutter app
      const updatedTrips = trips.map((trip, index) => {
        const updatedTrip = { ...trip };

        // For trip's end time: use arrival time from stop point between this trip and next trip
        // This is when the vehicle arrived at the stop point (same as stop point arrival time)
        // Matching Flutter: trip.endTime = arrivalTime from getStopPointTimestamps(trip, nextTrip)
        if (index < trips.length - 1 && index < tripTimestamps.length) {
          const timestamps = tripTimestamps[index];
          // Always update if we have arrival time (this is the accurate stop point time)
          if (timestamps.arrivalTime) {
            updatedTrip.endTime = timestamps.arrivalTime;
          }
        }

        // For trip's start time: use departure time from stop point between previous trip and this trip
        // This is when the vehicle departed from the previous stop point (same as stop point departure time)
        // Matching Flutter: trip.startTime = departureTime from getStopPointTimestamps(prevTrip, trip)
        if (index > 0 && (index - 1) < tripTimestamps.length) {
          const timestamps = tripTimestamps[index - 1];
          // Always update if we have departure time (this is the accurate stop point time)
          if (timestamps.departureTime) {
            updatedTrip.startTime = timestamps.departureTime;
          }
        }

        return updatedTrip;
      });

      // Step 3: Update trip segments using the updated trip times directly (for display)
      // This ensures segments use the exact same times as the updated trips
      const updatedSegments = segments.map((segment, index) => {
        const trip = updatedTrips[index]; // Use updated trip, not original
        if (!trip) return segment;

        // Use the updated trip's startTime and endTime directly
        // This ensures segments match trips exactly
        const updatedSegment = {
          ...segment,
          startTime: trip.startTime, // Use updated trip's start time
          endTime: trip.endTime,     // Use updated trip's end time
        };

        return updatedSegment;
      });

      // Step 4: Calculate stop points between trips (only include those with duration >= 1 minute)
      // Use the same timestamps we already calculated, and use updated trips
      const calculatedStopPoints: Array<{
        trip: Trip;
        nextTrip: Trip | null;
        arrivalTime: string | null;
        departureTime: string | null;
        duration: number;
        lat: number;
        lng: number;
      }> = [];

      for (let i = 0; i < updatedTrips.length - 1; i++) {
        const trip = updatedTrips[i]; // Use updated trip
        const nextTrip = updatedTrips[i + 1]; // Use updated trip
        const timestamps = tripTimestamps[i];
        const duration = calculateStopDuration(timestamps.arrivalTime, timestamps.departureTime);

        // Only include stop points with duration >= 1 minute
        if (duration >= 1) {
          calculatedStopPoints.push({
            trip,
            nextTrip,
            arrivalTime: timestamps.arrivalTime,
            departureTime: timestamps.departureTime,
            duration,
            lat: trip.endLatitude,
            lng: trip.endLongitude,
          });
        }
      }

      setStopPoints(calculatedStopPoints);

      // Step 5: Final update - ensure trips use stop point timestamps (same source as stop points)
      // This double-checks that trips match stop points exactly
      const finalUpdatedTrips = updatedTrips.map((trip, index) => {
        const finalTrip = { ...trip };

        // For trip's end time: prefer stop point arrival time, fallback to timestamp
        if (index < updatedTrips.length - 1 && index < tripTimestamps.length) {
          // First try to get from stop point (if it exists and has the time)
          const stopPoint = calculatedStopPoints.find(sp => sp.trip.tripNumber === trip.tripNumber);
          if (stopPoint?.arrivalTime) {
            finalTrip.endTime = stopPoint.arrivalTime;
          } else {
            // Use timestamp directly (same calculation as stop points)
            const timestamps = tripTimestamps[index];
            if (timestamps?.arrivalTime) {
              finalTrip.endTime = timestamps.arrivalTime;
            }
          }
        }

        // For trip's start time: prefer stop point departure time, fallback to timestamp
        if (index > 0 && (index - 1) < tripTimestamps.length) {
          // First try to get from previous trip's stop point
          const prevTrip = updatedTrips[index - 1];
          const stopPoint = calculatedStopPoints.find(sp => sp.trip.tripNumber === prevTrip.tripNumber);
          if (stopPoint?.departureTime) {
            finalTrip.startTime = stopPoint.departureTime;
          } else {
            // Use timestamp directly (same calculation as stop points)
            const timestamps = tripTimestamps[index - 1];
            if (timestamps?.departureTime) {
              finalTrip.startTime = timestamps.departureTime;
            }
          }
        }

        return finalTrip;
      });

      // Step 6: Update segments to match final updated trips exactly
      const finalUpdatedSegments = updatedSegments.map((segment, index) => {
        const trip = finalUpdatedTrips[index];
        if (!trip) return segment;
        // Use trip's times directly - they now match stop point times
        return {
          ...segment,
          startTime: trip.startTime,
          endTime: trip.endTime,
        };
      });

      // Set final updated trips and segments (these now match stop point times)
      setTrips(finalUpdatedTrips);
      setTripSegments(finalUpdatedSegments);

      // Load addresses for segments (preserve the updated times)
      setLoadingAddresses(true);
      const segmentsWithAddresses = [...finalUpdatedSegments]; // Use final segments with correct times
      for (let i = 0; i < finalUpdatedSegments.length; i++) {
        const segment = finalUpdatedSegments[i];
        try {
          const startAddress = await GeoUtils.getReverseGeoCode(segment.startLat, segment.startLng);
          const endAddress = await GeoUtils.getReverseGeoCode(segment.endLat, segment.endLng);
          
          // Update addresses while preserving all other properties including updated times
          segmentsWithAddresses[i] = {
            ...segment,
            startLocation: startAddress,
            endLocation: endAddress
          };
        } catch (error) {
          console.error('Error loading address for segment:', error);
        }
      }
      // Set all segments at once with addresses and correct times
      setTripSegments(segmentsWithAddresses);
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
        // Filter by datetime range (similar to Flutter app)
        const filteredHistoryData = filterHistoryByDateTime(
          response.data,
          startDateTime,
          endDateTime
        );

        setHistoryData(filteredHistoryData);
        await calculateTrips(filteredHistoryData);
        
        // Generate interpolated route for filtered history data
        const locationData = filteredHistoryData.filter(h => h.type === 'location' && h.latitude && h.longitude);
        const steps = getInterpolationSteps(speedMultiplier);
        const interpolated = generateInterpolatedRoute(locationData, steps);
        setInterpolatedRoute(interpolated);
      } else {
        console.error('Failed to load history:', response.error);
        setHistoryData([]);
        setTrips([]);
        setInterpolatedRoute([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setHistoryData([]);
      setTrips([]);
      setInterpolatedRoute([]);
      setSelectedTrip(null);
    } finally {
      setLoadingHistory(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle, startDateTime, endDateTime, vehicles]);

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
        if (startDateTime && endDateTime) {
          console.log('🚀 Auto-loading playback data for vehicle:', vehicleImei);
          setTimeout(() => {
            fetchHistoryData();
          }, 100);
        }
      }
    }
  }, [searchParams, vehicles, startDateTime, endDateTime, fetchHistoryData]);


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

  // Get stop point timestamps (arrival and departure times)
  const getStopPointTimestamps = (
    trip: Trip,
    _nextTrip: Trip | null,
    allHistoryData: History[]
  ): { arrivalTime: string | null; departureTime: string | null } => {
    // Use the trip's last point coordinates (more accurate than trip.endLatitude/endLongitude)
    const tripEndPoint = trip.tripPoints && trip.tripPoints.length > 0 
      ? trip.tripPoints[trip.tripPoints.length - 1]
      : null;
    const stopLatitude = tripEndPoint?.latitude ?? trip.endLatitude;
    const stopLongitude = tripEndPoint?.longitude ?? trip.endLongitude;

    // Find location history records
    const locationHistory = allHistoryData.filter(
      (data) => data.type === 'location' && data.latitude && data.longitude
    );

    // Find the arrival record (match with stop point coordinates)
    // Use a small tolerance for floating point comparison (0.0001 degrees ≈ 11 meters)
    // We want the FIRST location record at this coordinate (when vehicle first arrived at stop)
    const TOLERANCE = 0.0001;
    let arrivalRecord: History | null = null;
    
    // Find all matching location records (close to stop coordinates)
    // Only consider records that are at or before the trip's end time
    const tripEndTime = trip.endTime ? new Date(trip.endTime).getTime() : null;
    const matchingRecords: History[] = [];
    for (const record of locationHistory) {
      if (
        record.latitude != null &&
        record.longitude != null &&
        record.createdAt &&
        Math.abs(record.latitude - stopLatitude) < TOLERANCE &&
        Math.abs(record.longitude - stopLongitude) < TOLERANCE
      ) {
        const recordTime = new Date(record.createdAt).getTime();
        // Only include records that are at or before the trip's end time
        // This ensures we find the arrival at the stop, not some earlier unrelated visit
        if (tripEndTime === null || recordTime <= tripEndTime) {
          matchingRecords.push(record);
        }
      }
    }
    
    // Use the LAST matching record that's at or before trip end time
    // This is when the vehicle arrived at the stop (the last location record before/at trip end)
    // This matches the trip's end point, which is when it arrived at the stop
    if (matchingRecords.length > 0) {
      matchingRecords.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA; // Descending order (most recent first, but still <= trip end)
      });
      arrivalRecord = matchingRecords[0];
    }
    
    // If still not found, try to find the closest location point to the stop point
    if (!arrivalRecord && locationHistory.length > 0) {
      let closestRecord: History | null = null;
      let minDistance = Infinity;
      for (const record of locationHistory) {
        if (record.latitude != null && record.longitude != null) {
          const distance = Math.sqrt(
            Math.pow(record.latitude - stopLatitude, 2) +
            Math.pow(record.longitude - stopLongitude, 2)
          );
          if (distance < minDistance && distance < 0.001) { // Within 111 meters
            minDistance = distance;
            closestRecord = record;
          }
        }
      }
      if (closestRecord) {
        arrivalRecord = closestRecord;
      }
    }

    // Find ignition off status record after arrival
    let ignitionOffRecord: History | null = null;
    if (arrivalRecord) {
      const arrivalIndex = allHistoryData.indexOf(arrivalRecord);
      if (arrivalIndex >= 0) {
        // Look for ignition off status after arrival
        for (let i = arrivalIndex; i < allHistoryData.length; i++) {
          const record = allHistoryData[i];
          if (record.type === 'status' && record.ignition === false) {
            ignitionOffRecord = record;
            break;
          }
        }
      }
    }

    // Find departure record (next location record after ignition off)
    let departureRecord: History | null = null;
    if (ignitionOffRecord) {
      const ignitionOffIndex = allHistoryData.indexOf(ignitionOffRecord);
      if (ignitionOffIndex >= 0) {
        // Look for next location record after ignition off
        for (let i = ignitionOffIndex; i < allHistoryData.length; i++) {
          const record = allHistoryData[i];
          if (record.type === 'location' && record.latitude && record.longitude) {
            departureRecord = record;
            break;
          }
        }
      }
    }

    return {
      arrivalTime: arrivalRecord?.createdAt || null,
      departureTime: departureRecord?.createdAt || null,
    };
  };

  // Calculate stop duration in minutes
  const calculateStopDuration = (arrivalTime: string | null, departureTime: string | null): number => {
    if (!arrivalTime || !departureTime) return 0;
    const arrival = new Date(arrivalTime).getTime();
    const departure = new Date(departureTime).getTime();
    return (departure - arrival) / (1000 * 60); // Convert to minutes
  };


  // Interpolate between two GPS points
  const interpolatePoints = (
    startPoint: { latitude: number; longitude: number; speed?: number; course?: number; createdAt?: string },
    endPoint: { latitude: number; longitude: number; speed?: number; course?: number; createdAt?: string },
    numSteps: number
  ): Array<{ latitude: number; longitude: number; speed?: number; course?: number; createdAt?: string }> => {
    const points: Array<{ latitude: number; longitude: number; speed?: number; course?: number; createdAt?: string }> = [];
    
    for (let i = 0; i <= numSteps; i++) {
      const t = i / numSteps; // Interpolation factor (0 to 1)
      
      // Linear interpolation for latitude and longitude
      const lat = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * t;
      const lng = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * t;
      
      // Interpolate speed
      const speed = startPoint.speed !== undefined && endPoint.speed !== undefined
        ? startPoint.speed + (endPoint.speed - startPoint.speed) * t
        : endPoint.speed || startPoint.speed;
      
      // Calculate bearing/direction for smooth rotation
      const course = calculateBearing(
        startPoint.latitude,
        startPoint.longitude,
        endPoint.latitude,
        endPoint.longitude
      );
      
      // Interpolate timestamp
      let createdAt: string | undefined;
      if (startPoint.createdAt && endPoint.createdAt) {
        const startTime = new Date(startPoint.createdAt).getTime();
        const endTime = new Date(endPoint.createdAt).getTime();
        const interpolatedTime = new Date(startTime + (endTime - startTime) * t);
        createdAt = interpolatedTime.toISOString();
      } else {
        createdAt = endPoint.createdAt || startPoint.createdAt;
      }
      
      points.push({
        latitude: lat,
        longitude: lng,
        speed,
        course,
        createdAt,
      });
    }
    
    return points;
  };

  // Calculate bearing between two points
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
  };

  // Generate interpolated route from location data
  const generateInterpolatedRoute = (
    locationData: History[],
    stepsPerSegment: number
  ): Array<{ latitude: number; longitude: number; speed?: number; course?: number; createdAt?: string }> => {
    if (locationData.length < 2) {
      // If less than 2 points, return as is
      return locationData.map(point => ({
        latitude: point.latitude!,
        longitude: point.longitude!,
        speed: point.speed,
        course: point.course,
        createdAt: point.createdAt,
      }));
    }

    const interpolatedPoints: Array<{ latitude: number; longitude: number; speed?: number; course?: number; createdAt?: string }> = [];

    for (let i = 0; i < locationData.length - 1; i++) {
      const startPoint = {
        latitude: locationData[i].latitude!,
        longitude: locationData[i].longitude!,
        speed: locationData[i].speed,
        course: locationData[i].course,
        createdAt: locationData[i].createdAt,
      };

      const endPoint = {
        latitude: locationData[i + 1].latitude!,
        longitude: locationData[i + 1].longitude!,
        speed: locationData[i + 1].speed,
        course: locationData[i + 1].course,
        createdAt: locationData[i + 1].createdAt,
      };

      // Interpolate between start and end point
      const segmentPoints = interpolatePoints(startPoint, endPoint, stepsPerSegment);
      
      // Add all points except the last one (to avoid duplicates with next segment's first point)
      if (i === 0) {
        // First segment: include all points including the first one
        interpolatedPoints.push(...segmentPoints);
      } else {
        // Subsequent segments: skip first point (already added as last point of previous segment)
        interpolatedPoints.push(...segmentPoints.slice(1));
      }
    }

    return interpolatedPoints;
  };

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
    setHistoryData(trip.tripPoints);
    
    // Generate interpolated route for the selected trip
    const locationData = trip.tripPoints.filter(h => h.type === 'location' && h.latitude && h.longitude);
    const steps = getInterpolationSteps(speedMultiplier);
    const interpolated = generateInterpolatedRoute(locationData, steps);
    setInterpolatedRoute(interpolated);
  };

  const handleStopPointClick = (stopPoint: {
    trip: Trip;
    nextTrip: Trip | null;
    arrivalTime: string | null;
    departureTime: string | null;
    duration: number;
    lat: number;
    lng: number;
  }) => {
    setSelectedStopPoint(stopPoint);
  };

  const handleCloseStopModal = () => {
    setSelectedStopPoint(null);
  };

  const handleViewTrip = (trip: Trip) => {
    handleCloseStopModal();
    handleTripSelect(trip);
  };

  const handlePlayback = () => {
    if (playbackState.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Calculate animation speed based on route length and speed multiplier
  const calculateAnimationSpeed = (routeLength: number, multiplier: number) => {
    let baseSpeed: number;
    if (routeLength < 10) {
      baseSpeed = 100; // Fast for short routes
    } else if (routeLength < 50) {
      baseSpeed = 150; // Medium speed
    } else {
      baseSpeed = 200; // Slower for long routes
    }
    
    // Apply speed multiplier: actualSpeed = baseSpeed / multiplier
    // For higher speeds (4x, 8x, 16x), use more aggressive reduction
    return Math.max(20, Math.floor(baseSpeed / multiplier)); // Minimum 20ms for smoothness
  };

  const startPlayback = () => {
    if (historyData.length === 0 || interpolatedRoute.length === 0) return;

    // Use interpolated route for smooth animation
    const speed = calculateAnimationSpeed(interpolatedRoute.length, speedMultiplier);

    setPlaybackState(prev => ({ ...prev, isPlaying: true, currentIndex: 0 }));

    let currentSpeed = speed;
    let animationFrameId: number | null = null;
    let lastFrameTime = performance.now();
    let isPlayingRef = true;

    const animate = (currentTime: number) => {
      if (!isPlayingRef) {
        return;
      }

      const deltaTime = currentTime - lastFrameTime;
      
      // Only update if enough time has passed (throttle for performance)
      if (deltaTime >= currentSpeed) {
        lastFrameTime = currentTime;

        setPlaybackState(prev => {
          if (!prev.isPlaying) {
            isPlayingRef = false;
            return prev; // Stop if paused
          }
          
          if (prev.currentIndex >= interpolatedRoute.length - 1) {
            isPlayingRef = false;
            return { ...prev, isPlaying: false, currentIndex: 0 };
          }

          // Move to next interpolated point for smooth animation
          const nextIndex = prev.currentIndex + 1;
          const progress = nextIndex / (interpolatedRoute.length - 1);

          let currentDateTime = '';
          const currentPoint = interpolatedRoute[nextIndex];
          if (currentPoint?.createdAt) {
            const dateObj = new Date(currentPoint.createdAt);
            if (!isNaN(dateObj.getTime())) {
              const [date, timeWithMs] = dateObj.toISOString().split('T');
              const time = timeWithMs?.split('.')[0] || '';
              currentDateTime = `${date} ${time}`;
            }
          }

          // Recalculate speed if multiplier changed
          const newSpeed = calculateAnimationSpeed(interpolatedRoute.length, speedMultiplier);
          if (newSpeed !== currentSpeed) {
            currentSpeed = newSpeed;
          }

          return {
            ...prev,
            currentIndex: nextIndex,
            progress,
            currentSpeed: currentPoint?.speed || 0,
            currentDateTime: currentDateTime,
          };
        });
      }

      // Continue animation loop
      if (isPlayingRef) {
        animationFrameId = requestAnimationFrame(animate);
        animationRef.current = animationFrameId;
      }
    };

    // Start animation with requestAnimationFrame for smoother performance
    animationFrameId = requestAnimationFrame(animate);
    animationRef.current = animationFrameId;
  };

  const stopPlayback = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    setPlaybackState(prev => {
      if (prev.isPlaying) {
        return { ...prev, isPlaying: false, currentIndex: 0 };
      }
      return prev;
    });
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
                Start Date & Time
              </label>
              <DateTimePicker
                value={startDateTime}
                onChange={handleStartDateTimeChange}
                max={getTodayDateTimeString()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <DateTimePicker
                value={endDateTime}
                onChange={handleEndDateTimeChange}
                min={startDateTime || undefined}
                max={getTodayDateTimeString()}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                onClick={fetchHistoryData}
                loading={loadingHistory}
                disabled={!selectedVehicle || !startDateTime || !endDateTime}
                className="w-full"
              >
                GO
              </Button>
              {historyData.length > 0 && (
                <>
                  <Button
                    variant={playbackState.isPlaying ? "danger" : "primary"}
                    onClick={handlePlayback}
                    disabled={loadingHistory}
                  >
                    {playbackState.isPlaying ? 'Stop' : 'Play'}
                  </Button>
                  
                  {/* Speed Selector Dropdown */}
                  <div className="w-24">
                    <Select
                      options={SPEED_OPTIONS.map(speed => ({
                        value: speed.toString(),
                        label: `${speed}x`
                      }))}
                      value={speedMultiplier.toString()}
                      onChange={(value) => {
                        const newMultiplier = parseFloat(value);
                        setSpeedMultiplier(newMultiplier);
                        
                        // Regenerate interpolated route with new step count
                        const locationData = historyData.filter(h => h.type === 'location' && h.latitude && h.longitude);
                        if (locationData.length > 0) {
                          const steps = getInterpolationSteps(newMultiplier);
                          const interpolated = generateInterpolatedRoute(locationData, steps);
                          setInterpolatedRoute(interpolated);
                        }
                        
                        // If playing, restart with new speed
                        if (playbackState.isPlaying) {
                          stopPlayback();
                          setTimeout(() => startPlayback(), 100);
                        }
                      }}
                      disabled={loadingHistory}
                      size="sm"
                    />
                  </div>
                </>
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
                            {(() => {
                              const startDate = new Date(segment.startTime);
                              // Use local time formatting (same as stop point modal) instead of UTC
                              const year = startDate.getFullYear();
                              const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
                              const day = startDate.getDate().toString().padStart(2, '0');
                              const hours = startDate.getHours().toString().padStart(2, '0');
                              const minutes = startDate.getMinutes().toString().padStart(2, '0');
                              const seconds = startDate.getSeconds().toString().padStart(2, '0');
                              return `${year}-${month}-${day},${hours}:${minutes}:${seconds}`;
                            })()}
              </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {segment.startLocation}
                  </div>
                  </div>

                        {/* End time and location */}
                        <div className="mb-3">
                          <div className="text-sm font-bold text-gray-800">
                            {(() => {
                              const endDate = new Date(segment.endTime);
                              // Use local time formatting (same as stop point modal) instead of UTC
                              const year = endDate.getFullYear();
                              const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
                              const day = endDate.getDate().toString().padStart(2, '0');
                              const hours = endDate.getHours().toString().padStart(2, '0');
                              const minutes = endDate.getMinutes().toString().padStart(2, '0');
                              const seconds = endDate.getSeconds().toString().padStart(2, '0');
                              return `${year}-${month}-${day},${hours}:${minutes}:${seconds}`;
                            })()}
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
                  interpolatedRoute={interpolatedRoute}
                  stopPoints={stopPoints}
                  selectedTrip={selectedTrip}
                  onStopPointClick={handleStopPointClick}
                  className="w-full h-full"
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!loadingHistory && selectedVehicle && startDateTime && endDateTime && historyData.length === 0 && (
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

      {/* Stop Point Modal */}
      {selectedStopPoint && (
        <StopPointModal
          isOpen={!!selectedStopPoint}
          onClose={handleCloseStopModal}
          stopPoint={selectedStopPoint}
          onViewTrip={handleViewTrip}
          onViewNextTrip={handleViewTrip}
        />
      )}
    </div>
  );
};

export default PlaybackIndexPage;
