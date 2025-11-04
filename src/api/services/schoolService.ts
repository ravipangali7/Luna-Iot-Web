import { apiClient } from '../apiClient';
import type { 
  SchoolBus, 
  SchoolBusFormData, 
  SchoolBusList,
  SchoolParent, 
  SchoolParentFormData, 
  SchoolParentList,
  SchoolSMS, 
  SchoolSMSFormData, 
  SchoolSMSList 
} from '../../types/school';

class SchoolService {
  // ===== SCHOOL BUS METHODS =====
  
  async getSchoolBusVehicles(): Promise<{ 
    success: boolean; 
    data?: Array<{ id: number; imei: string; name: string; vehicleNo: string; vehicleType: string; is_active: boolean }>; 
    error?: string 
  }> {
    try {
      const response = await apiClient.get(`/api/school/school-bus/vehicles/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school bus vehicles' };
      }
    } catch (error) {
      console.error('Get school bus vehicles error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
  
  async getAllSchoolBuses(page: number = 1, pageSize: number = 20, search?: string, instituteId?: number): Promise<{ 
    success: boolean; 
    data?: { school_buses: SchoolBusList[]; pagination: any }; 
    error?: string 
  }> {
    try {
      let url = `/api/school/school-bus/?page=${page}&page_size=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (instituteId) url += `&institute_id=${instituteId}`;
      
      const response = await apiClient.get(url);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school buses' };
      }
    } catch (error) {
      console.error('Get school buses error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSchoolBusById(busId: number): Promise<{ success: boolean; data?: SchoolBus; error?: string }> {
    try {
      const response = await apiClient.get(`/api/school/school-bus/${busId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school bus' };
      }
    } catch (error) {
      console.error('Get school bus error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSchoolBusesByInstitute(instituteId: number): Promise<{ success: boolean; data?: SchoolBusList[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/school/school-bus/by-institute/${instituteId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school buses' };
      }
    } catch (error) {
      console.error('Get school buses by institute error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createSchoolBus(data: SchoolBusFormData): Promise<{ success: boolean; data?: SchoolBus; error?: string }> {
    try {
      const response = await apiClient.post(`/api/school/school-bus/create/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create school bus' };
      }
    } catch (error: any) {
      console.error('Create school bus error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.data || 'Network error: ' + (error as Error).message;
      return { success: false, error: errorMessage };
    }
  }

  async updateSchoolBus(busId: number, data: SchoolBusFormData): Promise<{ success: boolean; data?: SchoolBus; error?: string }> {
    try {
      const response = await apiClient.put(`/api/school/school-bus/${busId}/update/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update school bus' };
      }
    } catch (error: any) {
      console.error('Update school bus error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.data || 'Network error: ' + (error as Error).message;
      return { success: false, error: errorMessage };
    }
  }

  async deleteSchoolBus(busId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/school/school-bus/${busId}/delete/`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete school bus' };
      }
    } catch (error) {
      console.error('Delete school bus error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  // ===== SCHOOL PARENT METHODS =====
  
  async getAllSchoolParents(page: number = 1, pageSize: number = 20, search?: string, instituteId?: number, busId?: number): Promise<{ 
    success: boolean; 
    data?: { school_parents: SchoolParentList[]; pagination: any }; 
    error?: string 
  }> {
    try {
      let url = `/api/school/school-parents/?page=${page}&page_size=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (instituteId) url += `&institute_id=${instituteId}`;
      if (busId) url += `&bus_id=${busId}`;
      
      const response = await apiClient.get(url);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school parents' };
      }
    } catch (error) {
      console.error('Get school parents error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSchoolParentById(parentId: number): Promise<{ success: boolean; data?: SchoolParent; error?: string }> {
    try {
      const response = await apiClient.get(`/api/school/school-parents/${parentId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school parent' };
      }
    } catch (error) {
      console.error('Get school parent error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSchoolParentsByInstitute(instituteId: number): Promise<{ success: boolean; data?: SchoolParentList[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/school/school-parents/by-institute/${instituteId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school parents' };
      }
    } catch (error) {
      console.error('Get school parents by institute error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSchoolParentsByBus(busId: number): Promise<{ success: boolean; data?: SchoolParentList[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/school/school-parents/by-bus/${busId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school parents' };
      }
    } catch (error) {
      console.error('Get school parents by bus error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createSchoolParent(data: SchoolParentFormData): Promise<{ success: boolean; data?: SchoolParent; error?: string }> {
    try {
      const response = await apiClient.post(`/api/school/school-parents/create/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create school parent' };
      }
    } catch (error: any) {
      console.error('Create school parent error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.data || 'Network error: ' + (error as Error).message;
      return { success: false, error: errorMessage };
    }
  }

  async updateSchoolParent(parentId: number, data: SchoolParentFormData): Promise<{ success: boolean; data?: SchoolParent; error?: string }> {
    try {
      const response = await apiClient.put(`/api/school/school-parents/${parentId}/update/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update school parent' };
      }
    } catch (error: any) {
      console.error('Update school parent error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.data || 'Network error: ' + (error as Error).message;
      return { success: false, error: errorMessage };
    }
  }

  async deleteSchoolParent(parentId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/school/school-parents/${parentId}/delete/`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete school parent' };
      }
    } catch (error) {
      console.error('Delete school parent error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  // ===== SCHOOL SMS METHODS =====
  
  async getAllSchoolSMS(page: number = 1, pageSize: number = 20, search?: string, instituteId?: number): Promise<{ 
    success: boolean; 
    data?: { school_sms: SchoolSMSList[]; pagination: any }; 
    error?: string 
  }> {
    try {
      let url = `/api/school/school-sms/?page=${page}&page_size=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (instituteId) url += `&institute_id=${instituteId}`;
      
      const response = await apiClient.get(url);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school SMS' };
      }
    } catch (error) {
      console.error('Get school SMS error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSchoolSMSById(smsId: number): Promise<{ success: boolean; data?: SchoolSMS; error?: string }> {
    try {
      const response = await apiClient.get(`/api/school/school-sms/${smsId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school SMS' };
      }
    } catch (error) {
      console.error('Get school SMS error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async getSchoolSMSByInstitute(instituteId: number): Promise<{ success: boolean; data?: SchoolSMSList[]; error?: string }> {
    try {
      const response = await apiClient.get(`/api/school/school-sms/by-institute/${instituteId}/`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch school SMS' };
      }
    } catch (error) {
      console.error('Get school SMS by institute error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }

  async createSchoolSMS(data: SchoolSMSFormData): Promise<{ success: boolean; data?: SchoolSMS; error?: string }> {
    try {
      const response = await apiClient.post(`/api/school/school-sms/create/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to create school SMS' };
      }
    } catch (error: any) {
      console.error('Create school SMS error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.data || 'Network error: ' + (error as Error).message;
      return { success: false, error: errorMessage };
    }
  }

  async updateSchoolSMS(smsId: number, data: SchoolSMSFormData): Promise<{ success: boolean; data?: SchoolSMS; error?: string }> {
    try {
      const response = await apiClient.put(`/api/school/school-sms/${smsId}/update/`, data);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to update school SMS' };
      }
    } catch (error: any) {
      console.error('Update school SMS error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.data || 'Network error: ' + (error as Error).message;
      return { success: false, error: errorMessage };
    }
  }

  async deleteSchoolSMS(smsId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(`/api/school/school-sms/${smsId}/delete/`);
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to delete school SMS' };
      }
    } catch (error) {
      console.error('Delete school SMS error:', error);
      return { success: false, error: 'Network error: ' + (error as Error).message };
    }
  }
}

export const schoolService = new SchoolService();

