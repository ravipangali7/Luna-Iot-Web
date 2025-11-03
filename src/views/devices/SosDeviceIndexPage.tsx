import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { deviceService } from '../../api/services/deviceService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import { useRefresh } from '../../contexts/RefreshContext';
import type { Device } from '../../types/device';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { 
  EditActionButton, 
  DeleteActionButton, 
  RechargeActionButton, 
  CommandsActionButton, 
  RelayOnActionButton,
  RelayOffActionButton,
  ActionButtonGroup 
} from '../../components/ui/buttons';
import Input from '../../components/ui/forms/Input';
import Table from '../../components/ui/tables/Table';
import SendIcon from '@mui/icons-material/Send';
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
import RefreshIcon from '@mui/icons-material/Refresh';
import { AuthContext } from '../../contexts/AuthContext';
import VehicleUtils from '../../utils/vehicleUtils';
import PowerIcon from '@mui/icons-material/Power';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

const SosDeviceIndexPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshKey } = useRefresh();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<{ [key: string]: boolean }>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isInSearchMode, setIsInSearchMode] = useState(false);
  const [expandedDeviceId, setExpandedDeviceId] = useState<number | null>(null);
  
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

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load paginated SOS devices data
      const result = await deviceService.getSosDevicesPaginated(currentPage);

      if (result.success && result.data) {
        setDevices(result.data.devices);
        setPagination({
          current_page: result.data.pagination.current_page,
          total_pages: result.data.pagination.total_pages,
          total_items: result.data.pagination.total_items,
          page_size: 25,
          has_next: result.data.pagination.has_next,
          has_previous: result.data.pagination.has_previous,
          next_page: null,
          previous_page: null
        });
      } else {
        setError(result.error || 'Failed to load SOS devices');
      }
    } catch (err) {
      setError('An unexpected error occurred: ' + err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    // Only load devices if there's no search query in URL and we're not in search mode
    const urlSearchQuery = searchParams.get('q');
    if (!urlSearchQuery && !searchQuery && isInitialized && !isSearching && !isInSearchMode) {
      loadDevices();
    }
  }, [refreshKey, currentPage, loadDevices, searchParams, searchQuery, isInitialized, isSearching, isInSearchMode]);

  const handleSearchFromUrl = useCallback(async (query: string, page: number = 1) => {
    try {
      setIsSearching(true);
      setLoading(true);
      setError(null);
      const response = await deviceService.getSosDevicesPaginated(page, query.trim());
      
      if (response.success && response.data) {
        setDevices(response.data.devices);
        setPagination({
          current_page: response.data.pagination.current_page,
          total_pages: response.data.pagination.total_pages,
          total_items: response.data.pagination.total_items,
          page_size: 25,
          has_next: response.data.pagination.has_next,
          has_previous: response.data.pagination.has_previous,
          next_page: null,
          previous_page: null
        });
        setCurrentPage(page);
        setIsInSearchMode(true);
      } else {
        console.error('Search failed:', response.error);
        setError(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  // Handle URL parameters for search query
  useEffect(() => {
    const urlSearchQuery = searchParams.get('q');
    const urlPage = searchParams.get('page');
    
    if (urlSearchQuery) {
      // URL has search query - perform search
      setSearchInput(urlSearchQuery);
      setSearchQuery(urlSearchQuery);
      setCurrentPage(urlPage ? parseInt(urlPage) : 1);
      handleSearchFromUrl(urlSearchQuery, urlPage ? parseInt(urlPage) : 1);
    } else if (!isInitialized) {
      // Initial load without search query
      const page = urlPage ? parseInt(urlPage) : 1;
      setCurrentPage(page);
      setIsInSearchMode(false);
      loadDevices();
    }
    
    setIsInitialized(true);
  }, [searchParams, loadDevices, handleSearchFromUrl, isInitialized]);

  // Handle clearing search when navigating from other pages
  useEffect(() => {
    const urlSearchQuery = searchParams.get('q');
    
    // If we're on devices page without search query and we have an active search, clear it
    if (isInitialized && !urlSearchQuery && searchQuery && !isSearching && !loading) {
      const timeoutId = setTimeout(() => {
        setSearchInput('');
        setSearchQuery('');
        setError(null);
        setIsInSearchMode(false);
        loadDevices();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchParams, isInitialized, searchQuery, isSearching, loading, loadDevices]);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setSearchQuery('');
      setSearchParams({});
      return;
    }
    
    try {
      setIsSearching(true);
      setLoading(true);
      const response = await deviceService.getSosDevicesPaginated(1, searchInput.trim());
      
      if (response.success && response.data) {
        setDevices(response.data.devices);
        setPagination({
          current_page: response.data.pagination.current_page,
          total_pages: response.data.pagination.total_pages,
          total_items: response.data.pagination.total_items,
          page_size: 25,
          has_next: response.data.pagination.has_next,
          has_previous: response.data.pagination.has_previous,
          next_page: null,
          previous_page: null
        });
        setSearchQuery(searchInput);
        setCurrentPage(1);
        setSearchParams({ q: searchInput.trim() });
        setIsInSearchMode(true);
      } else {
        console.error('Search failed:', response.error);
        setError(response.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchInput('');
    setSearchQuery('');
    setIsInSearchMode(false);
    setSearchParams({});
    await loadDevices();
  };

  const handleSearchPageChange = async (page: number) => {
    if (!searchQuery) return;
    
    try {
      setIsSearching(true);
      setLoading(true);
      const response = await deviceService.getSosDevicesPaginated(page, searchQuery);
      
      if (response.success && response.data) {
        setDevices(response.data.devices);
        setPagination({
          current_page: response.data.pagination.current_page,
          total_pages: response.data.pagination.total_pages,
          total_items: response.data.pagination.total_items,
          page_size: 25,
          has_next: response.data.pagination.has_next,
          has_previous: response.data.pagination.has_previous,
          next_page: null,
          previous_page: null
        });
        setCurrentPage(page);
        setSearchParams({ q: searchQuery, page: page.toString() });
        setIsInSearchMode(true);
      } else {
        console.error('Search page change failed:', response.error);
        setError(response.error || 'Failed to load search results');
      }
    } catch (error) {
      console.error('Search page change error:', error);
      setError('Failed to load search results: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
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

  const canControlRelayForDevice = useCallback((device: Device): boolean => {
    if (auth?.isSuperAdmin && auth.isSuperAdmin()) return true;
    // Check if device has vehicles with relay permission
    if (device.vehicles && device.vehicles.length > 0) {
      // Check if any vehicle has userVehicles with relay permission for current user
      const currentUserId = auth?.user?.id;
      if (currentUserId) {
        for (const vehicle of device.vehicles) {
          // Type assertion needed as Device.Vehicle doesn't have userVehicles in type but API provides it
          const vehicleWithUserVehicles = vehicle as any;
          if (vehicleWithUserVehicles.userVehicles) {
            const userVehicle = vehicleWithUserVehicles.userVehicles.find((uv: any) => 
              uv.userId === currentUserId || uv.user?.id === currentUserId
            );
            if (userVehicle && userVehicle.relay === true) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }, [auth]);

  const handleRelayOn = async (device: Device) => {
    try {
      if (!device.phone) {
        showError('Device phone number not available');
        return;
      }

      const result = await deviceService.sendRelayOn(device.phone);

      if (result.success) {
        showSuccess('Relay ON command sent successfully');
      } else {
        showError(result.error || 'Failed to send relay ON command');
      }
    } catch (error) {
      console.error('Relay ON error:', error);
      showError('Failed to send relay ON command');
    }
  };

  const handleRelayOff = async (device: Device) => {
    try {
      if (!device.phone) {
        showError('Device phone number not available');
        return;
      }

      const result = await deviceService.sendRelayOff(device.phone);

      if (result.success) {
        showSuccess('Relay OFF command sent successfully');
      } else {
        showError(result.error || 'Failed to send relay OFF command');
      }
    } catch (error) {
      console.error('Relay OFF error:', error);
      showError('Failed to send relay OFF command');
    }
  };

  const getRelayStatusValue = (device: Device): boolean | null => {
    if (device.latestStatus) {
      return device.latestStatus.relay === true;
    }
    return null;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (!searchQuery) {
      setSearchParams({ page: page.toString() });
    }
  };

  const getDealerInfo = (device: Device) => {
    if (device.userDevices && device.userDevices.length > 0) {
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
      const vehicle = device.vehicles[0];
      return vehicle.name || 'Unknown Vehicle';
    }
    return 'Not Assign';
  };

  const getVehicleNo = (device: Device) => {
    if (device.vehicles && device.vehicles.length > 0) {
      const vehicle = device.vehicles[0];
      return vehicle.vehicleNo || '';
    }
    return '';
  };

  const getCustomerInfo = (device: Device) => {
    if (device.vehicles && device.vehicles.length > 0) {
      const vehicle = device.vehicles[0];
      
      if (vehicle.userVehicles && vehicle.userVehicles.length > 0) {
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

  // Helper function to convert battery (0-6) to percentage
  const getBatteryPercentage = (rawValue: number): number => {
    if (rawValue <= 0) return 0;
    if (rawValue >= 6) return 100;
    return Math.round((rawValue / 6) * 100);
  };

  // Helper function to convert signal (0-4) to percentage
  const getSignalPercentage = (rawValue: number): number => {
    if (rawValue <= 0) return 0;
    if (rawValue >= 4) return 100;
    return Math.round((rawValue / 4) * 100);
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 0) return 'Just now';
    if (diffInSeconds < 1) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    
    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(diffInSeconds / 3600);
    const days = Math.floor(diffInSeconds / 86400);

    if (diffInSeconds < 3600) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const handleRowClick = (deviceId: number) => {
    setExpandedDeviceId(expandedDeviceId === deviceId ? null : deviceId);
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
            <h1 className="text-2xl font-bold text-gray-900">SOS Switch Devices</h1>
            <p className="text-gray-600">Manage SOS emergency switch devices</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <Card>
          <CardBody>
            <div className="flex gap-2" onKeyDown={(e) => e.key === 'Enter' && handleSearch()}>
              <Input
                placeholder="Search SOS devices..."
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
          </CardBody>
        </Card>

        {/* Devices Table */}
        <Card>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No SOS devices found</p>
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
                      <TableHeader>Subscription Plan</TableHeader>
                      <TableHeader>Dealer Info</TableHeader>
                      <TableHeader>Vehicle Info</TableHeader>
                      <TableHeader>Customer Info</TableHeader>
                      <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <TableHeader>Actions</TableHeader>
                      </RoleBasedWidget>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {devices.map((device, index) => (
                      <React.Fragment key={device.id}>
                        <TableRow 
                          onClick={() => handleRowClick(device.id)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
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
                              {device.subscription_plan ? (
                                <>
                                  <div className="text-sm font-medium">{device.subscription_plan.title}</div>
                                  <Badge variant="success" size="sm">Rs {device.subscription_plan.price}</Badge>
                                </>
                              ) : (
                                <Badge variant="secondary" size="sm">No Plan</Badge>
                              )}
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
                              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <ActionButtonGroup>
                                  <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                    <EditActionButton onClick={() => handleEditDevice(device)} />
                                  </RoleBasedWidget>

                                  <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                    <RechargeActionButton onClick={() => handleRechargeDevice(device)} />
                                  </RoleBasedWidget>
                                  {/* Relay: show action if user can control for this device; else show Not Available */}
                                  {canControlRelayForDevice(device) ? (
                                    (() => {
                                      const relayStatus = getRelayStatusValue(device);
                                      if (relayStatus === true) {
                                        return <RelayOffActionButton onClick={() => handleRelayOff(device)} />;
                                      } else if (relayStatus === false) {
                                        return <RelayOnActionButton onClick={() => handleRelayOn(device)} />;
                                      } else {
                                        // Status unknown, show ON button as default
                                        return <RelayOnActionButton onClick={() => handleRelayOn(device)} />;
                                      }
                                    })()
                                  ) : (
                                    <Badge variant="secondary">Not Available</Badge>
                                  )}
                                  <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                    <div className="relative">
                                      <CommandsActionButton onClick={() => toggleDropdown(device.id.toString())} />
                                      {dropdownOpen[device.id.toString()] && (
                                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl z-10 border border-gray-200 backdrop-blur-sm">
                                          <div className="py-1">
                                            <button
                                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                                              onClick={() => {
                                                handleServerPoint(device);
                                                setDropdownOpen(prev => ({ ...prev, [device.id.toString()]: false }));
                                              }}
                                            >
                                              <SendIcon className="w-4 h-4 mr-3 text-blue-500" />
                                              SERVER POINT
                                            </button>
                                            <button
                                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                                              onClick={() => {
                                                handleReset(device);
                                                setDropdownOpen(prev => ({ ...prev, [device.id.toString()]: false }));
                                              }}
                                            >
                                              <RefreshIcon className="w-4 h-4 mr-3 text-orange-500" />
                                              RESET
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </RoleBasedWidget>
                                  <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                    <DeleteActionButton onClick={() => handleDeleteDevice(device)} />
                                  </RoleBasedWidget>
                                </ActionButtonGroup>
                              </div>
                            </TableCell>
                          </RoleBasedWidget>
                        </TableRow>
                        {expandedDeviceId === device.id && device.latestStatus && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-gradient-to-br from-gray-50 to-gray-100 p-0">
                              <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-6">
                                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                  <h3 className="text-xl font-bold text-gray-900">Device Status</h3>
                                  <div className="flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Battery */}
                                  <div className="group relative bg-gradient-to-br from-white to-blue-50 p-5 rounded-xl border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -mr-10 -mt-10 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                          {VehicleUtils.getBattery(device.latestStatus.battery, 24)}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Battery</span>
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <div className="text-3xl font-bold text-blue-600 mb-2">
                                        {getBatteryPercentage(device.latestStatus.battery)}%
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                          className={`h-2.5 rounded-full transition-all duration-500 ${
                                            getBatteryPercentage(device.latestStatus.battery) > 50 
                                              ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                              : getBatteryPercentage(device.latestStatus.battery) > 20
                                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                              : 'bg-gradient-to-r from-red-400 to-red-600'
                                          }`}
                                          style={{ width: `${getBatteryPercentage(device.latestStatus.battery)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Signal */}
                                  <div className="group relative bg-gradient-to-br from-white to-purple-50 p-5 rounded-xl border border-purple-100 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -mr-10 -mt-10 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                          {VehicleUtils.getSignal(device.latestStatus.signal, 24)}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Signal</span>
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <div className="text-3xl font-bold text-purple-600 mb-2">
                                        {getSignalPercentage(device.latestStatus.signal)}%
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                          className={`h-2.5 rounded-full transition-all duration-500 ${
                                            getSignalPercentage(device.latestStatus.signal) > 50 
                                              ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                              : getSignalPercentage(device.latestStatus.signal) > 20
                                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                              : 'bg-gradient-to-r from-red-400 to-red-600'
                                          }`}
                                          style={{ width: `${getSignalPercentage(device.latestStatus.signal)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Ignition */}
                                  <div className={`group relative bg-gradient-to-br p-5 rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                                    device.latestStatus.ignition 
                                      ? 'from-green-50 to-white border-green-200' 
                                      : 'from-red-50 to-white border-red-200'
                                  }`}>
                                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-20 group-hover:opacity-30 transition-opacity ${
                                      device.latestStatus.ignition ? 'bg-green-100' : 'bg-red-100'
                                    }`}></div>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                          device.latestStatus.ignition ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                          {device.latestStatus.ignition ? (
                                            <PowerIcon className="text-green-600" style={{ fontSize: 24 }} />
                                          ) : (
                                            <PowerOffIcon className="text-red-600" style={{ fontSize: 24 }} />
                                          )}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Ignition</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                                        device.latestStatus.ignition 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        <div className={`w-2 h-2 rounded-full ${
                                          device.latestStatus.ignition ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                        }`}></div>
                                        {device.latestStatus.ignition ? 'ON' : 'OFF'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Charging/Power */}
                                  <div className={`group relative bg-gradient-to-br p-5 rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                                    device.latestStatus.charging 
                                      ? 'from-green-50 to-white border-green-200' 
                                      : 'from-red-50 to-white border-red-200'
                                  }`}>
                                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-20 group-hover:opacity-30 transition-opacity ${
                                      device.latestStatus.charging ? 'bg-green-100' : 'bg-red-100'
                                    }`}></div>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                          device.latestStatus.charging ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                          {device.latestStatus.charging ? (
                                            <ElectricBoltIcon className="text-green-600" style={{ fontSize: 24 }} />
                                          ) : (
                                            <PowerOffIcon className="text-red-600" style={{ fontSize: 24 }} />
                                          )}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Power</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                                        device.latestStatus.charging 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        <div className={`w-2 h-2 rounded-full ${
                                          device.latestStatus.charging ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                        }`}></div>
                                        {device.latestStatus.charging ? 'Connected' : 'Disconnected'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Relay */}
                                  <div className={`group relative bg-gradient-to-br p-5 rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${
                                    device.latestStatus.relay 
                                      ? 'from-orange-50 to-white border-orange-200' 
                                      : 'from-gray-50 to-white border-gray-200'
                                  }`}>
                                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 opacity-20 group-hover:opacity-30 transition-opacity ${
                                      device.latestStatus.relay ? 'bg-orange-100' : 'bg-gray-100'
                                    }`}></div>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${
                                          device.latestStatus.relay ? 'bg-orange-100' : 'bg-gray-100'
                                        }`}>
                                          {device.latestStatus.relay ? (
                                            <ToggleOnIcon className="text-orange-600" style={{ fontSize: 24 }} />
                                          ) : (
                                            <ToggleOffIcon className="text-gray-600" style={{ fontSize: 24 }} />
                                          )}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Relay</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                                        device.latestStatus.relay 
                                          ? 'bg-orange-100 text-orange-700' 
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        <div className={`w-2 h-2 rounded-full ${
                                          device.latestStatus.relay ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'
                                        }`}></div>
                                        {device.latestStatus.relay ? 'ON' : 'OFF'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Last Updated */}
                                  <div className="group relative bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gray-100 rounded-full -mr-10 -mt-10 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                          <AccessTimeIcon className="text-gray-600" style={{ fontSize: 24 }} />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Last Updated</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                                        {formatTimeAgo(device.latestStatus.updatedAt || device.latestStatus.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {expandedDeviceId === device.id && !device.latestStatus && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-gradient-to-br from-gray-50 to-gray-100">
                              <div className="p-8 text-center">
                                <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">⚠️</span>
                                  </div>
                                  <span className="text-gray-600 font-medium">No status data available for this device</span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
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

export default SosDeviceIndexPage;