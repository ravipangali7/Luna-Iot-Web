import { apiClient } from '../apiClient';
import { getErrorMessage } from '../../utils/errorHandler';

class PhoneCallService {
  // Voice Models
  async getVoiceModels(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/phone-call/voice-models/');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch voice models' };
      }
    } catch (error) {
      console.error('Get voice models error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Phone Numbers
  async getActivePhoneNumbers(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await apiClient.get('/api/phone-call/phone-numbers/active/');
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch phone numbers' };
      }
    } catch (error) {
      console.error('Get active phone numbers error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Campaigns
  async getCampaigns(page?: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = page ? `/api/phone-call/campaign?page=${page}` : '/api/phone-call/campaign';
      const response = await apiClient.get(url);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch campaigns' };
      }
    } catch (error) {
      console.error('Get campaigns error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getCampaign(campaignId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.get(`/api/phone-call/campaign/${campaignId}/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch campaign' };
      }
    } catch (error) {
      console.error('Get campaign error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async createCampaign(data: any): Promise<{ success: boolean; data?: any; error?: string; validationErrors?: any }> {
    try {
      const response = await apiClient.post('/api/phone-call/campaign/create', data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Failed to create campaign',
          validationErrors: response.data.data?.validation_errors || null
        };
      }
    } catch (error: any) {
      console.error('Create campaign error:', error);
      const errorMessage = getErrorMessage(error);
      const validationErrors = error?.response?.data?.data?.validation_errors || null;
      return { 
        success: false, 
        error: errorMessage,
        validationErrors: validationErrors
      };
    }
  }

  async updateCampaign(campaignId: number, data: any): Promise<{ success: boolean; data?: any; error?: string; validationErrors?: any }> {
    try {
      const response = await apiClient.post(`/api/phone-call/campaign/${campaignId}/update`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { 
          success: false, 
          error: response.data.message || 'Failed to update campaign',
          validationErrors: response.data.data?.validation_errors || null
        };
      }
    } catch (error: any) {
      console.error('Update campaign error:', error);
      const errorMessage = getErrorMessage(error);
      const validationErrors = error?.response?.data?.data?.validation_errors || null;
      return { 
        success: false, 
        error: errorMessage,
        validationErrors: validationErrors
      };
    }
  }

  async addVoiceAssistance(campaignId: number, voiceId: number, category: string = 'Text', message?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const requestData: any = {
        voice: voiceId,
        category: category
      };
      if (message) {
        requestData.message = message;
      }
      const response = await apiClient.post(`/api/phone-call/campaign/${campaignId}/voice-assistance/`, requestData);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to add voice assistance' };
      }
    } catch (error) {
      console.error('Add voice assistance error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteCampaign(campaignId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/phone-call/campaign/${campaignId}/delete`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete campaign' };
      }
    } catch (error) {
      console.error('Delete campaign error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getCampaignDetails(campaignId: number, page?: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = page 
        ? `/api/phone-call/campaign/${campaignId}/details/?page=${page}` 
        : `/api/phone-call/campaign/${campaignId}/details/`;
      const response = await apiClient.get(url);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch campaign details' };
      }
    } catch (error) {
      console.error('Get campaign details error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async runCampaign(campaignId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/api/phone-call/campaign/${campaignId}/run/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to run campaign' };
      }
    } catch (error) {
      console.error('Run campaign error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async instantLaunchCampaign(campaignId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/api/phone-call/campaign/${campaignId}/instant-launch/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to launch campaign' };
      }
    } catch (error) {
      console.error('Instant launch campaign error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async downloadReport(campaignId: number): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const response = await apiClient.get(`/api/phone-call/campaign/${campaignId}/report/`, {
        responseType: 'blob',
        timeout: 60000 // 60 seconds for file download
      });
      
      // Check if response is successful (status 200)
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: 'Failed to download report' };
      }
    } catch (error) {
      console.error('Download report error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Contacts
  async addContact(campaignId: number, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/api/phone-call/campaign/${campaignId}/contacts/`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to add contact' };
      }
    } catch (error) {
      console.error('Add contact error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async addBulkContacts(campaignId: number, file: File): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post(`/api/phone-call/campaign/${campaignId}/contacts/bulk/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000 // 2 minutes for file upload
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to add bulk contacts' };
      }
    } catch (error) {
      console.error('Add bulk contacts error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async deleteContact(contactId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/phone-call/contacts/${contactId}/delete/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete contact' };
      }
    } catch (error) {
      console.error('Delete contact error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async getContactInfo(contactId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.get(`/api/phone-call/contacts/${contactId}/`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch contact info' };
      }
    } catch (error) {
      console.error('Get contact info error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateContactAttributes(contactId: number, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.patch(`/api/phone-call/contacts/${contactId}/attributes/`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update contact attributes' };
      }
    } catch (error) {
      console.error('Update contact attributes error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async updateContact(contactId: number, data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/api/phone-call/contacts/${contactId}/update`, data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update contact' };
      }
    } catch (error) {
      console.error('Update contact error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  // Testing
  async testVoice(campaignId: number, voiceInput: number, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post(`/api/phone-call/campaign/${campaignId}/test-voice/`, {
        voice_input: voiceInput,
        message: message
      });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to test voice' };
      }
    } catch (error) {
      console.error('Test voice error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  async demoCall(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await apiClient.post('/api/phone-call/demo-call/', data);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to initiate demo call' };
      }
    } catch (error) {
      console.error('Demo call error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

export const phoneCallService = new PhoneCallService();
export default phoneCallService;

