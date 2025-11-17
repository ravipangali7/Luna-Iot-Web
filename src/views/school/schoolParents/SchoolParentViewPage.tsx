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
import type { SchoolParent, SchoolBusList } from '../../../types/school';

const SchoolParentViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId, parentId } = useParams<{ id: string; parentId: string }>();
  const parentIdNum = parseInt(parentId || '0');
  const instituteIdNum = parseInt(instituteId || '0');
  
  const [schoolParent, setSchoolParent] = useState<SchoolParent | null>(null);
  const [buses, setBuses] = useState<SchoolBusList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const parentResult = await schoolService.getSchoolParentById(parentIdNum);
        
        if (parentResult.success && parentResult.data) {
          setSchoolParent(parentResult.data);
          
          // Get bus details for all associated buses
          if (parentResult.data.school_buses && parentResult.data.school_buses.length > 0) {
            const busPromises = parentResult.data.school_buses.map(busId =>
              schoolService.getSchoolBusById(busId)
            );
            const busResults = await Promise.all(busPromises);
            const busList: SchoolBusList[] = busResults
              .filter(r => r.success && r.data)
              .map(r => ({
                id: r.data!.id,
                institute_name: r.data!.institute.name,
                bus_name: r.data!.bus.name,
                bus_vehicle_no: r.data!.bus.vehicleNo,
                created_at: r.data!.created_at
              }));
            setBuses(busList);
          }
        } else {
          setError(parentResult.error || 'Failed to load school parent');
        }
      } catch (err) {
        console.error('Error fetching school parent:', err);
        setError('Failed to load school parent data');
      } finally {
        setLoading(false);
      }
    };
    
    if (parentIdNum) {
      fetchData();
    }
  }, [parentIdNum]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !schoolParent) {
    return (
      <Container>
        <Alert variant="danger">{error || 'School parent not found'}</Alert>
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
          <h1 className="text-2xl font-bold text-gray-900">School Parent Details</h1>
          <div className="flex space-x-2">
            <Button variant="primary" onClick={() => navigate(`/school/${instituteIdNum}/parents/${parentIdNum}/edit`)}>
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
              <label className="text-sm font-medium text-gray-700">Parent Name</label>
              <p className="mt-1 text-gray-900">{schoolParent.parent.name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <p className="mt-1 text-gray-900">{schoolParent.parent.phone}</p>
            </div>
            {schoolParent.parent.email && (
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{schoolParent.parent.email}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Child Name</label>
              <p className="mt-1 text-gray-900">{schoolParent.child_name || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Latitude</label>
                <p className="mt-1 text-gray-900">
                  {schoolParent.latitude ? Number(schoolParent.latitude).toFixed(6) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Longitude</label>
                <p className="mt-1 text-gray-900">
                  {schoolParent.longitude ? Number(schoolParent.longitude).toFixed(6) : 'N/A'}
                </p>
              </div>
            </div>
            {schoolParent.latitude && schoolParent.longitude && (
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="mt-1 text-gray-900">
                  {Number(schoolParent.latitude).toFixed(6)}, {Number(schoolParent.longitude).toFixed(6)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Created At</label>
              <p className="mt-1 text-gray-900">
                {new Date(schoolParent.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Associated Buses ({buses.length})</h3>
            {buses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No buses associated with this parent.
              </div>
            ) : (
              <Table striped hover>
                <TableHead>
                  <TableRow>
                    <TableHeader>Bus Name</TableHeader>
                    <TableHeader>Vehicle Number</TableHeader>
                    <TableHeader>Institute</TableHeader>
                    <TableHeader>Created At</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {buses.map(bus => (
                    <TableRow key={bus.id}>
                      <TableCell className="font-medium text-gray-900">{bus.bus_name}</TableCell>
                      <TableCell className="text-gray-600">{bus.bus_vehicle_no}</TableCell>
                      <TableCell className="text-gray-600">{bus.institute_name}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(bus.created_at)}</TableCell>
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

export default SchoolParentViewPage;

