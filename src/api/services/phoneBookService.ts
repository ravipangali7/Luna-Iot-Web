import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';
import type {
  PhoneBook,
  PhoneBookNumber,
  PhoneBookCreate,
  PhoneBookUpdate,
  PhoneBookNumberCreate,
  PhoneBookNumberUpdate,
  BulkCreateNumbersRequest,
  BulkCreateNumbersResponse
} from '../../types/phoneBook';

class PhoneBookService {
  // Phone Books
  async getAll(): Promise<{ success: boolean; data?: PhoneBook[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/phone-call/phone-books/');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch phone books' };
      }
    } catch (error) {
      console.error('Get phone books error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getById(id: number): Promise<{ success: boolean; data?: PhoneBook; error?: string }> {
    try {
      const response = await apiClient.get(`/api/phone-call/phone-books/${id}/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch phone book' };
      }
    } catch (error) {
      console.error('Get phone book error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getByUser(userId: number): Promise<{ success: boolean; data?: PhoneBook[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/phone-call/phone-books/user/${userId}/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch phone books' };
      }
    } catch (error) {
      console.error('Get phone books by user error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getByInstitute(instituteId: number): Promise<{ success: boolean; data?: PhoneBook[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/phone-call/phone-books/institute/${instituteId}/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch phone books' };
      }
    } catch (error) {
      console.error('Get phone books by institute error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async create(data: PhoneBookCreate): Promise<{ success: boolean; data?: PhoneBook; error?: string; validationErrors?: any }> {
    try {
      const response = await apiClient.post('/api/phone-call/phone-books/create', data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to create phone book',
          validationErrors: response.data.data?.validation_errors || null
        };
      }
    } catch (error: any) {
      console.error('Create phone book error:', error);
      const errorMessage = getErrorMessage(error);
      const validationErrors = error?.response?.data?.data?.validation_errors || error?.response?.data?.data || null;
      return {
        success: false,
        error: errorMessage,
        validationErrors: validationErrors
      };
    }
  }

  async update(id: number, data: PhoneBookUpdate): Promise<{ success: boolean; data?: PhoneBook; error?: string; validationErrors?: any }> {
    try {
      const response = await apiClient.put(`/api/phone-call/phone-books/${id}/update`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to update phone book',
          validationErrors: response.data.data?.validation_errors || null
        };
      }
    } catch (error: any) {
      console.error('Update phone book error:', error);
      const errorMessage = getErrorMessage(error);
      const validationErrors = error?.response?.data?.data?.validation_errors || error?.response?.data?.data || null;
      return {
        success: false,
        error: errorMessage,
        validationErrors: validationErrors
      };
    }
  }

  async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/phone-call/phone-books/${id}/delete`);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete phone book' };
      }
    } catch (error) {
      console.error('Delete phone book error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Phone Book Numbers
  async getNumbers(phoneBookId: number): Promise<{ success: boolean; data?: PhoneBookNumber[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/phone-call/phone-books/${phoneBookId}/numbers/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch phone book numbers' };
      }
    } catch (error) {
      console.error('Get phone book numbers error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getNumberById(phoneBookId: number, numberId: number): Promise<{ success: boolean; data?: PhoneBookNumber; error?: string }> {
    try {
      const response = await apiClient.get(`/api/phone-call/phone-books/${phoneBookId}/numbers/${numberId}/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch phone book number' };
      }
    } catch (error) {
      console.error('Get phone book number error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createNumber(phoneBookId: number, data: PhoneBookNumberCreate): Promise<{ success: boolean; data?: PhoneBookNumber; error?: string; validationErrors?: any }> {
    try {
      const response = await apiClient.post(`/api/phone-call/phone-books/${phoneBookId}/numbers/create`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to create phone book number',
          validationErrors: response.data.data?.validation_errors || null
        };
      }
    } catch (error: any) {
      console.error('Create phone book number error:', error);
      const errorMessage = getErrorMessage(error);
      const validationErrors = error?.response?.data?.data?.validation_errors || error?.response?.data?.data || null;
      return {
        success: false,
        error: errorMessage,
        validationErrors: validationErrors
      };
    }
  }

  async updateNumber(phoneBookId: number, numberId: number, data: PhoneBookNumberUpdate): Promise<{ success: boolean; data?: PhoneBookNumber; error?: string; validationErrors?: any }> {
    try {
      const response = await apiClient.put(`/api/phone-call/phone-books/${phoneBookId}/numbers/${numberId}/update`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to update phone book number',
          validationErrors: response.data.data?.validation_errors || null
        };
      }
    } catch (error: any) {
      console.error('Update phone book number error:', error);
      const errorMessage = getErrorMessage(error);
      const validationErrors = error?.response?.data?.data?.validation_errors || error?.response?.data?.data || null;
      return {
        success: false,
        error: errorMessage,
        validationErrors: validationErrors
      };
    }
  }

  async deleteNumber(phoneBookId: number, numberId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/phone-call/phone-books/${phoneBookId}/numbers/${numberId}/delete`);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete phone book number' };
      }
    } catch (error) {
      console.error('Delete phone book number error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async bulkCreateNumbers(phoneBookId: number, data: BulkCreateNumbersRequest): Promise<{ success: boolean; data?: BulkCreateNumbersResponse; error?: string }> {
    try {
      const response = await apiClient.post(`/api/phone-call/phone-books/${phoneBookId}/numbers/bulk/`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to bulk create phone book numbers' };
      }
    } catch (error) {
      console.error('Bulk create phone book numbers error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async uploadPhoneBookNumbers(phoneBookId: number, file: File): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(`/api/phone-call/phone-books/${phoneBookId}/numbers/upload-excel/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000 // 2 minutes for file upload
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to upload phone book numbers' };
      }
    } catch (error) {
      console.error('Upload phone book numbers error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async downloadPhoneBookTemplate(phoneBookId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.get(`/api/phone-call/phone-books/${phoneBookId}/numbers/download-template/`, {
        responseType: 'blob',
        timeout: 30000
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'phone_book_template.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Download phone book template error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const phoneBookService = new PhoneBookService();
