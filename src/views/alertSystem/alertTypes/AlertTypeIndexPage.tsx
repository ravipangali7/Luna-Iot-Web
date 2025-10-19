import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { alertTypeService } from '../../../api/services/alertSystemService';
import type { AlertType } from '../../../api/services/alertSystemService';

const AlertTypeIndexPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [alertTypes, setAlertTypes] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const fetchAlertTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await alertTypeService.getAll();
      
      // Apply search filter if needed
      let filteredAlertTypes = response;
      if (searchTerm) {
        filteredAlertTypes = response.filter(alertType =>
          alertType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (alertType.icon && alertType.icon.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedAlertTypes = filteredAlertTypes.slice(startIndex, endIndex);
      
      setAlertTypes(paginatedAlertTypes);
      setTotalCount(filteredAlertTypes.length);
      setTotalPages(Math.ceil(filteredAlertTypes.length / itemsPerPage));
    } catch (err) {
      console.error('Error fetching alert types:', err);
      setError('Failed to load alert types. Please try again.');
      setAlertTypes([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    fetchAlertTypes();
  }, [fetchAlertTypes]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    navigate('/alert-types/create');
  };

  const handleEdit = (alertTypeId: number) => {
    navigate(`/alert-types/${alertTypeId}/edit`);
  };

  const handleDelete = async (alertTypeId: number, alertTypeName: string) => {
    const confirmed = await confirmDelete(
      'Delete Alert Type',
      `Are you sure you want to delete "${alertTypeName}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await alertTypeService.delete(alertTypeId);
        showSuccess('Alert type deleted successfully');
        fetchAlertTypes();
      } catch (err) {
        console.error('Error deleting alert type:', err);
        showError('Failed to delete alert type. Please try again.');
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

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert Types</h1>
            <p className="text-gray-600 mt-1">
              Manage alert types for the alert system
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
            Create Alert Type
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search alert types..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Card>
          <div className="p-6">
            {alertTypes.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No alert types found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'No alert types match your search criteria.' : 'Get started by creating a new alert type.'}
                </p>
              </div>
            ) : (
              <>
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Icon</TableHeader>
                      <TableHeader>Created At</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alertTypes.map(alertType => (
                      <TableRow key={alertType.id}>
                        <TableCell className="font-medium text-gray-900">{alertType.name}</TableCell>
                        <TableCell className="text-gray-600">
                          {alertType.icon ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {alertType.icon}
                            </span>
                          ) : (
                            <span className="text-gray-400">No icon</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(alertType.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(alertType.id)}
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
                              onClick={() => handleDelete(alertType.id, alertType.name)}
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
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
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
              </>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default AlertTypeIndexPage;
