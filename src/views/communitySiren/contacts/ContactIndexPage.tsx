import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommunitySirenAccess } from '../../../hooks/useCommunitySirenAccess';
import { communitySirenContactService, type CommunitySirenContact } from '../../../api/services/communitySirenService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Table from '../../../components/ui/tables/Table';
import TableCell from '../../../components/ui/tables/TableCell';
import TableRow from '../../../components/ui/tables/TableRow';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import Input from '../../../components/ui/forms/Input';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';

const ContactIndexPage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading, isAdmin } = useCommunitySirenAccess(Number(instituteId));

  const [contacts, setContacts] = useState<CommunitySirenContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch contacts data
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const contactsData = await communitySirenContactService.getByInstitute(Number(instituteId));
      setContacts(contactsData);
    } catch (err: unknown) {
      console.error('Error fetching contacts:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load contacts. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => {
    // Allow access if user has general community-siren access or is admin
    // Backend will validate specific institute access when fetching/deleting
    if (accessLoading) {
      return;
    }
    
    if (hasAccess || isAdmin) {
      fetchContacts();
    } else {
      setError('Access denied. You do not have permission to view contacts for this institute.');
      setLoading(false);
    }
  }, [hasAccess, isAdmin, accessLoading, fetchContacts]);

  // Handle delete contact
  const handleDelete = async (contact: CommunitySirenContact) => {
    const confirmed = await confirmDelete(
      'Delete Contact',
      `Are you sure you want to delete the contact "${contact.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await communitySirenContactService.delete(contact.id);
        await fetchContacts(); // Refresh the list
        showSuccess('Contact deleted successfully');
      } catch (err: unknown) {
        console.error('Error deleting contact:', err);
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete contact. Please try again.';
        showError(errorMessage);
      }
    }
  };

  // Handle edit contact
  const handleEdit = (contactId: number) => {
    navigate(`/community-siren/${instituteId}/contacts/${contactId}/edit`);
  };

  // Handle create contact
  const handleCreate = () => {
    navigate(`/community-siren/${instituteId}/contacts/create`);
  };

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.institute_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || accessLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger" title="Error" message={error} />
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Community Siren Contacts</h1>
            <p className="text-gray-600 mt-1">Manage contacts for this institute</p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreate}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Contact
          </Button>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e)}
            icon={
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Contacts Table */}
        {filteredContacts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No contacts match your search criteria.' : 'Get started by creating your first contact.'}
              </p>
              {!searchTerm && (
                <Button variant="primary" onClick={handleCreate}>
                  Add Contact
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <Table striped hover>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Notifications</TableHeader>
                  <TableHeader>Institute</TableHeader>
                  <TableHeader>Created At</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContacts.map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium text-gray-900">{contact.name}</TableCell>
                    <TableCell className="text-gray-600">{contact.phone}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {contact.is_sms && <Badge variant="success" size="sm">SMS</Badge>}
                        {contact.is_call && <Badge variant="info" size="sm">Call</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{contact.institute_name}</TableCell>
                    <TableCell className="text-gray-600">{formatDate(contact.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {(isAdmin || hasAccess) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(contact.id)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            }
                          >
                            Edit
                          </Button>
                        )}
                        {(isAdmin || hasAccess) && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(contact)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            }
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </Container>
  );
};

export default ContactIndexPage;
