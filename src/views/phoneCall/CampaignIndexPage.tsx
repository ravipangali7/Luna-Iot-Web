import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { phoneCallService } from '../../api/services/phoneCallService';
import { confirmDelete, confirmAction, showSuccess, showError } from '../../utils/sweetAlert';
import { useRefresh } from '../../contexts/RefreshContext';
import type { Campaign, CampaignFilters } from '../../types/phoneCall';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { 
  EditActionButton, 
  DeleteActionButton,
  ActionButtonGroup 
} from '../../components/ui/buttons';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
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
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';

const CampaignIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshKey } = useRefresh();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_previous: false
  });

  const loadCampaigns = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await phoneCallService.getCampaigns(page);

      if (result.success && result.data) {
        // Handle paginated response
        if (result.data.results) {
          setCampaigns(result.data.results);
          setPagination({
            current_page: page,
            total_pages: Math.ceil(result.data.count / 25) || 1,
            total_items: result.data.count || 0,
            has_next: !!result.data.next,
            has_previous: !!result.data.previous
          });
        } else if (Array.isArray(result.data)) {
          // Handle array response
          setCampaigns(result.data);
          setPagination({
            current_page: 1,
            total_pages: 1,
            total_items: result.data.length,
            has_next: false,
            has_previous: false
          });
        }
      } else {
        setError(result.error || 'Failed to load campaigns');
        setCampaigns([]);
      }
    } catch (err) {
      setError('An unexpected error occurred: ' + (err as Error).message);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    setCurrentPage(page);
    loadCampaigns(page);
  }, [refreshKey, loadCampaigns, searchParams]);

  const handleSearch = () => {
    if (!searchInput.trim()) {
      setSearchQuery('');
      return;
    }
    setSearchQuery(searchInput.trim());
    // Filter campaigns locally
    const filtered = campaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(searchInput.toLowerCase()) ||
      campaign.message.toLowerCase().includes(searchInput.toLowerCase())
    );
    setCampaigns(filtered);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    loadCampaigns(currentPage);
  };

  const handleViewCampaign = (campaign: Campaign) => {
    navigate(`/phone-call/campaigns/${campaign.id}`);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    navigate(`/phone-call/campaigns/${campaign.id}/edit`);
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    const confirmed = await confirmDelete(
      'Delete Campaign',
      `Are you sure you want to delete campaign "${campaign.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const result = await phoneCallService.deleteCampaign(campaign.id);
        if (result.success) {
          showSuccess('Campaign Deleted', `Campaign "${campaign.name}" has been successfully deleted.`);
          loadCampaigns(currentPage);
        } else {
          showError('Failed to Delete Campaign', result.error || 'Failed to delete campaign');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const handleRunCampaign = async (campaign: Campaign) => {
    const confirmed = await confirmAction(
      'Run Campaign',
      `Are you sure you want to run campaign "${campaign.name}" immediately?`
    );
    
    if (confirmed) {
      try {
        const result = await phoneCallService.runCampaign(campaign.id);
        if (result.success) {
          showSuccess('Campaign Started', `Campaign "${campaign.name}" execution has been started.`);
          loadCampaigns(currentPage);
        } else {
          showError('Failed to Run Campaign', result.error || 'Failed to run campaign');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const handleDownloadReport = async (campaign: Campaign) => {
    try {
      const result = await phoneCallService.downloadReport(campaign.id);
      if (result.success && result.data) {
        // Create download link
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `campaign_${campaign.id}_report.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        showSuccess('Report Downloaded', 'Campaign report has been downloaded successfully.');
      } else {
        showError('Failed to Download Report', result.error || 'Failed to download report');
      }
    } catch (err) {
      showError('Error', 'An unexpected error occurred: ' + err);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'not started':
        return 'secondary';
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'paused':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getServiceBadgeVariant = (service: string) => {
    switch (service) {
      case 'PHONE':
        return 'primary';
      case 'SMS':
        return 'info';
      case 'SMS & PHONE':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filters.status && campaign.status !== filters.status) return false;
    if (filters.serviceType && campaign.services !== filters.serviceType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        campaign.name.toLowerCase().includes(query) ||
        campaign.message.toLowerCase().includes(query) ||
        (campaign.description || '').toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadCampaigns(page);
  };

  if (loading && campaigns.length === 0) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600">Manage your phone call campaigns</p>
          </div>
          <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
            <Button onClick={() => navigate('/phone-call/campaigns/create')}>
              Create Campaign
            </Button>
          </RoleBasedWidget>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex gap-2" onKeyDown={(e) => e.key === 'Enter' && handleSearch()}>
                <Input
                  placeholder="Search campaigns..."
                  value={searchInput}
                  onChange={setSearchInput}
                />
                <Button
                  onClick={handleSearch}
                  variant="primary"
                  size="sm"
                  className="px-3"
                >
                  Search
                </Button>
                {searchQuery && (
                  <Button
                    onClick={handleClearSearch}
                    variant="secondary"
                    size="sm"
                    className="px-3"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Select
                value={filters.status || ''}
                onChange={(value) => setFilters({ ...filters, status: value || undefined })}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'Not Started', label: 'Not Started' },
                  { value: 'Running', label: 'Running' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Paused', label: 'Paused' },
                  { value: 'Failed', label: 'Failed' }
                ]}
              />
              <Select
                value={filters.serviceType || ''}
                onChange={(value) => setFilters({ ...filters, serviceType: value || undefined })}
                options={[
                  { value: '', label: 'All Services' },
                  { value: 'PHONE', label: 'PHONE' },
                  { value: 'SMS', label: 'SMS' },
                  { value: 'SMS & PHONE', label: 'SMS & PHONE' }
                ]}
              />
              <Button
                onClick={() => loadCampaigns(currentPage)}
                variant="secondary"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Campaigns Table */}
        <Card>
          <CardBody>
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No campaigns found</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Service</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Schedule</TableHeader>
                    <TableHeader>Progress</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-gray-500">{campaign.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getServiceBadgeVariant(campaign.services)}>
                          {campaign.services}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.schedule ? new Date(campaign.schedule).toLocaleDateString() : 'Not scheduled'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${campaign.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{campaign.progress_percent}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActionButtonGroup>
                          <button
                            onClick={() => handleViewCampaign(campaign)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <VisibilityIcon className="w-4 h-4" />
                          </button>
                          <EditActionButton onClick={() => handleEditCampaign(campaign)} />
                          <button
                            onClick={() => handleRunCampaign(campaign)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Run Campaign"
                          >
                            <PlayArrowIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadReport(campaign)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                            title="Download Report"
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </button>
                          <DeleteActionButton onClick={() => handleDeleteCampaign(campaign)} />
                        </ActionButtonGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              onPageChange={handlePageChange}
              hasNext={pagination.has_next}
              hasPrevious={pagination.has_previous}
              totalItems={pagination.total_items}
              pageSize={25}
            />
          </div>
        )}
      </div>
    </Container>
  );
};

export default CampaignIndexPage;

