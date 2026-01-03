import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { phoneBookService } from '../../api/services/phoneBookService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import { useRefresh } from '../../contexts/RefreshContext';
import type { PhoneBook } from '../../types/phoneBook';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { 
  EditActionButton, 
  DeleteActionButton,
  ActionButtonGroup 
} from '../../components/ui/buttons';
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
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';

const PhoneBookIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshKey } = useRefresh();
  const [phoneBooks, setPhoneBooks] = useState<PhoneBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwnerType, setFilterOwnerType] = useState<string>('');

  const loadPhoneBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await phoneBookService.getAll();

      if (result.success && result.data) {
        setPhoneBooks(result.data);
      } else {
        setError(result.error || 'Failed to load phone books');
        setPhoneBooks([]);
      }
    } catch (err) {
      setError('An unexpected error occurred: ' + (err as Error).message);
      setPhoneBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhoneBooks();
  }, [refreshKey, loadPhoneBooks]);

  const handleSearch = () => {
    if (!searchInput.trim()) {
      setSearchQuery('');
      return;
    }
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleViewPhoneBook = (phoneBook: PhoneBook) => {
    navigate(`/phone-call/phone-books/${phoneBook.id}`);
  };

  const handleEditPhoneBook = (phoneBook: PhoneBook) => {
    navigate(`/phone-call/phone-books/${phoneBook.id}/edit`);
  };

  const handleDeletePhoneBook = async (phoneBook: PhoneBook) => {
    const confirmed = await confirmDelete(
      'Delete Phone Book',
      `Are you sure you want to delete phone book "${phoneBook.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const result = await phoneBookService.delete(phoneBook.id);
        if (result.success) {
          showSuccess('Phone Book Deleted', `Phone book "${phoneBook.name}" has been successfully deleted.`);
          loadPhoneBooks();
        } else {
          showError('Failed to Delete Phone Book', result.error || 'Failed to delete phone book');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const filteredPhoneBooks = phoneBooks.filter(phoneBook => {
    if (filterOwnerType && phoneBook.owner_type !== filterOwnerType) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        phoneBook.name.toLowerCase().includes(query) ||
        phoneBook.owner_name?.toLowerCase().includes(query) ||
        phoneBook.owner_type.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && phoneBooks.length === 0) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-64">
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
            <h1 className="text-2xl font-bold text-gray-900">Phone Books</h1>
            <p className="text-gray-600">Manage your phone books and contacts</p>
          </div>
          <Button onClick={() => navigate('/phone-call/phone-books/create')}>
            Create Phone Book
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-2" onKeyDown={(e) => e.key === 'Enter' && handleSearch()}>
                <Input
                  placeholder="Search phone books..."
                  value={searchInput}
                  onChange={setSearchInput}
                />
                <Button
                  onClick={handleSearch}
                  variant="primary"
                  size="sm"
                  className="px-3"
                >
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    onClick={handleClearSearch}
                    variant="secondary"
                    size="sm"
                    className="px-3"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <select
                value={filterOwnerType}
                onChange={(e) => setFilterOwnerType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Owners</option>
                <option value="user">User</option>
                <option value="institute">Institute</option>
              </select>
              <Button
                onClick={() => loadPhoneBooks()}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Phone Books Table */}
        <Card>
          <CardBody>
            {filteredPhoneBooks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchQuery || filterOwnerType ? 'No phone books found matching your filters.' : 'No phone books available. Create your first phone book to get started.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Owner</TableHeader>
                    <TableHeader>Owner Type</TableHeader>
                    <TableHeader>Numbers</TableHeader>
                    <TableHeader>Created</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPhoneBooks.map((phoneBook) => (
                    <TableRow key={phoneBook.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{phoneBook.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-600">{phoneBook.owner_name || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={phoneBook.owner_type === 'user' ? 'primary' : 'info'}>
                          {phoneBook.owner_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{phoneBook.numbers_count || 0} contacts</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500 text-sm">{formatDate(phoneBook.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <ActionButtonGroup>
                          <button
                            onClick={() => handleViewPhoneBook(phoneBook)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <VisibilityIcon className="w-4 h-4" />
                          </button>
                          <EditActionButton onClick={() => handleEditPhoneBook(phoneBook)} />
                          <DeleteActionButton onClick={() => handleDeletePhoneBook(phoneBook)} />
                        </ActionButtonGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default PhoneBookIndexPage;
