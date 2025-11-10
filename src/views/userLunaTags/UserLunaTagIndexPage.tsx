import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { lunaTagService } from '../../api/services/lunaTagService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import { useAuth } from '../../hooks/useAuth';
import { isSuperAdmin } from '../../utils/roleUtils';
import type { UserLunaTag } from '../../types/lunaTag';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
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
import { EditActionButton, DeleteActionButton } from '../../components/ui/buttons';

const UserLunaTagIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userLunaTags, setUserLunaTags] = useState<UserLunaTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  type PaginationState = {
    current_page: number;
    total_pages: number;
    total_items: number;
    page_size: number;
    has_next: boolean;
    has_previous: boolean;
    next_page: number | null;
    previous_page: number | null;
  };

  const [pagination, setPagination] = useState<PaginationState>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 25,
    has_next: false,
    has_previous: false,
    next_page: null,
    previous_page: null
  });

  const loadUserLunaTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await lunaTagService.getAllUserLunaTags(currentPage, 25);

      if (result.success && result.data) {
        setUserLunaTags(result.data.data);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load User Luna Tags');
      }
    } catch (err) {
      setError('An unexpected error occurred: ' + err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadUserLunaTags();
  }, [loadUserLunaTags]);

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await confirmDelete(`User Luna Tag: ${name}`);
    if (!confirmed) return;

    try {
      const result = await lunaTagService.deleteUserLunaTag(id);
      if (result.success) {
        showSuccess('User Luna Tag deleted successfully');
        loadUserLunaTags();
      } else {
        showError(result.error || 'Failed to delete User Luna Tag');
      }
    } catch (err) {
      showError('An unexpected error occurred');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const canDelete = user ? isSuperAdmin(user) : false;

  if (loading && userLunaTags.length === 0) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner />
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
            <h1 className="text-2xl font-bold text-gray-900">User Tags</h1>
            <p className="text-gray-600">Manage User Tags</p>
          </div>
          <Button onClick={() => navigate('/user-luna-tags/create')}>
            Create User Tag
          </Button>
        </div>

        <Card>
          <CardBody>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {userLunaTags.length === 0 && !loading ? (
            <Alert variant="info">
              No User Tags found. Create one to get started.
            </Alert>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>ID</TableHeader>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Public Key</TableHeader>
                    <TableHeader>Active</TableHeader>
                    <TableHeader>Expire Date</TableHeader>
                    <TableHeader>Created At</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userLunaTags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>{tag.id}</TableCell>
                      <TableCell>{tag.name}</TableCell>
                      <TableCell>{tag.publicKey_value || tag.publicKey}</TableCell>
                      <TableCell>
                        <Badge variant={tag.is_active ? 'success' : 'danger'}>
                          {tag.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tag.expire_date ? new Date(tag.expire_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(tag.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <EditActionButton
                            onClick={() => navigate(`/user-luna-tags/edit/${tag.id}`)}
                          />
                          {canDelete && (
                            <DeleteActionButton
                              onClick={() => handleDelete(tag.id, tag.name)}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.total_pages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={pagination.current_page}
                    totalPages={pagination.total_pages}
                    onPageChange={handlePageChange}
                    hasNext={pagination.has_next}
                    hasPrevious={pagination.has_previous}
                    totalItems={pagination.total_items}
                    pageSize={pagination.page_size}
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

export default UserLunaTagIndexPage;

