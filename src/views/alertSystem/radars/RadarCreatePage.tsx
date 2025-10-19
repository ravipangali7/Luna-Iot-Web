import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertRadarService, alertGeofenceService } from '../../../api/services/alertSystemService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import MultiSelect from '../../../components/ui/forms/MultiSelect';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';

interface AlertGeofence {
  id: number;
  title: string;
}

interface FormData {
  title: string;
  alert_geofence_ids: number[];
}

const RadarCreatePage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute } = useAlertSystemAccess(Number(instituteId));

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geofences, setGeofences] = useState<AlertGeofence[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
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

  // Fetch geofences
  const fetchGeofences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await alertGeofenceService.getByInstitute(Number(instituteId));
      setGeofences(response || []);
    } catch (err) {
      console.error('Error fetching geofences:', err);
      setError('Failed to load geofences. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  // Handle input changes
  const handleInputChange = (name: string, value: string | number[]) => {
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
        institute: Number(instituteId),
        geofence_ids: formData.alert_geofence_ids
      };

      await alertRadarService.create(payload);
      
      showSuccess('Radar created successfully!');
      navigate(`/alert-system/${instituteId}`);
    } catch (err: unknown) {
      console.error('Error creating radar:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create radar. Please try again.';
      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/alert-system/${instituteId}`);
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

  if (error && !loading) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
        <div className="flex justify-center">
          <Button variant="primary" onClick={() => navigate(`/alert-system/${instituteId}`)}>
            Back to Alert System
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Radar</h1>
            <p className="text-gray-600 mt-1">
              Create a new radar for the alert system. A unique token will be automatically generated.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="w-full">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Radar Details</h2>
                
                {/* Title Field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(value) => handleInputChange('title', value)}
                    placeholder="Enter radar title"
                    error={validationErrors.title}
                  />
                  {validationErrors.title && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                  )}
                </div>


              {/* Geofences Field */}
              <div className="mb-4">
                <MultiSelect
                  options={geofences.map(geofence => ({
                    id: geofence.id,
                    label: geofence.title,
                    value: geofence.id
                  }))}
                  value={formData.alert_geofence_ids}
                  onChange={(selectedValues) => handleInputChange('alert_geofence_ids', selectedValues as number[])}
                  placeholder="Select geofences..."
                  label="Alert Geofences"
                  searchable
                />
                <p className="mt-1 text-sm text-gray-500">
                  Select which geofences this radar should monitor
                </p>
              </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
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
                icon={
                  submitting ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )
                }
              >
                {submitting ? 'Creating...' : 'Create Radar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default RadarCreatePage;
