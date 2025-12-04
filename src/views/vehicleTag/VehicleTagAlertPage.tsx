import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [tag, setTag] = useState<VehicleTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!vtid) {
      setError('Invalid vehicle tag ID');
      setLoading(false);
      return;
    }

    loadTag();
    getLocation();
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

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Continue without location
        }
      );
    }
  };

  const captureImageFromCamera = async (): Promise<File | undefined> => {
    try {
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
              resolve(undefined);
            }
          }, 'image/jpeg', 0.8);
        });
      }

      // Stop camera stream if canvas context failed
      stream.getTracks().forEach(track => track.stop());
      return undefined;
    } catch (error) {
      console.error('Error capturing image:', error);
      // Continue without image if camera fails
      return undefined;
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

      // Automatically capture image from camera
      const imageFile = await captureImageFromCamera();

      // Submit alert with captured image
      const alertResult = await vehicleTagService.createAlert({
        vtid,
        alert: alertType,
        latitude: location?.lat,
        longitude: location?.lng,
        person_image: imageFile,
      });

      if (alertResult.success) {
        showSuccess(
          'Alert Sent',
          'Your alert is sent to respective person successfully.'
        );
      } else {
        showError('Failed', alertResult.error || 'Failed to send alert');
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred: ' + (error as Error).message);
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

