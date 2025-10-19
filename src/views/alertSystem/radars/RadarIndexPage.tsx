import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertRadarService } from '../../../api/services/alertSystemService';
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

interface AlertRadar {
  id: number;
  title: string;
  token: string;
  alert_geofences_names: string[];
  institute: number;
  institute_name: string;
  created_at: string;
  updated_at: string;
}

const RadarIndexPage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute, isAdmin } = useAlertSystemAccess(Number(instituteId));

  const [radars, setRadars] = useState<AlertRadar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);

  // Check access
  useEffect(() => {
    if (!hasAccessToInstitute(Number(instituteId))) {
      setError('You do not have access to this institute\'s alert system.');
      setLoading(false);
      return;
    }
  }, [hasAccessToInstitute, instituteId]);

  // Fetch radars
  const fetchRadars = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await alertRadarService.getByInstitute(Number(instituteId));
      setRadars(response || []);
      setTotalCount(response?.length || 0);
      setTotalPages(Math.ceil((response?.length || 0) / pageSize));
    } catch (err: unknown) {
      console.error('Error fetching radars:', err);
      const errorMessage = (err as any)?.response?.data?.message || 'Failed to load radars. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [instituteId, pageSize]);

  useEffect(() => {
    if (hasAccessToInstitute(Number(instituteId))) {
      fetchRadars();
    }
  }, [hasAccessToInstitute, instituteId, fetchRadars]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Filter radars based on search term
  const filteredRadars = radars.filter(radar =>
    radar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    radar.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
    radar.institute_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate filtered results
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRadars = filteredRadars.slice(startIndex, endIndex);

  // Handle view
  const handleView = (radarId: number) => {
    navigate(`/alert-system/${instituteId}/radars/${radarId}`);
  };

  // Handle edit
  const handleEdit = (radarId: number) => {
    navigate(`/alert-system/${instituteId}/radars/${radarId}/edit`);
  };

  // Handle delete
  const handleDelete = async (radarId: number, radarTitle: string) => {
    const confirmed = await confirmDelete(
      'Delete Radar',
      `Are you sure you want to delete "${radarTitle}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await alertRadarService.delete(radarId);
        showSuccess('Radar deleted successfully');
        fetchRadars();
      } catch (err: unknown) {
        console.error('Error deleting radar:', err);
        const errorMessage = (err as any)?.response?.data?.message || 'Failed to delete radar. Please try again.';
        showError(errorMessage);
      }
    }
  };

  // Handle add radar
  const handleAddRadar = () => {
    navigate(`/alert-system/${instituteId}/radars/create`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  if (error && !loading) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
        <div className="flex justify-center">
          <Button variant="primary" onClick={() => navigate(`/alert-system/${instituteId}`)}>
            Back to Alert System
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Radars</h1>
            <p className="text-gray-600 mt-1">
              Manage radar devices for alert monitoring
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleAddRadar}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Radar
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search radars by title, token, or institute..."
                value={searchTerm}
                onChange={handleSearch}
                icon={
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <div className="text-sm text-gray-600">
              Showing {paginatedRadars.length} of {filteredRadars.length} radars
            </div>
          </div>
        </div>

        {/* Radars Table */}
        <Card>
          <div className="p-6">
            {filteredRadars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No radars found' : 'No radars yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : 'Get started by creating your first radar device'
                  }
                </p>
                {!searchTerm && (
                  <Button variant="primary" onClick={handleAddRadar}>
                    Add Your First Radar
                  </Button>
                )}
              </div>
            ) : (
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader>Title</TableHeader>
                    <TableHeader>Token</TableHeader>
                    <TableHeader>Geofences</TableHeader>
                    <TableHeader>Institute</TableHeader>
                    <TableHeader>Created At</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRadars.map(radar => (
                    <TableRow key={radar.id}>
                      <TableCell className="font-medium text-gray-900">{radar.title}</TableCell>
                      <TableCell className="text-gray-600 font-mono text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="truncate max-w-[200px]">{radar.token}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(radar.token);
                              showSuccess('Token copied to clipboard!');
                            }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Copy token"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {radar.alert_geofences_names && radar.alert_geofences_names.length > 0 ? (
                            radar.alert_geofences_names.map((geofenceName, index) => (
                              <Badge key={index} variant="primary" size="sm">{geofenceName}</Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No geofences</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{radar.institute_name}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(radar.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleView(radar.id)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            }
                          >
                            View
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(radar.id)}
                              icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              }
                            >
                              Edit
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(radar.id, radar.title)}
                              icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              }
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
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

export default RadarIndexPage;
