import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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

const PublicVehicleViewPage: React.FC = () => {
  const { id: instituteId, vehicleId } = useParams<{ id: string; vehicleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [vehicle, setVehicle] = useState<PublicVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Check if user is Super Admin
  const isSuperAdmin = user?.roles?.some(role => role.name === ROLES.SUPER_ADMIN) || false;

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!vehicleId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const result = await publicVehicleService.getPublicVehicleById(parseInt(vehicleId));
        
        if (result.success && result.data) {
          setVehicle(result.data);
        } else {
          setError('Failed to load vehicle data');
        }
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        setError('Failed to load vehicle data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [vehicleId]);

  const handleToggleActive = async () => {
    if (!vehicle) return;
    
    try {
      const result = await publicVehicleService.togglePublicVehicleActive(vehicle.id, !vehicle.is_active);
      if (result.success && result.data) {
        setVehicle(result.data);
        showSuccess(`Public vehicle ${!vehicle.is_active ? 'activated' : 'deactivated'} successfully`);
      } else {
        showError(result.error || 'Failed to update vehicle status');
      }
    } catch (err) {
      console.error('Error toggling vehicle status:', err);
      showError('Failed to update vehicle status. Please try again.');
    }
  };

  const handleEdit = () => {
    navigate(`/public-vehicle/${instituteId}/vehicles/${vehicleId}/edit`);
  };

  const handleDelete = async () => {
    if (!vehicle) return;
    
    const confirmed = await confirmDelete(
      'Delete Public Vehicle',
      `Are you sure you want to delete this public vehicle? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await publicVehicleService.deletePublicVehicle(vehicle.id);
        showSuccess('Public vehicle deleted successfully');
        navigate(`/public-vehicle/${instituteId}`);
      } catch (err) {
        console.error('Error deleting public vehicle:', err);
        showError('Failed to delete public vehicle. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (imagePath: string) => {
    // Handle image URL - use as-is if it's already a full URL, otherwise construct it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Remove BASE_URL if it's accidentally duplicated in the path
    let cleanPath = imagePath;
    if (imagePath.includes(API_CONFIG.BASE_URL)) {
      cleanPath = imagePath.replace(API_CONFIG.BASE_URL, '');
    }
    return `${API_CONFIG.BASE_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
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

  if (error || !vehicle) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          {error || 'Vehicle not found'}
        </Alert>
        <Button variant="secondary" onClick={() => navigate(`/public-vehicle/${instituteId}`)}>
          Back to Vehicles
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Public Vehicle Details</h1>
            <p className="text-gray-600 mt-1">
              View detailed information about this public vehicle
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => navigate(`/public-vehicle/${instituteId}`)}>
              Back
            </Button>
            <Button variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
            {isSuperAdmin && (
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Details */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h2>
                <div className="space-y-4">
                  {vehicle.vehicle && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Vehicle Name</label>
                        <p className="text-gray-900 font-medium">{vehicle.vehicle.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Vehicle Number</label>
                        <p className="text-gray-900 font-medium">{vehicle.vehicle.vehicleNo}</p>
                      </div>
                      {vehicle.vehicle.imei && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">IMEI</label>
                          <p className="text-gray-900">{vehicle.vehicle.imei}</p>
                        </div>
                      )}
                      {vehicle.vehicle.vehicleType && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                          <p className="text-gray-900">{vehicle.vehicle.vehicleType}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Institute</label>
                    <p className="text-gray-900">{vehicle.institute.name}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-900 whitespace-pre-wrap">{vehicle.description || 'No description provided'}</p>
              </div>
            </Card>

            {/* Image Gallery */}
            {vehicle.images && vehicle.images.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Image Gallery</h2>
                  <div className="space-y-4">
                    {/* Main Image Display */}
                    <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={getImageUrl(vehicle.images[selectedImageIndex].image)}
                        alt={vehicle.images[selectedImageIndex].title || `Image ${selectedImageIndex + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      {vehicle.images[selectedImageIndex].title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-3">
                          <p className="font-medium">{vehicle.images[selectedImageIndex].title}</p>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {vehicle.images.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            index === selectedImageIndex
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={getImageUrl(image.image)}
                            alt={image.title || `Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          {image.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                              {image.title}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Active Status</label>
                    <div className="flex items-center space-x-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vehicle.is_active}
                          onChange={handleToggleActive}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {vehicle.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {vehicle.is_active ? 'This vehicle is currently active' : 'This vehicle is currently inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Information */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-sm text-gray-900">{formatDate(vehicle.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Updated At</label>
                    <p className="text-sm text-gray-900">{formatDate(vehicle.updated_at)}</p>
                  </div>
                  {vehicle.images && vehicle.images.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Images</label>
                      <p className="text-sm text-gray-900">{vehicle.images.length}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleEdit}
                  >
                    Edit Vehicle
                  </Button>
                  {isSuperAdmin && (
                    <Button
                      variant="danger"
                      className="w-full"
                      onClick={handleDelete}
                    >
                      Delete Vehicle
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate(`/public-vehicle/${instituteId}`)}
                  >
                    Back to List
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default PublicVehicleViewPage;

