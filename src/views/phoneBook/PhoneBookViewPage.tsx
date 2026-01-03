import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { phoneBookService } from '../../api/services/phoneBookService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { 
  EditActionButton, 
  DeleteActionButton,
  ActionButtonGroup 
} from '../../components/ui/buttons';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import type { PhoneBook, PhoneBookNumber } from '../../types/phoneBook';

const PhoneBookViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [phoneBook, setPhoneBook] = useState<PhoneBook | null>(null);
  const [numbers, setNumbers] = useState<PhoneBookNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPhoneBook = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [phoneBookResult, numbersResult] = await Promise.all([
        phoneBookService.getById(Number(id)),
        phoneBookService.getNumbers(Number(id))
      ]);
      
      if (phoneBookResult.success && phoneBookResult.data) {
        setPhoneBook(phoneBookResult.data);
      } else {
        setError(phoneBookResult.error || 'Failed to load phone book');
      }
      
      if (numbersResult.success && numbersResult.data) {
        setNumbers(numbersResult.data);
      }
    } catch (err: unknown) {
      console.error('Error loading phone book:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load phone book. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPhoneBook();
  }, [loadPhoneBook]);

  const handleEditPhoneBook = () => {
    if (id) {
      navigate(`/phone-call/phone-books/${id}/edit`);
    }
  };

  const handleDeletePhoneBook = async () => {
    if (!phoneBook || !id) return;
    
    const confirmed = await confirmDelete(
      'Delete Phone Book',
      `Are you sure you want to delete phone book "${phoneBook.name}"? This will also delete all ${numbers.length} contacts. This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const result = await phoneBookService.delete(Number(id));
        if (result.success) {
          showSuccess('Phone Book Deleted', `Phone book "${phoneBook.name}" has been successfully deleted.`);
          navigate('/phone-call/phone-books');
        } else {
          showError('Failed to Delete Phone Book', result.error || 'Failed to delete phone book');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const handleAddNumber = () => {
    if (id) {
      navigate(`/phone-call/phone-books/${id}/numbers/create`);
    }
  };

  const handleEditNumber = (numberId: number) => {
    if (id) {
      navigate(`/phone-call/phone-books/${id}/numbers/${numberId}/edit`);
    }
  };

  const handleDeleteNumber = async (number: PhoneBookNumber) => {
    if (!id) return;
    
    const confirmed = await confirmDelete(
      'Delete Contact',
      `Are you sure you want to delete contact "${number.name}" (${number.phone})? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const result = await phoneBookService.deleteNumber(Number(id), number.id);
        if (result.success) {
          showSuccess('Contact Deleted', `Contact "${number.name}" has been successfully deleted.`);
          loadPhoneBook();
        } else {
          showError('Failed to Delete Contact', result.error || 'Failed to delete contact');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !phoneBook) {
    return (
      <Container>
        <Alert variant="danger">{error || 'Phone book not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{phoneBook.name}</h1>
            <p className="text-gray-600">Phone book details and contacts</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddNumber} variant="primary">
              Add Contact
            </Button>
            <EditActionButton onClick={handleEditPhoneBook} />
            <DeleteActionButton onClick={handleDeletePhoneBook} />
          </div>
        </div>

        {/* Phone Book Info */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Owner</label>
                <p className="text-gray-900">{phoneBook.owner_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Owner Type</label>
                <p className="text-gray-900">
                  <Badge variant={phoneBook.owner_type === 'user' ? 'primary' : 'info'}>
                    {phoneBook.owner_type}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Contacts</label>
                <p className="text-gray-900">{numbers.length}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{formatDate(phoneBook.created_at)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Contacts Table */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
              <Button onClick={handleAddNumber} variant="primary" size="sm">
                Add Contact
              </Button>
            </div>
            
            {numbers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No contacts in this phone book. Add your first contact to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Phone</TableHeader>
                    <TableHeader>Created</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {numbers.map((number) => (
                    <TableRow key={number.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{number.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-600">{number.phone}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500 text-sm">{formatDate(number.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <ActionButtonGroup>
                          <EditActionButton onClick={() => handleEditNumber(number.id)} />
                          <DeleteActionButton onClick={() => handleDeleteNumber(number)} />
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

export default PhoneBookViewPage;
