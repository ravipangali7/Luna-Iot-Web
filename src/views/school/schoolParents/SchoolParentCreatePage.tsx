import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import SingleSelect from '../../../components/ui/forms/SingleSelect';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import { schoolService } from '../../../api/services/schoolService';
import { userService } from '../../../api/services/userService';
import type { SchoolBusList } from '../../../types/school';
import type { User } from '../../../types/auth';

interface SearchResult {
  user: User;
  phone: string;
  found: boolean;
}

const SchoolParentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId } = useParams<{ id: string }>();
  
  const [selectedBus, setSelectedBus] = useState<number | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [schoolBuses, setSchoolBuses] = useState<SchoolBusList[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!instituteId) return;
      
      try {
        setLoadingData(true);
        const busesRes = await schoolService.getSchoolBusesByInstitute(parseInt(instituteId));
        
        if (busesRes.success && busesRes.data) {
          setSchoolBuses(busesRes.data);
        } else {
          setError(busesRes.error || 'Failed to load school buses');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load school buses. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, [instituteId]);

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

      // Split by comma and clean up phone numbers
      const phones = phoneNumbers
        .split(',')
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
    
    if (!selectedBus) {
      setError('Please select a vehicle (school bus)');
      return;
    }

    if (selectedUsers.size === 0) {
      setError('Please select at least one user');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create parent records for each selected user
      const createPromises = Array.from(selectedUsers).map(userId => 
        schoolService.createSchoolParent({
          parent: userId,
          school_buses: [selectedBus]
        })
      );

      const results = await Promise.all(createPromises);
      const failed = results.filter(r => !r.success);
      const duplicateErrors: string[] = [];
      const otherErrors: string[] = [];
      
      failed.forEach((result, index) => {
        const errorMsg = result.error || 'Unknown error';
        if (errorMsg.includes('already associated') || errorMsg.includes('duplicate')) {
          const userId = Array.from(selectedUsers)[index];
          const user = searchResults.find(r => r.user.id === userId);
          duplicateErrors.push(user ? `${user.user.name || user.user.phone}: ${errorMsg}` : errorMsg);
        } else {
          otherErrors.push(errorMsg);
        }
      });
      
      if (failed.length === 0) {
        showSuccess(`Successfully created ${selectedUsers.size} parent record(s)`);
        navigate(`/school/${instituteId}`);
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
          showSuccess(`Created ${successCount} parent record(s), but ${failed.length} failed`);
        } else {
          showError('Failed to create parent records');
        }
      }
    } catch (err: any) {
      console.error('Error creating school parents:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create school parents. Please try again.';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const allSelected = searchResults.length > 0 && selectedUsers.size === searchResults.length;
  const someSelected = selectedUsers.size > 0 && selectedUsers.size < searchResults.length;

  if (loadingData) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Add School Parents</h1>
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* Step 1: Select Vehicle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Vehicle (School Bus) <span className="text-red-500">*</span>
              </label>
              {schoolBuses.length === 0 && !loadingData ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  No school buses found for this institute. Please add a school bus first.
                </div>
              ) : (
                <SingleSelect
                  options={(schoolBuses || []).map(bus => ({
                    id: bus.id,
                    label: `${bus.bus_vehicle_no} - ${bus.bus_name}`,
                    value: bus.id
                  }))}
                  value={selectedBus}
                  onChange={(value) => setSelectedBus(value ? Number(value) : null)}
                  placeholder="Select a school bus..."
                />
              )}
            </div>

            {/* Step 2: Search Users by Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users by Phone Numbers <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter phone numbers separated by commas (e.g., 1234567890, 9876543210)"
                    value={phoneNumbers}
                    onChange={(value) => setPhoneNumbers(value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSearch}
                    disabled={searching || !phoneNumbers.trim()}
                  >
                    {searching ? <Spinner size="sm" /> : 'Search'}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Enter multiple phone numbers separated by commas
                </p>
              </div>
            </div>

            {/* Step 3: Select Users */}
            {searchResults.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Users to Create as Parents
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

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/school/${instituteId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !selectedBus || selectedUsers.size === 0}
              >
                {loading ? <Spinner size="sm" /> : `Create ${selectedUsers.size > 0 ? `${selectedUsers.size} ` : ''}Parent(s)`}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default SchoolParentCreatePage;

