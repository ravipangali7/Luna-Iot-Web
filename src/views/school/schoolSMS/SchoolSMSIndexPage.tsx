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
import type { SchoolSMSList } from '../../../types/school';

const SchoolSMSIndexPage: React.FC = () => {
  
  const [schoolSMS, setSchoolSMS] = useState<SchoolSMSList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const fetchSchoolSMS = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await schoolService.getAllSchoolSMS(currentPage, itemsPerPage, searchTerm || undefined);
      
      if (response.success && response.data) {
        setSchoolSMS(response.data.school_sms);
        setTotalCount(response.data.pagination.total_items);
        setTotalPages(response.data.pagination.total_pages);
      } else {
        setError(response.error || 'Failed to load school SMS');
        setSchoolSMS([]);
      }
    } catch (err) {
      console.error('Error fetching school SMS:', err);
      setError('Failed to load school SMS. Please try again.');
      setSchoolSMS([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchSchoolSMS();
  }, [fetchSchoolSMS]);

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

  if (loading && schoolSMS.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900">School SMS</h1>
            <p className="text-gray-600 mt-1">
              Manage SMS messages for schools
            </p>
          </div>
        </div>

        <Card>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search by message or institute name..."
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

          {schoolSMS.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">
              No school SMS found
            </div>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Institute</TableHeader>
                    <TableHeader>Message</TableHeader>
                    <TableHeader>Recipients</TableHeader>
                    <TableHeader>Created At</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schoolSMS.map((sms) => (
                    <TableRow key={sms.id}>
                      <TableCell>{sms.institute_name}</TableCell>
                      <TableCell>{sms.message_preview}</TableCell>
                      <TableCell>{sms.phone_numbers_count}</TableCell>
                      <TableCell>{formatDate(sms.created_at)}</TableCell>
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

export default SchoolSMSIndexPage;

