import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import { deviceService } from '../../api/services/deviceService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import { useRefresh } from '../../contexts/RefreshContext';
import type { Vehicle, VehicleFilters } from '../../types/vehicle';
import { VEHICLE_TYPES } from '../../types/vehicle';
import { getState, getStateBackgroundColor } from '../../utils/vehicleUtils';
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

const VehicleIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshKey } = useRefresh();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VehicleFilters>({});
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

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load paginated vehicles data
      const result = await vehicleService.getVehiclesPaginated(currentPage);

      if (result.success && result.data) {
        setVehicles(result.data.vehicles);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load vehicles');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const applyFilters = useCallback(() => {
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
  }, [vehicles, searchQuery, filters]);

  useEffect(() => {
    loadVehicles();
  }, [refreshKey, currentPage, loadVehicles]); // Reload when refresh is triggered or page changes

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setSearchQuery('');
      return;
    }
    
    try {
      setLoading(true);
      const response = await vehicleService.searchVehicles(searchInput.trim(), 1);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
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
    // Reload vehicles when clearing search
    await loadVehicles();
  };

  const handleSearchPageChange = async (page: number) => {
    if (!searchQuery) return;
    
    try {
      setLoading(true);
      const response = await vehicleService.searchVehicles(searchQuery, page);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
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

  const handleEditVehicle = (vehicle: Vehicle) => {
    navigate(`/vehicles/edit/${vehicle.imei}`);
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    const confirmed = await confirmDelete(
      'Delete Vehicle',
      `Are you sure you want to delete vehicle ${vehicle.vehicleNo}? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const result = await vehicleService.deleteVehicle(vehicle.imei);
        if (result.success) {
          showSuccess('Vehicle Deleted', `Vehicle ${vehicle.vehicleNo} has been successfully deleted.`);
          setVehicles(vehicles.filter(v => v.imei !== vehicle.imei));
        } else {
          showError('Failed to Delete Vehicle', result.error || 'Failed to delete vehicle');
        }
      } catch (error) {
        showError('Error', 'An unexpected error occurred: ' + (error as Error).message);
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

  const handleServerPoint = async (vehicle: Vehicle) => {
    try {
      if (!vehicle.device?.phone) {
        showError('Device phone number not available');
        return;
      }

      const result = await deviceService.sendServerPoint(vehicle.device.phone);

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

  const handleReset = async (vehicle: Vehicle) => {
    try {
      if (!vehicle.device?.phone) {
        showError('Device phone number not available');
        return;
      }

      const result = await deviceService.sendReset(vehicle.device.phone);

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

  const handleActivateVehicle = async (vehicle: Vehicle) => {
    try {
      const result = await vehicleService.activateVehicle(vehicle.imei);
      
      if (result.success) {
        showSuccess('Vehicle activated successfully');
        // Update the vehicle in the local state
        setVehicles(vehicles.map(v => 
          v.imei === vehicle.imei ? { ...v, is_active: true } : v
        ));
      } else {
        showError(result.error || 'Failed to activate vehicle');
      }
    } catch (error) {
      console.error('Activate vehicle error:', error);
      showError('Failed to activate vehicle');
    }
  };

  const handleDeactivateVehicle = async (vehicle: Vehicle) => {
    try {
      const result = await vehicleService.deactivateVehicle(vehicle.imei);
      
      if (result.success) {
        showSuccess('Vehicle deactivated successfully');
        // Update the vehicle in the local state
        setVehicles(vehicles.map(v => 
          v.imei === vehicle.imei ? { ...v, is_active: false } : v
        ));
      } else {
        showError(result.error || 'Failed to deactivate vehicle');
      }
    } catch (error) {
      console.error('Deactivate vehicle error:', error);
      showError('Failed to deactivate vehicle');
    }
  };

  const toggleDropdown = (vehicleId: string) => {
    setDropdownOpen(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  const getExpireDate = (vehicle: Vehicle) => {
    if (!vehicle.expireDate) {
      return 'Not set';
    }

    const now = new Date();
    const expireDate = new Date(vehicle.expireDate);

    // Check if date is valid
    if (isNaN(expireDate.getTime())) {
      return 'Invalid date';
    }

    const diffInSeconds = Math.floor((expireDate.getTime() - now.getTime()) / 1000);

    // If already expired
    if (diffInSeconds < 0) {
      return 'Expired';
    }

    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(diffInSeconds / 3600);
    const days = Math.floor(diffInSeconds / 86400);
    const months = Math.floor(diffInSeconds / 2592000);
    const years = Math.floor(diffInSeconds / 31536000);

    // Format based on time remaining
    if (years > 0) {
      // Show years and months
      const remainingMonths = months % 12;
      return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years}y`;
    } else if (months > 0) {
      // Show months and days
      const remainingDays = days % 30;
      return remainingDays > 0 ? `${months}mo ${remainingDays}d` : `${months}mo`;
    } else if (days > 0) {
      // Show days and hours
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    } else if (hours > 0) {
      // Show hours only
      return `${hours}h`;
    } else {
      // Less than 1 hour - show minutes
      return `${minutes}m`;
    }
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
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-2" onKeyDown={(e) => e.key === 'Enter' && handleSearch()}>
                <Input
                  placeholder="Search vehicles..."
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
            <>
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>S.N.</TableHeader>
                      <TableHeader>Vehicle Info</TableHeader>
                      <TableHeader>Device Info</TableHeader>
                      <TableHeader>Vehicle Type</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Customer Info</TableHeader>
                      <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}> <TableHeader>Last Recharge ago</TableHeader></RoleBasedWidget>
                      <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}> <TableHeader>Expire Date</TableHeader></RoleBasedWidget>
                      <TableHeader>Last Data ago</TableHeader>
                      <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}><TableHeader>Relay</TableHeader></RoleBasedWidget>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVehicles.map((vehicle, index) => {
                      const vehicleState = getState(vehicle);
                      const backgroundColor = getStateBackgroundColor(vehicleState);
                      
                      return (
                      <TableRow 
                        key={vehicle.id}
                        style={{ 
                          '--row-bg-color': backgroundColor,
                          backgroundColor: backgroundColor 
                        } as React.CSSProperties}
                      >
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
                          <Badge 
                            variant={vehicle.is_active ? 'success' : 'danger'} 
                            size="sm"
                          >
                            {vehicle.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{getCustomerInfo(vehicle)}</div>
                            {getCustomerPhone(vehicle) && (
                              <Badge variant="secondary" size="sm">{getCustomerPhone(vehicle)}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                          <TableCell className="text-sm">
                            {getLastRecharge(vehicle)}
                          </TableCell>
                        </RoleBasedWidget>
                        <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
                          <TableCell className="text-sm">
                            <div className="text-sm">
                              {vehicle.expireDate ? (
                                <div className="space-y-1">
                                  <div>{getExpireDate(vehicle)}</div>
                                  <Badge 
                                    variant={new Date(vehicle.expireDate) < new Date() ? 'danger' : 
                                             new Date(vehicle.expireDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'warning' : 'success'}
                                    size="sm"
                                  >
                                    {new Date(vehicle.expireDate) < new Date() ? 'Expired' : 
                                     new Date(vehicle.expireDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'Expires Soon' : 'Active'}
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-gray-400">Not set</span>
                              )}
                            </div>
                          </TableCell>
                        </RoleBasedWidget>
                        <TableCell className="text-sm">
                          {getLastData(vehicle)}
                        </TableCell>
                        <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                          <TableCell>
                            <Badge
                              variant={vehicle.latestStatus?.relay ? 'success' : 'secondary'}
                              size="sm"
                            >
                              {getRelayStatus(vehicle)}
                            </Badge>
                          </TableCell>
                        </RoleBasedWidget>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditVehicle(vehicle)}
                              icon={<EditIcon className="w-4 h-4" />}
                            />
                            <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                              {vehicle.is_active ? (
                                <Button
                                  variant="warning"
                                  size="sm"
                                  onClick={() => handleDeactivateVehicle(vehicle)}
                                  icon={<PauseIcon className="w-4 h-4" />}
                                />
                              ) : (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleActivateVehicle(vehicle)}
                                  icon={<PlayArrowIcon className="w-4 h-4" />}
                                />
                              )}
                            </RoleBasedWidget>
                            <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleRechargeVehicle(vehicle)}
                                icon={<AccountBalanceWalletIcon className="w-4 h-4" />}
                              />
                            </RoleBasedWidget>
                            <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                              <div className="relative">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => toggleDropdown(vehicle.id.toString())}
                                  icon={<SendIcon className="w-4 h-4" />}
                                >
                                  <ArrowDropDownIcon className="w-4 h-4 ml-1" />
                                </Button>
                                {dropdownOpen[vehicle.id.toString()] && (
                                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                    <div className="py-1">
                                      <button
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => {
                                          handleServerPoint(vehicle);
                                          setDropdownOpen(prev => ({ ...prev, [vehicle.id.toString()]: false }));
                                        }}
                                      >
                                        <SendIcon className="w-4 h-4 mr-2" />
                                        SERVER POINT
                                      </button>
                                      <button
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => {
                                          handleReset(vehicle);
                                          setDropdownOpen(prev => ({ ...prev, [vehicle.id.toString()]: false }));
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
                                onClick={() => handleDeleteVehicle(vehicle)}
                                icon={<DeleteIcon className="w-4 h-4" />}
                              />
                            </RoleBasedWidget>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
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

export default VehicleIndexPage;
