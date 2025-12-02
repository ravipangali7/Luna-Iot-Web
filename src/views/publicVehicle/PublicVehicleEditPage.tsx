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
import type { PublicVehicleFormData, PublicVehicle } from '../../types/publicVehicle';
import { API_CONFIG } from '../../config/config';

const PublicVehicleEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId, vehicleId } = useParams<{ id: string; vehicleId: string }>();
  
  const [vehicle, setVehicle] = useState<PublicVehicle | null>(null);
  const [vehicles, setVehicles] = useState<Array<{ id: number; imei: string; name: string; vehicleNo: string; vehicleType: string; is_active: boolean }>>([]);
  const [formData, setFormData] = useState<PublicVehicleFormData>({
    institute: instituteId ? parseInt(instituteId) : 0,
    vehicle: 0,
    description: '',
    is_active: true,
    images: [],
    image_titles: [],
    images_to_delete: []
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: number; title: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!vehicleId) return;
      
      try {
        setLoadingData(true);
        
        // Fetch vehicles list
        const vehiclesRes = await publicVehicleService.getPublicVehicleVehicles();
        if (vehiclesRes.success && vehiclesRes.data) {
          setVehicles(vehiclesRes.data);
        }
        
        // Fetch vehicle data
        const result = await publicVehicleService.getPublicVehicleById(parseInt(vehicleId));
        
        if (result.success && result.data) {
          setVehicle(result.data);
          setFormData({
            institute: result.data.institute.id,
            vehicle: result.data.vehicle.id,
            description: result.data.description || '',
            is_active: result.data.is_active,
            images: [],
            image_titles: [],
            images_to_delete: []
          });
          
          // Set existing images with titles
          const existing = result.data.images.map(img => ({ id: img.id, title: img.title }));
          setExistingImages(existing);
          
          // Create previews for existing images
          const previews = result.data.images.map(img => {
            // Handle image URL - use as-is if it's already a full URL, otherwise construct it
            if (img.image.startsWith('http')) {
              return img.image;
            }
            // Remove BASE_URL if it's accidentally duplicated in the path
            let cleanPath = img.image;
            if (img.image.includes(API_CONFIG.BASE_URL)) {
              cleanPath = img.image.replace(API_CONFIG.BASE_URL, '');
            }
            return `${API_CONFIG.BASE_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
          });
          setImagePreviews(previews);
        } else {
          setError('Failed to load vehicle data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load vehicle data');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [vehicleId]);

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
      
      // Create previews for new images
      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);
    }
  };

  const handleExistingImageTitleChange = (index: number, title: string) => {
    const updated = [...existingImages];
    updated[index] = { ...updated[index], title };
    setExistingImages(updated);
  };

  const handleNewImageTitleChange = (index: number, title: string) => {
    const titles = [...(formData.image_titles || [])];
    titles[index] = title;
    setFormData({ ...formData, image_titles: titles });
  };

  const removeExistingImage = (imageId: number, index: number) => {
    setFormData({
      ...formData,
      images_to_delete: [...(formData.images_to_delete || []), imageId]
    });
    setExistingImages(existingImages.filter(img => img.id !== imageId));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    const newImageIndex = index - existingImages.length;
    const newImages = formData.images?.filter((_, i) => i !== newImageIndex) || [];
    const newTitles = formData.image_titles?.filter((_, i) => i !== newImageIndex) || [];
    setFormData({ ...formData, images: newImages, image_titles: newTitles });
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instituteId || !vehicleId) {
      setError('Institute ID and Vehicle ID are required');
      return;
    }

    if (!formData.vehicle) {
      setError('Please select a vehicle');
      return;
    }

    // Check if there are any images (existing or new)
    if (existingImages.length === 0 && (!formData.images || formData.images.length === 0)) {
      setError('Please keep at least one image');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare existing image titles
      const existingImageTitles: { [key: number]: string } = {};
      existingImages.forEach((img) => {
        existingImageTitles[img.id] = img.title || '';
      });

      const result = await publicVehicleService.updatePublicVehicle(parseInt(vehicleId), {
        institute: parseInt(instituteId),
        vehicle: formData.vehicle,
        description: formData.description,
        is_active: formData.is_active,
        images: formData.images,
        image_titles: formData.image_titles,
        existing_image_titles: existingImageTitles,
        images_to_delete: formData.images_to_delete
      });
      
      if (result.success) {
        showSuccess('Public vehicle updated successfully');
        navigate(`/public-vehicle/${instituteId}`);
      } else {
        showError(result.error || 'Failed to update public vehicle');
      }
    } catch (err: any) {
      console.error('Error updating public vehicle:', err);
      setError(err.response?.data?.message || 'Failed to update public vehicle. Please try again.');
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

  if (error && !vehicle) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Edit Public Vehicle</h1>
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
                Vehicle Images
              </label>
              
              {/* Existing Images */}
              {imagePreviews.length > 0 && (
                <div className="mb-4 space-y-4">
                  {imagePreviews.map((preview, index) => {
                    const isExisting = index < existingImages.length;
                    const imageData = isExisting ? existingImages[index] : null;
                    
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="relative mb-2">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => isExisting && imageData ? removeExistingImage(imageData.id, index) : removeNewImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {isExisting && imageData ? (
                          <Input
                            type="text"
                            placeholder="Image title (optional)"
                            value={imageData.title || ''}
                            onChange={(e) => handleExistingImageTitleChange(index, e.target.value)}
                            label={`Image ${index + 1} Title`}
                          />
                        ) : (
                          <Input
                            type="text"
                            placeholder="Image title (optional)"
                            value={formData.image_titles?.[index - existingImages.length] || ''}
                            onChange={(e) => handleNewImageTitleChange(index - existingImages.length, e.target.value)}
                            label={`Image ${index + 1} Title`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {formData.images && formData.images.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {formData.images.length} new image(s) selected
                </p>
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
                {loading ? <Spinner size="sm" /> : 'Update'}
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

export default PublicVehicleEditPage;

