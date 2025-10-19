import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../hooks/useAlertSystemAccess';
import { alertHistoryService, type AlertHistory } from '../../api/services/alertSystemService';
import { API_CONFIG } from '../../config/config';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Button from '../../components/ui/buttons/Button';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import Swal from 'sweetalert2';

const AlertHistoryViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading, isAdmin } = useAlertSystemAccess();
  
  const [alertHistory, setAlertHistory] = useState<AlertHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

   useEffect(() => {
     if (!accessLoading) {
       if (!hasAccess) {
         setError('You do not have access to the Alert History. Please contact your administrator.');
         setLoading(false);
         return;
       }
       fetchAlertHistory();
     }
   }, [id, hasAccess, accessLoading]);

  const fetchAlertHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const historyId = Number(id);
      const data = await alertHistoryService.getById(historyId);
      setAlertHistory(data);
    } catch (err) {
      console.error('Error fetching alert history:', err);
      setError('Failed to load alert history details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleStatusChange = async () => {
    if (!alertHistory) return;

    const { value: newStatus } = await Swal.fire({
      title: 'Change Status',
      input: 'select',
      inputOptions: {
        'pending': 'Pending',
        'approved': 'Approved',
        'rejected': 'Rejected'
      },
      inputValue: alertHistory.status,
      inputPlaceholder: 'Select a status',
      showCancelButton: true,
      confirmButtonText: 'Update',  // Explicit override
      cancelButtonText: 'Cancel',   // Explicit override
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6b7280',
      reverseButtons: false,  // Explicit override to prevent global config
      focusCancel: false,     // Explicit override
      inputValidator: (value) => {
        if (!value) {
          return 'You need to select a status!';
        }
      }
    });

    if (newStatus) {
      try {
        setUpdating(true);
        const updatedHistory = await alertHistoryService.updateStatus(alertHistory.id, { status: newStatus });
        setAlertHistory(updatedHistory);
        showSuccess('Status updated successfully');
      } catch (err) {
        console.error('Error updating status:', err);
        showError('Failed to update status. Please try again.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleRemarksChange = async () => {
    if (!alertHistory) return;

    const { value: newRemarks } = await Swal.fire({
      title: 'Change Remarks',
      input: 'textarea',
      inputValue: alertHistory.remarks || '',
      inputPlaceholder: 'Enter remarks...',
      inputAttributes: {
        'aria-label': 'Enter remarks'
      },
      showCancelButton: true,
      confirmButtonText: 'Update',  // Explicit override
      cancelButtonText: 'Cancel',   // Explicit override
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6b7280',
      reverseButtons: false,  // Explicit override to prevent global config
      focusCancel: false,     // Explicit override
      inputValidator: (value) => {
        if (value === undefined || value === null) {
          return 'Remarks cannot be empty!';
        }
      }
    });

    if (newRemarks !== undefined) {
      try {
        setUpdating(true);
        const updatedHistory = await alertHistoryService.updateRemarks(alertHistory.id, { remarks: newRemarks });
        setAlertHistory(updatedHistory);
        showSuccess('Remarks updated successfully');
      } catch (err) {
        console.error('Error updating remarks:', err);
        showError('Failed to update remarks. Please try again.');
      } finally {
        setUpdating(false);
      }
    }
  };

   const handleDelete = async () => {
     if (!alertHistory) return;

     const confirmed = await confirmDelete(
       'Delete Alert History',
       `Are you sure you want to delete the alert history for "${alertHistory.name}"? This action cannot be undone.`
     );

     if (confirmed) {
       try {
         await alertHistoryService.delete(alertHistory.id);
         showSuccess('Alert history deleted successfully');
         navigate('/alert-history');
       } catch (err) {
         console.error('Error deleting alert history:', err);
         showError('Failed to delete alert history. Please try again.');
       }
     }
   };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="warning" size="md">Pending</Badge>;
      case 'approved':
        return <Badge variant="success" size="md">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="md">Rejected</Badge>;
      default:
        return <Badge variant="secondary" size="md">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source.toLowerCase()) {
      case 'geofence':
        return <Badge variant="info" size="md">Geofence</Badge>;
      case 'radar':
        return <Badge variant="primary" size="md">Radar</Badge>;
      case 'buzzer':
        return <Badge variant="warning" size="md">Buzzer</Badge>;
      case 'switch':
        return <Badge variant="success" size="md">Switch</Badge>;
      default:
        return <Badge variant="secondary" size="md">{source}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (accessLoading || loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!alertHistory) {
    return (
      <Container>
        <Alert variant="warning" className="mb-6">
          Alert history not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert History Details</h1>
            <p className="text-gray-600 mt-1">
              View and manage alert history record
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/alert-history')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              }
            >
              Back to History
            </Button>
          </div>
        </div>

        {/* Alert History Details Card */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{alertHistory.name}</h2>
                <div className="flex space-x-3">
                  {getSourceBadge(alertHistory.source)}
                  {getStatusBadge(alertHistory.status)}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleStatusChange}
                  disabled={updating}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  Change Status
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={handleRemarksChange}
                  disabled={updating}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                >
                  Change Remarks
                </Button>
                
                {isAdmin && (
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={updating}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    }
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Alert ID</label>
                <p className="text-gray-900 font-mono">{alertHistory.id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Source</label>
                <p className="text-gray-900">{alertHistory.source}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(alertHistory.status)}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{alertHistory.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Primary Phone</label>
                <p className="text-gray-900">{alertHistory.primary_phone}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Alert Type</label>
                <p className="text-gray-900">{alertHistory.alert_type_name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Date & Time</label>
                <p className="text-gray-900">{formatDateTime(alertHistory.datetime)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Institute</label>
                <p className="text-gray-900">{alertHistory.institute_name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-gray-900">{formatDateTime(alertHistory.created_at)}</p>
              </div>
            </div>

            {/* Remarks Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-500">Remarks</label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {alertHistory.remarks || 'No remarks provided'}
                </p>
              </div>
            </div>

            {/* Image Section */}
            {alertHistory.image && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-500">Image</label>
                <div className="mt-2">
                  <img
                    src={`${API_CONFIG.BASE_URL}${alertHistory.image}`}
                    alt="Alert image"
                    className="max-w-md h-auto rounded-lg shadow-sm border border-gray-200"
                  />
                </div>
              </div>
            )}

            {/* Updated At */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900">{formatDateTime(alertHistory.updated_at)}</p>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default AlertHistoryViewPage;
