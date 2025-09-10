import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rechargeService } from '../../api/services/rechargeService';
import type { Recharge, RechargeFilters } from '../../types/recharge';
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

const RechargeIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [filteredRecharges, setFilteredRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RechargeFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [devices, setDevices] = useState<{ id: number; imei: string; phone: string }[]>([]);

  useEffect(() => {
    loadRecharges();
    loadDevices();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [recharges, filters, searchQuery]);

  const loadRecharges = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await rechargeService.getRechargesWithPagination(currentPage, 10, filters);
      
      if (result.success && result.data) {
        setRecharges(result.data.recharges);
        setTotalPages(result.data.pagination.pages);
        setTotalCount(result.data.pagination.total);
      } else {
        setError(result.error || 'Failed to load recharges');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      // This would typically come from a device service
      // For now, we'll extract unique devices from recharges
      const uniqueDevices = recharges.reduce((acc, recharge) => {
        const device = recharge.device;
        if (!acc.find(d => d.id === device.id)) {
          acc.push({
            id: device.id,
            imei: device.imei,
            phone: device.phone
          });
        }
        return acc;
      }, [] as { id: number; imei: string; phone: string }[]);
      setDevices(uniqueDevices);
    } catch (err) {
      console.error('Error loading devices:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...recharges];

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(recharge =>
        recharge.device.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recharge.device.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recharge.amount.toString().includes(searchQuery) ||
        recharge.id.toString().includes(searchQuery)
      );
    }

    // Apply amount filters
    if (filters.amountMin !== undefined) {
      filtered = filtered.filter(recharge => recharge.amount >= filters.amountMin!);
    }
    if (filters.amountMax !== undefined) {
      filtered = filtered.filter(recharge => recharge.amount <= filters.amountMax!);
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(recharge => 
        new Date(recharge.createdAt) >= new Date(filters.dateFrom!)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(recharge => 
        new Date(recharge.createdAt) <= new Date(filters.dateTo!)
      );
    }

    setFilteredRecharges(filtered);
  };

  const handleCreateRecharge = () => {
    navigate('/recharges/create');
  };

  const handleDeleteRecharge = async (recharge: Recharge) => {
    if (window.confirm(`Are you sure you want to delete recharge #${recharge.id}?`)) {
      try {
        const result = await rechargeService.deleteRecharge(recharge.id);
        if (result.success) {
          setRecharges(recharges.filter(r => r.id !== recharge.id));
        } else {
          setError(result.error || 'Failed to delete recharge');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      }
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceInfo = (recharge: Recharge) => {
    const device = recharge.device;
    return `${device.imei} (${device.phone})`;
  };

  const getAssignedUser = (recharge: Recharge) => {
    if (recharge.device.userDevices && recharge.device.userDevices.length > 0) {
      return recharge.device.userDevices[0].user.name;
    }
    if (recharge.device.vehicles && recharge.device.vehicles.length > 0) {
      const vehicle = recharge.device.vehicles[0];
      if (vehicle.userVehicles && vehicle.userVehicles.length > 0) {
        return vehicle.userVehicles[0].user.name;
      }
    }
    return 'Unassigned';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (key: keyof RechargeFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
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
            <h1 className="text-2xl font-bold text-gray-900">Recharges</h1>
            <p className="text-gray-600">Manage device recharges</p>
          </div>
          <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <Button onClick={handleCreateRecharge}>
              Add Recharge
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
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Search recharges..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <Select
                value={filters.deviceId?.toString() || ''}
                onChange={(value) => handleFilterChange('deviceId', value ? parseInt(value) : undefined)}
                options={[
                  { value: '', label: 'All Devices' },
                  ...devices.map(device => ({ 
                    value: device.id.toString(), 
                    label: `${device.imei} (${device.phone})` 
                  }))
                ]}
              />
              <Input
                type="number"
                placeholder="Min Amount"
                value={filters.amountMin?.toString() || ''}
                onChange={(value) => handleFilterChange('amountMin', value ? parseFloat(value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Max Amount"
                value={filters.amountMax?.toString() || ''}
                onChange={(value) => handleFilterChange('amountMax', value ? parseFloat(value) : undefined)}
              />
              <Input
                type="date"
                placeholder="From Date"
                value={filters.dateFrom || ''}
                onChange={(value) => handleFilterChange('dateFrom', value || undefined)}
              />
              <Input
                type="date"
                placeholder="To Date"
                value={filters.dateTo || ''}
                onChange={(value) => handleFilterChange('dateTo', value || undefined)}
              />
            </div>
          </CardBody>
        </Card>

        {/* Recharges Table */}
        <Card>
          {filteredRecharges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recharges found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader>S.N.</TableHeader>
                    <TableHeader>ID</TableHeader>
                    <TableHeader>Device</TableHeader>
                    <TableHeader>Assigned User</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecharges.map((recharge, index) => (
                    <TableRow key={recharge.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-semibold">#{recharge.id}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {getDeviceInfo(recharge)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getAssignedUser(recharge)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatAmount(recharge.amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(recharge.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteRecharge(recharge)}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardBody>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} recharges
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </Container>
  );
};

export default RechargeIndexPage;
