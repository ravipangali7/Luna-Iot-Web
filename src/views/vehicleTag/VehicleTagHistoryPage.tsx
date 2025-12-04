import React, { useState, useEffect, useCallback } from 'react';
import { vehicleTagService } from '../../api/services/vehicleTagService';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
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
import Input from '../../components/ui/forms/Input';
import Button from '../../components/ui/buttons/Button';
import type { VehicleTagAlert, PaginationData } from '../../types/vehicleTag';

const VehicleTagHistoryPage: React.FC = () => {
  const [alerts, setAlerts] = useState<VehicleTagAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vtidFilter, setVtidFilter] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 25,
    has_next: false,
    has_previous: false,
    next_page: null,
    previous_page: null,
  });

  const loadAlerts = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const result = await vehicleTagService.getAlertHistory(
        page,
        25,
        vtidFilter || undefined
      );

      if (result.success && result.data) {
        setAlerts(result.data.alerts);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load alert history');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [vtidFilter]);

  useEffect(() => {
    loadAlerts(1);
  }, [loadAlerts]);

  const handlePageChange = (page: number) => {
    loadAlerts(page);
  };

  const handleFilter = () => {
    loadAlerts(1);
  };

  const handleClearFilter = () => {
    setVtidFilter('');
    loadAlerts(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Tag History</h1>
        <p className="text-gray-600 mt-1">View all vehicle tag alerts and reports</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by VTID
              </label>
              <Input
                type="text"
                value={vtidFilter}
                onChange={(value) => setVtidFilter(value)}
                placeholder="Enter VTID (e.g., VTID83)"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleFilter}
                variant="primary"
                className="mt-6"
              >
                Filter
              </Button>
              {vtidFilter && (
                <Button
                  onClick={handleClearFilter}
                  variant="secondary"
                  className="mt-6"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No alerts found. {vtidFilter && 'Try adjusting your filter.'}
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>ID</TableHeader>
                    <TableHeader>VTID</TableHeader>
                    <TableHeader>Registration No</TableHeader>
                    <TableHeader>Alert Type</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Image</TableHeader>
                    <TableHeader>Created At</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>{alert.id}</TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold">{alert.vehicle_tag_vtid}</span>
                      </TableCell>
                      <TableCell>{alert.vehicle_tag_registration_no || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="info">{alert.alert_display}</Badge>
                      </TableCell>
                      <TableCell>
                        {alert.latitude && alert.longitude ? (
                          <span className="text-sm">
                            {Number(alert.latitude).toFixed(6)}, {Number(alert.longitude).toFixed(6)}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {alert.person_image ? (
                          <div className="flex items-center">
                            <img
                              src={alert.person_image}
                              alt="Alert"
                              className="w-16 h-16 object-cover rounded cursor-pointer"
                              onClick={() => {
                                window.open(alert.person_image!, '_blank');
                              }}
                              title="Click to view full size"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-400">No image</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(alert.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.total_pages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={pagination.current_page}
                    totalPages={pagination.total_pages}
                    onPageChange={handlePageChange}
                    hasNext={pagination.has_next}
                    hasPrevious={pagination.has_previous}
                    totalItems={pagination.total_items}
                    pageSize={pagination.page_size}
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </Container>
  );
};

export default VehicleTagHistoryPage;

