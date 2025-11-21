import React, { useState, useEffect } from 'react';
import GeoUtils from '../../utils/geoUtils';
import type { Trip } from '../../types/history';

interface StopPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  stopPoint: {
    trip: Trip;
    nextTrip: Trip | null;
    arrivalTime: string | null;
    departureTime: string | null;
    duration: number;
    lat: number;
    lng: number;
  };
  onViewTrip: (trip: Trip) => void;
  onViewNextTrip: (trip: Trip) => void;
}

const StopPointModal: React.FC<StopPointModalProps> = ({
  isOpen,
  onClose,
  stopPoint,
  onViewTrip,
  onViewNextTrip,
}) => {
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAddress();
    } else {
      setAddress('');
    }
  }, [isOpen, stopPoint.lat, stopPoint.lng]);

  const loadAddress = async () => {
    setIsLoadingAddress(true);
    try {
      const addr = await GeoUtils.getReverseGeoCode(stopPoint.lat, stopPoint.lng);
      setAddress(addr);
    } catch (error) {
      console.error('Error loading address:', error);
      setAddress('Address not available');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const formatDateTime = (dateTime: string | null): string => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start mb-6">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Stop Point</h3>
              {isLoadingAddress ? (
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading address...
                </div>
              ) : (
                <p className="text-sm text-gray-600 line-clamp-2">{address || 'Address not available'}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Time Information */}
          <div className="space-y-3 mb-6">
            {/* Arrival Time */}
            {stopPoint.arrivalTime && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center">
                  <div className="p-1.5 bg-orange-500 rounded-md mr-3">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-medium mb-0.5">Arrival Time</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatDateTime(stopPoint.arrivalTime)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Departure Time */}
            {stopPoint.departureTime && (
              <>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <div className="p-1.5 bg-green-500 rounded-md mr-3">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium mb-0.5">Departure Time</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDateTime(stopPoint.departureTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <div className="p-1.5 bg-blue-500 rounded-md mr-3">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 font-medium mb-0.5">Stop Duration</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatDuration(stopPoint.duration)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onViewTrip(stopPoint.trip)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              View Trip
            </button>
            {stopPoint.nextTrip && (
              <button
                onClick={() => onViewNextTrip(stopPoint.nextTrip!)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                Next Trip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StopPointModal;

