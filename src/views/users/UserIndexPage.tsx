import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../api/services/userService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import type { User } from '../../types/auth';
import type { PaginationInfo } from '../../types/pagination';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { ViewActionButton, EditActionButton, DeleteActionButton, ActionButtonGroup } from '../../components/ui/buttons';
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
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const UserIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 20,
    has_next: false,
    has_previous: false
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await userService.getUsersPaginated({
        page: currentPage,
        page_size: 20,
        search: searchQuery
      });

      if (result.success && result.data) {
        setFilteredUsers(result.data.items);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1); // Reset to first page when clearing search
  };

  const handleViewUser = (user: User) => {
    navigate(`/users/${user.id}`);
  };

  const handleEditUser = (user: User) => {
    navigate(`/users/${user.id}/edit`);
  };

  const handleDeleteUser = async (user: User) => {
    const confirmed = await confirmDelete(
      'Delete User',
      `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await userService.deleteUser(user.phone);
        
        if (result.success) {
          showSuccess('User deleted successfully');
          loadUsers();
        } else {
          showError('Failed to delete user', result.error);
        }
      } catch (error) {
        showError('Error deleting user', (error as Error).message);
      }
    }
  };

  const handleCreateUser = () => {
    navigate('/users/create');
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge 
        variant={isActive ? 'success' : 'danger'} 
        size="sm"
      >
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getRoleBadge = (role: string | undefined) => {
    if (!role) return <Badge variant="secondary" size="sm">No Role</Badge>;
    
    const roleColors: { [key: string]: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' } = {
      'Super Admin': 'danger',
      'Dealer': 'warning',
      'Customer': 'success',
      'Manager': 'primary'
    };

    return (
      <Badge 
        variant={roleColors[role] || 'secondary'} 
        size="sm"
      >
        {role}
      </Badge>
    );
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
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
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage system users and their access</p>
          </div>
          <Button
            onClick={handleCreateUser}
            variant="primary"
            className="flex items-center gap-2"
          >
            <AddIcon className="w-4 h-4" />
            Add User
          </Button>
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
                    placeholder="Search users by name, phone, or role..."
                    value={searchInput}
                    onChange={setSearchInput}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    type="button"
                    onClick={handleClearSearch}
                    variant="outline"
                  >
                    Clear
                  </Button>
                )}
              </form>
              <Button
                onClick={loadUsers}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {/* Users Table */}
        <Card>
          <CardBody>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={handleCreateUser}
                    variant="primary"
                    className="mt-4"
                  >
                    Create First User
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Name</TableHeader>
                      <TableHeader>Phone</TableHeader>
                      <TableHeader>Role</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Created</TableHeader>
                      <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {user.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-600">
                            {user.phone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.status === 'ACTIVE')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ActionButtonGroup>
                            <ViewActionButton onClick={() => handleViewUser(user)} />
                            <EditActionButton onClick={() => handleEditUser(user)} />
                            <DeleteActionButton onClick={() => handleDeleteUser(user)} />
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

        {/* Summary */}
        {filteredUsers.length > 0 && (
          <div className="text-sm text-gray-500 text-center">
            Showing {filteredUsers.length} of {pagination.total_items} users
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.total_pages}
            onPageChange={handlePageChange}
            hasNext={pagination.has_next}
            hasPrevious={pagination.has_previous}
            totalItems={pagination.total_items}
            pageSize={pagination.page_size}
          />
        )}
      </div>
    </Container>
  );
};

export default UserIndexPage;
