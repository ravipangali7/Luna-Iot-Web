import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { instituteService, type Institute } from '../../api/services/instituteService';
import { publicVehicleService } from '../../api/services/publicVehicleService';
import type { PublicVehicle } from '../../types/publicVehicle';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Button from '../../components/ui/buttons/Button';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import { ROLES } from '../../utils/roleUtils';
import { API_CONFIG } from '../../config/config';

const PublicVehicleShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const instituteId = Number(id);
  
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [publicVehicles, setPublicVehicles] = useState<PublicVehicle[]>([]);
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

      // Fetch public vehicles
      const vehiclesData = await publicVehicleService.getPublicVehiclesByInstitute(instituteId);
      if (vehiclesData.success && vehiclesData.data) {
        // Debug: Log vehicle data to check image structure
        console.log('Public vehicles data:', vehiclesData.data);
        setPublicVehicles(vehiclesData.data);
      } else {
        console.error('Failed to fetch vehicles:', vehiclesData.error);
        setPublicVehicles([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load public vehicle data. Please try again.');
      setPublicVehicles([]);
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
    navigate(`/public-vehicle/${instituteId}/vehicles/create`);
  };

  const handleViewVehicle = (vehicleId: number) => {
    navigate(`/public-vehicle/${instituteId}/vehicles/${vehicleId}`);
  };

  const handleEditVehicle = (vehicleId: number) => {
    navigate(`/public-vehicle/${instituteId}/vehicles/${vehicleId}/edit`);
  };

  const handleToggleActive = async (vehicleId: number, currentStatus: boolean) => {
    try {
      const result = await publicVehicleService.togglePublicVehicleActive(vehicleId, !currentStatus);
      if (result.success) {
        showSuccess(`Public vehicle ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchData();
      } else {
        showError(result.error || 'Failed to update vehicle status');
      }
    } catch (err) {
      console.error('Error toggling vehicle status:', err);
      showError('Failed to update vehicle status. Please try again.');
    }
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
        navigate('/public-vehicle');
      } catch (err) {
        console.error('Error deleting institute:', err);
        showError('Failed to delete institute. Please try again.');
      }
    }
  };

  const handleDelete = async (vehicleId: number) => {
    const confirmed = await confirmDelete(
      'Delete Public Vehicle',
      `Are you sure you want to delete this public vehicle? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await publicVehicleService.deletePublicVehicle(vehicleId);
        showSuccess('Public vehicle deleted successfully');
        fetchData();
      } catch (err) {
        console.error('Error deleting public vehicle:', err);
        showError('Failed to delete public vehicle. Please try again.');
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
            <h1 className="text-2xl font-bold text-gray-900">Public Vehicle - {institute.name}</h1>
            <p className="text-gray-600 mt-1">
              Manage public vehicles for this institute
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
                  <p className="text-sm text-gray-600">Public Vehicle Management</p>
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
            Add Public Vehicle
          </Button>
        </div>

        {/* Public Vehicles Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Public Vehicles ({publicVehicles.length})</h3>
            {publicVehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No public vehicles found. Click "Add Public Vehicle" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicVehicles.map((vehicle) => (
              <Card key={vehicle.id}>
                <div className="p-6">
                  {/* Vehicle Info */}
                  {vehicle.vehicle && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900">
                        {vehicle.vehicle.vehicleNo} - {vehicle.vehicle.name}
                      </p>
                    </div>
                  )}

                  {/* First Image */}
                  {vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0 ? (
                    <div className="mb-4">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                        {(() => {
                          const firstImage = vehicle.images[0];
                          if (!firstImage || !firstImage.image) {
                            return (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            );
                          }
                          // Handle image URL - use as-is if it's already a full URL, otherwise construct it
                          let imageUrl = firstImage.image;
                          if (!imageUrl.startsWith('http')) {
                            // Remove BASE_URL if it's accidentally duplicated in the path
                            if (imageUrl.includes(API_CONFIG.BASE_URL)) {
                              imageUrl = imageUrl.replace(API_CONFIG.BASE_URL, '');
                            }
                            imageUrl = `${API_CONFIG.BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                          }
                          return (
                            <>
                              <img
                                src={imageUrl}
                                alt={firstImage.title || `Vehicle ${vehicle.id} - Image`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Image load error:', imageUrl);
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              {firstImage.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 rounded-b-lg">
                                  {firstImage.title}
                                </div>
                              )}
                              {vehicle.images.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                                  +{vehicle.images.length - 1} more
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Description */}
                  {vehicle.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {vehicle.description}
                    </p>
                  )}

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vehicle.is_active}
                          onChange={() => handleToggleActive(vehicle.id, vehicle.is_active)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {vehicle.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(vehicle.created_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleViewVehicle(vehicle.id)}
                      className="flex-1"
                    >
                      View
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditVehicle(vehicle.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default PublicVehicleShowPage;

