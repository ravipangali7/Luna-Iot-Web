import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instituteService, type Institute } from '../../api/services/instituteService';
import { showSuccess, showError, confirmDelete } from '../../utils/sweetAlert';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import Button from '../../components/ui/buttons/Button';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Container from '../../components/ui/layout/Container';

const InstituteIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await instituteService.getAllInstitutes();
      
      if (result.success && result.data) {
        setInstitutes(result.data);
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
  };

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
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institutes</h1>
          <p className="text-gray-600">Manage institutes and their details</p>
        </div>
        <RoleBasedWidget allowedRoles={['Super Admin']}>
          <Button onClick={handleCreate} variant="primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Institute
          </Button>
        </RoleBasedWidget>
      </div>

      {/* Institutes Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
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
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleShow(institute.id)}
                        variant="secondary"
                        size="sm"
                      >
                        View
                      </Button>
                      <RoleBasedWidget allowedRoles={['Super Admin']}>
                        <Button
                          onClick={() => handleEdit(institute.id)}
                          variant="secondary"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(institute.id, institute.name)}
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

export default InstituteIndexPage;
