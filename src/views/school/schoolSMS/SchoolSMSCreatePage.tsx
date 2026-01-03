import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import TextArea from '../../../components/ui/forms/TextArea';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import { schoolService } from '../../../api/services/schoolService';
import { phoneBookService } from '../../../api/services/phoneBookService';
import type { SchoolSMSFormData, SchoolBusList } from '../../../types/school';
import type { PhoneBook } from '../../../types/phoneBook';

const SchoolSMSCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState({
    message: '',
    phoneNumbers: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [phoneBooks, setPhoneBooks] = useState<PhoneBook[]>([]);
  const [schoolBuses, setSchoolBuses] = useState<SchoolBusList[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Selection states
  const [selectedPhoneBooks, setSelectedPhoneBooks] = useState<Set<number>>(new Set());
  const [selectedSchoolBuses, setSelectedSchoolBuses] = useState<Set<number>>(new Set());
  
  // Track phone numbers by source for removal
  const [phoneNumbersBySource, setPhoneNumbersBySource] = useState<{
    phoneBooks: { [key: number]: string[] };
    schoolBuses: { [key: number]: string[] };
  }>({
    phoneBooks: {},
    schoolBuses: {}
  });

  // Fetch phone books and school buses
  const fetchData = useCallback(async () => {
    if (!instituteId) return;
    
    try {
      setLoadingData(true);
      const [phoneBooksResult, schoolBusesResult] = await Promise.all([
        phoneBookService.getByInstitute(Number(instituteId)),
        schoolService.getSchoolBusesByInstitute(Number(instituteId))
      ]);
      
      if (phoneBooksResult.success && phoneBooksResult.data) {
        setPhoneBooks(phoneBooksResult.data);
      }
      
      if (schoolBusesResult.success && schoolBusesResult.data) {
        setSchoolBuses(schoolBusesResult.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [instituteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Track manual phone numbers (not from selections)
  const manualPhoneNumbersRef = React.useRef<string[]>([]);

  // Update phone numbers textarea from all sources
  const updatePhoneNumbersField = useCallback(() => {
    const allNumbers: string[] = [];
    
    // Collect from phone books
    Object.values(phoneNumbersBySource.phoneBooks).forEach(numbers => {
      allNumbers.push(...numbers);
    });
    
    // Collect from school buses
    Object.values(phoneNumbersBySource.schoolBuses).forEach(numbers => {
      allNumbers.push(...numbers);
    });
    
    // Get numbers from selections (for comparison)
    const selectionNumbers = new Set(allNumbers);
    
    // Preserve manually entered numbers that aren't from selections
    const manualNumbers = manualPhoneNumbersRef.current.filter(num => !selectionNumbers.has(num));
    
    // Combine: manual numbers + selection numbers (remove duplicates)
    const combinedNumbers = [...manualNumbers, ...allNumbers];
    const uniqueNumbers = Array.from(new Set(combinedNumbers));
    
    setFormData(prev => ({
      ...prev,
      phoneNumbers: uniqueNumbers.join(', ')
    }));
  }, [phoneNumbersBySource]);

  useEffect(() => {
    updatePhoneNumbersField();
  }, [updatePhoneNumbersField]);

  // Track manual edits to phone numbers
  const handlePhoneNumbersChange = (value: string) => {
    setFormData(prev => ({ ...prev, phoneNumbers: value }));
    
    // Update manual numbers ref
    const currentNumbers = value
      .split(',')
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0);
    
    // Get all selection numbers
    const allSelectionNumbers: string[] = [];
    Object.values(phoneNumbersBySource.phoneBooks).forEach(numbers => {
      allSelectionNumbers.push(...numbers);
    });
    Object.values(phoneNumbersBySource.schoolBuses).forEach(numbers => {
      allSelectionNumbers.push(...numbers);
    });
    const selectionNumbersSet = new Set(allSelectionNumbers);
    
    // Store only manual numbers (not from selections)
    manualPhoneNumbersRef.current = currentNumbers.filter(num => !selectionNumbersSet.has(num));
  };

  // Handle phone book toggle
  const handlePhoneBookToggle = async (phoneBookId: number) => {
    const isSelected = selectedPhoneBooks.has(phoneBookId);
    
    if (isSelected) {
      // Deselect: Remove phone numbers from this phone book
      setSelectedPhoneBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(phoneBookId);
        return newSet;
      });
      
      setPhoneNumbersBySource(prev => {
        const newSource = { ...prev };
        delete newSource.phoneBooks[phoneBookId];
        return newSource;
      });
    } else {
      // Select: Fetch phone book numbers and add them
      try {
        const result = await phoneBookService.getNumbers(phoneBookId);
        
        if (result.success && result.data) {
          const phoneNumbers = result.data.map(num => num.phone);
          
          setSelectedPhoneBooks(prev => new Set(prev).add(phoneBookId));
          
          setPhoneNumbersBySource(prev => ({
            ...prev,
            phoneBooks: {
              ...prev.phoneBooks,
              [phoneBookId]: phoneNumbers
            }
          }));
        }
      } catch (err) {
        console.error('Error fetching phone book numbers:', err);
        showError('Failed to load phone book numbers');
      }
    }
  };

  // Handle school bus toggle
  const handleSchoolBusToggle = async (busId: number) => {
    const isSelected = selectedSchoolBuses.has(busId);
    
    if (isSelected) {
      // Deselect: Remove phone numbers from this bus
      setSelectedSchoolBuses(prev => {
        const newSet = new Set(prev);
        newSet.delete(busId);
        return newSet;
      });
      
      setPhoneNumbersBySource(prev => {
        const newSource = { ...prev };
        delete newSource.schoolBuses[busId];
        return newSource;
      });
    } else {
      // Select: Fetch school parents for this bus and add their phone numbers
      try {
        const result = await schoolService.getSchoolParentsByBus(busId);
        
        if (result.success && result.data) {
          const phoneNumbers = result.data
            .map(parent => parent.parent_phone)
            .filter(phone => phone && phone.trim().length > 0);
          
          setSelectedSchoolBuses(prev => new Set(prev).add(busId));
          
          setPhoneNumbersBySource(prev => ({
            ...prev,
            schoolBuses: {
              ...prev.schoolBuses,
              [busId]: phoneNumbers
            }
          }));
        }
      } catch (err) {
        console.error('Error fetching school parents:', err);
        showError('Failed to load school parents');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!formData.phoneNumbers.trim()) {
      setError('Please enter at least one phone number');
      return;
    }

    // Parse phone numbers
    const phoneNumbers = formData.phoneNumbers
      .split(',')
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0);

    if (phoneNumbers.length === 0) {
      setError('Please enter at least one valid phone number');
      return;
    }

    // Validate instituteId before submitting
    if (!instituteId || isNaN(Number(instituteId)) || Number(instituteId) <= 0) {
      setError('Invalid institute ID. Please navigate from a valid school page.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const smsData: Omit<SchoolSMSFormData, 'institute'> = {
        message: formData.message.trim(),
        phone_numbers: phoneNumbers
      };

      const result = await schoolService.createSchoolSMS(Number(instituteId), smsData);
      
      if (result.success) {
        showSuccess(`SMS sent successfully to ${phoneNumbers.length} recipient(s)`);
        navigate(`/school/${instituteId}`);
      } else {
        showError(result.error || 'Failed to send SMS');
      }
    } catch (err: any) {
      console.error('Error creating school SMS:', err);
      setError(err.response?.data?.message || 'Failed to send SMS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Send School SMS</h1>
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <TextArea
                placeholder="Enter your SMS message..."
                value={formData.message}
                onChange={(value) => setFormData(prev => ({ ...prev, message: value }))}
                rows={6}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the message content to be sent to all recipients
              </p>
            </div>

            {/* Phone Book Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Phone Book
              </label>
              {loadingData ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : phoneBooks.length === 0 ? (
                <p className="text-sm text-gray-500">No phone books available for this institute.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {phoneBooks.map((phoneBook) => {
                    const isSelected = selectedPhoneBooks.has(phoneBook.id);
                    return (
                      <button
                        key={phoneBook.id}
                        type="button"
                        onClick={() => handlePhoneBookToggle(phoneBook.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {phoneBook.name}
                        {phoneBook.numbers_count && (
                          <span className="ml-2 text-xs opacity-75">
                            ({phoneBook.numbers_count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* School Bus Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                School Bus
              </label>
              {loadingData ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : schoolBuses.length === 0 ? (
                <p className="text-sm text-gray-500">No school buses available for this institute.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {schoolBuses.map((bus) => {
                    const isSelected = selectedSchoolBuses.has(bus.id);
                    return (
                      <button
                        key={bus.id}
                        type="button"
                        onClick={() => handleSchoolBusToggle(bus.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {bus.bus_name} ({bus.bus_vehicle_no})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Phone Numbers Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Numbers <span className="text-red-500">*</span>
              </label>
              <TextArea
                placeholder="Enter phone numbers separated by commas (e.g., 1234567890, 9876543210) or select from Phone Book/School Bus above"
                value={formData.phoneNumbers}
                onChange={handlePhoneNumbersChange}
                rows={6}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter multiple phone numbers separated by commas, or select Phone Books and School Buses above to auto-fill. SMS will be sent to each number.
              </p>
            </div>

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
                disabled={loading || !formData.message.trim() || !formData.phoneNumbers.trim()}
              >
                {loading ? <Spinner size="sm" /> : 'Send SMS'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default SchoolSMSCreatePage;

