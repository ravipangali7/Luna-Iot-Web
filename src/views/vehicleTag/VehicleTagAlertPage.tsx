import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { vehicleTagService } from '../../api/services/vehicleTagService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Swal from 'sweetalert2';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import type { VehicleTag, VehicleTagAlert, AlertType } from '../../types/vehicleTag';
import { AlertTypeLabels } from '../../types/vehicleTag';

const VehicleTagAlertPage: React.FC = () => {
  const { vtid } = useParams<{ vtid: string }>();
  const [tag, setTag] = useState<VehicleTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!vtid) {
      setError('Invalid vehicle tag ID');
      setLoading(false);
      return;
    }

    loadTag();
    
    // Cleanup countdown interval on unmount
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [vtid]);

  const loadTag = async () => {
    if (!vtid) return;

    try {
      setLoading(true);
      setError(null);

      const result = await vehicleTagService.getTagByVtid(vtid);

      if (result.success && result.data) {
        setTag(result.data);
        // If vehicle is active, check for latest alert to determine cooldown
        if (result.data.is_active) {
          await loadLatestAlert();
        }
      } else {
        setError(result.error || 'Failed to load vehicle tag');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestAlert = async () => {
    if (!vtid) return;

    try {
      const result = await vehicleTagService.getLatestAlertByVtid(vtid);
      
      if (result.success && result.data) {
        checkCooldown(result.data);
      } else {
        setIsInCooldown(false);
        setCooldownRemaining(0);
      }
    } catch (error) {
      console.error('Error loading latest alert:', error);
      setIsInCooldown(false);
      setCooldownRemaining(0);
    }
  };

  const checkCooldown = (alert: VehicleTagAlert) => {
    try {
      const alertTime = new Date(alert.created_at).getTime();
      
      // Check if date parsing was successful
      if (isNaN(alertTime)) {
        console.error('Invalid date format for alert.created_at:', alert.created_at);
        setIsInCooldown(false);
        setCooldownRemaining(0);
        return;
      }

      const currentTime = new Date().getTime();
      const timeDiff = currentTime - alertTime;
      const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds

      if (timeDiff < tenMinutesInMs && timeDiff >= 0) {
        const remaining = Math.ceil((tenMinutesInMs - timeDiff) / 1000); // remaining seconds
        setCooldownRemaining(remaining);
        setIsInCooldown(true);
        startCountdown(remaining);
      } else {
        setIsInCooldown(false);
        setCooldownRemaining(0);
      }
    } catch (error) {
      console.error('Error checking cooldown:', error);
      // On error, assume not in cooldown to allow alerts
      setIsInCooldown(false);
      setCooldownRemaining(0);
    }
  };

  // Helper function to check if currently in cooldown based on latest alert
  const isCurrentlyInCooldown = async (): Promise<boolean> => {
    if (!vtid) return false;

    try {
      const result = await vehicleTagService.getLatestAlertByVtid(vtid);
      
      if (result.success && result.data) {
        try {
          const alertTime = new Date(result.data.created_at).getTime();
          
          // Check if date parsing was successful
          if (isNaN(alertTime)) {
            console.error('Invalid date format for alert.created_at:', result.data.created_at);
            return false;
          }

          const currentTime = new Date().getTime();
          const timeDiff = currentTime - alertTime;
          const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds

          return timeDiff < tenMinutesInMs && timeDiff >= 0;
        } catch (error) {
          console.error('Error parsing alert date:', error);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking cooldown status:', error);
      return false;
    }
  };

  const startCountdown = (initialSeconds: number) => {
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    let remaining = initialSeconds;
    setCooldownRemaining(remaining);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      
      if (remaining <= 0) {
        setCooldownRemaining(0);
        setIsInCooldown(false);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      } else {
        setCooldownRemaining(remaining);
      }
    }, 1000);
  };

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRefresh = () => {
    if (!vtid) return;
    loadTag();
  };

  const requestLocationPermission = async (retryCount = 0): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        showError('Location Not Supported', 'Your browser does not support geolocation. Please enable location services.');
        resolve(null);
        return;
      }

      // Check permission status using Permissions API if available
      const checkPermissionStatus = async () => {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            if (permissionStatus.state === 'denied') {
              // Permission is permanently denied - show instructions
              await Swal.fire({
                title: 'Location Permission Denied',
                html: `
                  <p>Location access is permanently denied in your browser settings.</p>
                  <p><strong>To enable location access:</strong></p>
                  <ol style="text-align: left; margin: 15px 0;">
                    <li>Click the lock/info icon in your browser's address bar</li>
                    <li>Find "Location" in the permissions list</li>
                    <li>Change it from "Block" to "Allow"</li>
                    <li>Refresh this page and try again</li>
                  </ol>
                `,
                icon: 'info',
                confirmButtonText: 'I Understand',
                confirmButtonColor: '#10b981',
              });
              resolve(null);
              return true; // Indicates permission is permanently denied
            }
          } catch (e) {
            // Permissions API not supported or failed - continue with normal flow
            console.warn('Permissions API check failed:', e);
          }
        }
        return false; // Permission not permanently denied or API not available
      };

      const handlePermissionCheck = async () => {
        const isPermanentlyDenied = await checkPermissionStatus();
        if (isPermanentlyDenied) {
          return; // Already handled in checkPermissionStatus
        }

        // Try to get location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            resolve(loc);
          },
          async (error) => {
            console.warn('Geolocation error:', error);
            if (error.code === error.PERMISSION_DENIED) {
              const result = await Swal.fire({
                title: 'Location Permission Required',
                html: `
                  <p>Location access is required to send alerts.</p>
                  <p><strong>Please allow location access:</strong></p>
                  <ol style="text-align: left; margin: 15px 0;">
                    <li>Click the lock/info icon in your browser's address bar</li>
                    <li>Find "Location" in the permissions list</li>
                    <li>Change it from "Block" to "Allow"</li>
                    <li>Click "Request Again" below</li>
                  </ol>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Request Again',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#10b981',
                allowOutsideClick: false,
              });

              if (result.isConfirmed) {
                // Try again (recursive call)
                const retryLoc = await requestLocationPermission(retryCount + 1);
                resolve(retryLoc);
              } else {
                showError(
                  'Permission Required',
                  'Location access is required to send alerts. Please grant location permission and try again.'
                );
                resolve(null);
              }
            } else {
              showError('Location Error', 'Failed to get your location. Please check your browser settings.');
              resolve(null);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      };

      handlePermissionCheck();
    });
  };

  const captureImageFromCamera = async (retryCount = 0): Promise<File | null> => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('Camera Not Supported', 'Your browser does not support camera access.');
        return null;
      }

      // Check permission status using Permissions API if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (permissionStatus.state === 'denied') {
            // Permission is permanently denied - show instructions
            await Swal.fire({
              title: 'Camera Permission Denied',
              html: `
                <p>Camera access is permanently denied in your browser settings.</p>
                <p><strong>To enable camera access:</strong></p>
                <ol style="text-align: left; margin: 15px 0;">
                  <li>Click the lock/info icon in your browser's address bar</li>
                  <li>Find "Camera" in the permissions list</li>
                  <li>Change it from "Block" to "Allow"</li>
                  <li>Refresh this page and try again</li>
                </ol>
              `,
              icon: 'info',
              confirmButtonText: 'I Understand',
              confirmButtonColor: '#10b981',
            });
            return null;
          }
        } catch (e) {
          // Permissions API not supported or failed - continue with normal flow
          console.warn('Permissions API check failed:', e);
        }
      }

      // Start camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' } // Front camera
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          resolve(null);
        };
      });

      // Create canvas and capture frame
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        // Stop camera stream
        stream.getTracks().forEach(track => track.stop());
        
        // Convert to blob and then to File
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
              resolve(file);
            } else {
              resolve(null);
            }
          }, 'image/jpeg', 0.8);
        });
      }

      // Stop camera stream if canvas context failed
      stream.getTracks().forEach(track => track.stop());
      return null;
    } catch (error: any) {
      console.error('Error capturing image:', error);
      
      // Handle permission denied
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        const result = await Swal.fire({
          title: 'Camera Permission Required',
          html: `
            <p>Camera access is required to send alerts.</p>
            <p><strong>Please allow camera access:</strong></p>
            <ol style="text-align: left; margin: 15px 0;">
              <li>Click the lock/info icon in your browser's address bar</li>
              <li>Find "Camera" in the permissions list</li>
              <li>Change it from "Block" to "Allow"</li>
              <li>Click "Request Again" below</li>
            </ol>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Request Again',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#10b981',
          allowOutsideClick: false,
        });

        if (result.isConfirmed) {
          // Try again (recursive call)
          return await captureImageFromCamera(retryCount + 1);
        } else {
          showError(
            'Permission Required',
            'Camera access is required to send alerts. Please grant camera permission and try again.'
          );
          return null;
        }
      } else {
        showError('Camera Error', 'Failed to access camera. Please check your browser settings and try again.');
        return null;
      }
    }
  };

  const handleAlertClick = async (alertType: AlertType) => {
    if (!vtid || !tag) return;

    // Check cooldown at the start - early return if in cooldown
    if (isInCooldown) {
      showError(
        'Cooldown Active',
        `Please wait ${formatCountdown(cooldownRemaining)} before sending another alert.`
      );
      return;
    }

    const alertLabel = AlertTypeLabels[alertType];
    
    // Show confirmation first
    const result = await Swal.fire({
      title: `${alertLabel}?`,
      text: `Report owner about ${alertLabel.toLowerCase()} of vehicle.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Report',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);

      // Re-check cooldown status before proceeding (in case time passed during confirmation)
      const stillInCooldown = await isCurrentlyInCooldown();
      if (stillInCooldown) {
        // Reload latest alert to update UI state
        await loadLatestAlert();
        showError(
          'Cooldown Active',
          'A recent alert was detected. Please wait before sending another alert.'
        );
        setSubmitting(false);
        return;
      }

      // Request location permission (required) - keep asking until granted
      let currentLocation: { lat: number; lng: number } | null = null;
      while (!currentLocation) {
        currentLocation = await requestLocationPermission();
        if (!currentLocation) {
          // User cancelled or permission denied - show message and stop
          showError(
            'Permission Required',
            'Location access is required to send alerts. Please grant location permission in your browser settings and try again.'
          );
          setSubmitting(false);
          return;
        }
      }

      // Capture image from camera (required) - keep asking until granted
      let imageFile: File | null = null;
      while (!imageFile) {
        imageFile = await captureImageFromCamera();
        if (!imageFile) {
          // User cancelled or permission denied - show message and stop
          showError(
            'Permission Required',
            'Camera access is required to send alerts. Please grant camera permission in your browser settings and try again.'
          );
          setSubmitting(false);
          return;
        }
      }

      // Re-check cooldown status before submitting (user might have taken time granting permissions)
      const stillInCooldownBeforeSubmit = await isCurrentlyInCooldown();
      if (stillInCooldownBeforeSubmit) {
        // Reload latest alert to update UI state
        await loadLatestAlert();
        showError(
          'Cooldown Active',
          'A recent alert was detected. Please wait before sending another alert.'
        );
        setSubmitting(false);
        return;
      }

      // Both permissions granted and cooldown check passed - submit alert
      const alertResult = await vehicleTagService.createAlert({
        vtid,
        alert: alertType,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        person_image: imageFile,
      });

      if (alertResult.success) {
        showSuccess(
          'Alert Sent',
          'Your alert is sent to respective person successfully.'
        );
        // Reload latest alert to update cooldown
        await loadLatestAlert();
      } else {
        // Handle backend errors gracefully - don't show validation errors for missing fields
        const errorMsg = alertResult.error || 'Failed to send alert';
        if (errorMsg.includes('latitude') || errorMsg.includes('longitude') || errorMsg.includes('person_image')) {
          showError(
            'Permission Required',
            'Please grant location and camera permissions to send alerts. Check your browser settings and try again.'
          );
        } else {
          showError('Failed', errorMsg);
        }
      }
    } catch (error: any) {
      // Handle network/API errors - check if it's a validation error
      const errorMsg = error?.message || 'An unexpected error occurred';
      if (errorMsg.includes('latitude') || errorMsg.includes('longitude') || errorMsg.includes('person_image') || errorMsg.includes('required')) {
        showError(
          'Permission Required',
          'Please grant location and camera permissions to send alerts. Check your browser settings and try again.'
        );
      } else {
        showError('Error', errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryDisplay = (category: string | null): string => {
    if (!category) return 'N/A';
    const categoryMap: Record<string, string> = {
      private: 'Red (Private)',
      public: 'Public',
      government: 'Government',
      diplomats: 'Diplomats',
      non_profit_org: 'Non Profit Organization',
      corporation: 'Corporation',
      tourism: 'Tourism',
      ministry: 'Ministry',
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner />
        </div>
      </Container>
    );
  }

  if (error && !tag) {
    return (
      <Container>
        <Alert variant="error">{error || 'Vehicle tag not found'}</Alert>
      </Container>
    );
  }

  if (!tag) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner />
        </div>
      </Container>
    );
  }

  const userInfo = typeof tag.user_info === 'object' && tag.user_info !== null
    ? tag.user_info
    : null;

  // Check if vehicle is inactive
  const isInactive = !tag.is_active;

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        {/* Header with registration number */}
        <div className="bg-red-600 text-white p-4 rounded-t-lg mb-4">
          <div className="text-sm mb-1">BAGMATI</div>
          <div className="text-2xl font-bold">{tag.registration_no || tag.vtid}</div>
        </div>

        {/* Vehicle Details */}
        <Card className="mb-4">
          <CardBody>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Owner:</span>
                <span className="font-medium">
                  {userInfo
                    ? `${userInfo.name ? userInfo.name.charAt(0) + '***' : 'N/A'} ${userInfo.name ? userInfo.name.split(' ').slice(1).map(n => n.charAt(0) + '***').join(' ') : ''}`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{tag.vehicle_model || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="font-medium">{tag.vehicle_model || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ownership:</span>
                <span className="font-medium">{getCategoryDisplay(tag.vehicle_category)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Inactive Vehicle UI */}
        {isInactive && (
          <Card className="mb-4 border-orange-500">
            <CardBody>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-800">Vehicle Tag Inactive</h3>
                  <p className="text-sm text-orange-600 mt-1">
                    This vehicle tag is currently inactive. Alert functionality is not available.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Cooldown UI */}
        {!isInactive && isInCooldown && (
          <Card className="mb-4 border-yellow-500 bg-yellow-50">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      Recently Alert was sent please wait
                    </p>
                    <p className="text-lg font-bold text-yellow-900 mt-1">
                      {formatCountdown(cooldownRemaining)} remaining
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="ml-4"
                >
                  Refresh
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Report Vehicle Emergency Link */}
        {!isInactive && (
          <div className="mb-4">
            <a
              href="#alerts"
              className="text-green-600 hover:text-green-700 font-medium"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('alerts')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Report Vehicle Emergency
            </a>
          </div>
        )}

        {/* Alert Buttons */}
        {!isInactive && (
          <div id="alerts" className="space-y-3">
            {Object.entries(AlertTypeLabels).map(([alertType, label]) => {
              const isAccident = alertType === 'accident_alert';
              return (
                <Button
                  key={alertType}
                  onClick={() => handleAlertClick(alertType as AlertType)}
                  disabled={submitting || isInCooldown}
                  variant={isAccident ? 'danger' : 'success'}
                  className="w-full py-4 text-lg"
                >
                  {label}
                </Button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div>POWERED BY:</div>
          <div className="font-bold text-gray-700 mt-1">LUNA</div>
        </div>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </Container>
  );
};

export default VehicleTagAlertPage;

