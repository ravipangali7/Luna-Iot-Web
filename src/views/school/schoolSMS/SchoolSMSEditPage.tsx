import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import TextArea from '../../../components/ui/forms/TextArea';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import { schoolService } from '../../../api/services/schoolService';
import type { SchoolSMS, SchoolSMSFormData } from '../../../types/school';

const SchoolSMSEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId, smsId } = useParams<{ id: string; smsId: string }>();
  
  const [formData, setFormData] = useState({
    message: '',
    phoneNumbers: ''
  });
  const [smsData, setSmsData] = useState<SchoolSMS | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!smsId) return;
      
      try {
        setLoadingData(true);
        setError(null);
        
        const result = await schoolService.getSchoolSMSById(Number(smsId));
        
        if (result.success && result.data) {
          setSmsData(result.data);
          // Convert phone_numbers array to comma-separated string
          const phoneNumbersStr = result.data.phone_numbers 
            ? result.data.phone_numbers.join(', ') 
            : '';
          setFormData({
            message: result.data.message || '',
            phoneNumbers: phoneNumbersStr
          });
        } else {
          setError(result.error || 'Failed to load SMS data');
        }
      } catch (err: any) {
        console.error('Error fetching SMS data:', err);
        setError(err.response?.data?.message || 'Failed to load SMS data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, [smsId]);

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

    try {
      setLoading(true);
      setError(null);

      const smsUpdateData: SchoolSMSFormData = {
        message: formData.message.trim(),
        institute: parseInt(instituteId || '0'),
        phone_numbers: phoneNumbers
      };

      const result = await schoolService.updateSchoolSMS(Number(smsId), smsUpdateData);
      
      if (result.success) {
        showSuccess('SMS updated successfully');
        navigate(`/school/${instituteId}`);
      } else {
        showError(result.error || 'Failed to update SMS');
      }
    } catch (err: any) {
      console.error('Error updating school SMS:', err);
      setError(err.response?.data?.message || 'Failed to update SMS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error && !smsData) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
        <div className="flex justify-center">
          <Button variant="primary" onClick={() => navigate(`/school/${instituteId}`)}>
            Back to School
          </Button>
        </div>
      </Container>
    );
  }

  if (!smsData) {
    return (
      <Container>
        <Alert variant="warning" className="mb-6">
          SMS not found
        </Alert>
        <div className="flex justify-center">
          <Button variant="primary" onClick={() => navigate(`/school/${instituteId}`)}>
            Back to School
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit School SMS</h1>
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
                Enter the message content
              </p>
            </div>

            {/* Phone Numbers Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Numbers <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter phone numbers separated by commas (e.g., 1234567890, 9876543210)"
                value={formData.phoneNumbers}
                onChange={(value) => setFormData(prev => ({ ...prev, phoneNumbers: value }))}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter multiple phone numbers separated by commas. Note: SMS will not be sent when updating (only on creation).
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
                {loading ? <Spinner size="sm" /> : 'Update SMS'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default SchoolSMSEditPage;

