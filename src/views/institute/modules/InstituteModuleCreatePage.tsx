import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { instituteService, type InstituteModuleCreate, type Institute } from '../../../api/services/instituteService';
import { moduleService } from '../../../api/services/moduleService';
import { userService } from '../../../api/services/userService';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import RoleBasedWidget from '../../../components/role-based/RoleBasedWidget';
import Button from '../../../components/ui/buttons/Button';
import Select from '../../../components/ui/forms/Select';
import MultiSelect from '../../../components/ui/forms/MultiSelect';
import Spinner from '../../../components/ui/common/Spinner';
import Container from '../../../components/ui/layout/Container';

const InstituteModuleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string; phone: string; status: string }>>([]);
  const [modules, setModules] = useState<Array<{ id: number; name: string }>>([]);
  const [formData, setFormData] = useState<InstituteModuleCreate>({
    institute: parseInt(searchParams.get('institute') || '0'),
    module: 0,
    user_ids: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
    fetchUsers(); // Load users separately in background
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch institutes
      const institutesResult = await instituteService.getAllInstitutes();
      if (institutesResult.success && institutesResult.data) {
        setInstitutes(institutesResult.data);
      }

      // Fetch modules
      const modulesResult = await moduleService.getAllModules();
      if (modulesResult.success && modulesResult.data) {
        setModules(modulesResult.data);
      }
    } catch {
      showError('Error', 'Failed to fetch required data');
    } finally {
      setLoading(false);
    }
  };

  // Load users in background - don't block page render (using optimized light endpoint)
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const usersResult = await userService.getLightUsers();
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }
    } catch {
      console.error('Failed to fetch users');
      // Don't show error to user - allow them to continue using form
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserChange = (selectedValues: (number | string)[]) => {
    setFormData(prev => ({
      ...prev,
      user_ids: selectedValues as number[]
    }));
    
    // Clear error when user makes a selection
    if (errors.user_ids) {
      setErrors(prev => ({
        ...prev,
        user_ids: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.institute || formData.institute === 0) {
      newErrors.institute = 'Institute is required';
    }

    if (!formData.module || formData.module === 0) {
      newErrors.module = 'Module is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await instituteService.createInstituteModule(formData);
      
      if (result.success) {
        showSuccess('Success', 'Institute module created successfully');
        navigate(`/institute/${formData.institute}`);
      } else {
        showError('Error', result.error || 'Failed to create institute module');
      }
    } catch {
      showError('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const instituteId = formData.institute || searchParams.get('institute');
    if (instituteId) {
      navigate(`/institute/${instituteId}`);
    } else {
      navigate('/institute');
    }
  };

  if (loading && institutes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RoleBasedWidget allowedRoles={['Super Admin']}>
      <Container className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Institute Module</h1>
          <p className="text-gray-600">Add a new module to an institute</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Institute Selection */}
              <div>
                <label htmlFor="institute" className="block text-sm font-medium text-gray-700 mb-2">
                  Institute *
                </label>
                <Select
                  value={formData.institute.toString()}
                  onChange={(value) => setFormData(prev => ({ ...prev, institute: parseInt(value) }))}
                  error={errors.institute}
                  options={[
                    { value: "0", label: "Select an institute" },
                    ...institutes.map((institute) => ({
                      value: institute.id.toString(),
                      label: institute.name
                    }))
                  ]}
                />
              </div>

              {/* Module Selection */}
              <div>
                <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">
                  Module *
                </label>
                <Select
                  value={formData.module.toString()}
                  onChange={(value) => setFormData(prev => ({ ...prev, module: parseInt(value) }))}
                  error={errors.module}
                  options={[
                    { value: "0", label: "Select a module" },
                    ...modules.map((module) => ({
                      value: module.id.toString(),
                      label: module.name
                    }))
                  ]}
                />
              </div>

              {/* Users Selection */}
              <div>
                <MultiSelect
                  options={users.map(user => ({
                    id: user.id,
                    label: `${user.name || ''} (${user.phone})`,
                    value: user.id
                  }))}
                  value={formData.user_ids || []}
                  onChange={handleUserChange}
                  placeholder="Select users..."
                  label="Users"
                  searchable
                  error={errors.user_ids}
                  loading={usersLoading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Select multiple users to assign to this module
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Module'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Container>
    </RoleBasedWidget>
  );
};

export default InstituteModuleCreatePage;
