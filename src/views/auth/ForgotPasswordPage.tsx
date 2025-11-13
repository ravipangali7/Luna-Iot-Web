import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../api/services/authService';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Input from '../../components/ui/forms/Input';
import Button from '../../components/ui/buttons/Button';
import Alert from '../../components/ui/common/Alert';
import logo from '../../assets/logo.png';
import Swal from 'sweetalert2';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (): boolean => {
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      return false;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 && cleanPhone.length !== 12) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }

    if (!cleanPhone.startsWith('9')) {
      setPhoneError('Phone number should start with 9');
      return false;
    }

    setPhoneError('');
    return true;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePhone()) {
      return;
    }

    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const result = await authService.sendForgotPasswordOTP(cleanPhone);

      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent!',
          text: `OTP sent to ${cleanPhone}`,
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
        navigate('/verify-forgot-password-otp', { state: { phone: cleanPhone } });
      } else {
        setError(result.error || 'Failed to send OTP');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error || 'Failed to send OTP',
          toast: true,
          position: 'top-end',
          timer: 4000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred',
        toast: true,
        position: 'top-end',
        timer: 4000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Container className="w-[30%]">
        <Card shadow="md" className="overflow-hidden">
          <CardHeader className="bg-white p-6 text-center border-b border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <img src={logo} alt="Luna IOT" className="h-12 w-auto" />
            </div>
            <p className="text-sm text-gray-600">Forgot Password</p>
            <p className="text-xs text-gray-500 mt-2">
              Enter your phone number to receive a verification code
            </p>
          </CardHeader>

          <CardBody className="p-6">
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(value) => {
                    setPhone(value);
                    if (phoneError) setPhoneError('');
                  }}
                  error={phoneError}
                  required
                  size="md"
                  className="w-full"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading}
                  loading={isLoading}
                  className="w-full h-10 text-sm font-semibold"
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Remember your password?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Login
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}

