import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleService } from '../../api/services/moduleService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import type { Module } from '../../api/services/moduleService';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { ViewActionButton, EditActionButton, DeleteActionButton, ActionButtonGroup } from '../../components/ui/buttons';
import Input from '../../components/ui/forms/Input';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const ModuleIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await moduleService.getAllModules();

      if (result.success && result.data) {
        setModules(result.data);
      } else {
        setError(result.error || 'Failed to load modules');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleViewModule = (module: Module) => {
    // For now, navigate to edit page as view functionality
    navigate(`/modules/${module.id}/edit`);
  };

  const handleEditModule = (module: Module) => {
    navigate(`/modules/${module.id}/edit`);
  };

  const handleDeleteModule = async (module: Module) => {
    const confirmed = await confirmDelete(
      'Delete Module',
      `Are you sure you want to delete module "${module.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await moduleService.deleteModule(module.id);
        
        if (result.success) {
          showSuccess('Module deleted successfully');
          loadModules();
        } else {
          showError('Failed to delete module', result.error);
        }
      } catch (error) {
        showError('Error deleting module', (error as Error).message);
      }
    }
  };

  const handleCreateModule = () => {
    navigate('/modules/create');
  };

  const handleRefresh = () => {
    loadModules();
  };

  // Filter modules based on search query
  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
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
            <h1 className="text-2xl font-bold text-gray-900">Modules</h1>
            <p className="text-gray-600">Manage system modules</p>
          </div>
          <Button
            onClick={handleCreateModule}
            variant="primary"
            size="md"
            icon={<AddIcon />}
          >
            Create Module
          </Button>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Search modules by name or slug..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e)}
                      icon={<SearchIcon />}
                    />
                  </div>
                  <Button type="submit" variant="secondary" size="md">
                    Search
                  </Button>
                  {searchQuery && (
                    <Button
                      type="button"
                      onClick={handleClearSearch}
                      variant="outline"
                      size="md"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </form>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="md"
                icon={<RefreshIcon />}
              >
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {/* Modules Table */}
        <Card>
          <CardBody>
            {filteredModules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No modules found matching your search.' : 'No modules found.'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={handleCreateModule}
                    variant="primary"
                    size="md"
                    className="mt-4"
                    icon={<AddIcon />}
                  >
                    Create First Module
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Slug</TableHeader>
                    <TableHeader>Created At</TableHeader>
                    <TableHeader className="text-right">Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredModules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {module.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {module.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {new Date(module.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <ActionButtonGroup>
                          <ViewActionButton
                            onClick={() => handleViewModule(module)}
                            title="View Module"
                          />
                          <EditActionButton
                            onClick={() => handleEditModule(module)}
                            title="Edit Module"
                          />
                          <DeleteActionButton
                            onClick={() => handleDeleteModule(module)}
                            title="Delete Module"
                          />
                        </ActionButtonGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Results Summary */}
        {filteredModules.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {filteredModules.length} of {modules.length} modules
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
      </div>
    </Container>
  );
};

export default ModuleIndexPage;
