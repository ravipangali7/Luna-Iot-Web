import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { instituteService, type InstituteModule, type InstituteModuleUpdate } from '../../../api/services/instituteService';
import { moduleService } from '../../../api/services/moduleService';
import { userService } from '../../../api/services/userService';
import type { User } from '../../../types/auth';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import RoleBasedWidget from '../../../components/role-based/RoleBasedWidget';
import Button from '../../../components/ui/buttons/Button';
import Spinner from '../../../components/ui/common/Spinner';
import Container from '../../../components/ui/layout/Container';

const InstituteModuleEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [module, setModule] = useState<InstituteModule | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<InstituteModuleUpdate>({
    user_ids: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchModule = async () => {
    try {
      setLoading(true);
      const result = await instituteService.getInstituteModuleById(parseInt(id!));
      
      if (result.success && result.data) {
        setModule(result.data);
        setFormData({
          user_ids: result.data.users.map(user => user.id)
        });
      } else {
        showError('Error', result.error || 'Failed to fetch institute module');
        navigate('/institute');
      }
    } catch {
      showError('Error', 'An unexpected error occurred');
      navigate('/institute');
    } finally {
      setLoading(false);
    }
    };

    const fetchUsers = async () => {
      try {
        const result = await userService.getAllUsers();
        if (result.success && result.data) {
          setUsers(result.data);
        }
      } catch {
        console.error('Failed to fetch users');
      }
    };

    if (id) {
      fetchModule();
      fetchUsers();
    }
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name } = e.target;
    
    if (name === 'user_ids') {
      const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
      setFormData(prev => ({
        ...prev,
        [name]: selectedIds
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

    if (!formData.user_ids || formData.user_ids.length === 0) {
      newErrors.user_ids = 'At least one user is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const result = await instituteService.updateInstituteModuleUsers(parseInt(id!), formData.user_ids!);
      
      if (result.success) {
        showSuccess('Success', 'Institute module updated successfully');
        navigate(`/institute/${module?.institute}`);
      } else {
        showError('Error', result.error || 'Failed to update institute module');
      }
    } catch {
      showError('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (module) {
      navigate(`/institute/${module.institute}`);
    } else {
      navigate('/institute');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Institute module not found</p>
        <Button onClick={() => navigate('/institute')} variant="primary">
          Back to Institutes
        </Button>
      </div>
    );
  }

  return (
    <RoleBasedWidget allowedRoles={['Super Admin']}>
      <Container className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Institute Module</h1>
          <p className="text-gray-600">
            Update users for {module.institute_name} - {module.module_name}
          </p>
        </div>

        {/* Module Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Institute:</span>
              <p className="text-gray-900">{module.institute_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Module:</span>
              <p className="text-gray-900">{module.module_name}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Users Selection */}
              <div>
                <label htmlFor="user_ids" className="block text-sm font-medium text-gray-700 mb-2">
                  Users *
                </label>
                <select
                  id="user_ids"
                  name="user_ids"
                  multiple
                  value={formData.user_ids?.map(id => id.toString()) || []}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.user_ids ? 'border-red-500' : ''}`}
                  required
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
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Update Module'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Container>
    </RoleBasedWidget>
  );
};

export default InstituteModuleEditPage;
