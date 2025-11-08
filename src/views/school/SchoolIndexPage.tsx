import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSchoolAccess } from '../../hooks/useSchoolAccess';
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


const SchoolIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess, loading: accessLoading, isAdmin, accessibleInstitutes } = useSchoolAccess();
  
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
        const schoolInstituteIds = accessibleInstitutes
          .filter(inst => inst.has_school_access)
          .map(inst => inst.institute_id);
        
        // If no accessible institutes yet, wait for hook to load
        if (schoolInstituteIds.length === 0 && accessibleInstitutes.length === 0) {
          setInstitutes([]);
          setTotalCount(0);
          setTotalPages(0);
          setLoading(false);
          return;
        }
        
        institutes = institutes.filter(inst => schoolInstituteIds.includes(inst.id));
        
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
        setError('You do not have access to the School module. Please contact your administrator.');
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
    navigate(`/school/${instituteId}`);
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
          You do not have access to the School module. Please contact your administrator.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School Management</h1>
            <p className="text-gray-600 mt-1">
              Manage institutes with school bus, parents, and SMS services
            </p>
          </div>
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
                 placeholder="Search institutes..."
                 value={searchTerm}
                 onChange={handleSearch}
                 className="pl-10"
               />
             </div>
          </div>
        </div>

        <Card>
          <div className="p-6">
            {institutes.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No institutes found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'No institutes match your search criteria.' : 'No institutes with school module access found.'}
                </p>
              </div>
            ) : (
              <>
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Institute Name</TableHeader>
                      <TableHeader>Phone</TableHeader>
                      <TableHeader>Address</TableHeader>
                      <TableHeader>Created At</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {institutes.map(institute => (
                      <TableRow key={institute.id}>
                        <TableCell className="font-medium text-gray-900">{institute.name}</TableCell>
                        <TableCell className="text-gray-600">{institute.phone || 'N/A'}</TableCell>
                        <TableCell className="text-gray-600 max-w-xs truncate" title={institute.address}>
                          {institute.address || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(institute.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleView(institute.id)}
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
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEdit(institute.id)}
                              icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              }
                            >
                              Edit
                            </Button>
                            
                            {isSuperAdmin && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(institute.id, institute.name)}
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

export default SchoolIndexPage;

