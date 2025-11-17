import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import MultiSelect from '../../../components/ui/forms/MultiSelect';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import { schoolService } from '../../../api/services/schoolService';
import type { SchoolParent, SchoolParentFormData, SchoolBusList } from '../../../types/school';

const SchoolParentEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId, parentId } = useParams<{ id: string; parentId: string }>();
  
  const [formData, setFormData] = useState<SchoolParentFormData>({
    parent: 0,
    school_buses: [],
    latitude: undefined,
    longitude: undefined,
    child_name: undefined
  });
  const [parentData, setParentData] = useState<SchoolParent | null>(null);
  const [schoolBuses, setSchoolBuses] = useState<SchoolBusList[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const parentIdNum = Number(parentId);
        const instituteIdNum = Number(instituteId);
        
        // Fetch parent data
        const parentRes = await schoolService.getSchoolParentById(parentIdNum);
        if (parentRes.success && parentRes.data) {
          setParentData(parentRes.data);
          setFormData({
            parent: parentRes.data.parent.id,
            school_buses: parentRes.data.school_buses || [],
            latitude: parentRes.data.latitude,
            longitude: parentRes.data.longitude,
            child_name: parentRes.data.child_name
          });
        } else {
          setError(parentRes.error || 'Failed to load parent data');
        }

        // Fetch school buses for this institute
        if (instituteId) {
          const busesRes = await schoolService.getSchoolBusesByInstitute(instituteIdNum);
          if (busesRes.success && busesRes.data) {
            setSchoolBuses(busesRes.data);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };
    
    if (parentId && instituteId) {
      fetchData();
    }
  }, [parentId, instituteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.school_buses || formData.school_buses.length === 0) {
      setError('Please select at least one vehicle (school bus)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await schoolService.updateSchoolParent(Number(parentId), formData);
      
      if (result.success) {
        showSuccess('School parent updated successfully');
        navigate(`/school/${instituteId}`);
      } else {
        showError(result.error || 'Failed to update school parent');
      }
    } catch (err: any) {
      console.error('Error updating school parent:', err);
      setError(err.response?.data?.message || 'Failed to update school parent. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  if (loadingData) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (!parentData) {
    return (
      <Container>
        <Alert variant="danger">
          {error || 'Parent not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit School Parent</h1>
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* Parent User Info (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent User
              </label>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="font-medium text-gray-900">
                  {parentData.parent.name || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  Phone: {parentData.parent.phone}
                </div>
                {parentData.parent.email && (
                  <div className="text-sm text-gray-600">
                    Email: {parentData.parent.email}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Parent user cannot be changed
              </p>
            </div>

            {/* Child Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Child Name
              </label>
              <Input
                type="text"
                placeholder="Enter child name"
                value={formData.child_name || ''}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  child_name: value || undefined
                }))}
              />
            </div>

            {/* School Bus Selection */}
            <div>
              <MultiSelect
                options={schoolBuses.map(bus => ({
                  id: bus.id,
                  label: `${bus.bus_vehicle_no} - ${bus.bus_name}`,
                  value: bus.id
                }))}
                value={formData.school_buses || []}
                onChange={(selectedValues) => setFormData(prev => ({
                  ...prev,
                  school_buses: selectedValues as number[]
                }))}
                placeholder="Select school buses..."
                label="Select Vehicle(s) (School Bus)"
                searchable
              />
              {schoolBuses.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">No school buses available for this institute</p>
              )}
            </div>

            {/* Location Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter latitude"
                  value={formData.latitude !== undefined ? String(formData.latitude) : ''}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    latitude: value ? parseFloat(value) : undefined
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter longitude"
                  value={formData.longitude !== undefined ? String(formData.longitude) : ''}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    longitude: value ? parseFloat(value) : undefined
                  }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/school/${instituteId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !formData.school_buses || formData.school_buses.length === 0}
              >
                {loading ? <Spinner size="sm" /> : 'Update Parent'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default SchoolParentEditPage;

