import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/ui/common/Modal';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import { userService } from '../../api/services/userService';
import type { VehicleTag, RegisterType, VehicleCategory } from '../../types/vehicleTag';

interface VehicleTagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: VehicleTag | null;
  onSave: (id: number, data: Partial<VehicleTag>) => Promise<void>;
}

const REGISTER_TYPE_OPTIONS = [
  { value: 'traditional_old', label: 'Traditional Old' },
  { value: 'traditional_new', label: 'Traditional New' },
  { value: 'embossed', label: 'Embossed' },
];

const VEHICLE_CATEGORY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
  { value: 'government', label: 'Government' },
  { value: 'diplomats', label: 'Diplomats' },
  { value: 'non_profit_org', label: 'Non Profit Organization' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'tourism', label: 'Tourism' },
  { value: 'ministry', label: 'Ministry' },
];

const VehicleTagEditModal: React.FC<VehicleTagEditModalProps> = ({
  isOpen,
  onClose,
  tag,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    user_id: null as number | null,
    vehicle_model: '',
    registration_no: '',
    register_type: '' as RegisterType | '',
    vehicle_category: '' as VehicleCategory | '',
    sos_number: '',
    sms_number: '',
    is_active: true,
    is_downloaded: false,
  });
  const [users, setUsers] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && tag) {
      let userId: number | null = null;
      if (tag.user?.id) {
        userId = tag.user.id;
      } else if (tag.user_info && typeof tag.user_info === 'object' && tag.user_info !== null && 'id' in tag.user_info) {
        userId = tag.user_info.id;
      }
      
      setFormData({
        user_id: userId,
        vehicle_model: tag.vehicle_model || '',
        registration_no: tag.registration_no || '',
        register_type: tag.register_type || '',
        vehicle_category: tag.vehicle_category || '',
        sos_number: tag.sos_number || '',
        sms_number: tag.sms_number || '',
        is_active: tag.is_active,
        is_downloaded: tag.is_downloaded,
      });
      
      // Set initial user search display
      if (tag.user_info && typeof tag.user_info === 'object') {
        setUserSearchQuery(`${tag.user_info.name || ''} (${tag.user_info.phone})`);
      } else {
        setUserSearchQuery('');
      }
    }
  }, [isOpen, tag]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (userSearchQuery.trim() === '') {
      setFilteredUsers(users.slice(0, 10));
    } else {
      const query = userSearchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.phone.includes(query)
      );
      setFilteredUsers(filtered.slice(0, 10));
    }
  }, [userSearchQuery, users]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const loadUsers = async () => {
    try {
      // Load users using light users endpoint for better performance
      const result = await userService.getLightUsers();
      if (result.success && result.data) {
        const userList = result.data.map((u: any) => ({
          id: u.id,
          name: u.name || '',
          phone: u.phone,
        }));
        setUsers(userList);
        setFilteredUsers(userList.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleUserSelect = (user: { id: number; name: string; phone: string }) => {
    setFormData({ ...formData, user_id: user.id });
    setUserSearchQuery(`${user.name || ''} (${user.phone})`);
    setShowUserDropdown(false);
  };

  const handleClearUser = () => {
    setFormData({ ...formData, user_id: null });
    setUserSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag) return;

    try {
      setSaving(true);
      const updateData: any = {
        vehicle_model: formData.vehicle_model || null,
        registration_no: formData.registration_no || null,
        register_type: formData.register_type || null,
        vehicle_category: formData.vehicle_category || null,
        sos_number: formData.sos_number || null,
        sms_number: formData.sms_number || null,
        is_active: formData.is_active,
        is_downloaded: formData.is_downloaded,
      };

      if (formData.user_id !== null) {
        updateData.user_id = formData.user_id;
      } else {
        updateData.user_id = null;
      }

      await onSave(tag.id, updateData);
      onClose();
    } catch (error) {
      console.error('Error saving tag:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedUser = users.find((u) => u.id === formData.user_id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Vehicle Tag" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VTID
          </label>
          <Input
            value={tag?.vtid || ''}
            readOnly
            disabled
            className="bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User Assignment
          </label>
          <div className="relative" ref={userDropdownRef}>
            <Input
              type="text"
              value={userSearchQuery}
              onChange={(value) => {
                setUserSearchQuery(value);
                setShowUserDropdown(true);
              }}
              onFocus={() => setShowUserDropdown(true)}
              placeholder="Search user by name or phone..."
            />
            {formData.user_id && (
              <button
                type="button"
                onClick={handleClearUser}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 text-xl font-bold"
                title="Clear user assignment"
              >
                ×
              </button>
            )}
            {showUserDropdown && filteredUsers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="font-medium">{user.name || 'No Name'}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedUser && (
            <p className="mt-1 text-sm text-gray-500">
              Selected: {selectedUser.name || 'No Name'} ({selectedUser.phone})
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Model
          </label>
          <Input
            type="text"
            value={formData.vehicle_model}
            onChange={(value) => setFormData({ ...formData, vehicle_model: value })}
            placeholder="Enter vehicle model"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Number
          </label>
          <Input
            type="text"
            value={formData.registration_no}
            onChange={(value) => setFormData({ ...formData, registration_no: value })}
            placeholder="Enter registration number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Register Type
          </label>
          <Select
            value={formData.register_type}
            onChange={(value) => setFormData({ ...formData, register_type: value as RegisterType })}
            options={[
              { value: '', label: 'Select register type...' },
              ...REGISTER_TYPE_OPTIONS,
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Category
          </label>
          <Select
            value={formData.vehicle_category}
            onChange={(value) => setFormData({ ...formData, vehicle_category: value as VehicleCategory })}
            options={[
              { value: '', label: 'Select vehicle category...' },
              ...VEHICLE_CATEGORY_OPTIONS,
            ]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SOS Number
          </label>
          <Input
            type="text"
            value={formData.sos_number}
            onChange={(value) => setFormData({ ...formData, sos_number: value })}
            placeholder="Enter SOS contact number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SMS Number
          </label>
          <Input
            type="text"
            value={formData.sms_number}
            onChange={(value) => setFormData({ ...formData, sms_number: value })}
            placeholder="Enter SMS contact number"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Is Active</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_downloaded}
              onChange={(e) => setFormData({ ...formData, is_downloaded: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Is Downloaded</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleTagEditModal;

