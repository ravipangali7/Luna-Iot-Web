import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertContactService, type AlertContact } from '../../../api/services/alertSystemService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Table from '../../../components/ui/tables/Table';
import TableCell from '../../../components/ui/tables/TableCell';
import TableRow from '../../../components/ui/tables/TableRow';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';

const ContactIndexPage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading, isAdmin } = useAlertSystemAccess(Number(instituteId));

  const [contacts, setContacts] = useState<AlertContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch contacts data
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const contactsData = await alertContactService.getByInstitute(Number(instituteId));
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
    // Allow access if user has general alert-system access or is admin
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
  const handleDelete = async (contact: AlertContact) => {
    const confirmed = await confirmDelete(
      'Delete Contact',
      `Are you sure you want to delete the contact "${contact.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await alertContactService.delete(contact.id);
        await fetchContacts(); // Refresh the list
        showSuccess('Contact deleted successfully');
      } catch (err: unknown) {
        console.error('Error deleting contact:', err);
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete contact. Please try again.';
        showError(errorMessage);
      }
    }
  };

  // View removed; keep edit and delete

  // Handle edit contact
  const handleEdit = (contactId: number) => {
    navigate(`/alert-system/${instituteId}/contacts/${contactId}/edit`);
  };

  // Handle create contact
  const handleCreate = () => {
    navigate(`/alert-system/${instituteId}/contacts/create`);
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

  if (loading) {
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
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert Contacts</h1>
            <p className="text-gray-600">Manage emergency contacts for alert notifications</p>
          </div>
          <Button
            onClick={handleCreate}
            variant="primary"
            size="md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search contacts by name, phone, or institute..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total: {contacts.length}</span>
            <span>Filtered: {filteredContacts.length}</span>
          </div>
        </div>

        {/* Contacts Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <TableRow>
                  <TableCell className="font-semibold text-gray-900">Name</TableCell>
                  <TableCell className="font-semibold text-gray-900">Phone</TableCell>
                  <TableCell className="font-semibold text-gray-900">Notifications</TableCell>
                  <TableCell className="font-semibold text-gray-900">Geofences</TableCell>
                  <TableCell className="font-semibold text-gray-900">Alert Types</TableCell>
                  <TableCell className="font-semibold text-gray-900">Institute</TableCell>
                  <TableCell className="font-semibold text-gray-900">Created</TableCell>
                  <TableCell className="font-semibold text-gray-900">Actions</TableCell>
                </TableRow>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No contacts found matching your search.' : 'No contacts available. Create your first contact to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {contact.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {contact.phone}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {contact.is_sms && (
                            <Badge variant="success" size="sm">SMS</Badge>
                          )}
                          {contact.is_call && (
                            <Badge variant="warning" size="sm">Call</Badge>
                          )}
                          {!contact.is_sms && !contact.is_call && (
                            <span className="text-gray-400 text-sm">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {contact.alert_geofences_names?.length || 0} geofences
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {contact.alert_types_names?.length || 0} types
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {contact.institute_name}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDate(contact.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          
                          <Button
                            onClick={() => handleEdit(contact.id)}
                            variant="primary"
                            size="sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDelete(contact)}
                            variant="danger"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default ContactIndexPage;
