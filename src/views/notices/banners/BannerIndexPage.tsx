import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bannerService } from '../../../api/services/bannerService';
import { confirmDelete, showSuccess, showError } from '../../../utils/sweetAlert';
import type { Banner } from '../../../types/banner';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import CardBody from '../../../components/ui/cards/CardBody';
import Button from '../../../components/ui/buttons/Button';
import { ViewActionButton, EditActionButton, DeleteActionButton, ActionButtonGroup } from '../../../components/ui/buttons';
import Input from '../../../components/ui/forms/Input';
import Table from '../../../components/ui/tables/Table';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import TableRow from '../../../components/ui/tables/TableRow';
import TableCell from '../../../components/ui/tables/TableCell';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const BannerIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [filteredBanners, setFilteredBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await bannerService.getAllBanners();

      if (result.success && result.data) {
        setBanners(result.data);
        setFilteredBanners(result.data);
      } else {
        setError(result.error || 'Failed to load banners');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = banners.filter(banner =>
        banner.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (banner.url && banner.url.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredBanners(filtered);
    } else {
      setFilteredBanners(banners);
    }
  }, [searchQuery, banners]);

  const handleViewBanner = (banner: Banner) => {
    navigate(`/notices/banners/${banner.id}`);
  };

  const handleEditBanner = (banner: Banner) => {
    navigate(`/notices/banners/${banner.id}/edit`);
  };

  const handleDeleteBanner = async (banner: Banner) => {
    const confirmed = await confirmDelete(
      'Delete Banner',
      `Are you sure you want to delete banner "${banner.title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await bannerService.deleteBanner(banner.id);
        
        if (result.success) {
          showSuccess('Banner deleted successfully');
          loadBanners();
        } else {
          showError('Failed to delete banner', result.error);
        }
      } catch (error) {
        showError('Error deleting banner', (error as Error).message);
      }
    }
  };

  const handleCreateBanner = () => {
    navigate('/notices/banners/create');
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge 
        variant={isActive ? 'success' : 'danger'} 
        size="sm"
      >
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
            <p className="text-gray-600">Manage system banners</p>
          </div>
          <Button
            onClick={handleCreateBanner}
            variant="primary"
            className="flex items-center gap-2"
          >
            <AddIcon className="w-4 h-4" />
            Add Banner
          </Button>
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search banners by title or URL..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={loadBanners}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>

        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        <Card>
          <CardBody>
            {filteredBanners.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No banners found matching your search.' : 'No banners found.'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={handleCreateBanner}
                    variant="primary"
                    className="mt-4"
                  >
                    Create First Banner
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Order</TableHeader>
                      <TableHeader>Title</TableHeader>
                      <TableHeader>Image</TableHeader>
                      <TableHeader>URL</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Clicks</TableHeader>
                      <TableHeader>Created</TableHeader>
                      <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBanners.map((banner) => (
                      <TableRow key={banner.id}>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-600">
                            {banner.orderPosition}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {banner.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          {banner.imageUrl ? (
                            <img 
                              src={banner.imageUrl} 
                              alt={banner.title}
                              className="w-20 h-auto object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 text-sm italic">No image</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-600 max-w-md truncate">
                            {banner.url ? (
                              <a href={banner.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {banner.url}
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">No URL</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(banner.isActive)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {banner.click}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {banner.createdAt ? new Date(banner.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ActionButtonGroup>
                            <ViewActionButton onClick={() => handleViewBanner(banner)} />
                            <EditActionButton onClick={() => handleEditBanner(banner)} />
                            <DeleteActionButton onClick={() => handleDeleteBanner(banner)} />
                          </ActionButtonGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default BannerIndexPage;

