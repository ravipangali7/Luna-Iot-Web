import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertSwitchService } from '../../../api/services/alertSystemService';
import { API_CONFIG } from '../../../config/config';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';

interface AlertSwitch {
  id: number;
  title: string;
  device: number;
  device_name: string;
  latitude: number;
  longitude: number;
  trigger: string;
  primary_phone: string;
  secondary_phone: string;
  image: string;
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

const SwitchViewPage: React.FC = () => {
  const { instituteId, id } = useParams<{ instituteId: string; id: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute, isAdmin } = useAlertSystemAccess(Number(instituteId));

  const [switchItem, setSwitchItem] = useState<AlertSwitch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch switch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const switchResponse = await alertSwitchService.getById(Number(id));
      setSwitchItem(switchResponse);
    } catch (err: unknown) {
      console.error('Error fetching switch data:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load switch data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (hasAccessToInstitute(Number(instituteId))) {
      fetchData();
    } else {
      setError('You do not have access to this institute\'s alert system.');
      setLoading(false);
    }
  }, [hasAccessToInstitute, instituteId, fetchData]);

  // Handle edit
  const handleEdit = () => {
    navigate(`/alert-system/${instituteId}/switches/${id}/edit`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!switchItem) return;

    const confirmed = await confirmDelete(
      'Delete Switch',
      `Are you sure you want to delete the switch "${switchItem.title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await alertSwitchService.delete(switchItem.id);
        showSuccess('Switch deleted successfully!');
        navigate(`/alert-system/${instituteId}/switches`);
      } catch (err: unknown) {
        console.error('Error deleting switch:', err);
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete switch. Please try again.';
        showError(errorMessage);
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate(`/alert-system/${instituteId}/switches`);
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

  // Format coordinates
  const formatCoordinates = (lat: number | string, lng: number | string) => {
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      return 'N/A';
    }
    
    return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
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
        <Alert variant="error" title="Error" message={error} />
      </Container>
    );
  }

  if (!switchItem) {
    return (
      <Container>
        <Alert variant="error" title="Error" message="Switch not found" />
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              onClick={handleBack}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              }
            >
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{switchItem.title}</h1>
              <p className="text-gray-600 mt-1">Alert Switch Details</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="primary"
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
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <p className="text-gray-900">{switchItem.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device
                  </label>
                  <p className="text-gray-900">{switchItem.device_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <p className="text-gray-900 font-mono text-sm">
                    {formatCoordinates(switchItem.latitude, switchItem.longitude)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Type
                  </label>
                  <Badge 
                    variant={switchItem.trigger === 'HIGH' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {switchItem.trigger}
                  </Badge>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Phone
                  </label>
                  <p className="text-gray-900">{switchItem.primary_phone}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Phone
                  </label>
                  <p className="text-gray-900">{switchItem.secondary_phone}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institute
                  </label>
                  <p className="text-gray-900">{switchItem.institute_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <p className="text-gray-900">{formatDate(switchItem.created_at)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Updated
                  </label>
                  <p className="text-gray-900">{formatDate(switchItem.updated_at)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Image */}
          {switchItem.image && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Image</h2>
                <div className="text-center">
                  <img
                    src={`${API_CONFIG.BASE_URL}${switchItem.image}`}
                    alt={switchItem.title}
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
};

export default SwitchViewPage;
