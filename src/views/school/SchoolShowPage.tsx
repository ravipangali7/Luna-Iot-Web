import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { instituteService, type Institute } from '../../api/services/instituteService';
import { schoolService } from '../../api/services/schoolService';
import type { SchoolBusList, SchoolParentList, SchoolSMSList } from '../../types/school';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Button from '../../components/ui/buttons/Button';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';


const SchoolShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const instituteId = Number(id);
  
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [schoolBuses, setSchoolBuses] = useState<SchoolBusList[]>([]);
  const [schoolParents, setSchoolParents] = useState<SchoolParentList[]>([]);
  const [schoolSMS, setSchoolSMS] = useState<SchoolSMSList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch institute details
      const instituteData = await instituteService.getInstituteById(instituteId);
      setInstitute(instituteData.data ? {
        ...instituteData.data,
        phone: instituteData.data.phone || '',
        address: instituteData.data.address || ''
      } : null);

      // Fetch all school data for this institute
      const [busesData, parentsData, smsData] = await Promise.all([
        schoolService.getSchoolBusesByInstitute(instituteId),
        schoolService.getSchoolParentsByInstitute(instituteId),
        schoolService.getSchoolSMSByInstitute(instituteId)
      ]);

      setSchoolBuses(busesData.success && busesData.data ? busesData.data : []);
      setSchoolParents(parentsData.success && parentsData.data ? parentsData.data : []);
      setSchoolSMS(smsData.success && smsData.data ? smsData.data : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load school data. Please try again.');
      setSchoolBuses([]);
      setSchoolParents([]);
      setSchoolSMS([]);
    } finally {
      setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => {
    if (instituteId) {
      fetchData();
    }
  }, [instituteId, fetchData]);

  const handleAddBus = () => {
    navigate(`/school/${instituteId}/buses/create`);
  };

  const handleAddParents = () => {
    navigate(`/school/${instituteId}/parents/create`);
  };

  const handleAddSMS = () => {
    navigate(`/school/${instituteId}/sms/create`);
  };

  const handleEditInstitute = () => {
    navigate(`/institute/${instituteId}/edit`);
  };

  const handleViewInstitute = () => {
    navigate(`/institute/${instituteId}`);
  };

  const handleDeleteInstitute = async () => {
    if (!institute) return;
    
    const confirmed = await confirmDelete(
      'Delete Institute',
      `Are you sure you want to delete "${institute.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await instituteService.deleteInstitute(instituteId);
        showSuccess('Institute deleted successfully');
        navigate('/school');
      } catch (err) {
        console.error('Error deleting institute:', err);
        showError('Failed to delete institute. Please try again.');
      }
    }
  };

  const handleEdit = (type: string, itemId: number) => {
    if (type === 'parents') {
      navigate(`/school/${instituteId}/parents/${itemId}/edit`);
    } else {
      navigate(`/school/${instituteId}/${type}/${itemId}/edit`);
    }
  };

  const handleDelete = async (type: string, itemId: number, name: string) => {
    const confirmed = await confirmDelete(
      `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        switch (type) {
          case 'buses':
            await schoolService.deleteSchoolBus(itemId);
            break;
          case 'parents':
            await schoolService.deleteSchoolParent(itemId);
            break;
          case 'sms':
            await schoolService.deleteSchoolSMS(itemId);
            break;
        }
        showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
        fetchData();
      } catch (err) {
        console.error(`Error deleting ${type}:`, err);
        showError(`Failed to delete ${type}. Please try again.`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
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

  if (!institute) {
    return (
      <Container>
        <Alert variant="warning" className="mb-6">
          Institute not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School - {institute.name}</h1>
            <p className="text-gray-600 mt-1">
              Manage school buses, parents, and SMS for this institute
            </p>
          </div>
        </div>

        {/* Institute Details Card */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Institute Details</h2>
              <div className="flex space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleViewInstitute}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                >
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEditInstitute}
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
                  size="sm"
                  onClick={handleDeleteInstitute}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{institute.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{institute.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{institute.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            variant="primary"
            onClick={handleAddBus}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Bus
          </Button>
          <Button
            variant="primary"
            onClick={handleAddParents}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Parents
          </Button>
          <Button
            variant="primary"
            onClick={handleAddSMS}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add SMS
          </Button>
        </div>

        {/* School Buses Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">School Buses ({schoolBuses.length})</h3>
            {schoolBuses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No school buses found. Click "Add Bus" to create one.
              </div>
            ) : (
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader>Bus Name</TableHeader>
                    <TableHeader>Vehicle No</TableHeader>
                    <TableHeader>Created At</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schoolBuses.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-gray-900">{item.bus_name}</TableCell>
                      <TableCell className="text-gray-600">{item.bus_vehicle_no}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit('buses', item.id)}
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
                            size="sm"
                            onClick={() => handleDelete('buses', item.id, item.bus_name)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* School Parents Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">School Parents ({schoolParents.length})</h3>
            {schoolParents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No school parents found. Click "Add Parents" to create one.
              </div>
            ) : (
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader>Parent Name</TableHeader>
                    <TableHeader>Phone</TableHeader>
                    <TableHeader>Buses Assigned</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Created At</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schoolParents.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-gray-900">{item.parent_name}</TableCell>
                      <TableCell className="text-gray-600">{item.parent_phone}</TableCell>
                      <TableCell className="text-gray-600">{item.school_buses_count}</TableCell>
                      <TableCell className="text-gray-600">
                        {item.latitude && item.longitude 
                          ? `${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit('parents', item.id)}
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
                            size="sm"
                            onClick={() => handleDelete('parents', item.id, item.parent_name)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* School SMS Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">School SMS ({schoolSMS.length})</h3>
            {schoolSMS.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No SMS messages found. Click "Add SMS" to create one.
              </div>
            ) : (
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader>Message Preview</TableHeader>
                    <TableHeader>Phone Numbers</TableHeader>
                    <TableHeader>Created At</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schoolSMS.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-gray-900">
                        <div className="max-w-md truncate" title={item.message_preview}>
                          {item.message_preview}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{item.phone_numbers_count} recipients</TableCell>
                      <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit('sms', item.id)}
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
                            size="sm"
                            onClick={() => handleDelete('sms', item.id, item.message_preview)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default SchoolShowPage;

