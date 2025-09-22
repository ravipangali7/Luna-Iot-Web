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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      <Container className="w-[40%]">
        <Card shadow="md" className="overflow-hidden">
          {/* Logo Header */}
          <CardHeader className="bg-white p-8 text-center border-b border-gray-200">
            <div className="flex items-center justify-center mb-6">
              <img 
                src={logo} 
                alt="Luna IOT" 
                className="h-16 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your Luna IOT account</p>
          </CardHeader>

          {/* Login Form */}
          <CardBody className="p-8">
            {error && (
              <Alert variant="danger" className="mb-6">
                {error}
              </Alert>
            )}


            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
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

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
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

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading}
                  loading={isLoading}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
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