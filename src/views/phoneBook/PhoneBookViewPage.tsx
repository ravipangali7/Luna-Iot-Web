import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { phoneBookService } from '../../api/services/phoneBookService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { 
  EditActionButton, 
  DeleteActionButton,
  ActionButtonGroup 
} from '../../components/ui/buttons';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import type { PhoneBook, PhoneBookNumber } from '../../types/phoneBook';

const PhoneBookViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [phoneBook, setPhoneBook] = useState<PhoneBook | null>(null);
  const [numbers, setNumbers] = useState<PhoneBookNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhoneBook = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [phoneBookResult, numbersResult] = await Promise.all([
        phoneBookService.getById(Number(id)),
        phoneBookService.getNumbers(Number(id))
      ]);
      
      if (phoneBookResult.success && phoneBookResult.data) {
        setPhoneBook(phoneBookResult.data);
      } else {
        setError(phoneBookResult.error || 'Failed to load phone book');
      }
      
      if (numbersResult.success && numbersResult.data) {
        setNumbers(numbersResult.data);
      }
    } catch (err: unknown) {
      console.error('Error loading phone book:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load phone book. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPhoneBook();
  }, [loadPhoneBook]);

  const handleEditPhoneBook = () => {
    if (id) {
      navigate(`/phone-call/phone-books/${id}/edit`);
    }
  };

  const handleDeletePhoneBook = async () => {
    if (!phoneBook || !id) return;
    
    const confirmed = await confirmDelete(
      'Delete Phone Book',
      `Are you sure you want to delete phone book "${phoneBook.name}"? This will also delete all ${numbers.length} contacts. This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const result = await phoneBookService.delete(Number(id));
        if (result.success) {
          showSuccess('Phone Book Deleted', `Phone book "${phoneBook.name}" has been successfully deleted.`);
          navigate('/phone-call/phone-books');
        } else {
          showError('Failed to Delete Phone Book', result.error || 'Failed to delete phone book');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const handleAddNumber = () => {
    if (id) {
      navigate(`/phone-call/phone-books/${id}/numbers/create`);
    }
  };

  const handleEditNumber = (numberId: number) => {
    if (id) {
      navigate(`/phone-call/phone-books/${id}/numbers/${numberId}/edit`);
    }
  };

  const handleDeleteNumber = async (number: PhoneBookNumber) => {
    if (!id) return;
    
    const confirmed = await confirmDelete(
      'Delete Contact',
      `Are you sure you want to delete contact "${number.name}" (${number.phone})? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const result = await phoneBookService.deleteNumber(Number(id), number.id);
        if (result.success) {
          showSuccess('Contact Deleted', `Contact "${number.name}" has been successfully deleted.`);
          loadPhoneBook();
        } else {
          showError('Failed to Delete Contact', result.error || 'Failed to delete contact');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const handleDownloadTemplate = async () => {
    if (!id) return;
    
    try {
      const result = await phoneBookService.downloadPhoneBookTemplate(Number(id));
      if (result.success) {
        showSuccess('Template Downloaded', 'Phone book template has been downloaded successfully.');
      } else {
        showError('Failed to Download Template', result.error || 'Failed to download template');
      }
    } catch (err) {
      showError('Error', 'An unexpected error occurred: ' + err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        showError('Invalid File Type', 'Please select a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError('File Too Large', 'File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!id || !selectedFile) return;
    
    try {
      setUploading(true);
      const result = await phoneBookService.uploadPhoneBookNumbers(Number(id), selectedFile);
      
      if (result.success && result.data) {
        const { successful, failed, total_rows } = result.data;
        showSuccess(
          'Import Completed',
          `Successfully imported ${successful} out of ${total_rows} contacts. ${failed} failed.`
        );
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        loadPhoneBook();
      } else {
        showError('Import Failed', result.error || 'Failed to import phone book numbers');
      }
    } catch (err) {
      showError('Error', 'An unexpected error occurred: ' + err);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !phoneBook) {
    return (
      <Container>
        <Alert variant="danger">{error || 'Phone book not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{phoneBook.name}</h1>
            <p className="text-gray-600">Phone book details and contacts</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddNumber} variant="primary">
              Add Contact
            </Button>
            <EditActionButton onClick={handleEditPhoneBook} />
            <DeleteActionButton onClick={handleDeletePhoneBook} />
          </div>
        </div>

        {/* Phone Book Info */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Owner</label>
                <p className="text-gray-900">{phoneBook.owner_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Owner Type</label>
                <p className="text-gray-900">
                  <Badge variant={phoneBook.owner_type === 'user' ? 'primary' : 'info'}>
                    {phoneBook.owner_type}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Contacts</label>
                <p className="text-gray-900">{numbers.length}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{formatDate(phoneBook.created_at)}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Contacts Table */}
        <Card>
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
              <div className="flex gap-2">
                <Button onClick={handleAddNumber} variant="primary" size="sm">
                  Add Contact
                </Button>
              </div>
            </div>

            {/* Excel Upload Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Bulk Import Contacts</h3>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <Button
                  onClick={handleDownloadTemplate}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileDownloadIcon className="w-4 h-4" />
                  Download Template
                </Button>
                <div className="flex-1 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    <FileUploadIcon className="w-4 h-4 inline mr-2" />
                    {selectedFile ? selectedFile.name : 'Select Excel File'}
                  </label>
                  {selectedFile && (
                    <Button
                      onClick={handleUpload}
                      variant="primary"
                      size="sm"
                      disabled={uploading}
                      className="flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Spinner size="sm" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileUploadIcon className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upload a CSV or Excel file (.csv, .xlsx, .xls) with columns: Name, Phone. Maximum file size: 10MB.
              </p>
            </div>
            
            {numbers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No contacts in this phone book. Add your first contact to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Phone</TableHeader>
                    <TableHeader>Created</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {numbers.map((number) => (
                    <TableRow key={number.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{number.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-600">{number.phone}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500 text-sm">{formatDate(number.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <ActionButtonGroup>
                          <EditActionButton onClick={() => handleEditNumber(number.id)} />
                          <DeleteActionButton onClick={() => handleDeleteNumber(number)} />
                        </ActionButtonGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default PhoneBookViewPage;
