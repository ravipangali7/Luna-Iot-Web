import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import { useRefresh } from '../../contexts/RefreshContext';
import type { Vehicle, VehicleFilters } from '../../types/vehicle';
import { VEHICLE_TYPES } from '../../types/vehicle';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
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

const VehicleIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshKey } = useRefresh();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVehicles();
  }, [refreshKey]); // Reload when refresh is triggered

  useEffect(() => {
    applyFilters();
  }, [vehicles, filters, searchQuery]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load detailed vehicles data (includes device, user, recharge info)
      const result = await vehicleService.getAllVehiclesDetailed();
      
      if (result.success && result.data) {
        setVehicles(result.data);
      } else {
        setError(result.error || 'Failed to load vehicles');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vehicles];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(vehicle =>
        vehicle.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.device?.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCustomerInfo(vehicle).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCustomerPhone(vehicle).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.vehicleType) {
      filtered = filtered.filter(vehicle => vehicle.vehicleType === filters.vehicleType);
    }
    // Note: Status filter removed as Vehicle interface doesn't have a status field

    setFilteredVehicles(filtered);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    navigate(`/vehicles/edit/${vehicle.imei}`);
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${vehicle.vehicleNo}?`)) {
      try {
        const result = await vehicleService.deleteVehicle(vehicle.imei);
        if (result.success) {
          setVehicles(vehicles.filter(v => v.imei !== vehicle.imei));
        } else {
          setError(result.error || 'Failed to delete vehicle');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleRechargeVehicle = (vehicle: Vehicle) => {
    if (vehicle.device) {
      navigate(`/recharges/create?deviceId=${vehicle.device.id}&imei=${vehicle.imei}`);
    } else {
      setError('Device information not available for this vehicle');
    }
  };



  const getCustomerInfo = (vehicle: Vehicle) => {
    if (vehicle.mainCustomer && vehicle.mainCustomer.user) {
      return vehicle.mainCustomer.user.name;
    }
    return 'Unassigned';
  };

  const getCustomerPhone = (vehicle: Vehicle) => {
    if (vehicle.mainCustomer && vehicle.mainCustomer.user) {
      return vehicle.mainCustomer.user.phone;
    }
    return '';
  };

  const getLastRecharge = (vehicle: Vehicle) => {
    if (vehicle.latestRecharge) {
      return formatTimeAgo(vehicle.latestRecharge.createdAt);
    }
    return 'No recharge';
  };

  const getLastData = (vehicle: Vehicle) => {
    if (vehicle.latestStatus) {
      return formatTimeAgo(vehicle.latestStatus.createdAt);
    }
    return 'No data';
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Handle negative values (future dates)
    if (diffInSeconds < 0) {
      return 'Just now';
    }
    
    // Handle very small differences
    if (diffInSeconds < 1) {
      return 'Just now';
    }
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    
    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(diffInSeconds / 3600);
    const days = Math.floor(diffInSeconds / 86400);
    const months = Math.floor(diffInSeconds / 2592000);
    const years = Math.floor(diffInSeconds / 31536000);
    
    if (diffInSeconds < 3600) {
      const remainingSeconds = diffInSeconds % 60;
      return remainingSeconds > 0 ? `${minutes}m, ${remainingSeconds}s ago` : `${minutes}m ago`;
    }
    
    if (diffInSeconds < 86400) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h, ${remainingMinutes}m ago` : `${hours}h ago`;
    }
    
    if (diffInSeconds < 2592000) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d, ${remainingHours}h ago` : `${days}d ago`;
    }
    
    if (diffInSeconds < 31536000) {
      const remainingDays = days % 30;
      return remainingDays > 0 ? `${months}mo, ${remainingDays}d ago` : `${months}mo ago`;
    }
    
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}y, ${remainingMonths}mo ago` : `${years}y ago`;
  };


  const getRelayStatus = (vehicle: Vehicle) => {
    if (vehicle.latestStatus) {
      return vehicle.latestStatus.relay ? 'ON' : 'OFF';
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-64">
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
            <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
            <p className="text-gray-600">Manage your vehicle fleet</p>
          </div>
          <Button onClick={() => navigate('/vehicles/create')}>
            Add Vehicle
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Filters</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <Select
                value={filters.vehicleType || ''}
                onChange={(value) => setFilters({ ...filters, vehicleType: value || undefined })}
                options={[
                  { value: '', label: 'All Types' },
                  ...VEHICLE_TYPES.map(type => ({ value: type, label: type }))
                ]}
              />
              <Select
                value={filters.status || ''}
                onChange={(value) => setFilters({ ...filters, status: value || undefined })}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'error', label: 'Error' }
                ]}
              />
            </div>
          </CardBody>
        </Card>

        {/* Vehicles Table */}
        <Card>
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No vehicles found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>S.N.</TableHeader>
                      <TableHeader>Vehicle Info</TableHeader>
                      <TableHeader>Device Info</TableHeader>
                      <TableHeader>Vehicle Type</TableHeader>
                      <TableHeader>Customer Info</TableHeader>
                      <TableHeader>Last Recharge ago</TableHeader>
                      <TableHeader>Last Data ago</TableHeader>
                      <TableHeader>Relay</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVehicles.map((vehicle, index) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold">{vehicle.vehicleNo}</div>
                            <Badge variant="secondary" size="sm">{vehicle.name}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-sm">{vehicle.imei}</div>
                            <Badge variant="secondary" size="sm">{vehicle.device?.phone || 'N/A'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="info" size="sm">{vehicle.vehicleType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{getCustomerInfo(vehicle)}</div>
                            {getCustomerPhone(vehicle) && (
                              <Badge variant="secondary" size="sm">{getCustomerPhone(vehicle)}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {getLastRecharge(vehicle)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getLastData(vehicle)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={vehicle.latestStatus?.relay ? 'success' : 'secondary'} 
                            size="sm"
                          >
                            {getRelayStatus(vehicle)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditVehicle(vehicle)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleRechargeVehicle(vehicle)}
                            >
                              Recharge
                            </Button>
                            <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteVehicle(vehicle)}
                            >
                              Delete
                            </Button>
                            </RoleBasedWidget>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </Card>
      </div>
    </Container>
  );
};

export default VehicleIndexPage;
