import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { instituteService, type InstituteModuleCreate, type Institute } from '../../../api/services/instituteService';
import { userService } from '../../../api/services/userService';
import type { User } from '../../../types/auth';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import RoleBasedWidget from '../../../components/role-based/RoleBasedWidget';
import Button from '../../../components/ui/buttons/Button';
import Select from '../../../components/ui/forms/Select';
import Spinner from '../../../components/ui/common/Spinner';
import Container from '../../../components/ui/layout/Container';

const InstituteModuleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([]);
  const [formData, setFormData] = useState<InstituteModuleCreate>({
    institute: parseInt(searchParams.get('institute') || '0'),
    group: 0,
    user_ids: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch institutes
      const institutesResult = await instituteService.getAllInstitutes();
      if (institutesResult.success && institutesResult.data) {
        setInstitutes(institutesResult.data);
      }

      // Fetch users
      const usersResult = await userService.getAllUsers();
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }

      // Fetch groups (roles)
      const groupsResult = await userService.getAllRoles();
      if (groupsResult.success && groupsResult.data) {
        setGroups(groupsResult.data);
      }
    } catch {
      showError('Error', 'Failed to fetch required data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'user_ids') {
      const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
      setFormData(prev => ({
        ...prev,
        [name]: selectedIds
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value)
      }));
    }
    
    // Clear error when user makes a selection
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.institute || formData.institute === 0) {
      newErrors.institute = 'Institute is required';
    }

    if (!formData.group || formData.group === 0) {
      newErrors.group = 'Group is required';
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

              {/* Group Selection */}
              <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">
                  Group *
                </label>
                <Select
                  value={formData.group.toString()}
                  onChange={(value) => setFormData(prev => ({ ...prev, group: parseInt(value) }))}
                  error={errors.group}
                  options={[
                    { value: "0", label: "Select a group" },
                    ...groups.map((group) => ({
                      value: group.id.toString(),
                      label: group.name
                    }))
                  ]}
                />
              </div>

              {/* Users Selection */}
              <div>
                <label htmlFor="user_ids" className="block text-sm font-medium text-gray-700 mb-2">
                  Users
                </label>
                <select
                  id="user_ids"
                  name="user_ids"
                  multiple
                  value={formData.user_ids?.map(id => id.toString()) || []}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.user_ids ? 'border-red-500' : ''}`}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id.toString()}>
                      {user.name} ({user.phone})
                    </option>
                  ))}
                </select>
                {errors.user_ids && <p className="mt-1 text-sm text-red-600">{errors.user_ids}</p>}
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
