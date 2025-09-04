import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceService } from '../../api/services/deviceService';
import type { Device, DeviceFilters } from '../../types/device';
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

const DeviceIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeviceFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [devices, filters, searchQuery]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await deviceService.getAllDevices();
      
      if (result.success && result.data) {
        setDevices(result.data);
      } else {
        setError(result.error || 'Failed to load devices');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...devices];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(device =>
        device.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.sim.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.sim) {
      filtered = filtered.filter(device => device.sim === filters.sim);
    }
    if (filters.protocol) {
      filtered = filtered.filter(device => device.protocol === filters.protocol);
    }
    if (filters.model) {
      filtered = filtered.filter(device => device.model === filters.model);
    }

    setFilteredDevices(filtered);
  };

  const handleEditDevice = (device: Device) => {
    navigate(`/devices/edit/${device.imei}`);
  };

  const handleDeleteDevice = async (device: Device) => {
    if (window.confirm(`Are you sure you want to delete device ${device.imei}?`)) {
      try {
        const result = await deviceService.deleteDevice(device.imei);
        if (result.success) {
          setDevices(devices.filter(d => d.imei !== device.imei));
        } else {
          setError(result.error || 'Failed to delete device');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { variant: 'success' as const, label: 'Active' },
      'inactive': { variant: 'secondary' as const, label: 'Inactive' },
      'maintenance': { variant: 'warning' as const, label: 'Maintenance' },
      'error': { variant: 'danger' as const, label: 'Error' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const getAssignedUsers = (device: Device) => {
    if (device.userDevices && device.userDevices.length > 0) {
      return device.userDevices.map(ud => ud.user.name).join(', ');
    }
    return 'Unassigned';
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
            <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
            <p className="text-gray-600">Manage your IoT devices</p>
          </div>
          <Button onClick={() => navigate('/devices/create')}>
            Add Device
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search devices..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <Select
                value={filters.sim || ''}
                onChange={(value) => setFilters({ ...filters, sim: value || undefined })}
                options={[
                  { value: '', label: 'All SIMs' },
                  { value: 'NTC', label: 'NTC' },
                  { value: 'Ncell', label: 'Ncell' },
                  { value: 'SmartCell', label: 'SmartCell' }
                ]}
              />
              <Select
                value={filters.protocol || ''}
                onChange={(value) => setFilters({ ...filters, protocol: value || undefined })}
                options={[
                  { value: '', label: 'All Protocols' },
                  { value: 'GT06', label: 'GT06' },
                  { value: 'GT06N', label: 'GT06N' },
                  { value: 'GT06E', label: 'GT06E' }
                ]}
              />
              <Select
                value={filters.model || ''}
                onChange={(value) => setFilters({ ...filters, model: value || undefined })}
                options={[
                  { value: '', label: 'All Models' },
                  { value: 'EC08', label: 'EC08' },
                  { value: 'TK103B', label: 'TK103B' },
                  { value: 'TK103C', label: 'TK103C' }
                ]}
              />
            </div>
          </CardBody>
        </Card>

        {/* Devices Table */}
        <Card>
            {filteredDevices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No devices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>S.N.</TableHeader>
                      <TableHeader>IMEI</TableHeader>
                      <TableHeader>Phone</TableHeader>
                      <TableHeader>SIM</TableHeader>
                      <TableHeader>Protocol</TableHeader>
                      <TableHeader>Model</TableHeader>
                      <TableHeader>ICCID</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Assigned To</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDevices.map((device, index) => (
                      <TableRow key={device.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{device.imei}</TableCell>
                        <TableCell>{device.phone}</TableCell>
                        <TableCell>{device.sim}</TableCell>
                        <TableCell>{device.protocol}</TableCell>
                        <TableCell>{device.model}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {device.iccid || '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(device.status)}</TableCell>
                        <TableCell className="text-sm">
                          {getAssignedUsers(device)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDevice(device)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteDevice(device)}
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
        </Card>
      </div>
    </Container>
  );
};

export default DeviceIndexPage;
