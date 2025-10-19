import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertGeofenceService } from '../../../api/services/alertSystemService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import GeofenceMap from '../../../components/maps/GeofenceMap';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';

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


interface AlertGeofence {
  id: number;
  title: string;
  boundary: string | GeoJSONGeometry; // Allow both types
  alert_types: number[]; // API returns array of IDs
  alert_types_names: string[]; // API also provides names
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

const GeofenceViewPage: React.FC = () => {
  const { instituteId, id } = useParams<{ instituteId: string; id: string }>();
  const navigate = useNavigate();
  const { isAdmin, hasAccessToInstitute } = useAlertSystemAccess(Number(instituteId));

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geofence, setGeofence] = useState<AlertGeofence | null>(null);

  // Check access
  useEffect(() => {
    if (!hasAccessToInstitute(Number(instituteId))) {
      setError('You do not have access to this institute\'s alert system.');
      setLoading(false);
      return;
    }
  }, [hasAccessToInstitute, instituteId]);

  // Fetch geofence data
  const fetchGeofence = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await alertGeofenceService.getById(Number(id));
      if (response) {
        // Parse boundary if it's a string
        const parsedGeofence: AlertGeofence = {
          ...response,
          boundary: typeof response.boundary === 'string' 
            ? JSON.parse(response.boundary) 
            : response.boundary
        };
        setGeofence(parsedGeofence);
      } else {
        setError('Geofence not found');
      }
    } catch (err: any) {
      console.error('Error fetching geofence:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load geofence. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (hasAccessToInstitute(Number(instituteId))) {
      fetchGeofence();
    }
  }, [hasAccessToInstitute, instituteId, fetchGeofence]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/alert-system/${instituteId}/geofences/${id}/edit`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!geofence) return;

    const confirmed = await confirmDelete(
      'Delete Geofence',
      `Are you sure you want to delete "${geofence.title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        setDeleting(true);
        await alertGeofenceService.delete(geofence.id);
        showSuccess('Geofence deleted successfully!');
        navigate(`/alert-system/${instituteId}`);
      } catch (err: any) {
        console.error('Error deleting geofence:', err);
        const errorMessage = err.response?.data?.message || 'Failed to delete geofence. Please try again.';
        showError(errorMessage);
      } finally {
        setDeleting(false);
      }
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <h1 className="text-2xl font-bold text-gray-900">{geofence.title}</h1>
            <p className="text-gray-600 mt-1">
              Geofence details and boundary
            </p>
          </div>
          <div className="flex space-x-2">
            {isAdmin && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleEdit}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleting}
                  icon={
                    deleting ? (
                      <Spinner size="sm" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )
                  }
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              onClick={() => navigate(`/alert-system/${instituteId}`)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              }
            >
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Details Card */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Geofence Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="text-gray-900">{geofence.title}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Institute</label>
                    <p className="text-gray-900">{geofence.institute_name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Alert Types</label>
                    <div className="mt-1">
                      {geofence.alert_types_names && geofence.alert_types_names.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {geofence.alert_types_names.map((typeName, index) => (
                            <Badge key={index} variant="primary" size="sm">
                              {typeName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No alert types assigned</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-gray-900">{formatDate(geofence.created_at)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{formatDate(geofence.updated_at)}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Map Card */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Geofence Boundary</h2>
                
                <GeofenceMap
                  center={undefined} // Let map auto-fit
                  zoom={undefined} // Let map auto-fit
                  boundary={typeof geofence.boundary === 'string' ? JSON.parse(geofence.boundary) : geofence.boundary}
                  onBoundaryChange={() => {}} // Read-only mode
                  readOnly={true}
                  height="400px"
                  fitToBounds={true} // New prop to enable auto-fit
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default GeofenceViewPage;
