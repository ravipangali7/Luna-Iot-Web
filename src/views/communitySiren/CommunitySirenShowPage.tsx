import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommunitySirenAccess } from '../../hooks/useCommunitySirenAccess';
import { instituteService, type Institute } from '../../api/services/instituteService';
import { 
  communitySirenBuzzerService, 
  communitySirenSwitchService, 
  communitySirenContactService,
  communitySirenMembersService,
  type CommunitySirenBuzzer,
  type CommunitySirenSwitch,
  type CommunitySirenContact,
  type CommunitySirenMembers
} from '../../api/services/communitySirenService';
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


const CommunitySirenShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading, isAdmin, hasAccessToInstitute } = useCommunitySirenAccess(Number(id));
  
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [buzzers, setBuzzers] = useState<CommunitySirenBuzzer[]>([]);
  const [switches, setSwitches] = useState<CommunitySirenSwitch[]>([]);
  const [contacts, setContacts] = useState<CommunitySirenContact[]>([]);
  const [members, setMembers] = useState<CommunitySirenMembers[]>([]);
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

      // Fetch all community siren data for this institute
      const [buzzersData, switchesData, contactsData, membersData] = await Promise.all([
        communitySirenBuzzerService.getByInstitute(instituteId),
        communitySirenSwitchService.getByInstitute(instituteId),
        communitySirenContactService.getByInstitute(instituteId),
        communitySirenMembersService.getByInstitute(instituteId)
      ]);

      setBuzzers((buzzersData || []).map(buzzer => ({
        ...buzzer,
        device_name: buzzer.device_imei // Map device_imei to device_name for compatibility
      })));
      setSwitches((switchesData || []).map(switchItem => ({
        ...switchItem,
        device_name: switchItem.device_imei // Map device_imei to device_name for compatibility
      })));
      setContacts(contactsData || []);
      setMembers(membersData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load community siren data. Please try again.');
      setBuzzers([]);
      setSwitches([]);
      setContacts([]);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!accessLoading) {
      if (!hasAccess || !hasAccessToInstitute(Number(id))) {
        setError('You do not have access to this institute\'s community siren.');
        setLoading(false);
        return;
      }
      fetchData();
    }
  }, [id, hasAccess, accessLoading, hasAccessToInstitute, fetchData]);

  const handleAddBuzzer = () => {
    navigate(`/community-siren/${id}/buzzers/create`);
  };

  const handleAddSwitch = () => {
    navigate(`/community-siren/${id}/switches/create`);
  };

  const handleAddContact = () => {
    navigate(`/community-siren/${id}/contacts/create`);
  };

  const handleAddMember = () => {
    navigate(`/community-siren/${id}/members/create`);
  };

  const handleEdit = (type: string, itemId: number) => {
    navigate(`/community-siren/${id}/${type}/${itemId}/edit`);
  };

  const handleDelete = async (type: string, itemId: number, name: string) => {
     const confirmed = await confirmDelete(
       `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
       `Are you sure you want to delete "${name}"? This action cannot be undone.`
     );

     if (confirmed) {
       try {
         switch (type) {
           case 'buzzers':
             await communitySirenBuzzerService.delete(itemId);
             break;
           case 'switches':
             await communitySirenSwitchService.delete(itemId);
             break;
           case 'contacts':
             await communitySirenContactService.delete(itemId);
             break;
           case 'members':
             await communitySirenMembersService.delete(itemId);
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
            <h1 className="text-2xl font-bold text-gray-900">Community Siren - {institute.name}</h1>
            <p className="text-gray-600 mt-1">
              Manage community siren components for this institute
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          <Button
            variant="primary"
            onClick={handleAddMember}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            Add Member
          </Button>
        </div>

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

        {/* Members Table */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Members ({members.length})</h3>
            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No members found. Click "Add Member" to create one.
              </div>
            ) : (
               <Table striped hover>
                 <TableHead>
                   <TableRow>
                     <TableHeader>Name</TableHeader>
                     <TableHeader>Phone</TableHeader>
                     <TableHeader>Created At</TableHeader>
                     <TableHeader>Actions</TableHeader>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {members.map(item => (
                     <TableRow key={item.id}>
                       <TableCell className="font-medium text-gray-900">{item.user_name || 'N/A'}</TableCell>
                       <TableCell className="text-gray-600">{item.user_phone}</TableCell>
                       <TableCell className="text-gray-600">{formatDate(item.created_at)}</TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                          
                           {(isAdmin || hasAccess) && (
                             <Button
                               variant="secondary"
                               size="sm"
                               onClick={() => handleEdit('members', item.id)}
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
                               onClick={() => handleDelete('members', item.id, item.user_name || 'Member')}
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

export default CommunitySirenShowPage;
