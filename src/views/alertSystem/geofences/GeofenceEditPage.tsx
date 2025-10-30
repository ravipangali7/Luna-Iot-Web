import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertGeofenceService, alertTypeService } from '../../../api/services/alertSystemService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import MultiSelect from '../../../components/ui/forms/MultiSelect';
import GeofenceMap from '../../../components/maps/GeofenceMap';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';

// GeoJSON type definitions
interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

type GeoJSONGeometry = GeoJSONPolygon | GeoJSONMultiPolygon;

interface AlertType {
  id: number;
  name: string;
  icon: string | null;
  description?: string;
}

interface AlertGeofence {
  id: number;
  title: string;
  boundary: string | GeoJSONGeometry;
  alert_types: AlertType[];
  institute: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  title: string;
  boundary: GeoJSONGeometry | null;
  alert_type_ids: number[];
}

const GeofenceEditPage: React.FC = () => {
  const { instituteId, id } = useParams<{ instituteId: string; id: string }>();
  const navigate = useNavigate();
  const { isAdmin, hasAccessToInstitute } = useAlertSystemAccess(Number(instituteId));

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geofence, setGeofence] = useState<AlertGeofence | null>(null);
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    boundary: null,
    alert_type_ids: []
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check admin access
  useEffect(() => {
    if (!isAdmin) {
      setError('You do not have permission to edit geofences.');
      setLoading(false);
      return;
    }

    if (!hasAccessToInstitute(Number(instituteId))) {
      setError('You do not have access to this institute\'s alert system.');
      setLoading(false);
      return;
    }
  }, [isAdmin, hasAccessToInstitute, instituteId]);

  // Fetch geofence data and alert types
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [geofenceResponse, alertTypesResponse] = await Promise.all([
        alertGeofenceService.getById(Number(id)),
        alertTypeService.getAll()
      ]);

      if (geofenceResponse) {
        setGeofence({
          ...geofenceResponse,
          alert_types: geofenceResponse.alert_types.map(id => ({ id, name: '', icon: null })) // Convert number[] to AlertType[]
        });
        setFormData({
          title: geofenceResponse.title,
          boundary: typeof geofenceResponse.boundary === 'string' ? JSON.parse(geofenceResponse.boundary) : geofenceResponse.boundary,
          alert_type_ids: geofenceResponse.alert_types.map((type: any) => type.id)
        });
      } else {
        setError('Geofence not found');
      }

      setAlertTypes(alertTypesResponse || []);
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      const errorMessage = (err as any)?.response?.data?.message || 'Failed to load geofence data. Please try again.';
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

  // Handle boundary change
  const handleBoundaryChange = (boundary: GeoJSONGeometry | null) => {
    setFormData(prev => ({
      ...prev,
      boundary
    }));

    // Clear boundary validation error
    if (validationErrors.boundary) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.boundary;
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

    if (!formData.boundary) {
      errors.boundary = 'Geofence boundary is required. Please draw a polygon on the map.';
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
        boundary: formData.boundary || undefined,
        alert_type_ids: formData.alert_type_ids
      };

      await alertGeofenceService.update(Number(id), payload);
      
      showSuccess('Geofence updated successfully!');
      navigate(`/alert-system/${instituteId}`);
    } catch (err: unknown) {
      console.error('Error updating geofence:', err);
      const errorMessage = (err as any)?.response?.data?.message || 'Failed to update geofence. Please try again.';
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

  if (!geofence) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          Geofence not found
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Geofence</h1>
            <p className="text-gray-600 mt-1">
              Update geofence details and boundary
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            {/* Form Fields */}
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Geofence Details</h2>
                  
                  {/* Title Field */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(value) => handleInputChange('title', value)}
                      placeholder="Enter geofence title"
                      error={validationErrors.title}
                    />
                    {validationErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                    )}
                  </div>

              {/* Alert Types Field */}
              <div className="mb-4">
                <MultiSelect
                  options={alertTypes.map(type => ({
                    id: type.id,
                    label: type.name,
                    value: type.id
                  }))}
                  value={formData.alert_type_ids}
                  onChange={(selectedValues) => handleInputChange('alert_type_ids', selectedValues as number[])}
                  placeholder="Select alert types..."
                  label="Alert Types"
                  searchable
                />
                <p className="mt-1 text-sm text-gray-500">
                  Select which alert types this geofence should trigger
                </p>
              </div>
                </div>
              </Card>
            </div>

            {/* Map Section */}
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Geofence Boundary</h2>
                  
                  {validationErrors.boundary && (
                    <Alert variant="danger" className="mb-4">
                      {validationErrors.boundary}
                    </Alert>
                  )}

                  <GeofenceMap
                    center={undefined} // Let map auto-fit
                    zoom={undefined} // Let map auto-fit
                    boundary={formData.boundary}
                    onBoundaryChange={handleBoundaryChange}
                    readOnly={false}
                    height="400px"
                    fitToBounds={true} // New prop to enable auto-fit
                  />
                </div>
              </Card>

              {/* Coordinate List Display */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Polygon Coordinates</h3>
                  
                  {formData.boundary ? (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 mb-3">
                        Total points: {formData.boundary.coordinates[0]?.length || 0}
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                        {formData.boundary.coordinates[0]?.map((coord, index) => (
                          <div key={index} className="text-sm font-mono text-gray-700 py-1">
                            Point {index + 1}: {(coord[1] as number).toFixed(6)}, {(coord[0] as number).toFixed(6)}
                          </div>
                        )) || (
                          <div className="text-sm text-gray-500">No coordinates available</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.553-1.894L9 2m0 18v-16m0 16l6-2.727m0 0V4m0 13.273L21 17.382A2 2 0 0021 15.382V6.618a2 2 0 00-1.553-1.894L15 4" />
                      </svg>
                      <p className="text-sm">No coordinates yet</p>
                      <p className="text-xs text-gray-400 mt-1">Draw a polygon on the map to see coordinates</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )
              }
            >
              {submitting ? 'Updating...' : 'Update Geofence'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default GeofenceEditPage;
