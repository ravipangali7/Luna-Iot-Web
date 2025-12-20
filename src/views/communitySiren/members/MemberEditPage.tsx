import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommunitySirenAccess } from '../../../hooks/useCommunitySirenAccess';
import { communitySirenMembersService, type CommunitySirenMembers, type CommunitySirenMembersUpdate } from '../../../api/services/communitySirenService';
import { userService } from '../../../api/services/userService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import SingleSelect from '../../../components/ui/forms/SingleSelect';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';

interface User {
  id: number;
  name: string;
  phone: string;
}

const MemberEditPage: React.FC = () => {
  const { instituteId, id } = useParams<{ instituteId: string; id: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading, isAdmin } = useCommunitySirenAccess(Number(instituteId));

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<CommunitySirenMembers | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [memberResponse, usersResponse] = await Promise.all([
        communitySirenMembersService.getById(Number(id)),
        userService.getLightUsers()
      ]);

      if (memberResponse) {
        setMember(memberResponse);
        setSelectedUser(memberResponse.user);
      } else {
        setError('Member not found');
      }

      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
      } else {
        setError(usersResponse.error || 'Failed to load users');
      }
    } catch (err: unknown) {
      console.error('Error fetching data:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load member data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (accessLoading) {
      return;
    }
    
    if (hasAccess || isAdmin) {
      fetchData();
    } else {
      setError('Access denied. You do not have permission to edit members.');
      setLoading(false);
    }
  }, [hasAccess, isAdmin, accessLoading, fetchData]);

  // Handle input changes
  const handleUserChange = (value: number | string | null) => {
    setSelectedUser(typeof value === 'number' ? value : null);
    if (validationErrors.user) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.user;
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedUser || selectedUser === 0) {
      errors.user = 'User is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const instituteIdNum = Number(instituteId);
      if (!instituteIdNum || isNaN(instituteIdNum)) {
        setError('Invalid institute ID');
        setSubmitting(false);
        return;
      }

      const payload: CommunitySirenMembersUpdate = {
        user: selectedUser!,
        institute: instituteIdNum
      };

      await communitySirenMembersService.update(Number(id), payload);
      showSuccess('Member updated successfully');
      navigate(`/community-siren/${instituteId}`);
    } catch (err: unknown) {
      console.error('Error updating member:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update member. Please try again.';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/community-siren/${instituteId}`);
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
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!member) {
    return (
      <Container>
        <Alert variant="danger">Member not found</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Community Siren Member</h1>
          <p className="text-gray-600">Update member information</p>
        </div>

        <Card>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Selection */}
              <div>
                <SingleSelect
                  options={(users || []).map(user => ({
                    id: user.id,
                    label: `${user.name || 'N/A'} - ${user.phone}`,
                    value: user.id
                  }))}
                  value={selectedUser}
                  onChange={handleUserChange}
                  placeholder="Select a user"
                  label="User *"
                  searchable
                  error={validationErrors.user}
                />
                {(users || []).length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No users available. Contact an administrator.
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Member'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default MemberEditPage;
