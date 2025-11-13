import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/roleUtils';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    const phoneFromState = location.state?.phone;
    const tokenFromState = location.state?.resetToken;

    if (phoneFromState && tokenFromState) {
      setPhone(phoneFromState);
      setResetToken(tokenFromState);
    } else {
      // If no phone/token in state, redirect back to forgot password
      navigate('/forgot-password', { replace: true });
    }
  }, [location, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.resetPassword(phone, resetToken, password);

      if (result.success && result.user) {
        setUser(result.user);
        Swal.fire({
          icon: 'success',
          title: 'Password Reset Successful!',
          text: 'Your password has been reset',
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
        setError(result.error || 'Password reset failed');
        Swal.fire({
          icon: 'error',
          title: 'Reset Failed',
          text: result.error || 'Password reset failed',
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

  if (!phone || !resetToken) {
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
            <p className="text-sm text-gray-600">Reset Password</p>
            <p className="text-xs text-gray-500 mt-2">
              Create a strong password for your account
            </p>
          </CardHeader>

          <CardBody className="p-6">
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(value) => {
                      setPassword(value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
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
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(value) => {
                      setConfirmPassword(value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
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

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading}
                  loading={isLoading}
                  className="w-full h-10 text-sm font-semibold"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}

