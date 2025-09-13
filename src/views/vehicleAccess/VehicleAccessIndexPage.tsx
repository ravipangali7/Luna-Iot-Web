import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleAccessService } from '../../api/services/vehicleAccessService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import { useRefresh } from '../../contexts/RefreshContext';
import type { Vehicle } from '../../types/vehicle';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const VehicleAccessIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshKey } = useRefresh();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVehiclesWithAccess();
  }, [refreshKey]); // Reload when refresh is triggered

  useEffect(() => {
    applyFilters();
  }, [vehicles, searchQuery]);

  const loadVehiclesWithAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await vehicleAccessService.getAllVehiclesWithAccess();

      if (result.success && result.data) {
        setVehicles(result.data);
      } else {
        setError(result.error || 'Failed to load vehicles with access');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.name?.toLowerCase().includes(query) ||
        vehicle.vehicleNo?.toLowerCase().includes(query) ||
        vehicle.imei?.includes(query) ||
        vehicle.vehicleType?.toLowerCase().includes(query) ||
        vehicle.userVehicle?.user?.name?.toLowerCase().includes(query) ||
        vehicle.userVehicle?.user?.phone?.includes(query)
      );
    }

    setFilteredVehicles(filtered);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleManageAccess = (imei: string) => {
    navigate(`/vehicle-access/manage/${imei}`);
  };

  const handleDeleteAccess = async (imei: string, userVehicle: any) => {
    const confirmed = await confirmDelete(
      'Remove Vehicle Access',
      `Are you sure you want to remove ${userVehicle.user?.name || 'this user'}'s access to this vehicle?`
    );
    
    if (confirmed) {
      try {
        // Try with userId first, fallback to userPhone if userId is not available
        const userId = userVehicle.user?.id || userVehicle.userId;
        const userPhone = userVehicle.user?.phone;
        
        if (!userId && !userPhone) {
          showError('Error', 'User ID or phone number is required for deletion');
          return;
        }
        
        // Use userId if available, otherwise use userPhone
        const result = userId 
          ? await vehicleAccessService.deleteVehicleAccessById(imei, userId)
          : await vehicleAccessService.deleteVehicleAccess(imei, userPhone);
          
        if (result.success) {
          showSuccess('Access Removed', 'User access has been successfully removed from the vehicle.');
          await loadVehiclesWithAccess(); // Reload the list
        } else {
          showError('Failed to Remove Access', result.error || 'Failed to remove vehicle access');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred while removing access');
      }
    }
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

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Access Management</h1>
            <p className="text-gray-600">View and manage user access permissions for vehicles</p>
          </div>
          <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <Button
              variant="primary"
              onClick={() => navigate('/vehicle-access/create')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Add Vehicle Access
            </Button>
          </RoleBasedWidget>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Search by vehicle name, number, IMEI, type, or user..."
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </CardBody>
        </Card>

        {/* Vehicle Access Table */}
        <Card>
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No vehicles found</p>
              </div>
            ) : (
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader>S.N.</TableHeader>
                    <TableHeader>Vehicle Details</TableHeader>
                    <TableHeader>Assigned Users</TableHeader>
                    <TableHeader>Access Permissions</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredVehicles.map((vehicle, index) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vehicle.name}</div>
                          <div className="text-sm text-gray-500">
                            {vehicle.vehicleNo} • {vehicle.vehicleType} • {vehicle.imei}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {vehicle.userVehicles && vehicle.userVehicles.length > 0 ? (
                            vehicle.userVehicles.map((userVehicle, userIndex) => (
                              <div key={userIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {userVehicle.user?.name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{userVehicle.user?.name || 'Unknown User'}</div>
                                  <div className="text-xs text-gray-500">{userVehicle.user?.phone || 'N/A'}</div>
                                  {userVehicle.isMain && (
                                    <Badge variant="primary" className="text-xs mt-1">Main User</Badge>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">No users assigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {vehicle.userVehicles && vehicle.userVehicles.length > 0 ? (
                            vehicle.userVehicles.map((userVehicle, userIndex) => (
                              <div key={userIndex} className="flex flex-wrap gap-1">
                                {userVehicle.allAccess ? (
                                  <Badge variant="success" className="text-xs">All Access</Badge>
                                ) : (
                                  <>
                                    {userVehicle.liveTracking && <Badge variant="success" className="text-xs">Live Tracking</Badge>}
                                    {userVehicle.history && <Badge variant="info" className="text-xs">History</Badge>}
                                    {userVehicle.report && <Badge variant="warning" className="text-xs">Reports</Badge>}
                                    {userVehicle.vehicleProfile && <Badge variant="secondary" className="text-xs">Profile</Badge>}
                                    {userVehicle.events && <Badge variant="primary" className="text-xs">Events</Badge>}
                                    {userVehicle.geofence && <Badge variant="info" className="text-xs">Geofence</Badge>}
                                    {userVehicle.edit && <Badge variant="warning" className="text-xs">Edit</Badge>}
                                    {userVehicle.shareTracking && <Badge variant="secondary" className="text-xs">Share</Badge>}
                                    {userVehicle.notification && <Badge variant="primary" className="text-xs">Notifications</Badge>}
                                  </>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">No permissions</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleManageAccess(vehicle.imei)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            }
                          >
                            Manage Access
                          </Button>
                          {vehicle.userVehicles && vehicle.userVehicles.length > 0 && (
                            <div className="space-y-1">
                              {vehicle.userVehicles.map((userVehicle, userIndex) => (
                                <RoleBasedWidget key={userIndex} allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteAccess(vehicle.imei, userVehicle)}
                                    icon={<PersonRemoveIcon className="w-4 h-4" />}
                                    title={`Remove ${userVehicle.user?.name || 'User'}`}
                                  />
                                </RoleBasedWidget>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </Card>
      </div>
    </Container>
  );
};

export default VehicleAccessIndexPage;
