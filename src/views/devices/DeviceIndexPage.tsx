import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceService } from '../../api/services/deviceService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import type { Device, DeviceFilters } from '../../types/device';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
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
import Pagination from '../../components/ui/pagination/Pagination';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SendIcon from '@mui/icons-material/Send';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RefreshIcon from '@mui/icons-material/Refresh';

const DeviceIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeviceFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<{ [key: string]: boolean }>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 25,
    has_next: false,
    has_previous: false,
    next_page: null,
    previous_page: null
  });

  useEffect(() => {
    loadDevices();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [devices, filters, searchQuery]);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setSearchQuery('');
      return;
    }
    
    try {
      setLoading(true);
      const response = await deviceService.searchDevices(searchInput.trim(), 1);
      
      if (response.success && response.data) {
        setDevices(response.data.devices);
        setPagination(response.data.pagination);
        setSearchQuery(searchInput);
        // Reset pagination when searching
        setCurrentPage(1);
      } else {
        console.error('Search failed:', response.error);
        setError(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchInput('');
    setSearchQuery('');
    // Reload devices when clearing search
    await loadDevices();
  };

  const handleSearchPageChange = async (page: number) => {
    if (!searchQuery) return;
    
    try {
      setLoading(true);
      const response = await deviceService.searchDevices(searchQuery, page);
      
      if (response.success && response.data) {
        setDevices(response.data.devices);
        setPagination(response.data.pagination);
        setCurrentPage(page);
      } else {
        console.error('Search page change failed:', response.error);
        setError(response.error || 'Failed to load search results');
      }
    } catch (error) {
      console.error('Search page change error:', error);
      setError('Failed to load search results: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load paginated devices data
      const result = await deviceService.getDevicesPaginated(currentPage);

      if (result.success && result.data) {
        setDevices(result.data.devices);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load devices');
      }
    } catch (err) {
      setError('An unexpected error occurred: ' + err);
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
        device.sim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (device.iccid || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getDealerInfo(device).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getDealerPhone(device).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getVehicleInfo(device).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getVehicleNo(device).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCustomerInfo(device).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCustomerPhone(device).toLowerCase().includes(searchQuery.toLowerCase())
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
    const confirmed = await confirmDelete(
      'Delete Device',
      `Are you sure you want to delete device ${device.imei}? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const result = await deviceService.deleteDevice(device.imei);
        if (result.success) {
          showSuccess('Device Deleted', `Device ${device.imei} has been successfully deleted.`);
          setDevices(devices.filter(d => d.imei !== device.imei));
        } else {
          showError('Failed to Delete Device', result.error || 'Failed to delete device');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const handleRechargeDevice = (device: Device) => {
    navigate(`/recharges/create?deviceId=${device.id}&imei=${device.imei}`);
  };

  const handleServerPoint = async (device: Device) => {
    try {
      if (!device.phone) {
        showError('Device phone number not available');
        return;
      }

      const result = await deviceService.sendServerPoint(device.phone);

      if (result.success) {
        showSuccess('Server point command sent successfully');
      } else {
        showError(result.error || 'Failed to send server point command');
      }
    } catch (error) {
      console.error('Server point error:', error);
      showError('Failed to send server point command');
    }
  };

  const handleReset = async (device: Device) => {
    try {
      if (!device.phone) {
        showError('Device phone number not available');
        return;
      }

      const result = await deviceService.sendReset(device.phone);

      if (result.success) {
        showSuccess('Reset command sent successfully');
      } else {
        showError(result.error || 'Failed to send reset command');
      }
    } catch (error) {
      console.error('Reset error:', error);
      showError('Failed to send reset command');
    }
  };

  const toggleDropdown = (deviceId: string) => {
    setDropdownOpen(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  const getDealerInfo = (device: Device) => {
    if (device.userDevices && device.userDevices.length > 0) {
      // Sort to show dealer first, then other users
      const sortedUsers = device.userDevices.sort((a, b) => {
        const aIsDealer = a.user && a.user.roles && a.user.roles.some(role => role.name === 'Dealer');
        const bIsDealer = b.user && b.user.roles && b.user.roles.some(role => role.name === 'Dealer');
        if (aIsDealer && !bIsDealer) return -1;
        if (!aIsDealer && bIsDealer) return 1;
        return 0;
      });

      const dealer = sortedUsers.find(ud =>
        ud.user && ud.user.roles && ud.user.roles.some(role => role.name === 'Dealer')
      );
      
      if (dealer && dealer.user) {
        return dealer.user.name;
      }
    }
    return 'No dealer';
  };

  const getDealerPhone = (device: Device) => {
    if (device.userDevices && device.userDevices.length > 0) {
      // Sort to show dealer first, then other users
      const sortedUsers = device.userDevices.sort((a, b) => {
        const aIsDealer = a.user && a.user.roles && a.user.roles.some(role => role.name === 'Dealer');
        const bIsDealer = b.user && b.user.roles && b.user.roles.some(role => role.name === 'Dealer');
        if (aIsDealer && !bIsDealer) return -1;
        if (!aIsDealer && bIsDealer) return 1;
        return 0;
      });

      const dealer = sortedUsers.find(ud =>
        ud.user && ud.user.roles && ud.user.roles.some(role => role.name === 'Dealer')
      );
      if (dealer && dealer.user) {
        return dealer.user.phone;
      }
    }
    return '';
  };

  const getVehicleInfo = (device: Device) => {
    if (device.vehicles && device.vehicles.length > 0) {
      const vehicle = device.vehicles[0]; // Get first vehicle
      return vehicle.name || 'Unknown Vehicle';
    }
    return 'Not Assign';
  };

  const getVehicleNo = (device: Device) => {
    if (device.vehicles && device.vehicles.length > 0) {
      const vehicle = device.vehicles[0]; // Get first vehicle
      return vehicle.vehicleNo || '';
    }
    return '';
  };

  const getCustomerInfo = (device: Device) => {
    if (device.vehicles && device.vehicles.length > 0) {
      const vehicle = device.vehicles[0];
      
      if (vehicle.userVehicles && vehicle.userVehicles.length > 0) {
        // Sort to show main customers first, then other customers
        const sortedCustomers = vehicle.userVehicles.sort((a, b) => {
          const aIsMain = a.isMain && a.user && a.user.roles && a.user.roles.some(role => role.name === 'Customer');
          const bIsMain = b.isMain && b.user && b.user.roles && b.user.roles.some(role => role.name === 'Customer');
          if (aIsMain && !bIsMain) return -1;
          if (!aIsMain && bIsMain) return 1;
          return 0;
        });

        const mainCustomer = sortedCustomers.find(uv =>
          uv.user && uv.user.roles && uv.user.roles.some(role => role.name === 'Customer') && uv.isMain
        );
        
        if (mainCustomer && mainCustomer.user) {
          return mainCustomer.user.name;
        }
      }
    }
    return 'No customer';
  };

  const getCustomerPhone = (device: Device) => {
    if (device.vehicles && device.vehicles.length > 0) {
      const vehicle = device.vehicles[0];
      if (vehicle.userVehicles && vehicle.userVehicles.length > 0) {
        // Sort to show main customers first, then other customers
        const sortedCustomers = vehicle.userVehicles.sort((a, b) => {
          const aIsMain = a.isMain && a.user && a.user.roles && a.user.roles.some(role => role.name === 'Customer');
          const bIsMain = b.isMain && b.user && b.user.roles && b.user.roles.some(role => role.name === 'Customer');
          if (aIsMain && !bIsMain) return -1;
          if (!aIsMain && bIsMain) return 1;
          return 0;
        });

        const mainCustomer = sortedCustomers.find(uv =>
          uv.user && uv.user.roles && uv.user.roles.some(role => role.name === 'Customer') && uv.isMain
        );
        if (mainCustomer && mainCustomer.user) {
          return mainCustomer.user.phone;
        }
      }
    }
    return '';
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
          <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
            <Button onClick={() => navigate('/devices/create')}>
              Add Device
            </Button>
          </RoleBasedWidget>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex gap-2" onKeyDown={(e) => e.key === 'Enter' && handleSearch()}>
                <Input
                  placeholder="Search devices..."
                  value={searchInput}
                  onChange={setSearchInput}
                />
                <Button
                  onClick={handleSearch}
                  variant="primary"
                  size="sm"
                  className="px-3"
                >
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    onClick={handleClearSearch}
                    variant="secondary"
                    size="sm"
                    className="px-3"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Select
                value={filters.sim || ''}
                onChange={(value) => setFilters({ ...filters, sim: value || undefined })}
                options={[
                  { value: '', label: 'All SIMs' },
                  { value: 'NTC', label: 'NTC' },
                  { value: 'Ncell', label: 'Ncell' },
                ]}
              />
              <Select
                value={filters.protocol || ''}
                onChange={(value) => setFilters({ ...filters, protocol: value || undefined })}
                options={[
                  { value: '', label: 'All Protocols' },
                  { value: 'GT06', label: 'GT06' },
                  { value: 'FMB003', label: 'FMB003' },
                ]}
              />
              <Select
                value={filters.model || ''}
                onChange={(value) => setFilters({ ...filters, model: value || undefined })}
                options={[
                  { value: '', label: 'All Models' },
                  { value: 'EC08', label: 'EC08' },
                  { value: ' VL149', label: ' VL149' },
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
            <>
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>S.N.</TableHeader>
                      <TableHeader>General Info</TableHeader>
                      <TableHeader>SIM Info</TableHeader>
                      <TableHeader>Device Info</TableHeader>
                      <TableHeader>Dealer Info</TableHeader>
                      <TableHeader>Vehicle Info</TableHeader>
                      <TableHeader>Customer Info</TableHeader>
                      <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <TableHeader>Actions</TableHeader>
                      </RoleBasedWidget>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDevices.map((device, index) => (
                      <TableRow key={device.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-sm">{device.imei}</div>
                            <Badge variant="secondary" size="sm">{device.phone}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{device.sim}</div>
                            <Badge variant="secondary" size="sm">{device.iccid || 'N/A'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{device.protocol}</div>
                            <Badge variant="info" size="sm">{device.model}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{getDealerInfo(device)}</div>
                            {getDealerPhone(device) && (
                              <Badge variant="secondary" size="sm">{getDealerPhone(device)}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{getVehicleInfo(device)}</div>
                            {getVehicleNo(device) && (
                              <Badge variant="secondary" size="sm">{getVehicleNo(device)}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{getCustomerInfo(device)}</div>
                            {getCustomerPhone(device) && (
                              <Badge variant="secondary" size="sm">{getCustomerPhone(device)}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                          <TableCell>
                            <div className="flex space-x-2">
                              <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditDevice(device)}
                                  icon={<EditIcon className="w-4 h-4" />}
                                />
                              </RoleBasedWidget>

                              <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleRechargeDevice(device)}
                                  icon={<AccountBalanceWalletIcon className="w-4 h-4" />}
                                />
                              </RoleBasedWidget>
                              <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                <div className="relative">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => toggleDropdown(device.id.toString())}
                                    icon={<SendIcon className="w-4 h-4" />}
                                  >
                                    <ArrowDropDownIcon className="w-4 h-4 ml-1" />
                                  </Button>
                                  {dropdownOpen[device.id.toString()] && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                      <div className="py-1">
                                        <button
                                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          onClick={() => {
                                            handleServerPoint(device);
                                            setDropdownOpen(prev => ({ ...prev, [device.id.toString()]: false }));
                                          }}
                                        >
                                          <SendIcon className="w-4 h-4 mr-2" />
                                          SERVER POINT
                                        </button>
                                        <button
                                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          onClick={() => {
                                            handleReset(device);
                                            setDropdownOpen(prev => ({ ...prev, [device.id.toString()]: false }));
                                          }}
                                        >
                                          <RefreshIcon className="w-4 h-4 mr-2" />
                                          RESET
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </RoleBasedWidget>
                              <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDeleteDevice(device)}
                                  icon={<DeleteIcon className="w-4 h-4" />}
                                />
                              </RoleBasedWidget>
                            </div>
                        </TableCell>
                        </RoleBasedWidget>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.total_pages}
                onPageChange={searchQuery ? handleSearchPageChange : handlePageChange}
                hasNext={pagination.has_next}
                hasPrevious={pagination.has_previous}
                totalItems={pagination.total_items}
                pageSize={pagination.page_size}
              />
            </>
          )}
        </Card>
      </div>
    </Container>
  );
};

export default DeviceIndexPage;
