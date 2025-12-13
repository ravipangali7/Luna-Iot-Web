import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommunitySirenAccess } from '../../../hooks/useCommunitySirenAccess';
import { communitySirenMembersService, type CommunitySirenMembers } from '../../../api/services/communitySirenService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import Table from '../../../components/ui/tables/Table';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import TableRow from '../../../components/ui/tables/TableRow';
import TableCell from '../../../components/ui/tables/TableCell';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';

const MemberIndexPage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading, isAdmin } = useCommunitySirenAccess(Number(instituteId));

  const [members, setMembers] = useState<CommunitySirenMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch members data
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const membersData = await communitySirenMembersService.getAll();
      setMembers(membersData);
    } catch (err: unknown) {
      console.error('Error fetching members:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load members. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Allow access if user has general community-siren access or is admin
    if (accessLoading) {
      return;
    }
    
    if (hasAccess || isAdmin) {
      fetchMembers();
    } else {
      setError('Access denied. You do not have permission to view members.');
      setLoading(false);
    }
  }, [hasAccess, isAdmin, accessLoading, fetchMembers]);

  // Handle delete member
  const handleDelete = async (member: CommunitySirenMembers) => {
    const confirmed = await confirmDelete(
      'Delete Member',
      `Are you sure you want to remove "${member.user_name || member.user_phone}" as a member? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await communitySirenMembersService.delete(member.id);
        await fetchMembers(); // Refresh the list
        showSuccess('Member removed successfully');
      } catch (err: unknown) {
        console.error('Error deleting member:', err);
        const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to remove member. Please try again.';
        showError(errorMessage);
      }
    }
  };

  // Handle edit member
  const handleEdit = (memberId: number) => {
    navigate(`/community-siren/${instituteId}/members/${memberId}/edit`);
  };

  // Handle create member
  const handleCreate = () => {
    navigate(`/community-siren/${instituteId}/members/create`);
  };

  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    (member.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user_phone.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-gray-900">Community Siren Members</h1>
            <p className="text-gray-600 mt-1">Manage members for community siren</p>
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
            Add Member
          </Button>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e)}
            icon={
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Members Table */}
        {filteredMembers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No members match your search criteria.' : 'Get started by adding your first member.'}
              </p>
              {!searchTerm && (
                <Button variant="primary" onClick={handleCreate}>
                  Add Member
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
                  <TableHeader>Created At</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium text-gray-900">{member.user_name || 'N/A'}</TableCell>
                    <TableCell className="text-gray-600">{member.user_phone}</TableCell>
                    <TableCell className="text-gray-600">{formatDate(member.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {(isAdmin || hasAccess) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(member.id)}
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
                            onClick={() => handleDelete(member)}
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

export default MemberIndexPage;
