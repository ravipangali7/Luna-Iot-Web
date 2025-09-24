import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instituteService, type InstituteService } from '../../../api/services/instituteService';
import { showSuccess, showError, confirmDelete } from '../../../utils/sweetAlert';
import RoleBasedWidget from '../../../components/role-based/RoleBasedWidget';
import Button from '../../../components/ui/buttons/Button';
import Table from '../../../components/ui/tables/Table';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import TableRow from '../../../components/ui/tables/TableRow';
import TableCell from '../../../components/ui/tables/TableCell';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Container from '../../../components/ui/layout/Container';

const InstituteServiceIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<InstituteService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await instituteService.getAllInstituteServices();
      
      if (result.success && result.data) {
        setServices(result.data);
      } else {
        setError(result.error || 'Failed to fetch institute services');
        showError('Error', result.error || 'Failed to fetch institute services');
      }
    } catch {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await confirmDelete(
      'Delete Institute Service',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await instituteService.deleteInstituteService(id);
        
        if (result.success) {
          showSuccess('Success', 'Institute service deleted successfully');
          fetchServices(); // Refresh the list
        } else {
          showError('Error', result.error || 'Failed to delete institute service');
        }
      } catch {
        showError('Error', 'An unexpected error occurred');
      }
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/institute/services/${id}/edit`);
  };

  const handleCreate = () => {
    navigate('/institute/services/create');
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
        <Button onClick={fetchServices} variant="primary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institute Services</h1>
          <p className="text-gray-600">Manage institute services and their details</p>
        </div>
        <RoleBasedWidget allowedRoles={['Super Admin']}>
          <Button onClick={handleCreate} variant="primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Service
          </Button>
        </RoleBasedWidget>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Icon</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No institute services found
                </td>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    {service.icon ? (
                      <Badge variant="secondary" size="sm">
                        {service.icon}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {service.description || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(service.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <RoleBasedWidget allowedRoles={['Super Admin']}>
                        <Button
                          onClick={() => handleEdit(service.id)}
                          variant="secondary"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(service.id, service.name)}
                          variant="danger"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </RoleBasedWidget>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Container>
  );
};

export default InstituteServiceIndexPage;
