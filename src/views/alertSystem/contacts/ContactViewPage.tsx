import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../../hooks/useAlertSystemAccess';
import { alertContactService, type AlertContact } from '../../../api/services/alertSystemService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';

const ContactViewPage: React.FC = () => {
  const { instituteId, id } = useParams<{ instituteId: string; id: string }>();
  const navigate = useNavigate();
  const { hasAccessToInstitute } = useAlertSystemAccess(Number(instituteId));

  const [contact, setContact] = useState<AlertContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contact data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const contactData = await alertContactService.getById(Number(id));
      setContact(contactData);
    } catch (err: unknown) {
      console.error('Error fetching contact data:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load contact data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (hasAccessToInstitute(Number(instituteId))) {
      fetchData();
    } else {
      setError('Access denied. You do not have permission to view contacts for this institute.');
      setLoading(false);
    }
  }, [hasAccessToInstitute, instituteId, fetchData]);

  // Handle delete contact
  const handleDelete = async () => {
    if (!contact) return;

    const confirmed = await confirmDelete(
      'Delete Contact',
      `Are you sure you want to delete the contact "${contact.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await alertContactService.delete(contact.id);
        showSuccess('Contact deleted successfully');
        navigate(`/alert-system/${instituteId}/contacts`);
      } catch (err: unknown) {
        console.error('Error deleting contact:', err);
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete contact. Please try again.';
        showError(errorMessage);
      }
    }
  };

  // Handle edit contact
  const handleEdit = () => {
    navigate(`/alert-system/${instituteId}/contacts/${id}/edit`);
  };

  // Handle back to contacts
  const handleBack = () => {
    navigate(`/alert-system/${instituteId}/contacts`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  if (!contact) {
    return (
      <Container>
        <Alert variant="danger">Contact not found</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
            <p className="text-gray-600">Contact Details</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleBack}
              variant="secondary"
              size="md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Contacts
            </Button>
            <Button
              onClick={handleEdit}
              variant="primary"
              size="md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Contact
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              size="md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <p className="text-gray-900">{contact.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <p className="text-gray-900">{contact.phone}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institute
                  </label>
                  <p className="text-gray-900">{contact.institute_name}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">SMS Notifications</span>
                  <Badge variant={contact.is_sms ? "success" : "secondary"} size="sm">
                    {contact.is_sms ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Phone Calls</span>
                  <Badge variant={contact.is_call ? "warning" : "secondary"} size="sm">
                    {contact.is_call ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Associated Geofences */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Associated Geofences ({contact.alert_geofences_names?.length || 0})
              </h2>
              
              {(!contact.alert_geofences_names || contact.alert_geofences_names.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.553-1.894L9 2m0 18v-16m0 16l6-2.727m0 0V4m0 13.273L21 17.382A2 2 0 0021 15.382V6.618a2 2 0 00-1.553-1.894L15 4" />
                  </svg>
                  <p className="text-sm">No geofences associated</p>
                  <p className="text-xs text-gray-400 mt-1">This contact is not monitoring any geofences</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contact.alert_geofences_names?.map((geofenceName, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">{geofenceName}</span>
                      <Badge variant="primary" size="sm">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Alert Types */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Alert Types ({contact.alert_types_names?.length || 0})
              </h2>
              
              {(!contact.alert_types_names || contact.alert_types_names.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm">No alert types associated</p>
                  <p className="text-xs text-gray-400 mt-1">This contact is not configured for any alert types</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contact.alert_types_names?.map((alertTypeName, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="text-sm text-gray-700">{alertTypeName}</span>
                      <Badge variant="info" size="sm">Configured</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Timestamps */}
          <Card className="lg:col-span-2">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created At
                  </label>
                  <p className="text-gray-900">{formatDate(contact.created_at)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Updated
                  </label>
                  <p className="text-gray-900">{formatDate(contact.updated_at)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default ContactViewPage;
