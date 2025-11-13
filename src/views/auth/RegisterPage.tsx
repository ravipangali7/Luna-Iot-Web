import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../api/services/authService';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Input from '../../components/ui/forms/Input';
import Button from '../../components/ui/buttons/Button';
import Checkbox from '../../components/ui/forms/Checkbox';
import Alert from '../../components/ui/common/Alert';
import logo from '../../assets/logo.png';
import Swal from 'sweetalert2';
import { useOTPCountdown } from '../../hooks/useOTPCountdown';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/roleUtils';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { countdown, canResend, startCountdown } = useOTPCountdown(60);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isOtpSent) {
      if (!formData.name.trim()) {
        newErrors.name = 'Full name is required';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else {
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10 && cleanPhone.length !== 12) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
        } else if (!cleanPhone.startsWith('9')) {
          newErrors.phone = 'Phone number should start with 9';
        }
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!agreeToTerms) {
        newErrors.terms = 'Please agree to terms and privacy policy';
      }
    } else {
      if (!formData.otp.trim()) {
        newErrors.otp = 'OTP is required';
      } else if (formData.otp.length !== 6) {
        newErrors.otp = 'OTP must be 6 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const result = await authService.sendRegistrationOTP(cleanPhone);

      if (result.success) {
        setIsOtpSent(true);
        startCountdown();
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent!',
          text: `OTP sent to ${cleanPhone}`,
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
        });
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

  const handleVerifyOTPAndRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const result = await authService.verifyOTPAndRegister({
        name: formData.name.trim(),
        phone: cleanPhone,
        password: formData.password,
        otp: formData.otp,
      });

      if (result.success && result.user) {
        setUser(result.user);
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Your account has been created',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });

        // Navigate based on role
        let redirectPath = '/dashboard';
        if (result.user.roles && result.user.roles.length > 0) {
          const userRoleNames = result.user.roles.map((role) => role.name);
          if (userRoleNames.includes(ROLES.SUPER_ADMIN)) {
            redirectPath = '/dashboard';
          } else if (userRoleNames.includes(ROLES.DEALER) || userRoleNames.includes(ROLES.CUSTOMER)) {
            redirectPath = '/live-tracking';
          }
        }
        navigate(redirectPath, { replace: true });
      } else {
        setError(result.error || 'Registration failed');
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: result.error || 'Registration failed',
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
    if (!canResend) return;

    setIsLoading(true);
    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const result = await authService.resendOTP(cleanPhone);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const goBackToRegistration = () => {
    setIsOtpSent(false);
    setFormData((prev) => ({ ...prev, otp: '' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Container className="w-[30%]">
        <Card shadow="md" className="overflow-hidden">
          <CardHeader className="bg-white p-6 text-center border-b border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <img src={logo} alt="Luna IOT" className="h-12 w-auto" />
            </div>
            <p className="text-sm text-gray-600">
              {isOtpSent ? 'Verify OTP' : 'Create New Account'}
            </p>
          </CardHeader>

          <CardBody className="p-6">
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            {isOtpSent && (
              <div className="mb-4 text-center text-sm text-gray-600">
                OTP sent to {formData.phone.replace(/\D/g, '')}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isOtpSent) {
                  handleVerifyOTPAndRegister();
                } else {
                  handleSendOTP();
                }
              }}
              className="space-y-4"
            >
              {!isOtpSent ? (
                <>
                  <div className="space-y-1">
                    <label htmlFor="name" className="block text-xs font-semibold text-gray-700">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(value) => handleInputChange('name', value)}
                      error={errors.name}
                      required
                      size="md"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="phone" className="block text-xs font-semibold text-gray-700">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(value) => handleInputChange('phone', value)}
                      error={errors.phone}
                      required
                      size="md"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-xs font-semibold text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(value) => handleInputChange('password', value)}
                        error={errors.password}
                        required
                        size="md"
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858 3.029a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(value) => handleInputChange('confirmPassword', value)}
                        error={errors.confirmPassword}
                        required
                        size="md"
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858 3.029a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Checkbox
                      checked={agreeToTerms}
                      onChange={setAgreeToTerms}
                      error={errors.terms}
                    >
                      <span className="text-sm text-gray-700">
                        I agree to the terms and conditions and privacy policy
                      </span>
                    </Checkbox>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isLoading || !agreeToTerms}
                      loading={isLoading}
                      className="w-full h-10 text-sm font-semibold"
                    >
                      {isLoading ? 'Sending OTP...' : 'Send OTP'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label htmlFor="otp" className="block text-xs font-semibold text-gray-700">
                      OTP Code
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={formData.otp}
                      onChange={(value) => {
                        const otpValue = value.replace(/\D/g, '').slice(0, 6);
                        handleInputChange('otp', otpValue);
                      }}
                      error={errors.otp}
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
                      {isLoading ? 'Verifying...' : 'Verify & Register'}
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
                    <button
                      type="button"
                      onClick={goBackToRegistration}
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Back to Registration
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
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

