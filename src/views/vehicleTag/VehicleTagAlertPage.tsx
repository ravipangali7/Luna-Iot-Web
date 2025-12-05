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
import type { VehicleTag, AlertType } from '../../types/vehicleTag';
import { AlertTypeLabels } from '../../types/vehicleTag';

const VehicleTagAlertPage: React.FC = () => {
  const { vtid } = useParams<{ vtid: string }>();
  const [tag, setTag] = useState<VehicleTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!vtid) {
      setError('Invalid vehicle tag ID');
      setLoading(false);
      return;
    }

    loadTag();
  }, [vtid]);

  const loadTag = async () => {
    if (!vtid) return;

    try {
      setLoading(true);
      setError(null);

      const result = await vehicleTagService.getTagByVtid(vtid);

      if (result.success && result.data) {
        setTag(result.data);
      } else {
        setError(result.error || 'Failed to load vehicle tag');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async (retryCount = 0): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        showError('Location Not Supported', 'Your browser does not support geolocation. Please enable location services.');
        resolve(null);
        return;
      }

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
              html: 'Location access is required to send alerts.<br/><br/>Please allow location access in your browser settings and click "Request Again".',
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
              // User cancelled - show message but keep asking next time
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
    });
  };

  const captureImageFromCamera = async (retryCount = 0): Promise<File | null> => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError('Camera Not Supported', 'Your browser does not support camera access.');
        return null;
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
          html: 'Camera access is required to send alerts.<br/><br/>Please allow camera access in your browser settings and click "Request Again".',
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
          // User cancelled - show message but keep asking next time
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

      // Both permissions granted - submit alert
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

  if (error || !tag) {
    return (
      <Container>
        <Alert variant="error">{error || 'Vehicle tag not found'}</Alert>
      </Container>
    );
  }

  const userInfo = typeof tag.user_info === 'object' && tag.user_info !== null
    ? tag.user_info
    : null;

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

        {/* Report Vehicle Emergency Link */}
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

        {/* Alert Buttons */}
        <div id="alerts" className="space-y-3">
          {Object.entries(AlertTypeLabels).map(([alertType, label]) => {
            const isAccident = alertType === 'accident_alert';
            return (
              <Button
                key={alertType}
                onClick={() => handleAlertClick(alertType as AlertType)}
                disabled={submitting}
                variant={isAccident ? 'danger' : 'success'}
                className="w-full py-4 text-lg"
              >
                {label}
              </Button>
            );
          })}
        </div>

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

