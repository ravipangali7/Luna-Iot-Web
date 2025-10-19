import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { instituteService, type Institute, type InstituteModule } from '../../api/services/instituteService';
import { showSuccess, showError, confirmDelete } from '../../utils/sweetAlert';
import { API_CONFIG } from '../../config/config';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import Button from '../../components/ui/buttons/Button';
import { EditActionButton, DeleteActionButton, ActionButtonGroup } from '../../components/ui/buttons';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Container from '../../components/ui/layout/Container';

const InstituteShowPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [modules, setModules] = useState<InstituteModule[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitute = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await instituteService.getInstituteById(parseInt(id!));
      
      if (result.success && result.data) {
        setInstitute(result.data);
      } else {
        setError(result.error || 'Failed to fetch institute');
        showError('Error', result.error || 'Failed to fetch institute');
      }
    } catch {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setLoading(false);
    }
    };

    const fetchModules = async () => {
      try {
        setModulesLoading(true);
        const result = await instituteService.getInstituteModulesByInstitute(parseInt(id!));
        
        if (result.success && result.data) {
          setModules(result.data);
        } else {
          console.error('Failed to fetch modules:', result.error);
        }
      } catch {
        console.error('Failed to fetch modules');
      } finally {
        setModulesLoading(false);
      }
    };

    if (id) {
      fetchInstitute();
      fetchModules();
    }
  }, [id, navigate]);

  const fetchModules = async () => {
    try {
      setModulesLoading(true);
      const result = await instituteService.getInstituteModulesByInstitute(parseInt(id!));
      
      if (result.success && result.data) {
        setModules(result.data);
      } else {
        console.error('Failed to fetch modules:', result.error);
      }
    } catch {
      console.error('Failed to fetch modules');
    } finally {
      setModulesLoading(false);
    }
  };

  const handleDeleteModule = async (moduleId: number, moduleName: string) => {
    const confirmed = await confirmDelete(
      'Delete Institute Module',
      `Are you sure you want to delete "${moduleName}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await instituteService.deleteInstituteModule(moduleId);
        
        if (result.success) {
          showSuccess('Success', 'Institute module deleted successfully');
          fetchModules(); // Refresh the modules list
        } else {
          showError('Error', result.error || 'Failed to delete institute module');
        }
      } catch {
        showError('Error', 'An unexpected error occurred');
      }
    }
  };

  const handleEditModule = (moduleId: number) => {
    navigate(`/institute/modules/${moduleId}/edit`);
  };

  const handleCreateModule = () => {
    navigate(`/institute/modules/create?institute=${id}`);
  };

  const handleEditInstitute = () => {
    navigate(`/institute/${id}/edit`);
  };

  const handleDeleteInstitute = async () => {
    if (!institute) return;

    const confirmed = await confirmDelete(
      'Delete Institute',
      `Are you sure you want to delete "${institute.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await instituteService.deleteInstitute(parseInt(id!));
        
        if (result.success) {
          showSuccess('Success', 'Institute deleted successfully');
          navigate('/institute');
        } else {
          showError('Error', result.error || 'Failed to delete institute');
        }
      } catch {
        showError('Error', 'An unexpected error occurred');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !institute) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Institute not found'}</p>
        <Button onClick={() => navigate('/institute')} variant="primary">
          Back to Institutes
        </Button>
      </div>
    );
  }

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{institute.name}</h1>
          <p className="text-gray-600">Institute details and module management</p>
        </div>
        <div className="flex space-x-2">
          <RoleBasedWidget allowedRoles={['Super Admin']}>
            <Button onClick={handleEditInstitute} variant="secondary">
              Edit Institute
            </Button>
            <Button onClick={handleDeleteInstitute} variant="danger">
              Delete Institute
            </Button>
          </RoleBasedWidget>
        </div>
      </div>

      {/* Institute Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{institute.name}</p>
              </div>
              
              {institute.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{institute.description}</p>
                </div>
              )}
              
              {institute.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{institute.phone}</p>
                </div>
              )}
              
              {institute.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{institute.address}</p>
                </div>
              )}
              
              {institute.location && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{institute.location}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Services</h2>
          </CardHeader>
          <CardBody>
            {institute.institute_services && institute.institute_services.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {institute.institute_services.map((service) => (
                  <Badge key={service.id} variant="secondary">
                    {service.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No services assigned</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Logo */}
      {institute.logo && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Logo</h2>
          </CardHeader>
          <CardBody>
            <img 
              src={`${API_CONFIG.BASE_URL}${institute.logo}`} 
              alt={`${institute.name} logo`}
              className="h-32 w-32 object-cover rounded-lg"
            />
          </CardBody>
        </Card>
      )}

      {/* Institute Modules */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Institute Modules</h2>
            <RoleBasedWidget allowedRoles={['Super Admin']}>
              <Button onClick={handleCreateModule} variant="primary" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Module
              </Button>
            </RoleBasedWidget>
          </div>
        </CardHeader>
        <CardBody>
          {modulesLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="md" />
            </div>
          ) : modules.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No modules found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table striped hover>
                <TableHead>
                <TableRow>
                  <TableHeader>Module</TableHeader>
                  <TableHeader>Users</TableHeader>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">{module.module_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{module.user_count}</span>
                        <Badge variant="secondary" size="sm">
                          {module.user_count === 1 ? 'user' : 'users'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(module.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <ActionButtonGroup>
                        <RoleBasedWidget allowedRoles={['Super Admin']}>
                          <EditActionButton onClick={() => handleEditModule(module.id)} />
                          <DeleteActionButton onClick={() => handleDeleteModule(module.id, `${institute.name} - ${module.module_name}`)} />
                        </RoleBasedWidget>
                      </ActionButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </Container>
  );
};

export default InstituteShowPage;
