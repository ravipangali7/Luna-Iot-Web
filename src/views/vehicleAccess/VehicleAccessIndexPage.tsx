import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { vehicleAccessService } from '../../api/services/vehicleAccessService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import { useRefresh } from '../../contexts/RefreshContext';
import type { Vehicle } from '../../types/vehicle';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { ActionButton } from '../../components/ui/buttons';
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
import Pagination from '../../components/ui/pagination/Pagination';
import { ROLES } from '../../utils/roleUtils';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

const VehicleAccessIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshKey } = useRefresh();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isInSearchMode, setIsInSearchMode] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 25,
    has_next: false,
    has_previous: false,
    next_page: null as number | null,
    previous_page: null as number | null
  });

  const loadVehiclesWithAccess = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load paginated vehicles with access data
      const result = await vehicleAccessService.getVehiclesWithAccessPaginated(currentPage);

      if (result.success && result.data) {
        setVehicles(result.data.vehicles);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load vehicles with access');
      }
    } catch (err) {
      setError('An unexpected error occurred: ' + err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const handleSearchFromUrl = useCallback(async (query: string, page: number = 1) => {
    try {
      setIsSearching(true);
      setLoading(true);
      setError(null);
      const response = await vehicleAccessService.searchVehiclesWithAccess(query.trim(), page);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination(response.data.pagination);
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
      loadVehiclesWithAccess();
    }
    
    setIsInitialized(true);
  }, [searchParams, loadVehiclesWithAccess, handleSearchFromUrl, isInitialized]);

  useEffect(() => {
    // Only load vehicles if there's no search query in URL and we're not in search mode
    const urlSearchQuery = searchParams.get('q');
    if (!urlSearchQuery && !searchQuery && isInitialized && !isSearching && !isInSearchMode) {
      loadVehiclesWithAccess();
    }
  }, [refreshKey, currentPage, loadVehiclesWithAccess, searchParams, searchQuery, isInitialized, isSearching, isInSearchMode]);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      // Update URL with search query
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('q', searchInput.trim());
      newSearchParams.set('page', '1');
      setSearchParams(newSearchParams);
    } else {
      // Clear search
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('q');
      newSearchParams.set('page', '1');
      setSearchParams(newSearchParams);
      setSearchQuery('');
      setIsInSearchMode(false);
      setCurrentPage(1);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('q');
    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams);
    setSearchQuery('');
    setIsInSearchMode(false);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page.toString());
    setSearchParams(newSearchParams);
  };

  const handleSearchPageChange = (page: number) => {
    const query = searchParams.get('q') || searchQuery;
    if (query) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', page.toString());
      setSearchParams(newSearchParams);
      handleSearchFromUrl(query, page);
    }
  };

  const handleRefresh = () => {
    if (isInSearchMode) {
      const query = searchParams.get('q') || searchQuery;
      if (query) {
        handleSearchFromUrl(query, currentPage);
      }
    } else {
      loadVehiclesWithAccess();
    }
  };

  const handleManageAccess = (imei: string) => {
    navigate(`/vehicle-access/manage/${imei}`);
  };

  const handleDeleteAccess = async (imei: string, userVehicle: { user?: { id?: number; phone?: string; name?: string }; userId?: number }) => {
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
          : await vehicleAccessService.deleteVehicleAccess(imei, userPhone || '');
          
        if (result.success) {
          showSuccess('Access Removed', 'User access has been successfully removed from the vehicle.');
          await handleRefresh(); // Reload the list
        } else {
          showError('Failed to Remove Access', result.error || 'Failed to remove vehicle access');
        }
      } catch {
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
      <div className="space-y-6 p-2">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Access Management</h1>
            <p className="text-gray-600">View and manage user access permissions for vehicles</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              icon={<RefreshIcon className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
              <Button
                variant="primary"
                onClick={() => navigate('/vehicle-access/create')}
                icon={<AddIcon className="w-4 h-4" />}
              >
                Add Vehicle Access
              </Button>
            </RoleBasedWidget>
          </div>
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
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by vehicle name, number, IMEI, type, or user..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={loading}
                icon={<SearchIcon className="w-4 h-4" />}
              >
                Search
              </Button>
              {searchInput && (
                <Button
                  variant="outline"
                  onClick={handleClearSearch}
                  disabled={loading}
                  icon={<ClearIcon className="w-4 h-4" />}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Vehicle Access Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {isInSearchMode ? 'No vehicles found matching your search' : 'No vehicles found'}
              </p>
            </div>
          ) : (
            <>
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
                  {vehicles.map((vehicle, index) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{(pagination.current_page - 1) * pagination.page_size + index + 1}</TableCell>
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
                            <ActionButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteAccess(vehicle.imei, userVehicle)}
                              title="Remove Access"
                              icon={<PersonRemoveIcon className="w-4 h-4" />}
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

export default VehicleAccessIndexPage;
