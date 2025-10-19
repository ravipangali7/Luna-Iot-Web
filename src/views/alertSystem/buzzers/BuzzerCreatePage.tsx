import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertBuzzerService, alertGeofenceService, type AlertBuzzerCreate } from '../../../api/services/alertSystemService';
import { deviceService } from '../../../api/services/deviceService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import Checkbox from '../../../components/ui/forms/Checkbox';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';

interface AlertGeofence {
  id: number;
  title: string;
}

interface Device {
  id: number;
  phone: string;
  imei: string;
}

interface FormData {
  title: string;
  device: number;
  delay: number;
  alert_geofence_ids: number[];
}

const BuzzerCreatePage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute } = useAlertSystemAccess(Number(instituteId));

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geofences, setGeofences] = useState<AlertGeofence[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    device: 0,
    delay: 5,
    alert_geofence_ids: []
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check access
  useEffect(() => {
    if (!hasAccessToInstitute(Number(instituteId))) {
      setError('You do not have access to this institute\'s alert system.');
      setLoading(false);
      return;
    }
  }, [hasAccessToInstitute, instituteId]);

  // Fetch geofences and devices
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [geofencesResponse, devicesResponse] = await Promise.all([
        alertGeofenceService.getByInstitute(Number(instituteId)),
        deviceService.getLightDevices()
      ]);

      setGeofences(geofencesResponse || []);
      
      if (devicesResponse.success && devicesResponse.data) {
        setDevices(devicesResponse.data);
      } else {
        setError(devicesResponse.error || 'Failed to load devices');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle input changes
  const handleInputChange = (name: string, value: string | number | number[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle geofence selection
  const handleGeofenceToggle = (geofenceId: number) => {
    setFormData(prev => ({
      ...prev,
      alert_geofence_ids: prev.alert_geofence_ids.includes(geofenceId)
        ? prev.alert_geofence_ids.filter(id => id !== geofenceId)
        : [...prev.alert_geofence_ids, geofenceId]
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.device || formData.device === 0) {
      errors.device = 'Device is required';
    }

    if (!formData.delay || formData.delay < 1) {
      errors.delay = 'Delay must be at least 1 second';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        title: formData.title.trim(),
        device: formData.device,
        delay: formData.delay,
        institute: Number(instituteId),
        geofence_ids: formData.alert_geofence_ids
      };

      await alertBuzzerService.create(payload as AlertBuzzerCreate);
      
      showSuccess('Buzzer created successfully!');
      navigate(`/alert-system/${instituteId}/buzzers`);
    } catch (err: unknown) {
      console.error('Error creating buzzer:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create buzzer. Please try again.';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/alert-system/${instituteId}/buzzers`);
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Alert Buzzer</h1>
            <p className="text-gray-600 mt-1">Create a new buzzer for the alert system</p>
          </div>
          <Button
            variant="secondary"
            onClick={handleCancel}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          >
            Cancel
          </Button>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-6 space-y-6">
              {/* Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(value) => handleInputChange('title', value)}
                  placeholder="Enter buzzer title"
                  error={validationErrors.title}
                />
              </div>

              {/* Device Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device <span className="text-red-500">*</span>
                </label>
                <select
                  className={`input select input--md ${validationErrors.device ? 'input--error' : ''}`}
                  value={formData.device.toString()}
                  onChange={(e) => handleInputChange('device', Number(e.target.value))}
                >
                  <option value={0}>Select a device</option>
                  {(devices || []).map(device => (
                    <option key={device.id} value={device.id}>
                      {device.phone} - {device.imei}
                    </option>
                  ))}
                </select>
                {validationErrors.device && (
                  <span className="input__error">{validationErrors.device}</span>
                )}
                {(devices || []).length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No devices available. Contact an administrator.
                  </p>
                )}
              </div>

              {/* Delay Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay (seconds) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.delay.toString()}
                  onChange={(value) => handleInputChange('delay', Number(value))}
                  placeholder="Enter delay in seconds"
                  error={validationErrors.delay}
                />
                <p className="text-sm text-gray-500 mt-1">
                  How long to wait before triggering the buzzer after alert detection
                </p>
              </div>

              {/* Geofences Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated Geofences
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {(geofences || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No geofences available</p>
                  ) : (
                    (geofences || []).map(geofence => (
                      <div key={geofence.id} className="flex items-center">
                        <Checkbox
                          checked={formData.alert_geofence_ids.includes(geofence.id)}
                          onChange={() => handleGeofenceToggle(geofence.id)}
                        />
                        <label
                          htmlFor={`geofence-${geofence.id}`}
                          className="ml-2 text-sm text-gray-700 cursor-pointer"
                        >
                          {geofence.title}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Select which geofences this buzzer should monitor
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                icon={submitting ? <Spinner size="sm" /> : undefined}
              >
                {submitting ? 'Creating...' : 'Create Buzzer'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default BuzzerCreatePage;
