import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Input from '../../components/ui/forms/Input';
import Button from '../../components/ui/buttons/Button';
import Alert from '../../components/ui/common/Alert';
import logo from '../../assets/logo.png';
import Swal from 'sweetalert2';
import { ROLES } from '../../utils/roleUtils';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const { login, isLoading, user } = useAuth(); // Get user from auth context
  const navigate = useNavigate();

  // Role-based redirect after login
  useEffect(() => {
    if (user) {
      // Determine redirect path based on user role
      let redirectPath = '/dashboard'; // Default for Super Admin
      
      if (user.roles && user.roles.length > 0) {
        const userRoleNames = user.roles.map(role => role.name);
        
        if (userRoleNames.includes(ROLES.SUPER_ADMIN)) {
          redirectPath = '/dashboard';
        } else if (userRoleNames.includes(ROLES.DEALER) || userRoleNames.includes(ROLES.CUSTOMER)) {
          redirectPath = '/live-tracking';
        }
      }
      
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  // reCAPTCHA callback function
  const onRecaptchaChange = (token: string | null) => {
    setRecaptchaVerified(!!token);
  };

  // Make callback available globally for reCAPTCHA and render reCAPTCHA
  useEffect(() => {
    // Set up global callback
    (window as any).onRecaptchaChange = onRecaptchaChange;
    
    // Render reCAPTCHA when component mounts
    const renderRecaptcha = () => {
      if ((window as any).grecaptcha && (window as any).grecaptcha.render) {
        const element = document.querySelector('.g-recaptcha');
        if (element && !element.hasChildNodes()) {
          (window as any).grecaptcha.render(element, {
            'sitekey': '6LeXVOErAAAAAPZnzDfq8xe_IBpvF96OuRn4HjSJ',
            'callback': onRecaptchaChange
          });
        }
      }
    };

    // Try to render immediately
    renderRecaptcha();

    // Also try after a short delay in case script is still loading
    const timer = setTimeout(renderRecaptcha, 1000);

    return () => {
      delete (window as any).onRecaptchaChange;
      clearTimeout(timer);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recaptchaVerified) {
      setError('Please complete the reCAPTCHA verification.');
      return;
    }

    try {
      
      const success = await login(phone, password);
      
      if (success) {
        
        // Show success toast
        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: 'Redirecting...',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
        // Navigation will happen automatically via useEffect when user state updates
      } else {
        setError('Login failed! Please check your credentials.');
        
        // Show error toast
        Swal.fire({
          icon: 'error',
          title: 'Login Failed!',
          text: 'Invalid phone number or password',
          toast: true,
          position: 'top-end',
          timer: 4000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      setError('Login error occurred');
      console.error('Login error:', err);
      
      // Show error toast
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'An unexpected error occurred',
        toast: true,
        position: 'top-end',
        timer: 4000,
        showConfirmButton: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Container className="w-[30%]">
        <Card shadow="md" className="overflow-hidden">
          {/* Logo Header */}
          <CardHeader className="bg-white p-6 text-center border-b border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <img 
                src={logo} 
                alt="Luna IOT" 
                className="h-12 w-auto"
              />
            </div>
            <p className="text-sm text-gray-600">Sign in to your Luna IOT account</p>
          </CardHeader>

          {/* Login Form */}
          <CardBody className="p-6">
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}


            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="phone" className="block text-xs font-semibold text-gray-700">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(value) => setPhone(value)}
                  required
                  size="md"
                  className="w-full"
                  // Add autocomplete attribute
                  {...{ 'data-autocomplete': 'tel' }}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(value) => setPassword(value)}
                  required
                  size="md"
                  className="w-full"
                  // Add autocomplete attribute
                  {...{ 'data-autocomplete': 'current-password' }}
                />
              </div>

              {/* reCAPTCHA */}
              <div className="pt-2">
                <div className="g-recaptcha"></div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading || !recaptchaVerified}
                  loading={isLoading}
                  className="w-full h-10 text-sm font-semibold"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Don't have an account?{' '}
                <button className="text-green-600 hover:text-green-700 font-medium">
                  Contact Support
                </button>
              </p>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}