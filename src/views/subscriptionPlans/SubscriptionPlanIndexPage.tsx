import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionPlanService } from '../../api/services/subscriptionPlanService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import type { SubscriptionPlan } from '../../types/subscriptionPlan';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { EditActionButton, DeleteActionButton, ActionButtonGroup } from '../../components/ui/buttons';
import Input from '../../components/ui/forms/Input';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Pagination from '../../components/ui/pagination/Pagination';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const SubscriptionPlanIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_previous: false,
  });

  const fetchSubscriptionPlans = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await subscriptionPlanService.getSubscriptionPlansPaginated(page, search);
      
      if (response.success && response.data) {
        setSubscriptionPlans(response.data.subscription_plans);
        setPagination(response.data.pagination);
        setCurrentPage(response.data.pagination.current_page);
      } else {
        setError(response.error || 'Failed to fetch subscription plans');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching subscription plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionPlans(currentPage, searchQuery);
  }, [currentPage, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDelete = async (id: number, title: string) => {
    const confirmed = await confirmDelete(
      'Delete Subscription Plan',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const response = await subscriptionPlanService.deleteSubscriptionPlan(id);
        
        if (response.success) {
          showSuccess('Subscription plan deleted successfully');
          fetchSubscriptionPlans(currentPage, searchQuery);
        } else {
          showError(response.error || 'Failed to delete subscription plan');
        }
      } catch (err) {
        showError('An unexpected error occurred');
        console.error('Error deleting subscription plan:', err);
      }
    }
  };

  const handleRefresh = () => {
    fetchSubscriptionPlans(currentPage, searchQuery);
  };

  const formatPrice = (price: number) => {
    return `Rs ${price}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && subscriptionPlans.length === 0) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" color="primary" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-gray-600">
              Manage subscription plans and their permissions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              icon={<RefreshIcon className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
              <Button
                variant="primary"
                onClick={() => navigate('/subscription-plans/create')}
                icon={<AddIcon className="w-4 h-4" />}
              >
                Add Subscription Plan
              </Button>
            </RoleBasedWidget>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search subscription plans..."
                    value={searchInput}
                    onChange={(value) => setSearchInput(value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="primary">
                  Search
                </Button>
              </form>
            </div>
          </CardBody>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Subscription Plans Table */}
        <Card>
          <CardBody>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner size="md" color="primary" />
              </div>
            ) : subscriptionPlans.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No subscription plans found</p>
                {searchQuery && (
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your search criteria
                  </p>
                )}
              </div>
            ) : (
              <>
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Title</TableHeader>
                      <TableHeader>Price</TableHeader>
                      <TableHeader>Permissions</TableHeader>
                      <TableHeader>Created</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subscriptionPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{plan.title}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            {formatPrice(plan.price)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="info" size="sm">
                            {plan.permissions_count || plan.permissions?.length || 0} permissions
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {formatDate(plan.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ActionButtonGroup>
                            <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                              <EditActionButton onClick={() => navigate(`/subscription-plans/${plan.id}/edit`)} />
                            </RoleBasedWidget>
                            <RoleBasedWidget allowedRoles={[ROLES.ADMIN]}>
                              <DeleteActionButton onClick={() => handleDelete(plan.id, plan.title)} />
                            </RoleBasedWidget>
                          </ActionButtonGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={pagination.current_page}
                      totalPages={pagination.total_pages}
                      onPageChange={handlePageChange}
                      hasNext={pagination.has_next}
                      hasPrevious={pagination.has_previous}
                      totalItems={pagination.total_items}
                      pageSize={10}
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default SubscriptionPlanIndexPage;
