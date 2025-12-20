import React, { useState } from 'react';
import { ntcM2mService } from '../../api/services/ntcM2mService';
import type { NtcM2mRecord } from '../../api/services/ntcM2mService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Button from '../../components/ui/buttons/Button';
import Alert from '../../components/ui/common/Alert';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';

const NtcM2mReportPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NtcM2mRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleFetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus('Initializing automation...');
      
      // Simulate status updates (since we can't get real-time updates without WebSockets)
      const statusUpdates = [
        { delay: 500, message: 'Launching browser...' },
        { delay: 2000, message: 'Navigating to NTC M2M portal...' },
        { delay: 3000, message: 'Logging in...' },
        { delay: 5000, message: 'Waiting for page to load...' },
        { delay: 7000, message: 'Locating download button...' },
        { delay: 9000, message: 'Downloading report...' },
        { delay: 12000, message: 'Processing Excel file...' },
      ];
      
      let currentUpdate = 0;
      const statusInterval = setInterval(() => {
        if (currentUpdate < statusUpdates.length) {
          setStatus(statusUpdates[currentUpdate].message);
          currentUpdate++;
        }
      }, 2000);
      
      try {
        const result = await ntcM2mService.fetchReport();
        clearInterval(statusInterval);
        setStatus('Complete!');
        
        setData(result.records);
        setColumns(result.columns);
        setTotalRecords(result.total_records);
        showSuccess('Success', `Successfully fetched ${result.total_records} records from NTC M2M portal`);
      } finally {
        clearInterval(statusInterval);
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch report';
      setError(errorMessage);
      setStatus('Error occurred');
      showError('Error', errorMessage);
      setData([]);
      setColumns([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 3000); // Clear status after 3 seconds
    }
  };

  return (
    <Container>
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NTC M2M Report</h1>
            <p className="text-gray-600 mt-1">Fetch and view reports from NTC M2M portal</p>
          </div>
          <Button
            onClick={handleFetchReport}
            disabled={loading}
            loading={loading}
            variant="success"
            className="font-bold"
          >
            Fetch Report
          </Button>
        </div>

        {status && (
          <Alert variant="info" className="mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span>{status}</span>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {totalRecords > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              <span className="font-semibold">Total Records:</span> {totalRecords}
            </p>
            <p className="text-gray-700 mt-1">
              <span className="font-semibold">Columns:</span> {columns.join(', ')}
            </p>
          </div>
        )}

        {data.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHeader key={index}>
                      {column}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((record, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {record[column] !== null && record[column] !== undefined
                          ? String(record[column])
                          : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && data.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No data available</p>
            <p className="text-sm">Click "Fetch Report" to load data from NTC M2M portal</p>
          </div>
        )}
      </Card>
    </Container>
  );
};

export default NtcM2mReportPage;

