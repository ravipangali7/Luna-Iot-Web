import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertBuzzerService } from '../../../api/services/alertSystemService';
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

interface AlertBuzzer {
  id: number;
  title: string;
  device: number;
  device_imei: string;
  device_phone: string;
  delay: number;
  geofences_count: number;
  alert_geofences_names?: string[];
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

const BuzzerIndexPage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute, isAdmin } = useAlertSystemAccess(Number(instituteId));

  const [buzzers, setBuzzers] = useState<AlertBuzzer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch buzzers
  const fetchBuzzers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await alertBuzzerService.getByInstitute(Number(instituteId));
      setBuzzers(response || []);
    } catch (err: unknown) {
      console.error('Error fetching buzzers:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load buzzers. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => {
    if (hasAccessToInstitute(Number(instituteId))) {
      fetchBuzzers();
    } else {
      setError('You do not have access to this institute\'s alert system.');
      setLoading(false);
    }
  }, [hasAccessToInstitute, instituteId, fetchBuzzers]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Filter buzzers based on search term
  const filteredBuzzers = buzzers.filter(buzzer =>
    buzzer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buzzer.device_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buzzer.device_imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    buzzer.institute_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBuzzers = filteredBuzzers.slice(startIndex, endIndex);

  useEffect(() => {
    setTotalPages(Math.ceil(filteredBuzzers.length / itemsPerPage));
  }, [filteredBuzzers.length, itemsPerPage]);

  // Handle delete
  const handleDelete = async (id: number, title: string) => {
    const confirmed = await confirmDelete(
      'Delete Buzzer',
      `Are you sure you want to delete the buzzer "${title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await alertBuzzerService.delete(id);
        showSuccess('Buzzer deleted successfully!');
        fetchBuzzers();
      } catch (err: unknown) {
        console.error('Error deleting buzzer:', err);
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete buzzer. Please try again.';
        showError(errorMessage);
      }
    }
  };

  // Handle view
  const handleView = (id: number) => {
    navigate(`/alert-system/${instituteId}/buzzers/${id}`);
  };

  // Handle edit
  const handleEdit = (id: number) => {
    navigate(`/alert-system/${instituteId}/buzzers/${id}/edit`);
  };

  // Handle create
  const handleCreate = () => {
    navigate(`/alert-system/${instituteId}/buzzers/create`);
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
            <h1 className="text-2xl font-bold text-gray-900">Alert Buzzers</h1>
            <p className="text-gray-600 mt-1">Manage alert buzzers for this institute</p>
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
            Add Buzzer
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search buzzers..."
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
            {filteredBuzzers.length} of {buzzers.length} buzzers
          </div>
        </div>

        {/* Buzzers Table */}
        {filteredBuzzers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No buzzers found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No buzzers match your search criteria.' : 'Get started by creating your first alert buzzer.'}
              </p>
              {!searchTerm && (
                <Button variant="primary" onClick={handleCreate}>
                  Add Buzzer
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
                <TableHeader>Delay</TableHeader>
                <TableHeader>Geofences</TableHeader>
                <TableHeader>Institute</TableHeader>
                <TableHeader>Created At</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBuzzers.map(buzzer => (
                <TableRow key={buzzer.id}>
                  <TableCell className="font-medium text-gray-900">{buzzer.title}</TableCell>
                  <TableCell className="text-gray-600">
                    {buzzer.device_phone} - {buzzer.device_imei}
                  </TableCell>
                  <TableCell className="text-gray-600">{buzzer.delay}s</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {buzzer.alert_geofences_names && buzzer.alert_geofences_names.length > 0 ? (
                        buzzer.alert_geofences_names.map((geofenceName, index) => (
                          <Badge key={index} variant="primary" size="sm">{geofenceName}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No geofences</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{buzzer.institute_name}</TableCell>
                  <TableCell className="text-gray-600">{formatDate(buzzer.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleView(buzzer.id)}
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
                        onClick={() => handleEdit(buzzer.id)}
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
                        onClick={() => handleDelete(buzzer.id, buzzer.title)}
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
              Showing {startIndex + 1} to {Math.min(endIndex, filteredBuzzers.length)} of {filteredBuzzers.length} results
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

export default BuzzerIndexPage;
