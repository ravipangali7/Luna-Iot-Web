import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Table from '../../../components/ui/tables/Table';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import TableRow from '../../../components/ui/tables/TableRow';
import TableCell from '../../../components/ui/tables/TableCell';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { schoolService } from '../../../api/services/schoolService';
import type { SchoolBus, SchoolParentList } from '../../../types/school';

const SchoolBusViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId, busId } = useParams<{ id: string; busId: string }>();
  const busIdNum = parseInt(busId || '0');
  const instituteIdNum = parseInt(instituteId || '0');
  
  const [schoolBus, setSchoolBus] = useState<SchoolBus | null>(null);
  const [parents, setParents] = useState<SchoolParentList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [busResult, parentsResult] = await Promise.all([
          schoolService.getSchoolBusById(busIdNum),
          schoolService.getSchoolParentsByBus(busIdNum)
        ]);
        
        if (busResult.success && busResult.data) {
          setSchoolBus(busResult.data);
        } else {
          setError(busResult.error || 'Failed to load school bus');
        }
        
        if (parentsResult.success && parentsResult.data) {
          setParents(parentsResult.data);
        }
      } catch (err) {
        console.error('Error fetching school bus:', err);
        setError('Failed to load school bus data');
      } finally {
        setLoading(false);
      }
    };
    
    if (busIdNum) {
      fetchData();
    }
  }, [busIdNum]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error || !schoolBus) {
    return (
      <Container>
        <Alert variant="danger">{error || 'School bus not found'}</Alert>
        <Button variant="secondary" onClick={() => navigate(`/school/${instituteIdNum}`)} className="mt-4">
          Back to School
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">School Bus Details</h1>
          <div className="flex space-x-2">
            <Button variant="primary" onClick={() => navigate(`/school/${instituteIdNum}/buses/${busIdNum}/edit`)}>
              Edit
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/school/${instituteIdNum}`)}>
              Back to School
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Institute</label>
              <p className="mt-1 text-gray-900">{schoolBus.institute.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Bus Name</label>
              <p className="mt-1 text-gray-900">{schoolBus.bus.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle Number</label>
              <p className="mt-1 text-gray-900">{schoolBus.bus.vehicleNo}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created At</label>
              <p className="mt-1 text-gray-900">
                {new Date(schoolBus.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Associated Parents ({parents.length})</h3>
            {parents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No parents associated with this bus.
              </div>
            ) : (
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader>Parent Name</TableHeader>
                    <TableHeader>Child Name</TableHeader>
                    <TableHeader>Phone</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Created At</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parents.map(parent => (
                    <TableRow key={parent.id}>
                      <TableCell className="font-medium text-gray-900">{parent.parent_name}</TableCell>
                      <TableCell className="text-gray-600">{parent.child_name || 'N/A'}</TableCell>
                      <TableCell className="text-gray-600">{parent.parent_phone}</TableCell>
                      <TableCell className="text-gray-600">
                        {parent.latitude && parent.longitude 
                          ? `${Number(parent.latitude).toFixed(6)}, ${Number(parent.longitude).toFixed(6)}`
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-600">{formatDate(parent.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default SchoolBusViewPage;

