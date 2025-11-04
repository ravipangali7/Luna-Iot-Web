import React, { useState, useEffect, useCallback } from 'react';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Table from '../../../components/ui/tables/Table';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import TableRow from '../../../components/ui/tables/TableRow';
import TableCell from '../../../components/ui/tables/TableCell';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { schoolService } from '../../../api/services/schoolService';
import type { SchoolParentList } from '../../../types/school';

const SchoolParentIndexPage: React.FC = () => {
  
  const [schoolParents, setSchoolParents] = useState<SchoolParentList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const fetchSchoolParents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await schoolService.getAllSchoolParents(currentPage, itemsPerPage, searchTerm || undefined);
      
      if (response.success && response.data) {
        setSchoolParents(response.data.school_parents);
        setTotalCount(response.data.pagination.total_items);
        setTotalPages(response.data.pagination.total_pages);
      } else {
        setError(response.error || 'Failed to load school parents');
        setSchoolParents([]);
      }
    } catch (err) {
      console.error('Error fetching school parents:', err);
      setError('Failed to load school parents. Please try again.');
      setSchoolParents([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchSchoolParents();
  }, [fetchSchoolParents]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && schoolParents.length === 0) {
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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School Parents</h1>
            <p className="text-gray-600 mt-1">
              Manage school parents and their bus assignments
            </p>
          </div>
        </div>

        <Card>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by parent name or phone..."
              value={searchTerm}
              onChange={handleSearch}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {schoolParents.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">
              No school parents found
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Parent Name</TableHeader>
                    <TableHeader>Phone</TableHeader>
                    <TableHeader>Buses Count</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Created At</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schoolParents.map((parent) => (
                    <TableRow key={parent.id}>
                      <TableCell>{parent.parent_name}</TableCell>
                      <TableCell>{parent.parent_phone}</TableCell>
                      <TableCell>{parent.school_buses_count}</TableCell>
                      <TableCell>
                        {parent.latitude && parent.longitude 
                          ? `${parent.latitude}, ${parent.longitude}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{formatDate(parent.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </Container>
  );
};

export default SchoolParentIndexPage;

