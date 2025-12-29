import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommunitySirenAccess } from '../../../hooks/useCommunitySirenAccess';
import { communitySirenMembersService } from '../../../api/services/communitySirenService';
import { userService } from '../../../api/services/userService';
import type { User } from '../../../types/auth';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';

interface SearchResult {
  user: User;
  phone: string;
  found: boolean;
}

const MemberCreatePage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading, isAdmin } = useCommunitySirenAccess(Number(instituteId));

  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessLoading) {
      return;
    }
    
    if (!hasAccess && !isAdmin) {
      setError('Access denied. You do not have permission to create members.');
    }
  }, [hasAccess, isAdmin, accessLoading]);

  const handleSearch = async () => {
    if (!phoneNumbers.trim()) {
      setError('Please enter at least one phone number');
      return;
    }

    try {
      setSearching(true);
      setError(null);
      setSearchResults([]);
      setSelectedUsers(new Set());

      // Split by comma or newline and clean up phone numbers
      const phones = phoneNumbers
        .split(/[,\n]/)
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0);

      if (phones.length === 0) {
        setError('Please enter at least one valid phone number');
        return;
      }

      // Search for users by phone numbers
      const result = await userService.searchUsersByPhones(phones);
      
      if (result.success && result.data) {
        // Create search results with phone mapping
        const results: SearchResult[] = phones.map(phone => {
          const user = result.data?.find(u => u.phone === phone);
          return {
            user: user!,
            phone,
            found: !!user
          };
        }).filter(r => r.found); // Only show found users

        setSearchResults(results);
        
        if (results.length === 0) {
          setError('No users found for the provided phone numbers');
        }
      } else {
        setError(result.error || 'Failed to search users');
      }
    } catch (err: any) {
      console.error('Error searching users:', err);
      setError('Failed to search users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUserIds = new Set(searchResults.map(r => r.user.id));
      setSelectedUsers(allUserIds);
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleToggleUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.size === 0) {
      setError('Please select at least one user');
      return;
    }

    const instituteIdNum = Number(instituteId);
    if (!instituteIdNum || isNaN(instituteIdNum)) {
      setError('Invalid institute ID');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Create member records for each selected user
      const createPromises = Array.from(selectedUsers).map(userId => 
        communitySirenMembersService.create({
          user: userId,
          institute: instituteIdNum
        }).catch((err: any) => {
          const errorMsg = err?.response?.data?.message || err?.message || 'Unknown error';
          return { success: false, error: errorMsg, userId };
        })
      );

      const results = await Promise.all(createPromises);
      const failed = results.filter((r: any) => !r || r.error);
      const duplicateErrors: string[] = [];
      const otherErrors: string[] = [];
      
      failed.forEach((result: any) => {
        const errorMsg = result.error || 'Unknown error';
        if (errorMsg.includes('already') || errorMsg.includes('duplicate') || errorMsg.includes('member')) {
          const userId = result.userId || Array.from(selectedUsers)[failed.indexOf(result)];
          const user = searchResults.find(r => r.user.id === userId);
          duplicateErrors.push(user ? `${user.user.name || user.user.phone}: ${errorMsg}` : errorMsg);
        } else {
          otherErrors.push(errorMsg);
        }
      });
      
      if (failed.length === 0) {
        showSuccess(`Successfully added ${selectedUsers.size} member(s)`);
        navigate(`/community-siren/${instituteId}`);
      } else {
        const successCount = selectedUsers.size - failed.length;
        let errorMessage = '';
        
        if (duplicateErrors.length > 0) {
          errorMessage = `Duplicate entries detected:\n${duplicateErrors.join('\n')}`;
          if (otherErrors.length > 0) {
            errorMessage += `\n\nOther errors:\n${otherErrors.join('\n')}`;
          }
        } else {
          errorMessage = otherErrors.join('\n');
        }
        
        setError(errorMessage);
        
        if (successCount > 0) {
          showSuccess(`Added ${successCount} member(s), but ${failed.length} failed`);
        } else {
          showError('Failed to add members');
        }
      }
    } catch (err: any) {
      console.error('Error creating members:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to add members. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/community-siren/${instituteId}`);
  };

  const allSelected = searchResults.length > 0 && selectedUsers.size === searchResults.length;
  const someSelected = selectedUsers.size > 0 && selectedUsers.size < searchResults.length;

  if (accessLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Community Siren Members</h1>
          <p className="text-gray-600">Search users by phone numbers and add them as members</p>
        </div>

        <Card>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert variant="danger">{error}</Alert>}
              
              {/* Search Users by Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users by Phone Numbers <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <textarea
                      placeholder="Enter phone numbers separated by commas or new lines (e.g., 1234567890, 9876543210)"
                      value={phoneNumbers}
                      onChange={(e) => setPhoneNumbers(e.target.value)}
                      className="flex-1 min-h-[100px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSearch}
                      disabled={searching || !phoneNumbers.trim()}
                    >
                      {searching ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Searching...
                        </>
                      ) : (
                        'Search'
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter multiple phone numbers separated by commas or new lines
                  </p>
                </div>
              </div>

              {/* Select Users */}
              {searchResults.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Users to Add as Members
                  </label>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="mb-3 pb-3 border-b">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = someSelected;
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Select All ({selectedUsers.size} of {searchResults.length} selected)
                        </span>
                      </label>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {searchResults.map((result) => (
                        <label
                          key={result.user.id}
                          className="flex items-center space-x-3 p-3 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(result.user.id)}
                            onChange={() => handleToggleUser(result.user.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {result.user.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Phone: {result.user.phone}
                            </div>
                            {result.user.email && (
                              <div className="text-sm text-gray-500">
                                Email: {result.user.email}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                  disabled={submitting || selectedUsers.size === 0}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    `Add ${selectedUsers.size > 0 ? `${selectedUsers.size} ` : ''}Member${selectedUsers.size !== 1 ? 's' : ''}`
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

export default MemberCreatePage;
