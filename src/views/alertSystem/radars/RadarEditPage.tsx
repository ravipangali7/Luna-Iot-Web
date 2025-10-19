import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertRadarService, alertGeofenceService } from '../../../api/services/alertSystemService';
import type { AlertRadar } from '../../../api/services/alertSystemService';
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

interface FormData {
  title: string;
  token: string;
  alert_geofence_ids: number[];
}

const RadarEditPage: React.FC = () => {
  const { instituteId, id } = useParams<{ instituteId: string; id: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute, isAdmin } = useAlertSystemAccess(Number(instituteId));

  const [radar, setRadar] = useState<AlertRadar | null>(null);
  const [geofences, setGeofences] = useState<AlertGeofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    token: '',
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

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [radarResponse, geofencesResponse] = await Promise.all([
        alertRadarService.getById(Number(id)),
        alertGeofenceService.getByInstitute(Number(instituteId))
      ]);

      if (radarResponse) {
        setRadar(radarResponse);
        setFormData({
          title: radarResponse.title,
          token: radarResponse.token,
          alert_geofence_ids: radarResponse.alert_geofences.map(g => g.id)
        });
      } else {
        setError('Radar not found');
      }

      setGeofences(geofencesResponse || []);
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load radar data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id, instituteId]);

  useEffect(() => {
    if (isAdmin && hasAccessToInstitute(Number(instituteId))) {
      fetchData();
    }
  }, [isAdmin, hasAccessToInstitute, instituteId, fetchData]);

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
        geofence_ids: formData.alert_geofence_ids
      };

      await alertRadarService.update(Number(id), payload);
      
      showSuccess('Radar updated successfully!');
      navigate(`/alert-system/${instituteId}/radars/${id}`);
    } catch (err: unknown) {
      console.error('Error updating radar:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update radar. Please try again.';
      showError(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/alert-system/${instituteId}/radars/${id}`);
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

  if (!radar) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          Radar not found
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Radar</h1>
            <p className="text-gray-600 mt-1">
              Update radar details and geofences
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

                {/* Token Field - Read Only */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token
                  </label>
                  <Input
                    type="text"
                    value={formData.token}
                    onChange={() => {}} // Disabled
                    placeholder="Auto-generated token"
                    disabled={true}
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Auto-generated unique identifier for this radar device
                  </p>
                </div>

                {/* Geofences Field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Geofences
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                    {geofences.length === 0 ? (
                      <p className="text-sm text-gray-500">No geofences available</p>
                    ) : (
                      geofences.map(geofence => (
                        <Checkbox
                          key={geofence.id}
                          checked={formData.alert_geofence_ids.includes(geofence.id)}
                          onChange={(checked) => {
                            if (checked) {
                              handleInputChange('alert_geofence_ids', [...formData.alert_geofence_ids, geofence.id]);
                            } else {
                              handleInputChange('alert_geofence_ids', formData.alert_geofence_ids.filter(id => id !== geofence.id));
                            }
                          }}
                        >
                          <span className="text-sm text-gray-700">{geofence.title}</span>
                        </Checkbox>
                      ))
                    )}
                  </div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )
                }
              >
                {submitting ? 'Updating...' : 'Update Radar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default RadarEditPage;
