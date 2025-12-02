import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Button from '../../components/ui/buttons/Button';
import Textarea from '../../components/ui/forms/Textarea';
import SingleSelect from '../../components/ui/forms/SingleSelect';
import Input from '../../components/ui/forms/Input';
import Checkbox from '../../components/ui/forms/Checkbox';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import { showSuccess, showError } from '../../utils/sweetAlert';
import { publicVehicleService } from '../../api/services/publicVehicleService';
import type { PublicVehicleFormData } from '../../types/publicVehicle';

const PublicVehicleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState<PublicVehicleFormData>({
    institute: instituteId ? parseInt(instituteId) : 0,
    vehicle: 0,
    description: '',
    is_active: true,
    images: [],
    image_titles: []
  });
  const [vehicles, setVehicles] = useState<Array<{ id: number; imei: string; name: string; vehicleNo: string; vehicleType: string; is_active: boolean }>>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiclesRes = await publicVehicleService.getPublicVehicleVehicles();
        if (vehiclesRes.success && vehiclesRes.data) {
          setVehicles(vehiclesRes.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const currentImages = formData.images || [];
      const newImages = [...currentImages, ...fileArray];
      const newTitles = formData.image_titles || [];
      // Add empty titles for new images
      const additionalTitles = Array(fileArray.length).fill('');
      
      setFormData({ 
        ...formData, 
        images: newImages,
        image_titles: [...newTitles, ...additionalTitles]
      });
      
      // Create previews
      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);
    }
  };

  const handleImageTitleChange = (index: number, title: string) => {
    const titles = [...(formData.image_titles || [])];
    titles[index] = title;
    setFormData({ ...formData, image_titles: titles });
  };

  const removeImage = (index: number) => {
    const newImages = formData.images?.filter((_, i) => i !== index) || [];
    const newTitles = formData.image_titles?.filter((_, i) => i !== index) || [];
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages, image_titles: newTitles });
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instituteId) {
      setError('Institute ID is required');
      return;
    }

    if (!formData.vehicle) {
      setError('Please select a vehicle');
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await publicVehicleService.createPublicVehicle({
        institute: parseInt(instituteId),
        vehicle: formData.vehicle,
        description: formData.description,
        is_active: formData.is_active,
        images: formData.images,
        image_titles: formData.image_titles
      });
      
      if (result.success) {
        showSuccess('Public vehicle created successfully');
        navigate(`/public-vehicle/${instituteId}`);
      } else {
        showError(result.error || 'Failed to create public vehicle');
      }
    } catch (err: any) {
      console.error('Error creating public vehicle:', err);
      setError(err.response?.data?.message || 'Failed to create public vehicle. Please try again.');
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

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Add Public Vehicle</h1>
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <Alert variant="danger">{error}</Alert>}
            
            <div>
              <SingleSelect
                options={(vehicles || []).map(vehicle => ({
                  id: vehicle.id,
                  label: `${vehicle.vehicleNo} - ${vehicle.name}`,
                  value: vehicle.id
                }))}
                value={formData.vehicle || null}
                onChange={(value) => setFormData({ ...formData, vehicle: value as number })}
                placeholder="Select a vehicle"
                label="Vehicle *"
                searchable
              />
              {(vehicles || []).length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No vehicles available. Contact an administrator.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Images *
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {formData.images && formData.images.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {formData.images.length} image(s) selected
                </p>
              )}
              
              {imagePreviews.length > 0 && (
                <div className="mt-4 space-y-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="relative mb-2">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <Input
                        type="text"
                        placeholder="Image title (optional)"
                        value={formData.image_titles?.[index] || ''}
                        onChange={(e) => handleImageTitleChange(index, e.target.value)}
                        label={`Image ${index + 1} Title`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Textarea
                label="Description"
                value={formData.description || ''}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter vehicle description..."
                rows={4}
              />
            </div>

            <div>
              <Checkbox
                label="Active"
                checked={formData.is_active}
                onChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Create'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(`/public-vehicle/${instituteId}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default PublicVehicleCreatePage;

