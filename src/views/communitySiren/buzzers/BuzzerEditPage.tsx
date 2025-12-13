import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommunitySirenAccess } from '../../../hooks/useCommunitySirenAccess';
import { communitySirenBuzzerService, type CommunitySirenBuzzer } from '../../../api/services/communitySirenService';
import { deviceService } from '../../../api/services/deviceService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import SingleSelect from '../../../components/ui/forms/SingleSelect';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';


interface Device {
  id: number;
  phone: string;
  imei: string;
}

interface FormData {
  title: string;
  device: number;
  delay: number;
}

const BuzzerEditPage: React.FC = () => {
  const { instituteId, id } = useParams<{ instituteId: string; id: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute, isAdmin } = useCommunitySirenAccess(Number(instituteId));

  const [buzzer, setBuzzer] = useState<CommunitySirenBuzzer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    device: 0,
    delay: 5
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check access
  useEffect(() => {
    if (!hasAccessToInstitute(Number(instituteId))) {
      setError('You do not have access to this institute\'s community siren.');
      setLoading(false);
      return;
    }
  }, [hasAccessToInstitute, instituteId]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [buzzerResponse, devicesResponse] = await Promise.all([
        communitySirenBuzzerService.getById(Number(id)),
        deviceService.getBuzzerDevicesPaginated(1)
      ]);

      if (buzzerResponse) {
        setBuzzer(buzzerResponse);
        setFormData({
          title: buzzerResponse.title,
          device: buzzerResponse.device,
          delay: buzzerResponse.delay
        });
      } else {
        setError('Buzzer not found');
      }

      if (devicesResponse.success && devicesResponse.data?.devices) {
        setDevices(devicesResponse.data.devices);
      } else {
        setError(devicesResponse.error || 'Failed to load devices');
      }
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load buzzer data. Please try again.';
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
  const handleInputChange = (name: string, value: string | number) => {
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
        delay: formData.delay
      };

      await communitySirenBuzzerService.update(Number(id), payload);
      
      showSuccess('Buzzer updated successfully!');
      navigate(`/community-siren/${instituteId}`);
    } catch (err: unknown) {
      console.error('Error updating buzzer:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update buzzer. Please try again.';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/community-siren/${instituteId}`);
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

  if (!buzzer) {
    return (
      <Container>
        <Alert variant="danger">Buzzer not found</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Community Siren Buzzer</h1>
            <p className="text-gray-600 mt-1">Update buzzer settings and configuration</p>
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
                  onChange={(e) => handleInputChange('title', e)}
                  placeholder="Enter buzzer title"
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
                  onChange={(e) => handleInputChange('delay', Number(e))}
                  placeholder="Enter delay in seconds"
                  error={validationErrors.delay}
                />
                <p className="text-sm text-gray-500 mt-1">
                  How long to wait before triggering the buzzer after alert detection
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
                {submitting ? 'Updating...' : 'Update Buzzer'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default BuzzerEditPage;
