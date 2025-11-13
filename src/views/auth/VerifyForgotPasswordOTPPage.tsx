import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
import { useOTPCountdown } from '../../hooks/useOTPCountdown';

export default function VerifyForgotPasswordOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [phone, setPhone] = useState('');
  const { countdown, canResend, startCountdown } = useOTPCountdown(60);

  useEffect(() => {
    const phoneFromState = location.state?.phone;
    if (phoneFromState) {
      setPhone(phoneFromState);
      startCountdown();
    } else {
      // If no phone in state, redirect back to forgot password
      navigate('/forgot-password', { replace: true });
    }
  }, [location, navigate, startCountdown]);

  const validateOTP = (): boolean => {
    if (!otp.trim()) {
      setOtpError('OTP is required');
      return false;
    }

    if (otp.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return false;
    }

    setOtpError('');
    return true;
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateOTP()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.verifyForgotPasswordOTP(phone, otp);

      if (result.success && result.resetToken) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Verified!',
          text: 'You can now reset your password',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
        navigate('/reset-password', {
          state: { phone, resetToken: result.resetToken },
        });
      } else {
        setError(result.error || 'OTP verification failed');
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: result.error || 'OTP verification failed',
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

  const handleResendOTP = async () => {
    if (!canResend || !phone) return;

    setIsLoading(true);
    try {
      const result = await authService.resendForgotPasswordOTP(phone);

      if (result.success) {
        startCountdown();
        Swal.fire({
          icon: 'success',
          title: 'OTP Resent!',
          text: 'OTP has been resent to your phone',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error || 'Failed to resend OTP',
          toast: true,
          position: 'top-end',
          timer: 4000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to resend OTP',
        toast: true,
        position: 'top-end',
        timer: 4000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!phone) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Container className="w-[30%]">
        <Card shadow="md" className="overflow-hidden">
          <CardHeader className="bg-white p-6 text-center border-b border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <img src={logo} alt="Luna IOT" className="h-12 w-auto" />
            </div>
            <p className="text-sm text-gray-600">Verify OTP</p>
            <p className="text-xs text-gray-500 mt-2">
              OTP sent to {phone}
            </p>
          </CardHeader>

          <CardBody className="p-6">
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="otp" className="block text-xs font-semibold text-gray-700">
                  OTP Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(value) => {
                    const otpValue = value.replace(/\D/g, '').slice(0, 6);
                    setOtp(otpValue);
                    if (otpError) setOtpError('');
                  }}
                  error={otpError}
                  required
                  size="md"
                  className="w-full"
                  maxLength={6}
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
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>

              <div className="text-center space-y-2">
                <div className="text-sm text-gray-600">
                  Didn't receive OTP?{' '}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || isLoading}
                    className="text-green-600 hover:text-green-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {canResend ? 'Resend' : `Resend in ${countdown}s`}
                  </button>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Back to Forgot Password
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}

