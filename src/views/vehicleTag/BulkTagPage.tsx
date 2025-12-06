import React, { useState, useEffect } from 'react';
import { vehicleTagService } from '../../api/services/vehicleTagService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';
import type { VehicleTag } from '../../types/vehicleTag';
import jsPDF from 'jspdf';

const BulkTagPage: React.FC = () => {
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<VehicleTag[]>([]);

  const handleLoadTags = async () => {
    if (!fromId || !toId) {
      setError('Please enter both From ID and To ID');
      return;
    }

    const from = parseInt(fromId);
    const to = parseInt(toId);

    if (isNaN(from) || isNaN(to)) {
      setError('Please enter valid numbers');
      return;
    }

    if (from > to) {
      setError('From ID must be less than or equal to To ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await vehicleTagService.getTagsForBulkPrint(from, to);

      if (result.success && result.data) {
        setTags(result.data);
        showSuccess('Tags Loaded', `Loaded ${result.data.length} tag(s) for printing`);
      } else {
        setError(result.error || 'Failed to load tags');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Load all tags on component mount
  useEffect(() => {
    const loadAllTags = async () => {
      try {
        setInitialLoading(true);
        setError(null);

        // Fetch all tags with a large page size
        const result = await vehicleTagService.getAllTags(1, 10000);

        if (result.success && result.data) {
          setTags(result.data.tags);
        } else {
          setError(result.error || 'Failed to load tags');
        }
      } catch (error) {
        setError('An unexpected error occurred: ' + (error as Error).message);
      } finally {
        setInitialLoading(false);
      }
    };

    loadAllTags();
  }, []);

  const handlePrint = async (tagsToPrint: VehicleTag[] = tags) => {
    if (tagsToPrint.length === 0) {
      showError('No Tags', 'Please load tags first');
      return;
    }

    try {
      setLoading(true);
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150], // Tag size in mm (approximately 4x6 inches)
      });

      for (let i = 0; i < tagsToPrint.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const tag = tagsToPrint[i];
        const qrImageUrl = vehicleTagService.getQrImageUrl(tag.vtid);

        // Fetch QR code image
        try {
          const response = await fetch(qrImageUrl);
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);

          // Add image to PDF (centered)
          const imgWidth = 80;
          const imgHeight = 120;
          const x = (100 - imgWidth) / 2;
          const y = (150 - imgHeight) / 2;

          pdf.addImage(imageUrl, 'PNG', x, y, imgWidth, imgHeight);

          // Clean up
          URL.revokeObjectURL(imageUrl);
        } catch (imgError) {
          console.error(`Failed to load image for tag ${tag.vtid}:`, imgError);
          // Add text fallback
          pdf.text(`Tag: ${tag.vtid}`, 50, 75, { align: 'center' });
        }
      }

      // Save PDF
      const fileName = fromId && toId 
        ? `vehicle_tags_${fromId}_to_${toId}.pdf`
        : `vehicle_tags_all_${tagsToPrint.length}.pdf`;
      pdf.save(fileName);
      showSuccess('PDF Generated', `Vehicle tags PDF has been generated successfully (${tagsToPrint.length} tags)`);
    } catch (error) {
      showError('Print Error', 'Failed to generate PDF: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintSelected = () => {
    if (!fromId || !toId) {
      showError('Invalid Range', 'Please enter both From ID and To ID');
      return;
    }

    const from = parseInt(fromId);
    const to = parseInt(toId);

    if (isNaN(from) || isNaN(to) || from > to) {
      showError('Invalid Range', 'Please enter valid numbers where From ID <= To ID');
      return;
    }

    const selectedTags = tags.filter(tag => tag.id >= from && tag.id <= to);
    if (selectedTags.length === 0) {
      showError('No Tags Found', 'No tags found in the specified range');
      return;
    }

    handlePrint(selectedTags);
  };

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Tag Print</h1>
        <p className="text-gray-600 mt-1">View and print vehicle tags</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From ID (Optional)
              </label>
              <Input
                type="number"
                value={fromId}
                onChange={(value) => setFromId(value)}
                placeholder="Enter starting ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To ID (Optional)
              </label>
              <Input
                type="number"
                value={toId}
                onChange={(value) => setToId(value)}
                placeholder="Enter ending ID"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleLoadTags}
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Loading...' : 'Load Range'}
            </Button>
            <Button
              onClick={() => handlePrint()}
              disabled={tags.length === 0 || loading}
              variant="success"
            >
              Print All ({tags.length})
            </Button>
            {fromId && toId && (
              <Button
                onClick={handlePrintSelected}
                disabled={loading}
                variant="info"
              >
                Print Selected Range
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {initialLoading ? (
        <Card>
          <CardBody>
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          </CardBody>
        </Card>
      ) : tags.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-gray-500">
              No vehicle tags found. Generate some tags to get started.
            </div>
          </CardBody>
        </Card>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {tags.length} tag(s) ready for printing
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tags.map((tag) => {
              const qrImageUrl = vehicleTagService.getQrImageUrl(tag.vtid);
              return (
                <Card key={tag.id} className="hover:shadow-lg transition-shadow">
                  <CardBody className="p-4">
                    <div className="flex flex-col items-center">
                      {/* QR Code */}
                      <div className="mb-3 w-full flex justify-center">
                        <img
                          src={qrImageUrl}
                          alt={`QR Code for ${tag.vtid}`}
                          className="w-32 h-32 object-contain border border-gray-200 rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-32 h-32 flex items-center justify-center border border-gray-200 rounded bg-gray-100 text-xs text-gray-500 text-center p-2">QR Code<br/>Loading...</div>`;
                            }
                          }}
                        />
                      </div>
                      
                      {/* Tag Information */}
                      <div className="w-full text-center space-y-1">
                        <div className="font-semibold text-sm text-gray-900">
                          {tag.vtid}
                        </div>
                        {tag.registration_no && (
                          <div className="text-xs text-gray-600">
                            {tag.registration_no}
                          </div>
                        )}
                        {tag.vehicle_model && (
                          <div className="text-xs text-gray-500">
                            {tag.vehicle_model}
                          </div>
                        )}
                        <div className="text-xs">
                          <span className={`inline-block px-2 py-1 rounded ${
                            tag.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tag.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {tag.user_info && tag.user_info !== 'unassigned' && typeof tag.user_info === 'object' && (
                          <div className="text-xs text-gray-500 truncate">
                            {tag.user_info.name || tag.user_info.phone}
                          </div>
                        )}
                      </div>

                      {/* Print Single Button */}
                      <Button
                        onClick={() => handlePrint([tag])}
                        disabled={loading}
                        variant="outline"
                        className="mt-3 w-full text-xs"
                        size="sm"
                      >
                        Print
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </Container>
  );
};

export default BulkTagPage;

