import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertSwitchService, type AlertSwitch } from '../../../api/services/alertSystemService';
import { deviceService } from '../../../api/services/deviceService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import SingleSelect from '../../../components/ui/forms/SingleSelect';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import { getErrorMessage, getErrorTitle } from '../../../utils/errorHandler';
import { roundCoordinate } from '../../../utils/coordinateUtils';


interface Device {
  id: number;
  phone: string;
  imei: string;
}

interface FormData {
  title: string;
  device: number;
  latitude: number;
  longitude: number;
  trigger: number;
  primary_phone: string;
  secondary_phone: string;
  image: File | null;
}

const SwitchEditPage: React.FC = () => {
  const { instituteId, id } = useParams<{ instituteId: string; id: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute, isAdmin } = useAlertSystemAccess(Number(instituteId));

  const [switchItem, setSwitchItem] = useState<AlertSwitch | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    device: 0,
    latitude: 0,
    longitude: 0,
    trigger: 5,
    primary_phone: '',
    secondary_phone: '',
    image: null
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

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [switchResponse, devicesResponse] = await Promise.all([
        alertSwitchService.getById(Number(id)),
        deviceService.getLightDevices()
      ]);

      if (switchResponse) {
        setSwitchItem(switchResponse);
        setFormData({
          title: switchResponse.title,
          device: switchResponse.device,
          latitude: switchResponse.latitude,
          longitude: switchResponse.longitude,
          trigger: typeof switchResponse.trigger === 'string' ? parseInt(switchResponse.trigger) : switchResponse.trigger,
          primary_phone: switchResponse.primary_phone,
          secondary_phone: switchResponse.secondary_phone,
          image: null
        });
      } else {
        setError('Switch not found');
      }

      if (devicesResponse.success && devicesResponse.data) {
        setDevices(devicesResponse.data);
      } else {
        setError(devicesResponse.error || 'Failed to load devices');
      }
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load switch data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAdmin && hasAccessToInstitute(Number(instituteId))) {
      fetchData();
    }
  }, [isAdmin, hasAccessToInstitute, instituteId, fetchData]);

  // Handle input changes
  const handleInputChange = (name: string, value: string | number | File | null) => {
    // Round coordinates to 8 decimal places for precision
    if (name === 'latitude' || name === 'longitude') {
      const numValue = typeof value === 'number' ? roundCoordinate(value) : value;
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleInputChange('image', file);
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

    if (!formData.latitude || formData.latitude < -90 || formData.latitude > 90) {
      errors.latitude = 'Valid latitude is required (-90 to 90)';
    }

    if (!formData.longitude || formData.longitude < -180 || formData.longitude > 180) {
      errors.longitude = 'Valid longitude is required (-180 to 180)';
    }

    if (!formData.trigger || formData.trigger < 1) {
      errors.trigger = 'Valid trigger delay is required (minimum 1 second)';
    }

    if (!formData.primary_phone.trim()) {
      errors.primary_phone = 'Primary phone is required';
    }

    if (!formData.secondary_phone.trim()) {
      errors.secondary_phone = 'Secondary phone is required';
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
        latitude: roundCoordinate(formData.latitude),
        longitude: roundCoordinate(formData.longitude),
        trigger: formData.trigger,
        primary_phone: formData.primary_phone.trim(),
        secondary_phone: formData.secondary_phone.trim(),
        image: formData.image
      };

      await alertSwitchService.update(Number(id), payload);
      
      showSuccess('Switch updated successfully!');
      navigate(`/alert-system/${instituteId}/switches/${id}`);
    } catch (err: unknown) {
      console.error('Error updating switch:', err);
      showError(getErrorTitle(err), getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/alert-system/${instituteId}/switches/${id}`);
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

  if (!switchItem) {
    return (
      <Container>
        <Alert variant="danger">Switch not found</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Alert Switch</h1>
            <p className="text-gray-600 mt-1">Update switch settings and configuration</p>
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
                  placeholder="Enter switch title"
                  error={validationErrors.title}
                />
              </div>

              {/* Device Field */}
              <div>
                <SingleSelect
                  options={(devices || []).map(device => ({
                    id: device.id,
                    label: `${device.phone} - ${device.imei}`,
                    value: device.id
                  }))}
                  value={formData.device || null}
                  onChange={(value) => handleInputChange('device', value as number)}
                  placeholder="Select a device"
                  label="Device *"
                  searchable
                  error={validationErrors.device}
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude.toString()}
                    onChange={(value) => handleInputChange('latitude', Number(value))}
                    placeholder="Enter latitude"
                    error={validationErrors.latitude}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude.toString()}
                    onChange={(value) => handleInputChange('longitude', Number(value))}
                    placeholder="Enter longitude"
                    error={validationErrors.longitude}
                  />
                </div>
              </div>

              {/* Trigger Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Delay (seconds) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.trigger.toString()}
                  onChange={(value) => handleInputChange('trigger', Number(value))}
                  placeholder="Enter trigger delay in seconds"
                  error={validationErrors.trigger}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Delay in seconds before the switch triggers the alert
                </p>
              </div>

              {/* Phone Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={formData.primary_phone}
                    onChange={(value) => handleInputChange('primary_phone', value)}
                    placeholder="Enter primary phone number"
                    error={validationErrors.primary_phone}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={formData.secondary_phone}
                    onChange={(value) => handleInputChange('secondary_phone', value)}
                    placeholder="Enter secondary phone number"
                    error={validationErrors.secondary_phone}
                  />
                </div>
              </div>

              {/* Image Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {switchItem.image && (
                  <p className="text-sm text-gray-500 mt-1">
                    Current image: {switchItem.image}
                  </p>
                )}
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
                {submitting ? 'Updating...' : 'Update Switch'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default SwitchEditPage;
