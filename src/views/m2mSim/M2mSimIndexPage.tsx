import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { simBalanceService } from '../../api/services/simBalanceService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import type { SimBalance, SimBalanceFilters, SimBalanceImportResult } from '../../types/simBalance';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { DeleteActionButton } from '../../components/ui/buttons';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Badge from '../../components/ui/common/Badge';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const M2mSimIndexPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [simBalances, setSimBalances] = useState<SimBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<SimBalanceImportResult | null>(null);
  const [filters, setFilters] = useState<SimBalanceFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [highlightedPhone, setHighlightedPhone] = useState<string | null>(null);

  // Check URL params for phone filter on mount
  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    if (phoneParam) {
      setFilters(prev => ({ ...prev, phone_number: phoneParam }));
      setSearchQuery(phoneParam);
      setHighlightedPhone(phoneParam);
    }
  }, []);

  useEffect(() => {
    loadSimBalances();
  }, [currentPage, filters]);

  const loadSimBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await simBalanceService.getSimBalancesWithPagination(currentPage, 10, filters);
      
      if (result.success && result.data) {
        setSimBalances(result.data.sim_balances);
        setTotalPages(result.data.pagination.pages);
        setTotalCount(result.data.pagination.total);
      } else {
        setError(result.error || 'Failed to load SIM balances');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        setUploadError('Please select a CSV or XLSX file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit');
        return;
      }
      
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);
      setImportResult(null);

      const result = await simBalanceService.uploadSimData(selectedFile);

      if (result.success && result.data) {
        setImportResult(result.data);
        if (result.data.success) {
          setUploadSuccess(
            `Import completed: ${result.data.successful} successful, ${result.data.failed} failed out of ${result.data.total_rows} total rows`
          );
          // Reload data after successful import
          await loadSimBalances();
          // Clear file input
          setSelectedFile(null);
          const fileInput = document.getElementById('file-input') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        } else {
          setUploadError(result.data.error || 'Import failed');
        }
      } else {
        setUploadError(result.error || 'Failed to upload file');
      }
    } catch (err) {
      setUploadError('An unexpected error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, phoneNumber: string) => {
    const confirmed = await confirmDelete(
      'Delete SIM Balance',
      `Are you sure you want to delete SIM balance for ${phoneNumber}? This will also delete all associated free resources.`
    );

    if (confirmed) {
      try {
        const result = await simBalanceService.deleteSimBalance(id);
        if (result.success) {
          showSuccess('SIM Balance Deleted', 'SIM balance has been successfully deleted.');
          loadSimBalances();
        } else {
          showError('Failed to Delete', result.error || 'Failed to delete SIM balance');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred');
      }
    }
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatBalance = (balance: number | string | null | undefined) => {
    if (balance === null || balance === undefined) {
      return 'Rs. 0.00';
    }
    const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
    if (isNaN(numBalance)) {
      return 'Rs. 0.00';
    }
    return `Rs. ${numBalance.toFixed(2)}`;
  };

  const getResourceTypeBadge = (type: string) => {
    const colors: Record<string, 'info' | 'success' | 'warning' | 'secondary'> = {
      DATA: 'info',
      SMS: 'success',
      VOICE: 'warning',
    };
    return <Badge variant={colors[type] || 'secondary'}>{type}</Badge>;
  };

  const filteredSimBalances = simBalances.filter(sim => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sim.phone_number.toLowerCase().includes(query) ||
      sim.device_imei?.toLowerCase().includes(query) ||
      sim.state.toLowerCase().includes(query)
    );
  });

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">M2M SIM Management</h1>
            <p className="text-gray-600">Manage SIM balances and free resources</p>
          </div>
          <Button onClick={loadSimBalances} variant="outline" icon={<RefreshIcon className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>

        {/* File Upload Section */}
        <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Upload SIM Data</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select CSV or XLSX file
                    </label>
                    <input
                      id="file-input"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <Button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploading}
                    icon={<UploadFileIcon className="w-4 h-4" />}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>

                {uploadError && (
                  <Alert variant="danger" dismissible onDismiss={() => setUploadError(null)}>
                    {uploadError}
                  </Alert>
                )}

                {uploadSuccess && (
                  <Alert variant="success" dismissible onDismiss={() => setUploadSuccess(null)}>
                    {uploadSuccess}
                  </Alert>
                )}

                {importResult && importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <Alert variant="warning">
                      <div className="space-y-2">
                        <p className="font-semibold">Import Errors ({importResult.errors.length}):</p>
                        <div className="max-h-40 overflow-y-auto text-sm">
                          {importResult.errors.slice(0, 20).map((error, index) => (
                            <div key={index} className="text-red-600">{error}</div>
                          ))}
                          {importResult.errors.length > 20 && (
                            <div className="text-gray-500">... and {importResult.errors.length - 20} more errors</div>
                          )}
                        </div>
                      </div>
                    </Alert>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </RoleBasedWidget>

        {/* Filters */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Filters</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by phone, IMEI, or state..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <Input
                placeholder="Phone Number"
                value={filters.phone_number || ''}
                onChange={(value) => setFilters({ ...filters, phone_number: value || undefined })}
              />
              <Select
                value={filters.state || ''}
                onChange={(value) => setFilters({ ...filters, state: value || undefined })}
                options={[
                  { value: '', label: 'All States' },
                  { value: 'ACTIVE', label: 'ACTIVE' },
                  { value: 'INACTIVE', label: 'INACTIVE' },
                ]}
              />
            </div>
          </CardBody>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* SIM Balances Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : filteredSimBalances.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No SIM balances found</p>
              <p className="text-sm">Upload a CSV or XLSX file to import SIM data</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader></TableHeader>
                    <TableHeader>Phone Number</TableHeader>
                    <TableHeader>Device IMEI</TableHeader>
                    <TableHeader>State</TableHeader>
                    <TableHeader>Balance</TableHeader>
                    <TableHeader>Balance Expiry</TableHeader>
                    <TableHeader>Free Resources</TableHeader>
                    <TableHeader>Last Synced</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSimBalances.map((sim) => (
                    <React.Fragment key={sim.id}>
                      <TableRow className={highlightedPhone && sim.phone_number === highlightedPhone ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRowExpansion(sim.id)}
                            icon={expandedRows.has(sim.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{sim.phone_number}</TableCell>
                        <TableCell>{sim.device_imei || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={sim.state === 'ACTIVE' ? 'success' : 'danger'}>{sim.state}</Badge>
                        </TableCell>
                        <TableCell>{formatBalance(sim.balance)}</TableCell>
                        <TableCell>{formatDate(sim.balance_expiry)}</TableCell>
                        <TableCell>
                          {sim.free_resources.length > 0 ? (
                            <Badge variant="info">{sim.free_resources.length} resources</Badge>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(sim.last_synced_at)}</TableCell>
                        <TableCell>
                          <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
                            <DeleteActionButton
                              onClick={() => handleDelete(sim.id, sim.phone_number)}
                            />
                          </RoleBasedWidget>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(sim.id) && sim.free_resources.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <div className="p-4 bg-gray-50">
                              <h4 className="font-semibold mb-2">Free Resources:</h4>
                              <div className="space-y-2">
                                {sim.free_resources.map((resource) => (
                                  <div key={resource.id} className="flex items-center gap-4 p-2 bg-white rounded border">
                                    <div className="flex-1">
                                      <div className="font-medium">{resource.name}</div>
                                      <div className="text-sm text-gray-600">
                                        Remaining: {resource.remaining} | Expiry: {formatDate(resource.expiry)}
                                      </div>
                                    </div>
                                    <div>{getResourceTypeBadge(resource.resource_type)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing page {currentPage} of {totalPages} ({totalCount} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
};

export default M2mSimIndexPage;

