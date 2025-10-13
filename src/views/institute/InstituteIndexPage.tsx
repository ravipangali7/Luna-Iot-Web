import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { instituteService, type Institute } from '../../api/services/instituteService';
import type { PaginationInfo } from '../../types/pagination';
import { showSuccess, showError, confirmDelete } from '../../utils/sweetAlert';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import Button from '../../components/ui/buttons/Button';
import { ViewActionButton, EditActionButton, DeleteActionButton, ActionButtonGroup } from '../../components/ui/buttons';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import AddIcon from '@mui/icons-material/Add';
import Pagination from '../../components/ui/pagination/Pagination';

const InstituteIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 20,
    has_next: false,
    has_previous: false
  });

  const fetchInstitutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await instituteService.getInstitutesPaginated({
        page: currentPage,
        page_size: 20,
        search: searchQuery
      });
      
      if (result.success && result.data) {
        setInstitutes(result.data.items);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to fetch institutes');
        showError('Error', result.error || 'Failed to fetch institutes');
      }
    } catch {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1); // Reset to first page when clearing search
  };

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await confirmDelete(
      'Delete Institute',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await instituteService.deleteInstitute(id);
        
        if (result.success) {
          showSuccess('Success', 'Institute deleted successfully');
          fetchInstitutes(); // Refresh the list
        } else {
          showError('Error', result.error || 'Failed to delete institute');
        }
      } catch {
        showError('Error', 'An unexpected error occurred');
      }
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/institute/${id}/edit`);
  };

  const handleShow = (id: number) => {
    navigate(`/institute/${id}`);
  };

  const handleCreate = () => {
    navigate('/institute/create');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchInstitutes} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institutes</h1>
          <p className="text-gray-600">Manage institutes and their details</p>
        </div>
        <RoleBasedWidget allowedRoles={['Super Admin']}>
          <Button onClick={handleCreate} variant="primary" icon={<AddIcon className="w-4 h-4" />}>
            Add Institute
          </Button>
        </RoleBasedWidget>
      </div>

      {/* Search Form */}
      <Card>
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Institutes
              </label>
              <input
                id="search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, phone, address, or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {searchQuery && (
              <Button type="button" onClick={handleClearSearch} variant="outline">
                Clear
              </Button>
            )}
          </form>
        </CardBody>
      </Card>

      {/* Institutes Table */}
        <Card>
          <CardBody>
            <div className="overflow-x-auto">
              <Table striped hover>
                <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Phone</TableHeader>
              <TableHeader>Address</TableHeader>
              <TableHeader>Services</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {institutes.length === 0 ? (
              <TableRow>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No institutes found
                </td>
              </TableRow>
            ) : (
              institutes.map((institute) => (
                <TableRow key={institute.id}>
                  <TableCell className="font-medium">{institute.name}</TableCell>
                  <TableCell>{institute.phone || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {institute.address || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {institute.institute_services && institute.institute_services.length > 0 ? (
                        institute.institute_services.slice(0, 2).map((service) => (
                          <Badge key={service.id} variant="secondary" size="sm">
                            {service.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {institute.institute_services && institute.institute_services.length > 2 && (
                        <Badge variant="secondary" size="sm">
                          +{institute.institute_services.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(institute.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ActionButtonGroup>
                      <ViewActionButton onClick={() => handleShow(institute.id)} />
                      <RoleBasedWidget allowedRoles={['Super Admin']}>
                        <EditActionButton onClick={() => handleEdit(institute.id)} />
                        <DeleteActionButton onClick={() => handleDelete(institute.id, institute.name)} />
                      </RoleBasedWidget>
                    </ActionButtonGroup>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
            </div>
          </CardBody>
        </Card>

        {/* Summary */}
        {institutes.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Showing {institutes.length} of {pagination.total_items} institutes
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.total_pages}
            onPageChange={handlePageChange}
            hasNext={pagination.has_next}
            hasPrevious={pagination.has_previous}
            totalItems={pagination.total_items}
            pageSize={pagination.page_size}
          />
        )}
      </div>
    </Container>
  );
};

export default InstituteIndexPage;
