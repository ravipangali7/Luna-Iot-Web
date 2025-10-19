import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertSwitchService } from '../../../api/services/alertSystemService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import Table from '../../../components/ui/tables/Table';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import TableRow from '../../../components/ui/tables/TableRow';
import TableCell from '../../../components/ui/tables/TableCell';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';

interface AlertSwitch {
  id: number;
  title: string;
  device: number;
  device_imei: string;
  device_phone: string;
  latitude: number;
  longitude: number;
  trigger: string;
  primary_phone: string;
  secondary_phone?: string;
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

const SwitchIndexPage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute } = useAlertSystemAccess(Number(instituteId));

  const [switches, setSwitches] = useState<AlertSwitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch switches
  const fetchSwitches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await alertSwitchService.getByInstitute(Number(instituteId));
      setSwitches(response || []);
    } catch (err: unknown) {
      console.error('Error fetching switches:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load switches. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => {
    if (hasAccessToInstitute(Number(instituteId))) {
      fetchSwitches();
    } else {
      setError('You do not have access to this institute\'s alert system.');
      setLoading(false);
    }
  }, [hasAccessToInstitute, instituteId, fetchSwitches]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Filter switches based on search term
  const filteredSwitches = switches.filter(switchItem =>
    switchItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    switchItem.device_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    switchItem.device_imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    switchItem.primary_phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    switchItem.institute_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSwitches = filteredSwitches.slice(startIndex, endIndex);

  useEffect(() => {
    setTotalPages(Math.ceil(filteredSwitches.length / itemsPerPage));
  }, [filteredSwitches.length, itemsPerPage]);

  // Handle delete
  const handleDelete = async (id: number, title: string) => {
    const confirmed = await confirmDelete(
      'Delete Switch',
      `Are you sure you want to delete the switch "${title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await alertSwitchService.delete(id);
        showSuccess('Switch deleted successfully!');
        fetchSwitches();
      } catch (err: unknown) {
        console.error('Error deleting switch:', err);
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete switch. Please try again.';
        showError(errorMessage);
      }
    }
  };

  // Handle view
  const handleView = (id: number) => {
    navigate(`/alert-system/${instituteId}/switches/${id}`);
  };

  // Handle edit
  const handleEdit = (id: number) => {
    navigate(`/alert-system/${instituteId}/switches/${id}/edit`);
  };

  // Handle create
  const handleCreate = () => {
    navigate(`/alert-system/${instituteId}/switches/create`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format coordinates
  const formatCoordinates = (lat: number | string, lng: number | string) => {
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      return 'N/A';
    }
    
    return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="error" title="Error" message={error} />
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert Switches</h1>
            <p className="text-gray-600 mt-1">Manage alert switches for this institute</p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreate}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Switch
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search switches..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              icon={
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredSwitches.length} of {switches.length} switches
          </div>
        </div>

        {/* Switches Table */}
        {filteredSwitches.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No switches found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No switches match your search criteria.' : 'Get started by creating your first alert switch.'}
              </p>
              {!searchTerm && (
                <Button variant="primary" onClick={handleCreate}>
                  Add Switch
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Table striped hover>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader>Device</TableHeader>
                <TableHeader>Location</TableHeader>
                <TableHeader>Trigger</TableHeader>
                <TableHeader>Primary Phone</TableHeader>
                <TableHeader>Institute</TableHeader>
                <TableHeader>Created At</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSwitches.map(switchItem => (
                <TableRow key={switchItem.id}>
                  <TableCell className="font-medium text-gray-900">{switchItem.title}</TableCell>
                  <TableCell className="text-gray-600">
                    {switchItem.device_phone} - {switchItem.device_imei}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {formatCoordinates(switchItem.latitude, switchItem.longitude)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={switchItem.trigger === 'HIGH' ? 'success' : 'warning'}
                      size="sm"
                    >
                      {switchItem.trigger}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{switchItem.primary_phone}</TableCell>
                  <TableCell className="text-gray-600">{switchItem.institute_name}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(switchItem.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleView(switchItem.id)}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        }
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(switchItem.id)}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(switchItem.id, switchItem.title)}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredSwitches.length)} of {filteredSwitches.length} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default SwitchIndexPage;
