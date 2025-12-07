import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import { deviceService } from '../../api/services/deviceService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import { useRefresh } from '../../contexts/RefreshContext';
import type { Vehicle } from '../../types/vehicle';
import { VEHICLE_TYPES } from '../../types/vehicle';
import { getState, getStateBackgroundColor, getBattery, getSignal, getIgnition, getCharging, getImagePath } from '../../utils/vehicleUtils';
import { VehicleImageState } from '../../utils/vehicleUtils';
import { handleVehicleAction, VEHICLE_ACTIONS } from '../../utils/vehicleActionUtils';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { 
  EditActionButton, 
  DeleteActionButton, 
  ActivateActionButton, 
  DeactivateActionButton, 
  RechargeActionButton, 
  CommandsActionButton, 
  RelayOnActionButton, 
  RelayOffActionButton
} from '../../components/ui/buttons';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
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
import Tooltip from '../../components/ui/common/Tooltip';
import Pagination from '../../components/ui/pagination/Pagination';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';
import { getSearchVariants } from '../../utils/numeralUtils';
import RefreshIcon from '@mui/icons-material/Refresh';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { AuthContext } from '../../contexts/AuthContext';

const VehicleIndexPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshKey } = useRefresh();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<{ [key: string]: boolean }>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isInSearchMode, setIsInSearchMode] = useState(false);
  const [expireFilter, setExpireFilter] = useState<string | null>(null);
  const [isInExpireFilterMode, setIsInExpireFilterMode] = useState(false);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string | null>(null);
  const [isInVehicleTypeFilterMode, setIsInVehicleTypeFilterMode] = useState(false);
  
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

    // Apply search query with numeral normalization
    if (searchQuery) {
      // Get search variants (original, English, Nepali)
      const searchVariants = getSearchVariants(searchQuery);
      const searchVariantsLower = searchVariants.map(v => v.toLowerCase());

      filtered = filtered.filter(vehicle => {
        // Get all searchable text fields
        const searchableFields = [
          vehicle.imei,
          vehicle.vehicleNo || '',
          vehicle.name || '',
          vehicle.vehicleType || '',
          vehicle.device?.phone || '',
          getCustomerInfo(vehicle),
          getCustomerPhone(vehicle),
        ];

        // Check if any search variant matches any field (with normalization)
        for (const field of searchableFields) {
          if (!field) continue;
          
          // Get normalized variants of the field
          const fieldVariants = getSearchVariants(field);
          const fieldVariantsLower = fieldVariants.map(v => v.toLowerCase());

          // Check if any search variant matches any field variant
          for (const searchVariantLower of searchVariantsLower) {
            for (const fieldVariantLower of fieldVariantsLower) {
              if (fieldVariantLower.includes(searchVariantLower)) {
                return true;
              }
            }
          }
        }

        return false;
      });
    }

    // Note: Vehicle type filter is now handled via API (searchVehiclesByVehicleType)
    // Note: Status filter removed as Vehicle interface doesn't have a status field

    setFilteredVehicles(filtered);
  }, [vehicles, searchQuery]);

  useEffect(() => {
    // Only load vehicles if there's no search query in URL and we're not in search mode or expire filter mode or vehicle type filter mode
    const urlSearchQuery = searchParams.get('q');
    const urlExpireFilter = searchParams.get('expire');
    const urlVehicleTypeFilter = searchParams.get('vehicle_type');
    if (!urlSearchQuery && !urlExpireFilter && !urlVehicleTypeFilter && !searchQuery && !expireFilter && !vehicleTypeFilter && isInitialized && !isSearching && !isInSearchMode && !isInExpireFilterMode && !isInVehicleTypeFilterMode) {
      loadVehicles();
    }
  }, [refreshKey, currentPage, loadVehicles, searchParams, searchQuery, expireFilter, vehicleTypeFilter, isInitialized, isSearching, isInSearchMode, isInExpireFilterMode, isInVehicleTypeFilterMode]); // Reload when refresh is triggered or page changes

  const handleSearchFromUrl = useCallback(async (query: string, page: number = 1) => {
    try {
      setIsSearching(true);
      setLoading(true);
      setError(null);
      const response = await vehicleService.searchVehicles(query.trim(), page);
      
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

  const handleExpireFilterFromUrl = useCallback(async (expirePeriod: string, page: number = 1) => {
    try {
      setIsSearching(true);
      setLoading(true);
      setError(null);
      const response = await vehicleService.searchVehiclesByExpire(expirePeriod, page);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination(response.data.pagination);
        setCurrentPage(page);
        setExpireFilter(expirePeriod);
        setIsInExpireFilterMode(true);
      } else {
        console.error('Expire filter failed:', response.error);
        setError(response.error || 'Expire filter failed');
      }
    } catch (error) {
      console.error('Expire filter error:', error);
      setError('Expire filter failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  const handleVehicleTypeFilterFromUrl = useCallback(async (vehicleType: string, page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await vehicleService.searchVehiclesByVehicleType(vehicleType, page);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination(response.data.pagination);
        setVehicleTypeFilter(vehicleType);
        setCurrentPage(page);
        setIsInVehicleTypeFilterMode(true);
      } else {
        console.error('Vehicle type filter failed:', response.error);
        setError(response.error || 'Vehicle type filter failed');
      }
    } catch (error) {
      console.error('Vehicle type filter error:', error);
      setError('Vehicle type filter failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle URL parameters for search query, expire filter, and vehicle type filter
  useEffect(() => {
    const urlSearchQuery = searchParams.get('q');
    const urlExpireFilter = searchParams.get('expire');
    const urlVehicleTypeFilter = searchParams.get('vehicle_type');
    const urlPage = searchParams.get('page');
    
    
    if (urlSearchQuery) {
      // URL has search query - perform search
      setSearchInput(urlSearchQuery);
      setSearchQuery(urlSearchQuery);
      setCurrentPage(urlPage ? parseInt(urlPage) : 1);
      handleSearchFromUrl(urlSearchQuery, urlPage ? parseInt(urlPage) : 1);
      // Clear expire filter and vehicle type filter if search is active
      setExpireFilter(null);
      setIsInExpireFilterMode(false);
      setVehicleTypeFilter(null);
      setIsInVehicleTypeFilterMode(false);
    } else if (urlExpireFilter) {
      // URL has expire filter - perform expire filter
      setExpireFilter(urlExpireFilter);
      setCurrentPage(urlPage ? parseInt(urlPage) : 1);
      handleExpireFilterFromUrl(urlExpireFilter, urlPage ? parseInt(urlPage) : 1);
      // Clear search and vehicle type filter if expire filter is active
      setSearchInput('');
      setSearchQuery('');
      setIsInSearchMode(false);
      setVehicleTypeFilter(null);
      setIsInVehicleTypeFilterMode(false);
    } else if (urlVehicleTypeFilter) {
      // URL has vehicle type filter - perform vehicle type filter
      setVehicleTypeFilter(urlVehicleTypeFilter);
      setCurrentPage(urlPage ? parseInt(urlPage) : 1);
      handleVehicleTypeFilterFromUrl(urlVehicleTypeFilter, urlPage ? parseInt(urlPage) : 1);
      // Clear search and expire filter if vehicle type filter is active
      setSearchInput('');
      setSearchQuery('');
      setIsInSearchMode(false);
      setExpireFilter(null);
      setIsInExpireFilterMode(false);
    } else if (!isInitialized) {
      // Initial load without search query, expire filter, or vehicle type filter
      const page = urlPage ? parseInt(urlPage) : 1;
      setCurrentPage(page);
      setIsInSearchMode(false);
      setIsInExpireFilterMode(false);
      setIsInVehicleTypeFilterMode(false);
      loadVehicles();
    }
    
    setIsInitialized(true);
  }, [searchParams, loadVehicles, handleSearchFromUrl, handleExpireFilterFromUrl, handleVehicleTypeFilterFromUrl, isInitialized]);

  // Handle clearing search, expire filter, and vehicle type filter when navigating from other pages
  useEffect(() => {
    const urlSearchQuery = searchParams.get('q');
    const urlExpireFilter = searchParams.get('expire');
    const urlVehicleTypeFilter = searchParams.get('vehicle_type');
    
    // If we're on vehicles page without search query and we have an active search, clear it
    // This handles navigation from sidebar/header
    // Only clear if we're not currently searching and not loading
    if (isInitialized && !urlSearchQuery && searchQuery && !isSearching && !loading) {
      // Add a small delay to ensure search operations complete
      const timeoutId = setTimeout(() => {
        setSearchInput('');
        setSearchQuery('');
        setError(null);
        setIsInSearchMode(false);
        loadVehicles();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    
    // If we're on vehicles page without expire filter and we have an active expire filter, clear it
    if (isInitialized && !urlExpireFilter && expireFilter && !isSearching && !loading) {
      // Add a small delay to ensure filter operations complete
      const timeoutId = setTimeout(() => {
        setExpireFilter(null);
        setError(null);
        setIsInExpireFilterMode(false);
        loadVehicles();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    
    // If we're on vehicles page without vehicle type filter and we have an active vehicle type filter, clear it
    if (isInitialized && !urlVehicleTypeFilter && vehicleTypeFilter && !isSearching && !loading) {
      // Add a small delay to ensure filter operations complete
      const timeoutId = setTimeout(() => {
        setVehicleTypeFilter(null);
        setError(null);
        setIsInVehicleTypeFilterMode(false);
        loadVehicles();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchParams, isInitialized, searchQuery, expireFilter, vehicleTypeFilter, isSearching, loading, loadVehicles]);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setSearchQuery('');
      // Clear URL parameters when clearing search, but preserve expire filter or vehicle type filter if active
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('q');
      if (expireFilter) {
        newSearchParams.set('expire', expireFilter);
        setSearchParams(newSearchParams);
      } else if (vehicleTypeFilter) {
        newSearchParams.set('vehicle_type', vehicleTypeFilter);
        setSearchParams(newSearchParams);
      } else {
        setSearchParams({});
      }
      return;
    }
    
    try {
      setIsSearching(true);
      setLoading(true);
      // Clear expire filter and vehicle type filter when performing search
      setExpireFilter(null);
      setIsInExpireFilterMode(false);
      setVehicleTypeFilter(null);
      setIsInVehicleTypeFilterMode(false);
      const response = await vehicleService.searchVehicles(searchInput.trim(), 1);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination(response.data.pagination);
        setSearchQuery(searchInput);
        // Reset pagination when searching
        setCurrentPage(1);
        // Update URL with search query
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
    // Clear URL parameters when clearing search, but preserve expire filter or vehicle type filter if active
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('q');
    if (expireFilter) {
      // If expire filter is active, reload expire filter results
      newSearchParams.set('expire', expireFilter);
      setSearchParams(newSearchParams);
      await handleExpireFilterChange(expireFilter);
    } else if (vehicleTypeFilter) {
      // If vehicle type filter is active, reload vehicle type filter results
      newSearchParams.set('vehicle_type', vehicleTypeFilter);
      setSearchParams(newSearchParams);
      await handleVehicleTypeFilterChange(vehicleTypeFilter);
    } else {
      // Otherwise, clear all and reload normal vehicles
      setSearchParams({});
      await loadVehicles();
    }
  };

  const handleSearchPageChange = async (page: number) => {
    if (!searchQuery) return;
    
    try {
      setIsSearching(true);
      setLoading(true);
      const response = await vehicleService.searchVehicles(searchQuery, page);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination(response.data.pagination);
        setCurrentPage(page);
        // Update URL with new page
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

  const handleExpireFilterChange = async (value: string) => {
    if (!value || value === '') {
      // Clear expire filter
      setExpireFilter(null);
      setIsInExpireFilterMode(false);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('expire');
      newSearchParams.set('page', '1');
      setSearchParams(newSearchParams);
      setCurrentPage(1);
      // If search is active, reload search results; otherwise load normal vehicles
      if (searchQuery) {
        try {
          setIsSearching(true);
          setLoading(true);
          const response = await vehicleService.searchVehicles(searchQuery, 1);
          if (response.success && response.data) {
            setVehicles(response.data.vehicles);
            setPagination(response.data.pagination);
            setIsInSearchMode(true);
          }
        } catch (error) {
          console.error('Error reloading search:', error);
        } finally {
          setLoading(false);
          setIsSearching(false);
        }
      } else if (vehicleTypeFilter) {
        // If vehicle type filter is active, reload vehicle type filter results
        await handleVehicleTypeFilterChange(vehicleTypeFilter);
      } else {
        await loadVehicles();
      }
      return;
    }
    
    try {
      setIsSearching(true);
      setLoading(true);
      setError(null);
      // Clear search and vehicle type filter when applying expire filter
      setSearchInput('');
      setSearchQuery('');
      setIsInSearchMode(false);
      setVehicleTypeFilter(null);
      setIsInVehicleTypeFilterMode(false);
      const response = await vehicleService.searchVehiclesByExpire(value, 1);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination(response.data.pagination);
        setExpireFilter(value);
        setCurrentPage(1);
        setIsInExpireFilterMode(true);
        // Update URL with expire filter
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('expire', value);
        newSearchParams.delete('q'); // Remove search query if present
        newSearchParams.delete('vehicle_type'); // Remove vehicle type filter if present
        newSearchParams.set('page', '1');
        setSearchParams(newSearchParams);
      } else {
        console.error('Expire filter failed:', response.error);
        setError(response.error || 'Failed to filter vehicles by expire');
      }
    } catch (error) {
      console.error('Expire filter error:', error);
      setError('Failed to filter vehicles by expire: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleExpireFilterPageChange = async (page: number) => {
    if (!expireFilter) return;
    
    try {
      setIsSearching(true);
      setLoading(true);
      const response = await vehicleService.searchVehiclesByExpire(expireFilter, page);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination(response.data.pagination);
        setCurrentPage(page);
        setIsInExpireFilterMode(true);
        // Update URL with new page
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('expire', expireFilter);
        newSearchParams.set('page', page.toString());
        setSearchParams(newSearchParams);
      } else {
        console.error('Expire filter page change failed:', response.error);
        setError(response.error || 'Failed to load expire filter results');
      }
    } catch (error) {
      console.error('Expire filter page change error:', error);
      setError('Failed to load expire filter results: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleVehicleTypeFilterChange = async (value: string) => {
    if (!value || value === '') {
      // Clear vehicle type filter
      setVehicleTypeFilter(null);
      setIsInVehicleTypeFilterMode(false);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('vehicle_type');
      newSearchParams.set('page', '1');
      setSearchParams(newSearchParams);
      setCurrentPage(1);
      // If search is active, reload search results; otherwise load normal vehicles
      if (searchQuery) {
        try {
          setIsSearching(true);
          setLoading(true);
          const response = await vehicleService.searchVehicles(searchQuery, 1);
          if (response.success && response.data) {
            setVehicles(response.data.vehicles);
            setPagination(response.data.pagination);
            setIsInSearchMode(true);
          }
        } catch (error) {
          console.error('Error reloading search:', error);
        } finally {
          setLoading(false);
          setIsSearching(false);
        }
      } else if (expireFilter) {
        // If expire filter is active, reload expire filter results
        await handleExpireFilterChange(expireFilter);
      } else {
        await loadVehicles();
      }
      return;
    }
    
    try {
      setIsSearching(true);
      setLoading(true);
      setError(null);
      // Clear search and expire filter when applying vehicle type filter
      setSearchInput('');
      setSearchQuery('');
      setIsInSearchMode(false);
      setExpireFilter(null);
      setIsInExpireFilterMode(false);
      const response = await vehicleService.searchVehiclesByVehicleType(value, 1);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination(response.data.pagination);
        setVehicleTypeFilter(value);
        setCurrentPage(1);
        setIsInVehicleTypeFilterMode(true);
        // Update URL with vehicle type filter
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('vehicle_type', value);
        newSearchParams.delete('q'); // Remove search query if present
        newSearchParams.delete('expire'); // Remove expire filter if present
        newSearchParams.set('page', '1');
        setSearchParams(newSearchParams);
      } else {
        console.error('Vehicle type filter failed:', response.error);
        setError(response.error || 'Failed to filter vehicles by vehicle type');
      }
    } catch (error) {
      console.error('Vehicle type filter error:', error);
      setError('Failed to filter vehicles by vehicle type: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleVehicleTypeFilterPageChange = async (page: number) => {
    if (!vehicleTypeFilter) return;
    
    try {
      setIsSearching(true);
      setLoading(true);
      const response = await vehicleService.searchVehiclesByVehicleType(vehicleTypeFilter, page);
      
      if (response.success && response.data) {
        setVehicles(response.data.vehicles);
        setPagination(response.data.pagination);
        setCurrentPage(page);
        setIsInVehicleTypeFilterMode(true);
        // Update URL with new page
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('vehicle_type', vehicleTypeFilter);
        newSearchParams.set('page', page.toString());
        setSearchParams(newSearchParams);
      } else {
        console.error('Vehicle type filter page change failed:', response.error);
        setError(response.error || 'Failed to load vehicle type filter results');
      }
    } catch (error) {
      console.error('Vehicle type filter page change error:', error);
      setError('Failed to load vehicle type filter results: ' + (error as Error).message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    handleVehicleAction(
      vehicle,
      VEHICLE_ACTIONS.EDIT,
      () => navigate(`/vehicles/edit/${vehicle.imei}`)
    );
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    handleVehicleAction(
      vehicle,
      VEHICLE_ACTIONS.DELETE,
      async () => {
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
      }
    );
  };

  const handleRechargeVehicle = (vehicle: Vehicle) => {
    handleVehicleAction(
      vehicle,
      VEHICLE_ACTIONS.RECHARGE,
      () => {
    if (vehicle.device) {
      navigate(`/recharges/create?deviceId=${vehicle.device.id}&imei=${vehicle.imei}`);
    } else {
      setError('Device information not available for this vehicle');
    }
      }
    );
  };

  const handleServerPoint = async (vehicle: Vehicle) => {
    handleVehicleAction(
      vehicle,
      VEHICLE_ACTIONS.SERVER_POINT,
      async () => {
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
      }
    );
  };

  const handleReset = async (vehicle: Vehicle) => {
    handleVehicleAction(
      vehicle,
      VEHICLE_ACTIONS.RESET,
      async () => {
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
      }
    );
  };

  const handleToggleRelayAccess = async (vehicle: Vehicle) => {
    try {
      const currentIsRelay = vehicle.is_relay === true;
      const newIsRelayValue = !currentIsRelay;
      
      // Update only the is_relay field - backend supports partial updates
      const result = await vehicleService.updateVehicle(vehicle.imei, {
        imei: vehicle.imei,
        name: vehicle.name || '',
        vehicleNo: vehicle.vehicleNo || '',
        vehicleType: vehicle.vehicleType || '',
        odometer: vehicle.odometer || 0,
        mileage: vehicle.mileage || 0,
        speedLimit: vehicle.speedLimit || 60,
        minimumFuel: vehicle.minimumFuel || 0,
        is_relay: newIsRelayValue,
      } as any);

      if (result.success) {
        showSuccess(`Relay access ${newIsRelayValue ? 'enabled' : 'disabled'} successfully`);
        await loadVehicles();
      } else {
        showError(result.error || 'Failed to update relay access');
      }
    } catch (error) {
      console.error('Toggle relay access error:', error);
      showError('Failed to update relay access');
    }
  };

  const handleRelayOn = async (vehicle: Vehicle) => {
    handleVehicleAction(
      vehicle,
      VEHICLE_ACTIONS.RELAY_ON,
      async () => {
    try {
      if (!vehicle.device?.phone) {
        showError('Device phone number not available');
        return;
      }

      const result = await deviceService.sendRelayOn(vehicle.device.phone);

      if (result.success) {
        showSuccess('Relay ON command sent successfully');
        // Update the vehicle in the local state
        setVehicles(vehicles.map(v => 
          v.imei === vehicle.imei ? { 
            ...v, 
            latestStatus: v.latestStatus ? { 
              ...v.latestStatus, 
              relay: true 
            } : undefined
          } : v
        ));
      } else {
        showError(result.error || 'Failed to send relay ON command');
      }
    } catch (error) {
      console.error('Relay ON error:', error);
      showError('Failed to send relay ON command');
        }
      }
    );
  };

  const handleRelayOff = async (vehicle: Vehicle) => {
    handleVehicleAction(
      vehicle,
      VEHICLE_ACTIONS.RELAY_OFF,
      async () => {
    try {
      if (!vehicle.device?.phone) {
        showError('Device phone number not available');
        return;
      }

      const result = await deviceService.sendRelayOff(vehicle.device.phone);

      if (result.success) {
        showSuccess('Relay OFF command sent successfully');
        // Update the vehicle in the local state
        setVehicles(vehicles.map(v => 
          v.imei === vehicle.imei ? { 
            ...v, 
            latestStatus: v.latestStatus ? { 
              ...v.latestStatus, 
              relay: false 
            } : undefined
          } : v
        ));
      } else {
        showError(result.error || 'Failed to send relay OFF command');
      }
    } catch (error) {
      console.error('Relay OFF error:', error);
      showError('Failed to send relay OFF command');
        }
      }
    );
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

  const handleDeviceMonitoring = (vehicle: Vehicle) => {
    navigate(`/monitoring/device/${vehicle.imei}`);
  };

  const toggleDropdown = (vehicleId: string) => {
    setDropdownOpen(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Update URL with new page (only if not in search mode, expire filter mode, or vehicle type filter mode)
    if (!searchQuery && !expireFilter && !vehicleTypeFilter) {
      setSearchParams({ page: page.toString() });
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

  const formatJoinedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      return `${day} ${month}, ${year}`;
    } catch {
      return 'Invalid date';
    }
  };

  const getExpireTimeRemaining = (vehicle: Vehicle) => {
    if (!vehicle.expireDate) {
      return null;
    }

    const now = new Date();
    const expireDate = new Date(vehicle.expireDate);

    // Check if date is valid
    if (isNaN(expireDate.getTime())) {
      return null;
    }

    const diffInSeconds = Math.floor((expireDate.getTime() - now.getTime()) / 1000);

    // If already expired
    if (diffInSeconds < 0) {
      return 'Expired';
    }

    // Calculate months and days remaining
    const days = Math.floor(diffInSeconds / 86400);
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;

    if (months > 0 && remainingDays > 0) {
      return `${months}m ${remainingDays}d`;
    } else if (months > 0) {
      return `${months}m`;
    } else if (days > 0) {
      return `${days}d`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      if (hours > 0) {
        return `${hours}h`;
      }
      return 'Expiring soon';
    }
  };

  const getLastData = (vehicle: Vehicle) => {
    if (vehicle.latestStatus) {
      return formatTimeAgo(vehicle.latestStatus.updatedAt);
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
                value={expireFilter || ''}
                onChange={handleExpireFilterChange}
                options={[
                  { value: '', label: 'Expire in: None' },
                  { value: '1_day', label: 'Expire in: 1 day' },
                  { value: '3_days', label: 'Expire in: 3 days' },
                  { value: '1_week', label: 'Expire in: 1 week' },
                  { value: '1_month', label: 'Expire in: 1 month' },
                  { value: '3_months', label: 'Expire in: 3 months' },
                  { value: '6_months', label: 'Expire in: 6 months' }
                ]}
              />
              <Select
                value={vehicleTypeFilter || ''}
                onChange={handleVehicleTypeFilterChange}
                options={[
                  { value: '', label: 'All Types' },
                  ...VEHICLE_TYPES.map(type => ({ value: type, label: type }))
                ]}
              />
            </div>
          </CardBody>
        </Card>

        {/* Vehicles Table */}
        <Card>
          {(isInSearchMode || isInExpireFilterMode || isInVehicleTypeFilterMode ? vehicles : filteredVehicles).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No vehicles found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Vehicle Info</TableHeader>
                      <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
                        <TableHeader>Device Info</TableHeader>
                      </RoleBasedWidget>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Customer Info</TableHeader>
                      <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <TableHeader>Last Recharge</TableHeader>
                      </RoleBasedWidget>
                      <TableHeader>Last Data ago</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(isInSearchMode || isInExpireFilterMode || isInVehicleTypeFilterMode ? vehicles : filteredVehicles).map((vehicle) => {
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
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <img
                                src={getImagePath(
                                  vehicle.vehicleType || 'car',
                                  vehicleState,
                                  VehicleImageState.STATUS
                                )}
                                alt={vehicle.vehicleType}
                                className="w-12 h-12 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/assets/icon/status/car_stop.png';
                                  target.onerror = null;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="font-semibold">{vehicle.vehicleNo}</div>
                              <Badge variant="secondary" size="sm">{vehicle.name}</Badge>
                              <div className="flex items-center gap-1.5">
                                {vehicle.expireDate ? (
                                  <Badge 
                                    variant={new Date(vehicle.expireDate) < new Date() ? 'danger' : 
                                             new Date(vehicle.expireDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'warning' : 'success'}
                                    size="sm"
                                  >
                                    {formatJoinedDate(vehicle.createdAt)} / Ex: {getExpireTimeRemaining(vehicle)}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" size="sm">
                                    {formatJoinedDate(vehicle.createdAt)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
                          <TableCell>
                            <div className="flex flex-col min-w-0 space-y-1">
                              <span className="font-mono text-sm font-medium truncate">{vehicle.imei}</span>
                              <span className="text-xs text-gray-500 truncate">{vehicle.device?.phone || 'N/A'}</span>
                              <div className="">
                              <button
                                className="bg-gray-700 text-white px-2 py-1 text-xs rounded shadow-md hover:bg-gray-800 transition-colors"
                                onClick={() => handleDeviceMonitoring(vehicle)}
                              >
                                {'>_'}
                              </button>
                              </div>
                            </div>
                          </TableCell>
                        </RoleBasedWidget>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div>
                              <Badge 
                                variant={vehicle.is_active ? 'success' : 'danger'} 
                                size="sm"
                              >
                                {vehicle.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            {vehicle.latestStatus && (
                              <div className="flex items-center gap-1">
                                <Tooltip content={`Battery: ${vehicle.latestStatus.battery}/6`}>
                                  <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                                    {getBattery(vehicle.latestStatus.battery, 18)}
                                  </div>
                                </Tooltip>
                                <Tooltip content={`Signal: ${vehicle.latestStatus.signal}/4`}>
                                  <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                                    {getSignal(vehicle.latestStatus.signal, 18)}
                                  </div>
                                </Tooltip>
                                <Tooltip content={vehicle.latestStatus.ignition ? 'Ignition: ON' : 'Ignition: OFF'}>
                                  <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                                    {getIgnition(vehicle.latestStatus.ignition, 18)}
                                  </div>
                                </Tooltip>
                                <Tooltip content={vehicle.latestStatus.charging ? 'Charging: ON' : 'Charging: OFF'}>
                                  <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
                                    {getCharging(vehicle.latestStatus.charging, 18)}
                                  </div>
                                </Tooltip>
                              </div>
                            )}
                            {!vehicle.latestStatus && (
                              <span className="text-xs text-gray-400">No data</span>
                            )}
                          </div>
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
                            {vehicle.latestRecharge ? (
                              <div className="flex flex-col gap-1">
                                <Badge variant="info" size="sm" className="w-fit">रु{vehicle.latestRecharge.amount}</Badge>
                                <span className="text-xs text-gray-600">{formatTimeAgo(vehicle.latestRecharge.createdAt)}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No recharge</span>
                            )}
                          </TableCell>
                        </RoleBasedWidget>
                        <TableCell className="text-sm">
                          {getLastData(vehicle)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-end gap-2">
                              <EditActionButton onClick={() => handleEditVehicle(vehicle)} />
                              <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
                                {vehicle.is_active ? (
                                  <DeactivateActionButton onClick={() => handleDeactivateVehicle(vehicle)} />
                                ) : (
                                  <ActivateActionButton onClick={() => handleActivateVehicle(vehicle)} />
                                )}
                              </RoleBasedWidget>
                              <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                <RechargeActionButton onClick={() => handleRechargeVehicle(vehicle)} />
                              </RoleBasedWidget>
                            </div>
                            <div className="flex justify-end gap-2">
                              {(() => {
                                const isRelayEnabled = vehicle.is_relay === true;
                                const canControl = auth?.isSuperAdmin && auth.isSuperAdmin() ? true : isRelayEnabled;
                                const isDisabled = !canControl;
                                
                                if (vehicle.latestStatus?.relay) {
                                  return <RelayOffActionButton onClick={() => handleRelayOff(vehicle)} disabled={isDisabled} />;
                                } else {
                                  return <RelayOnActionButton onClick={() => handleRelayOn(vehicle)} disabled={isDisabled} />;
                                }
                              })()}
                              <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                <div className="relative">
                                  <CommandsActionButton onClick={() => toggleDropdown(vehicle.id.toString())} />
                                  {dropdownOpen[vehicle.id.toString()] && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl z-10 border border-gray-200 backdrop-blur-sm">
                                    <div className="py-1">
                                      <button
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                                        onClick={() => {
                                          handleServerPoint(vehicle);
                                          setDropdownOpen(prev => ({ ...prev, [vehicle.id.toString()]: false }));
                                        }}
                                      >
                                        <SendIcon className="w-4 h-4 mr-3 text-blue-500" />
                                        SERVER POINT
                                      </button>
                                      <button
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                                        onClick={() => {
                                          handleReset(vehicle);
                                          setDropdownOpen(prev => ({ ...prev, [vehicle.id.toString()]: false }));
                                        }}
                                      >
                                        <RefreshIcon className="w-4 h-4 mr-3 text-orange-500" />
                                        RESET
                                      </button>
                                      <button
                                        className={`flex items-center w-full px-4 py-2 text-sm transition-colors duration-200 ${
                                          vehicle.is_relay === true
                                            ? 'text-gray-700 hover:bg-red-50 hover:text-red-700' 
                                            : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                                        }`}
                                        onClick={() => {
                                          handleToggleRelayAccess(vehicle);
                                          setDropdownOpen(prev => ({ ...prev, [vehicle.id.toString()]: false }));
                                        }}
                                      >
                                        <PowerSettingsNewIcon className={`w-4 h-4 mr-3 ${vehicle.is_relay === true ? 'text-red-500' : 'text-green-500'}`} />
                                        {vehicle.is_relay === true ? 'RELAY OFF ACC' : 'RELAY ON ACC'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </RoleBasedWidget>
                              <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                                <DeleteActionButton onClick={() => handleDeleteVehicle(vehicle)} />
                              </RoleBasedWidget>
                            </div>
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
                onPageChange={
                  searchQuery 
                    ? handleSearchPageChange 
                    : expireFilter 
                      ? handleExpireFilterPageChange 
                      : vehicleTypeFilter
                        ? handleVehicleTypeFilterPageChange
                        : handlePageChange
                }
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
