import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Table from '../../../components/ui/tables/Table';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import TableRow from '../../../components/ui/tables/TableRow';
import TableCell from '../../../components/ui/tables/TableCell';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';
import { schoolService } from '../../../api/services/schoolService';
import type { SchoolBusList } from '../../../types/school';
import { ROLES } from '../../../utils/roleUtils';

const SchoolBusIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [schoolBuses, setSchoolBuses] = useState<SchoolBusList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // Check if user is Super Admin
  const isSuperAdmin = user?.roles?.some(role => role.name === ROLES.SUPER_ADMIN) || false;

  const fetchSchoolBuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await schoolService.getAllSchoolBuses(currentPage, itemsPerPage, searchTerm || undefined);
      
      if (response.success && response.data) {
        setSchoolBuses(response.data.school_buses);
        setTotalCount(response.data.pagination.total_items);
        setTotalPages(response.data.pagination.total_pages);
      } else {
        setError(response.error || 'Failed to load school buses');
        setSchoolBuses([]);
      }
    } catch (err) {
      console.error('Error fetching school buses:', err);
      setError('Failed to load school buses. Please try again.');
      setSchoolBuses([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchSchoolBuses();
  }, [fetchSchoolBuses]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    navigate('/school/buses/create');
  };

  const handleEdit = (busId: number) => {
    navigate(`/school/buses/edit/${busId}`);
  };

  const handleView = (busId: number) => {
    navigate(`/school/buses/${busId}`);
  };

  const handleDelete = async (busId: number, busName: string) => {
    const confirmed = await confirmDelete(
      'Delete School Bus',
      `Are you sure you want to delete "${busName}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await schoolService.deleteSchoolBus(busId);
        if (result.success) {
          showSuccess('School bus deleted successfully');
          fetchSchoolBuses();
        } else {
          showError(result.error || 'Failed to delete school bus');
        }
      } catch (err) {
        console.error('Error deleting school bus:', err);
        showError('Failed to delete school bus. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && schoolBuses.length === 0) {
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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School Buses</h1>
            <p className="text-gray-600 mt-1">
              Manage school bus assignments to institutes
            </p>
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
            Create School Bus
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by institute name, bus name, or vehicle number..."
              value={searchTerm}
              onChange={handleSearch}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {schoolBuses.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">
              No school buses found
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Institute</TableHeader>
                    <TableHeader>Bus Name</TableHeader>
                    <TableHeader>Vehicle No</TableHeader>
                    <TableHeader>Created At</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schoolBuses.map((bus) => (
                    <TableRow key={bus.id}>
                      <TableCell>{bus.institute_name}</TableCell>
                      <TableCell>{bus.bus_name}</TableCell>
                      <TableCell>{bus.bus_vehicle_no}</TableCell>
                      <TableCell>{formatDate(bus.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleView(bus.id)}
                          >
                            View
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleEdit(bus.id)}
                          >
                            Edit
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(bus.id, `${bus.institute_name} - ${bus.bus_name}`)}
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

              {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </Container>
  );
};

export default SchoolBusIndexPage;

