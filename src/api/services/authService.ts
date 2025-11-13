import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type { User } from '../../types/auth';

class AuthService {
  async login(phone: string, password: string) {
    try {
      const response = await apiClient.post('/api/core/auth/login', {
        phone,
        password,
      });
      
      
      // Check the actual API response success field
      if (response.data.success === true) {
        const userData = response.data.data as User;
        const token = userData.token || '';
        
        // Store both token and phone in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('phone', phone);
        
        return {
          success: true,
          user: userData,
          token: token,
        };
      } else {
        // API returned success: false
        return {
          success: false,
          error: response.data.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/api/core/auth/me');
      
      if (response.data.success === true) {
        const userData = response.data.data as User;
        
        if (userData) {
          return {
            success: true,
            user: userData,
          };
        }
      }
      
      return {
        success: false,
        error: response.data.message || 'Failed to get user info',
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async logout() {
    try {
      await apiClient.post('/api/core/auth/logout');
      // Clear both token and phone on logout
      localStorage.removeItem('token');
      localStorage.removeItem('phone');
      return { success: true };
    } catch (error) {
      // Even if logout fails, clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('phone');
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Registration methods
  async sendRegistrationOTP(phone: string) {
    try {
      const response = await apiClient.post('/api/core/auth/register/send-otp', {
        phone,
      });
      
      if (response.data.success === true) {
        return {
          success: true,
          message: response.data.message || 'OTP sent to your phone number',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to send OTP',
        };
      }
    } catch (error) {
      console.error('Send registration OTP error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async verifyOTPAndRegister(data: { name: string; phone: string; password: string; otp: string }) {
    try {
      const response = await apiClient.post('/api/core/auth/register/verify-otp', {
        name: data.name,
        phone: data.phone,
        password: data.password,
        otp: data.otp,
      });
      
      if (response.data.success === true) {
        const userData = response.data.data as User;
        const token = userData.token || '';
        
        // Store both token and phone in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('phone', data.phone);
        
        return {
          success: true,
          user: userData,
          token: token,
          message: response.data.message || 'Registration successful',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Registration failed',
        };
      }
    } catch (error) {
      console.error('Verify OTP and register error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async resendOTP(phone: string) {
    try {
      const response = await apiClient.post('/api/core/auth/register/resend-otp', {
        phone,
      });
      
      if (response.data.success === true) {
        return {
          success: true,
          message: response.data.message || 'OTP resent successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to resend OTP',
        };
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  // Forgot password methods
  async sendForgotPasswordOTP(phone: string) {
    try {
      const response = await apiClient.post('/api/core/auth/forgot-password/send-otp', {
        phone,
      });
      
      if (response.data.success === true) {
        return {
          success: true,
          message: response.data.message || 'OTP sent to your phone number',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to send OTP',
        };
      }
    } catch (error) {
      console.error('Send forgot password OTP error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async verifyForgotPasswordOTP(phone: string, otp: string) {
    try {
      const response = await apiClient.post('/api/core/auth/forgot-password/verify-otp', {
        phone,
        otp,
      });
      
      if (response.data.success === true) {
        // Extract reset token from response
        let resetToken = '';
        if (response.data.data && typeof response.data.data === 'object') {
          resetToken = response.data.data.resetToken || '';
        } else if (response.data.resetToken) {
          resetToken = response.data.resetToken;
        }
        
        return {
          success: true,
          resetToken: resetToken,
          message: response.data.message || 'OTP verified successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'OTP verification failed',
        };
      }
    } catch (error) {
      console.error('Verify forgot password OTP error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async resendForgotPasswordOTP(phone: string) {
    try {
      const response = await apiClient.post('/api/core/auth/forgot-password/send-otp', {
        phone,
      });
      
      if (response.data.success === true) {
        return {
          success: true,
          message: response.data.message || 'OTP resent successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to resend OTP',
        };
      }
    } catch (error) {
      console.error('Resend forgot password OTP error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async resetPassword(phone: string, resetToken: string, newPassword: string) {
    try {
      const response = await apiClient.post('/api/core/auth/forgot-password/reset-password', {
        phone,
        resetToken,
        newPassword,
      });
      
      if (response.data.success === true) {
        const userData = response.data.data as User;
        const token = userData.token || '';
        
        // Store both token and phone in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('phone', phone);
        
        return {
          success: true,
          user: userData,
          token: token,
          message: response.data.message || 'Password reset successfully',
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Password reset failed',
        };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }
}

export const authService = new AuthService();