import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
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

const VehicleIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VehicleFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vehicles, filters, searchQuery]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await vehicleService.getAllVehicles();
      
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
        vehicle.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.device?.phone || '').toLowerCase().includes(searchQuery.toLowerCase())
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



  const getAssignedUsers = (vehicle: Vehicle) => {
    if (vehicle.userVehicle && vehicle.userVehicle.user) {
      return vehicle.userVehicle.user.name;
    }
    return 'Unassigned';
  };

  const formatLastRecharge = () => {
    // This would typically come from the device data
    return 'N/A';
  };

  const formatLastData = (vehicle: Vehicle) => {
    if (vehicle.latestStatus) {
      return new Date(vehicle.latestStatus.createdAt).toLocaleString();
    }
    return 'No data';
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
          <CardHeader>
            <h3 className="text-lg font-semibold">
              Vehicles ({filteredVehicles.length})
            </h3>
          </CardHeader>
          <CardBody>
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
                      <TableHeader>Reg. No.</TableHeader>
                      <TableHeader>Customer</TableHeader>
                      <TableHeader>IMEI</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Number</TableHeader>
                      <TableHeader>Last Recharge</TableHeader>
                      <TableHeader>Last Data</TableHeader>
                      <TableHeader>Relay</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVehicles.map((vehicle, index) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-semibold">{vehicle.vehicleNo}</TableCell>
                        <TableCell className="text-sm">
                          {getAssignedUsers(vehicle)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{vehicle.imei}</TableCell>
                        <TableCell>
                          <Badge variant="info" size="sm">{vehicle.vehicleType}</Badge>
                        </TableCell>
                        <TableCell>{vehicle.device?.phone || 'N/A'}</TableCell>
                        <TableCell className="text-sm">
                          {formatLastRecharge()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatLastData(vehicle)}
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
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteVehicle(vehicle)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default VehicleIndexPage;
