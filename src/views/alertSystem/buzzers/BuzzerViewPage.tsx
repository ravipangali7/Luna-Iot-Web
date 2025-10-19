import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertBuzzerService, type AlertBuzzer } from '../../../api/services/alertSystemService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';



const BuzzerViewPage: React.FC = () => {
  const { instituteId, id } = useParams<{ instituteId: string; id: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute } = useAlertSystemAccess(Number(instituteId));

  const [buzzer, setBuzzer] = useState<AlertBuzzer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch buzzer data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const buzzerResponse = await alertBuzzerService.getById(Number(id));

      setBuzzer(buzzerResponse);
    } catch (err: unknown) {
      console.error('Error fetching buzzer data:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load buzzer data. Please try again.';
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
    navigate(`/alert-system/${instituteId}/buzzers/${id}/edit`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!buzzer) return;

    const confirmed = await confirmDelete(
      'Delete Buzzer',
      `Are you sure you want to delete the buzzer "${buzzer.title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await alertBuzzerService.delete(buzzer.id);
        showSuccess('Buzzer deleted successfully!');
        navigate(`/alert-system/${instituteId}/buzzers`);
      } catch (err: unknown) {
        console.error('Error deleting buzzer:', err);
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete buzzer. Please try again.';
        showError(errorMessage);
      }
    }
  };

  // Handle back
  const handleBack = () => {
    navigate(`/alert-system/${instituteId}/buzzers`);
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
              <h1 className="text-2xl font-bold text-gray-900">{buzzer.title}</h1>
              <p className="text-gray-600 mt-1">Alert Buzzer Details</p>
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
                  <p className="text-gray-900">{buzzer.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device
                  </label>
                  <p className="text-gray-900">{buzzer.device_phone} - {buzzer.device_imei}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay
                  </label>
                  <p className="text-gray-900">{buzzer.delay} seconds</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institute
                  </label>
                  <p className="text-gray-900">{buzzer.institute_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <p className="text-gray-900">{formatDate(buzzer.created_at)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Updated
                  </label>
                  <p className="text-gray-900">{formatDate(buzzer.updated_at)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Associated Geofences */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Associated Geofences ({buzzer.alert_geofences_names?.length || 0})
              </h2>
              
              {(!buzzer.alert_geofences_names || buzzer.alert_geofences_names.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.553-1.894L9 2m0 18v-16m0 16l6-2.727m0 0V4m0 13.273L21 17.382A2 2 0 0021 15.382V6.618a2 2 0 00-1.553-1.894L15 4" />
                  </svg>
                  <p className="text-sm">No geofences associated</p>
                  <p className="text-xs text-gray-400 mt-1">This buzzer is not monitoring any geofences</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {buzzer.alert_geofences_names?.map((geofenceName, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">{geofenceName}</span>
                      <Badge variant="primary" size="sm">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default BuzzerViewPage;
