import React, { useState } from 'react';
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
import type { SchoolSMSFormData } from '../../../types/school';

const SchoolSMSCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState({
    message: '',
    phoneNumbers: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const smsData: SchoolSMSFormData = {
        message: formData.message.trim(),
        institute: parseInt(instituteId || '0'),
        phone_numbers: phoneNumbers
      };

      const result = await schoolService.createSchoolSMS(smsData);
      
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
                Enter multiple phone numbers separated by commas. SMS will be sent to each number.
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

