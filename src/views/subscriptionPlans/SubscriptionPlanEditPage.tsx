import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscriptionPlanService } from '../../api/services/subscriptionPlanService';
import { showSuccess } from '../../utils/sweetAlert';
import type { SubscriptionPlanFormData, Permission, SubscriptionPlan } from '../../types/subscriptionPlan';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Checkbox from '../../components/ui/forms/Checkbox';
import Form from '../../components/ui/forms/Form';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

const SubscriptionPlanEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);
  
  const [formData, setFormData] = useState<SubscriptionPlanFormData>({
    title: '',
    price: 0,
    permission_ids: [],
  });

  const [formErrors, setFormErrors] = useState<{ [key in keyof SubscriptionPlanFormData]?: string }>({});

  useEffect(() => {
    if (id) {
      fetchSubscriptionPlan();
      fetchPermissions();
    }
  }, [id]);

  const fetchSubscriptionPlan = async () => {
    if (!id) return;
    
    try {
      setLoadingData(true);
      const response = await subscriptionPlanService.getSubscriptionPlan(parseInt(id));
      
      if (response.success && response.data) {
        const plan = response.data;
        setSubscriptionPlan(plan);
        setFormData({
          title: plan.title,
          price: plan.price,
          permission_ids: plan.permissions?.map(p => p.permission) || [],
        });
      } else {
        setError(response.error || 'Failed to fetch subscription plan');
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching subscription plan');
      console.error('Error fetching subscription plan:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const response = await subscriptionPlanService.getAvailablePermissions();
      
      if (response.success && response.data) {
        setPermissions(response.data);
      } else {
        setError(response.error || 'Failed to fetch permissions');
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching permissions');
      console.error('Error fetching permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleInputChange = (field: keyof SubscriptionPlanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: checked
        ? [...prev.permission_ids, permissionId]
        : prev.permission_ids.filter(id => id !== permissionId)
    }));
  };

  const validateForm = (): boolean => {
    const errors: { [key in keyof SubscriptionPlanFormData]?: string } = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await subscriptionPlanService.updateSubscriptionPlan(parseInt(id), formData);
      
      if (response.success) {
        showSuccess('Subscription plan updated successfully');
        navigate('/subscription-plans');
      } else {
        setError(response.error || 'Failed to update subscription plan');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating subscription plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/subscription-plans');
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const contentType = permission.content_type;
    if (!acc[contentType]) {
      acc[contentType] = [];
    }
    acc[contentType].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loadingData) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" color="primary" />
        </div>
      </Container>
    );
  }

  if (!subscriptionPlan) {
    return (
      <Container>
        <Alert variant="danger">
          Subscription plan not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              <ArrowBackIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Subscription Plan</h1>
              <p className="text-gray-600">
                Update subscription plan details and permissions
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
          <Form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <Input
                        type="text"
                        value={formData.title}
                        onChange={(value) => handleInputChange('title', value)}
                        placeholder="Enter subscription plan title"
                        error={formErrors.title}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <Input
                        type="number"
                        value={formData.price.toString()}
                        onChange={(value) => handleInputChange('price', parseFloat(value) || 0)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        error={formErrors.price}
                        required
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Permissions */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
                  <p className="text-sm text-gray-500">
                    Select the permissions for this subscription plan
                  </p>
                </CardHeader>
                <CardBody>
                  {loadingPermissions ? (
                    <div className="flex justify-center items-center py-8">
                      <Spinner size="md" color="primary" />
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Object.entries(groupedPermissions).map(([contentType, perms]) => (
                        <div key={contentType}>
                          <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                            {contentType.replace('_', ' ')}
                          </h4>
                          <div className="space-y-2">
                            {perms.map((permission) => (
                              <Checkbox
                                key={permission.id}
                                checked={formData.permission_ids.includes(permission.id)}
                                onChange={(checked) => handlePermissionChange(permission.id, checked)}
                              >
                                <span className="text-sm text-gray-600">
                                  {permission.name}
                                </span>
                              </Checkbox>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={<SaveIcon className="w-4 h-4" />}
              >
                Update Subscription Plan
              </Button>
            </div>
          </Form>
        </RoleBasedWidget>
      </div>
    </Container>
  );
};

export default SubscriptionPlanEditPage;
