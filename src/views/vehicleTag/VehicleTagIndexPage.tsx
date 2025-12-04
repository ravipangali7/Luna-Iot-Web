import React, { useState, useEffect, useCallback } from 'react';
import { vehicleTagService } from '../../api/services/vehicleTagService';
import { showSuccess, showError, confirmDelete } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Pagination from '../../components/ui/pagination/Pagination';
import Select from '../../components/ui/forms/Select';
import VehicleTagEditModal from './VehicleTagEditModal';
import type { VehicleTag, PaginationData } from '../../types/vehicleTag';
import jsPDF from 'jspdf';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const GENERATE_COUNTS = [1, 5, 10, 20, 30, 50, 75, 100];

const VehicleTagIndexPage: React.FC = () => {
  const [tags, setTags] = useState<VehicleTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState<number>(1);
  const [editingTag, setEditingTag] = useState<VehicleTag | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    page_size: 25,
    has_next: false,
    has_previous: false,
    next_page: null,
    previous_page: null,
  });

  const loadTags = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const result = await vehicleTagService.getAllTags(page, 25);

      if (result.success && result.data) {
        setTags(result.data.tags);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to load vehicle tags');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags(1);
  }, [loadTags]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const result = await vehicleTagService.generateTags(generateCount);

      if (result.success) {
        showSuccess('Tags Generated', `Successfully generated ${generateCount} vehicle tag(s)`);
        await loadTags(1);
      } else {
        showError('Generation Failed', result.error || 'Failed to generate tags');
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePageChange = (page: number) => {
    loadTags(page);
  };

  const getUserDisplay = (tag: VehicleTag): string => {
    if (tag.user_info === 'unassigned' || !tag.user_info) {
      return 'Unassigned';
    }
    if (typeof tag.user_info === 'object') {
      return `${tag.user_info.name || 'N/A'} (${tag.user_info.phone})`;
    }
    return 'Unassigned';
  };

  const handlePrintTag = async (tag: VehicleTag) => {
    try {
      const qrImageUrl = vehicleTagService.getQrImageUrl(tag.vtid);
      
      // Fetch QR code image with credentials
      const response = await fetch(qrImageUrl, {
        credentials: 'include',
        headers: {
          'x-token': localStorage.getItem('token') || '',
          'x-phone': localStorage.getItem('phone') || '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch QR code image');
      }
      
      const blob = await response.blob();
      
      // Convert blob to base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        // Create new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          showError('Print Error', 'Please allow popups to print');
          return;
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>Print ${tag.vtid}</title>
              <style>
                @media print {
                  @page {
                    margin: 0;
                    size: auto;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                  }
                }
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: white;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  display: block;
                }
              </style>
            </head>
            <body>
              <img src="${base64data}" alt="${tag.vtid}" onload="window.print();" />
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Fallback: print after a delay if onload doesn't fire
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.print();
          }
        }, 1000);
      };
      
      reader.onerror = () => {
        showError('Print Error', 'Failed to process image for printing');
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      showError('Print Error', 'Failed to print tag: ' + (error as Error).message);
    }
  };

  const handleDownloadPDF = async (tag: VehicleTag) => {
    try {
      const qrImageUrl = vehicleTagService.getQrImageUrl(tag.vtid);
      
      // Fetch QR code image
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150], // Tag size in mm
      });

      // Add image to PDF (centered)
      const imgWidth = 80;
      const imgHeight = 120;
      const x = (100 - imgWidth) / 2;
      const y = (150 - imgHeight) / 2;

      pdf.addImage(imageUrl, 'PNG', x, y, imgWidth, imgHeight);

      // Save PDF
      pdf.save(`vehicle_tag_${tag.vtid}.pdf`);
      URL.revokeObjectURL(imageUrl);
      showSuccess('PDF Downloaded', `PDF for ${tag.vtid} has been downloaded`);
    } catch (error) {
      showError('PDF Error', 'Failed to generate PDF: ' + (error as Error).message);
    }
  };

  const handleEdit = (tag: VehicleTag) => {
    setEditingTag(tag);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (id: number, data: Partial<VehicleTag>) => {
    try {
      const result = await vehicleTagService.updateTag(id, data);
      if (result.success) {
        showSuccess('Tag Updated', 'Vehicle tag has been updated successfully');
        await loadTags(pagination.current_page);
      } else {
        showError('Update Failed', result.error || 'Failed to update vehicle tag');
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred: ' + (error as Error).message);
    }
  };

  const handleDelete = async (tag: VehicleTag) => {
    const confirmed = await confirmDelete(
      'Delete Vehicle Tag',
      `Are you sure you want to delete vehicle tag "${tag.vtid}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await vehicleTagService.deleteTag(tag.id);
        if (result.success) {
          showSuccess('Tag Deleted', `Vehicle tag ${tag.vtid} has been deleted successfully`);
          await loadTags(pagination.current_page);
        } else {
          showError('Delete Failed', result.error || 'Failed to delete vehicle tag');
        }
      } catch (error) {
        showError('Error', 'An unexpected error occurred: ' + (error as Error).message);
      }
    }
  };

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Tags</h1>
        <p className="text-gray-600 mt-1">Manage vehicle tags and generate new ones</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generate Tags
              </label>
              <Select
                value={generateCount.toString()}
                onChange={(value) => setGenerateCount(parseInt(value))}
                options={GENERATE_COUNTS.map((count) => ({
                  value: count.toString(),
                  label: count.toString(),
                }))}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              variant="primary"
              className="mt-6"
            >
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No vehicle tags found. Generate some tags to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>ID</TableHeader>
                    <TableHeader>VTID</TableHeader>
                    <TableHeader>User</TableHeader>
                    <TableHeader>Registration No</TableHeader>
                    <TableHeader>Vehicle Model</TableHeader>
                    <TableHeader>Category</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Created At</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>{tag.id}</TableCell>
                      <TableCell>
                        <span className="font-mono font-semibold">{tag.vtid}</span>
                      </TableCell>
                      <TableCell>{getUserDisplay(tag)}</TableCell>
                      <TableCell>{tag.registration_no || 'N/A'}</TableCell>
                      <TableCell>{tag.vehicle_model || 'N/A'}</TableCell>
                      <TableCell>
                        {tag.vehicle_category ? (
                          <Badge variant="info">{tag.vehicle_category}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tag.is_active ? 'success' : 'danger'}>
                          {tag.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(tag.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEdit(tag)}
                            variant="info"
                            size="sm"
                            title="Edit"
                            className="p-2"
                          >
                            <EditIcon style={{ fontSize: 18 }} />
                          </Button>
                          <Button
                            onClick={() => handleDownloadPDF(tag)}
                            variant="info"
                            size="sm"
                            title="Download PDF"
                            className="p-2"
                          >
                            <PictureAsPdfIcon style={{ fontSize: 18 }} />
                          </Button>
                          <Button
                            onClick={() => handlePrintTag(tag)}
                            variant="primary"
                            size="sm"
                            title="Print"
                            className="p-2"
                          >
                            <PrintIcon style={{ fontSize: 18 }} />
                          </Button>
                          <Button
                            onClick={() => handleDelete(tag)}
                            variant="danger"
                            size="sm"
                            title="Delete"
                            className="p-2"
                          >
                            <DeleteIcon style={{ fontSize: 18 }} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.total_pages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={pagination.current_page}
                    totalPages={pagination.total_pages}
                    onPageChange={handlePageChange}
                    hasNext={pagination.has_next}
                    hasPrevious={pagination.has_previous}
                    totalItems={pagination.total_items}
                    pageSize={pagination.page_size}
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      <VehicleTagEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTag(null);
        }}
        tag={editingTag}
        onSave={handleEditSave}
      />
    </Container>
  );
};

export default VehicleTagIndexPage;

