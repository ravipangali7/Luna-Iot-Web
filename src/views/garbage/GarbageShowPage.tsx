import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { instituteService, type Institute } from '../../api/services/instituteService';
import { garbageService } from '../../api/services/garbageService';
import type { GarbageVehicleList } from '../../types/garbage';
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
import { ROLES } from '../../utils/roleUtils';
import { API_CONFIG } from '../../config/config';


const GarbageShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const instituteId = Number(id);
  
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [garbageVehicles, setGarbageVehicles] = useState<GarbageVehicleList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is Super Admin
  const isSuperAdmin = user?.roles?.some(role => role.name === ROLES.SUPER_ADMIN) || false;

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

      // Fetch garbage vehicles
      const vehiclesData = await garbageService.getGarbageVehiclesByInstitute(instituteId);
      setGarbageVehicles(vehiclesData.success && vehiclesData.data ? vehiclesData.data : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load garbage data. Please try again.');
      setGarbageVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => {
    if (instituteId) {
      fetchData();
    }
  }, [instituteId, fetchData]);

  const handleAddVehicle = () => {
    navigate(`/garbage/${instituteId}/vehicles/create`);
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
        navigate('/garbage');
      } catch (err) {
        console.error('Error deleting institute:', err);
        showError('Failed to delete institute. Please try again.');
      }
    }
  };

  const handleDelete = async (vehicleId: number, vehicleName: string) => {
    const confirmed = await confirmDelete(
      'Delete Garbage Vehicle',
      `Are you sure you want to delete "${vehicleName}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await garbageService.deleteGarbageVehicle(vehicleId);
        showSuccess('Garbage vehicle deleted successfully');
        fetchData();
      } catch (err) {
        console.error('Error deleting garbage vehicle:', err);
        showError('Failed to delete garbage vehicle. Please try again.');
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
            <h1 className="text-2xl font-bold text-gray-900">Garbage - {institute.name}</h1>
            <p className="text-gray-600 mt-1">
              Manage garbage vehicles for this institute
            </p>
          </div>
        </div>

        {/* Institute Details Card */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                {institute.logo && (
                  <img 
                    src={`${API_CONFIG.BASE_URL}${institute.logo}`} 
                    alt={institute.name}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{institute.name}</h2>
                  <p className="text-sm text-gray-600">Garbage Management</p>
                </div>
              </div>
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
                {isSuperAdmin && (
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
                )}
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

        {/* Action Button */}
        <div className="mb-6">
          <Button
            variant="primary"
            onClick={handleAddVehicle}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Garbage Vehicle
          </Button>
        </div>

        {/* Garbage Vehicles Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Garbage Vehicles ({garbageVehicles.length})</h3>
            {garbageVehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No garbage vehicles found. Click "Add Garbage Vehicle" to create one.
              </div>
            ) : (
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader>Vehicle Name</TableHeader>
                    <TableHeader>Vehicle No</TableHeader>
                    <TableHeader>Created At</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {garbageVehicles.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-gray-900">{item.vehicle_name}</TableCell>
                      <TableCell className="text-gray-600">{item.vehicle_vehicle_no}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {isSuperAdmin && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.vehicle_name)}
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
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default GarbageShowPage;

