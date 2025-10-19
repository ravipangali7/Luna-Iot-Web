import React, { useState, useEffect, useCallback } from 'react';
import { useAlertSystemAccess } from '../../hooks/useAlertSystemAccess';
import { alertHistoryService, type AlertHistory } from '../../api/services/alertSystemService';
import { API_CONFIG } from '../../config/config';
import GeoUtils from '../../utils/geoUtils';
import AlertLocationMap from '../../components/maps/AlertLocationMap';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';

const AlertHistoryIndexPage: React.FC = () => {
  const { hasAccess, loading: accessLoading, isAdmin, accessibleInstitutes } = useAlertSystemAccess();
  
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertHistory | null>(null);
  const [alertAddress, setAlertAddress] = useState<string>('Loading address...');
  const [updatingAlert, setUpdatingAlert] = useState(false);
  const [alertStatus, setAlertStatus] = useState<string>('');
  const [alertRemarks, setAlertRemarks] = useState<string>('');

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const sourceOptions = [
    { value: '', label: 'All Sources' },
    { value: 'geofence', label: 'Geofence' },
    { value: 'radar', label: 'Radar' },
    { value: 'buzzer', label: 'Buzzer' },
    { value: 'switch', label: 'Switch' }
  ];

  const fetchAlertHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
       if (isAdmin) {
         // Admin gets all alert history
         const data = await alertHistoryService.getAll();
         response = Array.isArray(data) ? data : []; // ENSURE ARRAY
       } else {
         // Regular user gets history for their accessible institutes
         const accessibleInstituteIds = accessibleInstitutes
           .filter(inst => inst.has_alert_system_access)
           .map(inst => inst.institute_id);
         
         if (accessibleInstituteIds.length === 0) {
           setAlertHistory([]);
           setTotalCount(0);
           setTotalPages(0);
           setLoading(false);
           return;
         }

         // For now, we'll get all and filter client-side
         // In a real implementation, you'd want a backend endpoint that filters by institute IDs
         const data = await alertHistoryService.getAll();
         const allData = Array.isArray(data) ? data : []; // ENSURE ARRAY
         response = allData.filter((history: AlertHistory) => 
           accessibleInstituteIds.includes(history.institute)
         );
       }

      // Apply filters - response is guaranteed to be an array now
      let filteredData = Array.isArray(response) ? response : []; // DOUBLE CHECK
      
       if (searchTerm) {
         filteredData = filteredData.filter((item: AlertHistory) => 
           item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.primary_phone.includes(searchTerm)
         );
       }
       
       if (statusFilter) {
         filteredData = filteredData.filter((item: AlertHistory) => item.status === statusFilter);
       }
       
       if (sourceFilter) {
         filteredData = filteredData.filter((item: AlertHistory) => item.source === sourceFilter);
       }
       
       if (alertTypeFilter) {
         filteredData = filteredData.filter((item: AlertHistory) => 
           item.alert_type_name.toLowerCase().includes(alertTypeFilter.toLowerCase())
         );
       }

      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = Array.isArray(filteredData) ? filteredData.slice(startIndex, endIndex) : []; // ADD ARRAY CHECK

      setAlertHistory(paginatedData);
      setTotalCount(filteredData.length);
      setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
    } catch (err) {
      console.error('Error fetching alert history:', err);
      setError('Failed to load alert history. Please try again.');
      setAlertHistory([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, accessibleInstitutes, currentPage, searchTerm, statusFilter, sourceFilter, alertTypeFilter]);

  useEffect(() => {
    if (!accessLoading) {
      if (!hasAccess) {
        setError('You do not have access to the Alert History. Please contact your administrator.');
        setLoading(false);
        return;
      }
      fetchAlertHistory();
    }
  }, [hasAccess, accessLoading, fetchAlertHistory]);

  useEffect(() => {
    if (!accessLoading && hasAccess) {
      fetchAlertHistory();
    }
  }, [currentPage, searchTerm, statusFilter, sourceFilter, alertTypeFilter, accessLoading, hasAccess, fetchAlertHistory]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSourceFilter = (value: string) => {
    setSourceFilter(value);
    setCurrentPage(1);
  };

  const handleAlertTypeFilter = (value: string) => {
    setAlertTypeFilter(value);
    setCurrentPage(1);
  };


  // Modal handlers
  const handleOpenModal = (alert: AlertHistory) => {
    console.log('Opening modal for alert:', alert);
    console.log('Alert remarks:', alert.remarks);
    setSelectedAlert(alert);
    setAlertStatus(alert.status);
    setAlertRemarks(alert.remarks || '');
    setShowAlertModal(true);
  };

  const handleCloseModal = () => {
    setShowAlertModal(false);
    setSelectedAlert(null);
    setAlertAddress('Loading address...');
  };

  // Fetch reverse geocoded address when alert is shown
  useEffect(() => {
    if (selectedAlert) {
      GeoUtils.getReverseGeoCode(Number(selectedAlert.latitude), Number(selectedAlert.longitude))
        .then(address => setAlertAddress(address))
        .catch(() => setAlertAddress('Address unavailable'));
    }
  }, [selectedAlert]);

  // Handle alert status/remarks update
  const handleAlertUpdate = async () => {
    if (!selectedAlert) return;
    
    try {
      setUpdatingAlert(true);
      
      // Update status if changed
      if (alertStatus !== selectedAlert.status) {
        await alertHistoryService.updateStatus(selectedAlert.id, { status: alertStatus });
      }
      
      // Update remarks if changed
      if (alertRemarks !== (selectedAlert.remarks || '')) {
        await alertHistoryService.updateRemarks(selectedAlert.id, { remarks: alertRemarks });
      }
      
      showSuccess('Alert updated successfully!');
      handleCloseModal();
      
      // Refresh alert history
      fetchAlertHistory();
    } catch (error) {
      console.error('Error updating alert:', error);
      showError('Failed to update alert');
    } finally {
      setUpdatingAlert(false);
    }
  };


   const handleDelete = async (historyId: number, name: string) => {
     const confirmed = await confirmDelete(
       'Delete Alert History',
       `Are you sure you want to delete the alert history for "${name}"? This action cannot be undone.`
     );

     if (confirmed) {
       try {
         await alertHistoryService.delete(historyId);
         showSuccess('Alert history deleted successfully');
         fetchAlertHistory();
       } catch (err) {
         console.error('Error deleting alert history:', err);
         showError('Failed to delete alert history. Please try again.');
       }
     }
   };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'approved':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source.toLowerCase()) {
      case 'geofence':
        return <Badge variant="info" size="sm">Geofence</Badge>;
      case 'radar':
        return <Badge variant="primary" size="sm">Radar</Badge>;
      case 'buzzer':
        return <Badge variant="warning" size="sm">Buzzer</Badge>;
      case 'switch':
        return <Badge variant="success" size="sm">Switch</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{source}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (!hasAccess) {
    return (
      <Container>
        <Alert variant="warning" className="mb-6">
          You do not have access to the Alert History. Please contact your administrator.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert History</h1>
            <p className="text-gray-600 mt-1">
              View and manage alert history records
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                 </div>
                 <Input
                   type="text"
                   placeholder="Search by name or phone..."
                   value={searchTerm}
                   onChange={handleSearch}
                   className="pl-10"
                 />
               </div>
              
               <div>
                 <Select
                   value={statusFilter}
                   onChange={handleStatusFilter}
                   options={statusOptions}
                 />
               </div>
               
               <div>
                 <Select
                   value={sourceFilter}
                   onChange={handleSourceFilter}
                   options={sourceOptions}
                 />
               </div>
              
              <div>
                <Input
                  type="text"
                  placeholder="Filter by alert type..."
                  value={alertTypeFilter}
                  onChange={handleAlertTypeFilter}
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setSourceFilter('');
                    setAlertTypeFilter('');
                    setCurrentPage(1);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            {alertHistory.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No alert history found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter || sourceFilter || alertTypeFilter
                    ? 'No alert history matches your filter criteria.'
                    : 'No alert history records found.'}
                </p>
              </div>
            ) : (
              <>
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Source</TableHeader>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Primary Phone</TableHeader>
                      <TableHeader>Alert Type</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Date & Time</TableHeader>
                      <TableHeader>Remarks</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alertHistory.map(item => (
                      <TableRow 
                        key={item.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleOpenModal(item)}
                      >
                        <TableCell>{getSourceBadge(item.source)}</TableCell>
                        <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                        <TableCell className="text-gray-600">{item.primary_phone}</TableCell>
                        <TableCell className="text-gray-600">{item.alert_type_name}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-gray-600">{formatDateTime(item.datetime)}</TableCell>
                        <TableCell className="text-gray-600 max-w-xs truncate" title={item.remarks}>
                          {item.remarks || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenModal(item)}
                              icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              }
                            >
                              View
                            </Button>
                            
                            {isAdmin && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(item.id, item.name)}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Alert Details Modal */}
      {showAlertModal && selectedAlert && (
        <div style={{backgroundColor: 'rgba(0,0,0,0.7'}} className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Alert Details</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Address Section */}
              <div className="mb-4">
                <p className="text-base text-gray-900">{alertAddress}</p>
              </div>
              
              {/* Badges Row */}
              <div className="flex gap-3 mb-4">
                <Badge variant="danger" className="px-3 py-2 text-sm font-medium">
                  {selectedAlert.alert_type_name}
                </Badge>
                <Badge variant="primary" className="px-3 py-2 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {selectedAlert.name}
                </Badge>
                <Badge variant="primary" className="px-3 py-2 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {selectedAlert.primary_phone}
                </Badge>
              </div>
              
              {/* Coordinates */}
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {Number(selectedAlert.latitude).toFixed(6)}, {Number(selectedAlert.longitude).toFixed(6)}
              </div>
              
              {/* Map */}
              <div className="mb-4">
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <AlertLocationMap 
                    latitude={Number(selectedAlert.latitude)} 
                    longitude={Number(selectedAlert.longitude)} 
                    height="200px" 
                  />
                </div>
              </div>
              
              {/* Image Section - Show for non-app sources */}
              {selectedAlert.source !== 'app' && selectedAlert.image && (
                <div className="mb-4">
                  <img
                    src={`${API_CONFIG.BASE_URL}${selectedAlert.image}`}
                    alt="Alert image"
                    className="w-full h-auto rounded-md border border-gray-200"
                  />
                </div>
              )}
              
              {/* Current Remarks Display */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Current Remarks</h4>
                <p className="text-sm text-blue-800">
                  {selectedAlert.remarks || 'No remarks available'}
                </p>
              </div>
              
              {/* Review SOS Request Section */}
              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-900">Review SOS Request</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Remarks
                  </label>
                  <textarea
                    value={alertRemarks}
                    onChange={(e) => setAlertRemarks(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add or update remarks..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="approved"
                        checked={alertStatus === 'approved'}
                        onChange={(e) => setAlertStatus(e.target.value)}
                        className="mr-2"
                      />
                      Approve
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="action"
                        value="rejected"
                        checked={alertStatus === 'rejected'}
                        onChange={(e) => setAlertStatus(e.target.value)}
                        className="mr-2"
                      />
                      Disapprove
                    </label>
                  </div>
                </div>
                
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAlertUpdate}
                  disabled={updatingAlert}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updatingAlert ? (
                    <>
                      <Spinner size="sm" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Submit Action</span>
                  )}
                </button>
                <button
                  onClick={handleCloseModal}
                  disabled={updatingAlert}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default AlertHistoryIndexPage;
