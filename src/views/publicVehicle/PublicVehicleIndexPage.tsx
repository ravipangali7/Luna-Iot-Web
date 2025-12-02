import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePublicVehicleAccess } from '../../hooks/usePublicVehicleAccess';
import { instituteService, type Institute } from '../../api/services/instituteService';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import { ROLES } from '../../utils/roleUtils';

const PublicVehicleIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess, loading: accessLoading, isAdmin, accessibleInstitutes } = usePublicVehicleAccess();
  
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Check if user is Super Admin
  const isSuperAdmin = user?.roles?.some(role => role.name === ROLES.SUPER_ADMIN) || false;

  const fetchInstitutes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all institutes first
      const response = await instituteService.getAllInstitutes();
      
      if (response.success && response.data) {
        let institutes = response.data;
        
        // Filter by module access - both admin and non-admin use accessibleInstitutes
        const publicVehicleInstituteIds = accessibleInstitutes
          .filter(inst => inst.has_public_vehicle_access)
          .map(inst => inst.institute_id);
        
        // If no accessible institutes yet, wait for hook to load
        if (publicVehicleInstituteIds.length === 0 && accessibleInstitutes.length === 0) {
          setInstitutes([]);
          setTotalCount(0);
          setTotalPages(0);
          setLoading(false);
          return;
        }
        
        institutes = institutes.filter(inst => publicVehicleInstituteIds.includes(inst.id));
        
        // Apply search filter if needed
        if (searchTerm) {
          institutes = institutes.filter(inst =>
            inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inst.phone && inst.phone.includes(searchTerm)) ||
            (inst.address && inst.address.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        // Client-side pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedInstitutes = institutes.slice(startIndex, endIndex);
        
        setInstitutes(paginatedInstitutes.map(inst => ({
          ...inst,
          phone: inst.phone || '',
          address: inst.address || ''
        })));
        setTotalCount(institutes.length);
        setTotalPages(Math.ceil(institutes.length / itemsPerPage));
      } else {
        setInstitutes([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error('Error fetching institutes:', err);
      setError('Failed to load institutes. Please try again.');
      setInstitutes([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, accessibleInstitutes, currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    if (!accessLoading) {
      if (!hasAccess) {
        setError('You do not have access to the Public Vehicle module. Please contact your administrator.');
        setLoading(false);
        return;
      }
      fetchInstitutes();
    }
  }, [hasAccess, accessLoading, fetchInstitutes]);

  useEffect(() => {
    if (!accessLoading && hasAccess) {
      fetchInstitutes();
    }
  }, [currentPage, searchTerm, accessLoading, hasAccess, fetchInstitutes]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleView = (instituteId: number) => {
    navigate(`/public-vehicle/${instituteId}`);
  };

  const handleEdit = (instituteId: number) => {
    navigate(`/institute/${instituteId}/edit`);
  };

  const handleDelete = async (instituteId: number, instituteName: string) => {
     const confirmed = await confirmDelete(
       'Delete Institute',
       `Are you sure you want to delete "${instituteName}"? This action cannot be undone.`
     );

     if (confirmed) {
       try {
         await instituteService.deleteInstitute(instituteId);
         showSuccess('Institute deleted successfully');
         fetchInstitutes();
       } catch (err) {
         console.error('Error deleting institute:', err);
         showError('Failed to delete institute. Please try again.');
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

  if (accessLoading || loading) {
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

  if (!hasAccess) {
    return (
      <Container>
        <Alert variant="warning" className="mb-6">
          You do not have access to the Public Vehicle module. Please contact your administrator.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Public Vehicle Management</h1>
            <p className="text-gray-600 mt-1">
              Manage institutes with public vehicle services
            </p>
          </div>
        </div>

        <Card>
          <div className="p-6">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search institutes by name, phone, or address..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {institutes.length === 0 && !loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No institutes found.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Phone</TableHeader>
                      <TableHeader>Address</TableHeader>
                      <TableHeader>Created At</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {institutes.map((institute) => (
                      <TableRow key={institute.id}>
                        <TableCell>{institute.name}</TableCell>
                        <TableCell>{institute.phone || '-'}</TableCell>
                        <TableCell>{institute.address || '-'}</TableCell>
                        <TableCell>{formatDate(institute.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleView(institute.id)}
                            >
                              View Vehicles
                            </Button>
                            {isSuperAdmin && (
                              <>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleEdit(institute.id)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleDelete(institute.id, institute.name)}
                                >
                                  Delete
                                </Button>
                              </>
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
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} institutes
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

export default PublicVehicleIndexPage;

