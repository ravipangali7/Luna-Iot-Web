import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { popupService } from '../../../api/services/popupService';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';
import type { Popup } from '../../../types/popup';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import CardBody from '../../../components/ui/cards/CardBody';
import Button from '../../../components/ui/buttons/Button';
import { ViewActionButton, EditActionButton, DeleteActionButton, ActionButtonGroup } from '../../../components/ui/buttons';
import Input from '../../../components/ui/forms/Input';
import Table from '../../../components/ui/tables/Table';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import TableRow from '../../../components/ui/tables/TableRow';
import TableCell from '../../../components/ui/tables/TableCell';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const PopupIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [filteredPopups, setFilteredPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPopups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await popupService.getAllPopups();

      if (result.success && result.data) {
        setPopups(result.data);
        setFilteredPopups(result.data);
      } else {
        setError(result.error || 'Failed to load popups');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPopups();
  }, [loadPopups]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = popups.filter(popup =>
        popup.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        popup.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPopups(filtered);
    } else {
      setFilteredPopups(popups);
    }
  }, [searchQuery, popups]);

  const handleViewPopup = (popup: Popup) => {
    navigate(`/notices/popups/${popup.id}`);
  };

  const handleEditPopup = (popup: Popup) => {
    navigate(`/notices/popups/${popup.id}/edit`);
  };

  const handleDeletePopup = async (popup: Popup) => {
    const confirmed = await confirmDelete(
      'Delete Popup',
      `Are you sure you want to delete popup "${popup.title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await popupService.deletePopup(popup.id);
        
        if (result.success) {
          showSuccess('Popup deleted successfully');
          loadPopups();
        } else {
          showError('Failed to delete popup', result.error);
        }
      } catch (error) {
        showError('Error deleting popup', (error as Error).message);
      }
    }
  };

  const handleCreatePopup = () => {
    navigate('/notices/popups/create');
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Popup Management</h1>
            <p className="text-gray-600">Manage system popups</p>
          </div>
          <Button
            onClick={handleCreatePopup}
            variant="primary"
            className="flex items-center gap-2"
          >
            <AddIcon className="w-4 h-4" />
            Add Popup
          </Button>
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search popups by title or message..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={loadPopups}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>

        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        <Card>
          <CardBody>
            {filteredPopups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No popups found matching your search.' : 'No popups found.'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={handleCreatePopup}
                    variant="primary"
                    className="mt-4"
                  >
                    Create First Popup
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Title</TableHeader>
                      <TableHeader>Message</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Created</TableHeader>
                      <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPopups.map((popup) => (
                      <TableRow key={popup.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {popup.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-600 max-w-md truncate">
                            {popup.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(popup.isActive)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {popup.createdAt ? new Date(popup.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ActionButtonGroup>
                            <ViewActionButton onClick={() => handleViewPopup(popup)} />
                            <EditActionButton onClick={() => handleEditPopup(popup)} />
                            <DeleteActionButton onClick={() => handleDeletePopup(popup)} />
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
      </div>
    </Container>
  );
};

export default PopupIndexPage;

