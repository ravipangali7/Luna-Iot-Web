import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlertSystemAccess } from '../../hooks/useAlertSystemAccess';
import { instituteService, type Institute } from '../../api/services/instituteService';
import { 
  alertGeofenceService, 
  alertRadarService, 
  alertBuzzerService, 
  alertSwitchService, 
  alertContactService,
  type AlertGeofence,
  type AlertRadar,
  type AlertBuzzer,
  type AlertSwitch,
  type AlertContact
} from '../../api/services/alertSystemService';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Button from '../../components/ui/buttons/Button';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';


const AlertSystemShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading, isAdmin, hasAccessToInstitute } = useAlertSystemAccess(Number(id));
  
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [geofences, setGeofences] = useState<AlertGeofence[]>([]);
  const [radars, setRadars] = useState<AlertRadar[]>([]);
  const [buzzers, setBuzzers] = useState<AlertBuzzer[]>([]);
  const [switches, setSwitches] = useState<AlertSwitch[]>([]);
  const [contacts, setContacts] = useState<AlertContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const instituteId = Number(id);
      
       // Fetch institute details
       const instituteData = await instituteService.getInstituteById(instituteId);
       setInstitute(instituteData.data ? {
         ...instituteData.data,
         phone: instituteData.data.phone || '',
         address: instituteData.data.address || ''
       } : null);

      // Fetch all alert system data for this institute
      const [geofencesData, radarsData, buzzersData, switchesData, contactsData] = await Promise.all([
        alertGeofenceService.getByInstitute(instituteId),
        alertRadarService.getByInstitute(instituteId),
        alertBuzzerService.getByInstitute(instituteId),
        alertSwitchService.getByInstitute(instituteId),
        alertContactService.getByInstitute(instituteId)
      ]);

      setGeofences(geofencesData || []);
      // Ensure token is present for radars; some list endpoints may omit it
      const radarsList = radarsData || [];
      const missingToken = radarsList.filter(r => !r.token || String(r.token).trim().length === 0);
      if (missingToken.length > 0) {
        try {
          const fetched = await Promise.all(
            missingToken.map(r => alertRadarService.getById(r.id).catch(() => null))
          );
          const idToToken = new Map<number, string>();
          fetched.forEach(fr => {
            if (fr && fr.token) idToToken.set(fr.id, fr.token);
          });
          setRadars(
            radarsList.map(r => ({
              ...r,
              token: r.token || idToToken.get(r.id) || ''
            }))
          );
        } catch {
          setRadars(radarsList);
        }
      } else {
        setRadars(radarsList);
      }
      setBuzzers((buzzersData || []).map(buzzer => ({
        ...buzzer,
        device_name: buzzer.device_imei // Map device_imei to device_name for compatibility
      })));
      setSwitches((switchesData || []).map(switchItem => ({
        ...switchItem,
        device_name: switchItem.device_imei // Map device_imei to device_name for compatibility
      })));
      setContacts(contactsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load alert system data. Please try again.');
      setGeofences([]);
      setRadars([]);
      setBuzzers([]);
      setSwitches([]);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!accessLoading) {
      if (!hasAccess || !hasAccessToInstitute(Number(id))) {
        setError('You do not have access to this institute\'s alert system.');
        setLoading(false);
        return;
      }
      fetchData();
    }
  }, [id, hasAccess, accessLoading, hasAccessToInstitute, fetchData]);

  const handleAddGeofence = () => {
    navigate(`/alert-system/${id}/geofences/create`);
  };

  const handleAddRadar = () => {
    navigate(`/alert-system/${id}/radars/create`);
  };

  const handleAddBuzzer = () => {
    navigate(`/alert-system/${id}/buzzers/create`);
  };

  const handleAddSwitch = () => {
    navigate(`/alert-system/${id}/switches/create`);
  };

  const handleAddContact = () => {
    navigate(`/alert-system/${id}/contacts/create`);
  };

  // Per-item View removed; keep create/edit/delete

  const handleEdit = (type: string, itemId: number) => {
    navigate(`/alert-system/${id}/${type}/${itemId}/edit`);
  };

  const handleDelete = async (type: string, itemId: number, name: string) => {
     const confirmed = await confirmDelete(
       `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
       `Are you sure you want to delete "${name}"? This action cannot be undone.`
     );

     if (confirmed) {
       try {
         switch (type) {
           case 'geofences':
             await alertGeofenceService.delete(itemId);
             break;
           case 'radars':
             await alertRadarService.delete(itemId);
             break;
           case 'buzzers':
             await alertBuzzerService.delete(itemId);
             break;
           case 'switches':
             await alertSwitchService.delete(itemId);
             break;
           case 'contacts':
             await alertContactService.delete(itemId);
             break;
         }
         showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
         fetchData();
       } catch (err) {
         console.error(`Error deleting ${type}:`, err);
         showError(`Failed to delete ${type}. Please try again.`);
       }
     }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Open public radar monitor by token in a new tab
  const handleOpenRadarMonitor = async (id: number, token?: string) => {
    let useToken = token;
    if (!useToken || useToken.trim().length === 0) {
      try {
        const radar = await alertRadarService.getById(id);
        useToken = radar?.token;
      } catch {
        // ignore; handled below
      }
    }
    if (!useToken || useToken.trim().length === 0) {
      showError('Missing radar token', 'This radar does not have a valid token.');
      return;
    }
    const radarUrl = `${window.location.origin}/alert-system/radar/token/${useToken}`;
    window.open(radarUrl, '_blank');
  };


  if (accessLoading || loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!institute) {
    return (
      <Container>
        <Alert variant="warning" className="mb-6">
          Institute not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alert System - {institute.name}</h1>
            <p className="text-gray-600 mt-1">
              Manage alert system components for this institute
            </p>
          </div>
        </div>

        {/* Institute Details Card */}
        <Card className="mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Institute Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{institute.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{institute.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{institute.address || 'N/A'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Button
            variant="primary"
            onClick={handleAddGeofence}
            disabled={!isAdmin}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Geofence
          </Button>
          <Button
            variant="primary"
            onClick={handleAddRadar}
            disabled={!isAdmin}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Radar
          </Button>
          <Button
            variant="primary"
            onClick={handleAddBuzzer}
            disabled={!isAdmin}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Buzzer
          </Button>
          <Button
            variant="primary"
            onClick={handleAddSwitch}
            disabled={!isAdmin}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Switch
          </Button>
          <Button
            variant="primary"
            onClick={handleAddContact}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Contact
          </Button>
        </div>

        {/* Geofences Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Geofences ({geofences.length})</h3>
            {geofences.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No geofences found. Click "Add Geofence" to create one.
              </div>
            ) : (
               <Table striped hover>
                 <TableHead>
                   <TableRow>
                     <TableHeader>Title</TableHeader>
                     <TableHeader>Alert Types</TableHeader>
                     <TableHeader>Created At</TableHeader>
                     <TableHeader>Actions</TableHeader>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {geofences.map(item => (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium text-gray-900">{item.title}</TableCell>
                       <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.alert_types_names && item.alert_types_names.length > 0 ? (
                            item.alert_types_names.map((type, index) => (
                              <Badge key={index} variant="primary" size="sm">{type}</Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No alert types</span>
                          )}
                        </div>
                       </TableCell>
                       <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                           {isAdmin && (
                             <Button
                               variant="secondary"
                               size="sm"
                               onClick={() => handleEdit('geofences', item.id)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                               }
                             >
                               Edit
                             </Button>
                           )}
                           {isAdmin && (
                             <Button
                               variant="danger"
                               size="sm"
                               onClick={() => handleDelete('geofences', item.id, item.title)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               }
                             >
                               Delete
                             </Button>
                           )}
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            )}
          </div>
        </Card>

        {/* Radars Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Radars ({radars.length})</h3>
            {radars.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No radars found. Click "Add Radar" to create one.
              </div>
            ) : (
               <Table striped hover>
                 <TableHead>
                   <TableRow>
                     <TableHeader>Title</TableHeader>
                     <TableHeader>Token</TableHeader>
                     <TableHeader>Geofences</TableHeader>
                     <TableHeader>Created At</TableHeader>
                     <TableHeader>Actions</TableHeader>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {radars.map(item => (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium text-gray-900">{item.title}</TableCell>
                      <TableCell className="text-gray-600 font-mono text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="truncate max-w-[200px]">{item.token || 'N/A'}</span>
                          {item.token && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.token as string);
                                showSuccess('Token copied to clipboard!');
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Copy token"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </TableCell>
                       <TableCell className="text-gray-600">{item.alert_geofences_names?.length || 0} geofences</TableCell>
                       <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                          <Button
                             variant="success"
                             size="sm"
                            onClick={() => handleOpenRadarMonitor(item.id, item.token)}
                             icon={
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                               </svg>
                             }
                            
                           >
                             Monitor
                           </Button>
                           
                           {isAdmin && (
                             <Button
                               variant="secondary"
                               size="sm"
                               onClick={() => handleEdit('radars', item.id)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                               }
                             >
                               Edit
                             </Button>
                           )}
                           {isAdmin && (
                             <Button
                               variant="danger"
                               size="sm"
                               onClick={() => handleDelete('radars', item.id, item.title)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               }
                             >
                               Delete
                             </Button>
                           )}
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            )}
          </div>
        </Card>

        {/* Buzzers Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Buzzers ({buzzers.length})</h3>
            {buzzers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No buzzers found. Click "Add Buzzer" to create one.
              </div>
            ) : (
               <Table striped hover>
                 <TableHead>
                   <TableRow>
                     <TableHeader>Title</TableHeader>
                     <TableHeader>Device</TableHeader>
                     <TableHeader>Delay (s)</TableHeader>
                     <TableHeader>Created At</TableHeader>
                     <TableHeader>Actions</TableHeader>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {buzzers.map(item => (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium text-gray-900">{item.title}</TableCell>
                       <TableCell className="text-gray-600">{item.device_name || item.device_imei}</TableCell>
                       <TableCell className="text-gray-600">{item.delay}</TableCell>
                       <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                          
                           {isAdmin && (
                             <Button
                               variant="secondary"
                               size="sm"
                               onClick={() => handleEdit('buzzers', item.id)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                               }
                             >
                               Edit
                             </Button>
                           )}
                           {isAdmin && (
                             <Button
                               variant="danger"
                               size="sm"
                               onClick={() => handleDelete('buzzers', item.id, item.title)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               }
                             >
                               Delete
                             </Button>
                           )}
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            )}
          </div>
        </Card>

        {/* Switches Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Switches ({switches.length})</h3>
            {switches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No switches found. Click "Add Switch" to create one.
              </div>
            ) : (
               <Table striped hover>
                 <TableHead>
                   <TableRow>
                     <TableHeader>Title</TableHeader>
                     <TableHeader>Device</TableHeader>
                     <TableHeader>Primary Phone</TableHeader>
                     <TableHeader>Created At</TableHeader>
                     <TableHeader>Actions</TableHeader>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {switches.map(item => (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium text-gray-900">{item.title}</TableCell>
                       <TableCell className="text-gray-600">{item.device_name || item.device_imei}</TableCell>
                       <TableCell className="text-gray-600">{item.primary_phone}</TableCell>
                       <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                          
                           {isAdmin && (
                             <Button
                               variant="secondary"
                               size="sm"
                               onClick={() => handleEdit('switches', item.id)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                               }
                             >
                               Edit
                             </Button>
                           )}
                           {isAdmin && (
                             <Button
                               variant="danger"
                               size="sm"
                               onClick={() => handleDelete('switches', item.id, item.title)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               }
                             >
                               Delete
                             </Button>
                           )}
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            )}
          </div>
        </Card>

        {/* Contacts Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacts ({contacts.length})</h3>
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No contacts found. Click "Add Contact" to create one.
              </div>
            ) : (
               <Table striped hover>
                 <TableHead>
                   <TableRow>
                     <TableHeader>Name</TableHeader>
                     <TableHeader>Phone</TableHeader>
                     <TableHeader>Notifications</TableHeader>
                     <TableHeader>Created At</TableHeader>
                     <TableHeader>Actions</TableHeader>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {contacts.map(item => (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                       <TableCell className="text-gray-600">{item.phone}</TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                           {item.is_sms && <Badge variant="success" size="sm">SMS</Badge>}
                           {item.is_call && <Badge variant="info" size="sm">Call</Badge>}
                         </div>
                       </TableCell>
                       <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                          
                           {(isAdmin || hasAccess) && (
                             <Button
                               variant="secondary"
                               size="sm"
                               onClick={() => handleEdit('contacts', item.id)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                 </svg>
                               }
                             >
                               Edit
                             </Button>
                           )}
                           {(isAdmin || hasAccess) && (
                             <Button
                               variant="danger"
                               size="sm"
                               onClick={() => handleDelete('contacts', item.id, item.name)}
                               icon={
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               }
                             >
                               Delete
                             </Button>
                           )}
                         </div>
                       </TableCell>
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

export default AlertSystemShowPage;
