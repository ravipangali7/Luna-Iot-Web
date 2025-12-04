import React, { useState } from 'react';
import { vehicleTagService } from '../../api/services/vehicleTagService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Alert from '../../components/ui/common/Alert';
import type { VehicleTag } from '../../types/vehicleTag';
import jsPDF from 'jspdf';

const BulkTagPage: React.FC = () => {
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [loading, setLoading] = useState(false);
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

  const handlePrint = async () => {
    if (tags.length === 0) {
      showError('No Tags', 'Please load tags first');
      return;
    }

    try {
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150], // Tag size in mm (approximately 4x6 inches)
      });

      for (let i = 0; i < tags.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const tag = tags[i];
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
      pdf.save(`vehicle_tags_${fromId}_to_${toId}.pdf`);
      showSuccess('PDF Generated', 'Vehicle tags PDF has been generated successfully');
    } catch (error) {
      showError('Print Error', 'Failed to generate PDF: ' + (error as Error).message);
    }
  };

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Tag Print</h1>
        <p className="text-gray-600 mt-1">Select a range of tags to print</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From ID
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
                To ID
              </label>
              <Input
                type="number"
                value={toId}
                onChange={(value) => setToId(value)}
                placeholder="Enter ending ID"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleLoadTags}
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Loading...' : 'Load Tags'}
            </Button>
            <Button
              onClick={handlePrint}
              disabled={tags.length === 0 || loading}
              variant="success"
            >
              Print PDF
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-600">
                Loaded {tags.length} tag(s) ready for printing
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </Container>
  );
};

export default BulkTagPage;

