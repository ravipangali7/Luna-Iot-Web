import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { phoneCallService } from '../../api/services/phoneCallService';
import { confirmDelete, confirmAction, showSuccess, showError } from '../../utils/sweetAlert';
import { useRefresh } from '../../contexts/RefreshContext';
import type { Campaign, Contact, ContactFormData, VoiceModel } from '../../types/phoneCall';
import Select from '../../components/ui/forms/Select';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import { DeleteActionButton } from '../../components/ui/buttons';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Input from '../../components/ui/forms/Input';
import TextArea from '../../components/ui/forms/TextArea';
import FileInput from '../../components/ui/forms/FileInput';
import Pagination from '../../components/ui/pagination/Pagination';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const CampaignViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshKey } = useRefresh();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Add contact modal state
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    number: '',
    other_variables: {}
  });
  const [addingContact, setAddingContact] = useState(false);
  
  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Voice management state
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<number | null>(null);
  const [settingVoice, setSettingVoice] = useState(false);
  
  // Test voice state
  const [testMessage, setTestMessage] = useState<string>('');
  const [testVoiceId, setTestVoiceId] = useState<number | null>(null);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [testingVoice, setTestingVoice] = useState(false);

  const loadCampaign = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const result = await phoneCallService.getCampaign(parseInt(id));
      
      if (result.success && result.data) {
        const campaignData = result.data;
        setCampaign(campaignData);
        // Extract voice ID from campaign
        if (campaignData.voice) {
          if (typeof campaignData.voice === 'object' && campaignData.voice.id) {
            setSelectedVoiceId(campaignData.voice.id);
            setTestVoiceId(campaignData.voice.id); // Set test voice to current voice
          } else if (typeof campaignData.voice === 'number') {
            setSelectedVoiceId(campaignData.voice);
            setTestVoiceId(campaignData.voice); // Set test voice to current voice
          }
        } else {
          setSelectedVoiceId(null);
        }
        // Set test message to campaign message
        if (campaignData.message) {
          setTestMessage(campaignData.message);
        }
      } else {
        setError(result.error || 'Failed to load campaign');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadVoiceModels = useCallback(async () => {
    try {
      const result = await phoneCallService.getVoiceModels();
      if (result.success && result.data) {
        setVoiceModels(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      console.error('Error loading voice models:', err);
    }
  }, []);

  const loadContacts = useCallback(async (page: number = 1) => {
    if (!id) return;

    try {
      const result = await phoneCallService.getCampaignDetails(parseInt(id), page);
      
      if (result.success && result.data) {
        if (result.data.results) {
          setContacts(result.data.results);
          setTotalPages(result.data.total_pages || 1);
          setTotalCount(result.data.count || 0);
        } else if (Array.isArray(result.data)) {
          setContacts(result.data);
          setTotalPages(1);
          setTotalCount(result.data.length);
        }
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  }, [id]);

  useEffect(() => {
    loadCampaign();
    loadVoiceModels();
  }, [loadCampaign, loadVoiceModels, refreshKey]);

  useEffect(() => {
    loadContacts(currentPage);
  }, [loadContacts, currentPage, refreshKey]);

  const handleEdit = () => {
    navigate(`/phone-call/campaigns/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    const confirmed = await confirmDelete(
      'Delete Campaign',
      `Are you sure you want to delete campaign "${campaign?.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const result = await phoneCallService.deleteCampaign(parseInt(id));
        if (result.success) {
          showSuccess('Campaign Deleted', 'Campaign has been deleted successfully.');
          navigate('/phone-call/campaigns');
        } else {
          showError('Failed to Delete Campaign', result.error || 'Failed to delete campaign');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const handleRun = async () => {
    if (!id) return;
    
    const scheduleText = campaign?.schedule 
      ? ` according to schedule (${new Date(campaign.schedule).toLocaleString()})`
      : ' immediately';
    
    const confirmed = await confirmAction(
      'Run Campaign',
      `Are you sure you want to run campaign "${campaign?.name}"${scheduleText}?`
    );
    
    if (confirmed) {
      try {
        const result = await phoneCallService.runCampaign(parseInt(id));
        if (result.success) {
          showSuccess('Campaign Started', 'Campaign execution has been started.');
          loadCampaign();
        } else {
          showError('Failed to Run Campaign', result.error || 'Failed to run campaign');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const handleInstantLaunch = async () => {
    if (!id) return;
    
    const confirmed = await confirmAction(
      'Instant Launch Campaign',
      `Are you sure you want to launch campaign "${campaign?.name}" immediately? This will call all numbers right now, ignoring any schedule.`
    );
    
    if (confirmed) {
      try {
        const result = await phoneCallService.instantLaunchCampaign(parseInt(id));
        if (result.success) {
          showSuccess('Campaign Launched', 'Campaign has been launched immediately and calls are being made now.');
          loadCampaign();
        } else {
          showError('Failed to Launch Campaign', result.error || 'Failed to launch campaign');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };

  const handleDownloadReport = async () => {
    if (!id) return;
    
    try {
      const result = await phoneCallService.downloadReport(parseInt(id));
      if (result.success && result.data) {
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `campaign_${id}_report.csv`;
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

  const handleAddContact = async () => {
    if (!id || !contactFormData.number.trim()) {
      showError('Validation Error', 'Phone number is required');
      return;
    }

    try {
      setAddingContact(true);
      const result = await phoneCallService.addContact(parseInt(id), contactFormData);
      
      if (result.success) {
        showSuccess('Contact Added', 'Contact has been added successfully.');
        setShowAddContact(false);
        setContactFormData({ number: '', other_variables: {} });
        loadContacts(currentPage);
      } else {
        showError('Failed to Add Contact', result.error || 'Failed to add contact');
      }
    } catch (err) {
      showError('Error', 'An unexpected error occurred: ' + err);
    } finally {
      setAddingContact(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!id || !uploadFile) {
      showError('Validation Error', 'Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      const result = await phoneCallService.addBulkContacts(parseInt(id), uploadFile);
      
      if (result.success) {
        showSuccess('Bulk Upload Successful', `Successfully uploaded ${result.data?.total_validated_rows || 0} contacts.`);
        setShowBulkUpload(false);
        setUploadFile(null);
        loadContacts(currentPage);
      } else {
        showError('Upload Failed', result.error || 'Failed to upload contacts');
      }
    } catch (err) {
      showError('Error', 'An unexpected error occurred: ' + err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    const confirmed = await confirmDelete(
      'Delete Contact',
      'Are you sure you want to delete this contact?'
    );
    
    if (confirmed) {
      try {
        const result = await phoneCallService.deleteContact(contactId);
        if (result.success) {
          showSuccess('Contact Deleted', 'Contact has been deleted successfully.');
          loadContacts(currentPage);
        } else {
          showError('Failed to Delete Contact', result.error || 'Failed to delete contact');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred: ' + err);
      }
    }
  };
  
  const handleSetVoice = async () => {
    if (!id || !selectedVoiceId) {
      showError('Validation Error', 'Please select a voice model');
      return;
    }

    if (!campaign || !campaign.message) {
      showError('Validation Error', 'Campaign message is required to set voice');
      return;
    }

    try {
      setSettingVoice(true);
      const result = await phoneCallService.addVoiceAssistance(parseInt(id), selectedVoiceId, 'Text', campaign.message);
      
      if (result.success) {
        showSuccess('Voice Set', 'Voice has been set successfully.');
        loadCampaign(); // Reload campaign to get updated voice
      } else {
        showError('Failed to Set Voice', result.error || 'Failed to set voice');
      }
    } catch (err) {
      showError('Error', 'An unexpected error occurred: ' + err);
    } finally {
      setSettingVoice(false);
    }
  };

  const handleTestVoice = async () => {
    if (!id || !testVoiceId || !testMessage.trim()) {
      showError('Validation Error', 'Please select a voice and enter a message to test');
      return;
    }

    try {
      setTestingVoice(true);
      setTestAudioUrl(null); // Clear previous audio
      const result = await phoneCallService.testVoice(parseInt(id), testVoiceId, testMessage);
      
      if (result.success && result.data) {
        // Handle different response formats from the API
        let audioUrl: string | null = null;
        
        if (typeof result.data === 'string') {
          // Direct URL string
          audioUrl = result.data;
        } else if (typeof result.data === 'object' && result.data !== null) {
          // JSON object - try multiple possible fields
          audioUrl = result.data.url || 
                    result.data.audio_url || 
                    result.data.audio || 
                    result.data.file_url ||
                    (typeof result.data === 'string' ? result.data : null);
          
          // If still no URL, check if the whole object is a URL-like string
          if (!audioUrl && typeof result.data === 'object') {
            const dataStr = JSON.stringify(result.data);
            // Check if the response contains a URL pattern
            const urlMatch = dataStr.match(/https?:\/\/[^\s"']+/);
            if (urlMatch) {
              audioUrl = urlMatch[0];
            }
          }
        }
        
        if (audioUrl && (audioUrl.startsWith('http://') || audioUrl.startsWith('https://'))) {
          setTestAudioUrl(audioUrl);
          showSuccess('Voice Test', 'Voice test completed. Click play to hear the audio.');
        } else {
          console.error('Test Voice Response:', result.data);
          showError('Test Voice', 'No valid audio URL returned from the API. Please check the console for details.');
        }
      } else {
        showError('Failed to Test Voice', result.error || 'Failed to test voice');
      }
    } catch (err) {
      console.error('Test Voice Error:', err);
      showError('Error', 'An unexpected error occurred: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setTestingVoice(false);
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

  if (loading && !campaign) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (!campaign) {
    return (
      <Container>
        <Alert variant="danger">
          Campaign not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-600">Campaign details and contact management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
            <Button variant="success" onClick={handleInstantLaunch}>
              <PlayArrowIcon className="w-4 h-4 mr-2" />
              Instant Launch
            </Button>
            <Button variant="primary" onClick={handleRun}>
              <PlayArrowIcon className="w-4 h-4 mr-2" />
              Run Campaign
            </Button>
            <Button variant="secondary" onClick={handleDownloadReport}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Campaign Details */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Campaign Information</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Service Type</label>
                <div className="mt-1">
                  <Badge variant="primary">{campaign.services}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Schedule</label>
                <div className="mt-1 text-gray-900">
                  {campaign.schedule ? new Date(campaign.schedule).toLocaleString() : 'Not scheduled'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Progress</label>
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${campaign.progress_percent}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{campaign.progress_percent}%</span>
                  </div>
                </div>
              </div>
              {campaign.description && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <div className="mt-1 text-gray-900">{campaign.description}</div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Messages</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Voice Message</label>
                <div className="mt-1 p-3 bg-gray-50 rounded border text-gray-900">
                  {campaign.message || 'No message'}
                </div>
              </div>
              {(campaign.services === 'SMS' || campaign.services === 'SMS & PHONE') && (
                <div>
                  <label className="text-sm font-medium text-gray-500">SMS Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded border text-gray-900">
                    {campaign.sms_message || 'No SMS message'}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Voice Management */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Voice Model</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Voice
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded border text-gray-900">
                  {campaign.voice !== null && campaign.voice !== undefined
                    ? (typeof campaign.voice === 'number'
                        ? (voiceModels.find(v => v.id === campaign.voice)?.voice_display_name || `Voice ID: ${campaign.voice}`)
                        : 'Unknown voice')
                    : 'No voice selected'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Voice Model
                </label>
                <Select
                  value={selectedVoiceId?.toString() || ''}
                  onChange={(value) => setSelectedVoiceId(value ? parseInt(value) : null)}
                  options={[
                    { value: '', label: 'Select voice model' },
                    ...voiceModels.map(voice => ({
                      value: voice.id.toString(),
                      label: `${voice.voice_display_name}${voice.is_premium ? ' (Premium)' : ''}`
                    }))
                  ]}
                />
              </div>
              <div>
                <Button
                  variant="primary"
                  onClick={handleSetVoice}
                  disabled={!selectedVoiceId || settingVoice}
                >
                  {settingVoice ? 'Setting...' : 'Set Voice'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Test Voice */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Test Voice</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message to Test
                </label>
                <TextArea
                  value={testMessage}
                  onChange={setTestMessage}
                  placeholder="Enter message to test with voice"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Voice
                </label>
                <Select
                  value={testVoiceId?.toString() || ''}
                  onChange={(value) => setTestVoiceId(value ? parseInt(value) : null)}
                  options={[
                    { value: '', label: 'Select voice model' },
                    ...voiceModels.map(voice => ({
                      value: voice.id.toString(),
                      label: `${voice.voice_display_name}${voice.is_premium ? ' (Premium)' : ''}`
                    }))
                  ]}
                />
              </div>
              <div>
                <Button
                  variant="primary"
                  onClick={handleTestVoice}
                  disabled={!testVoiceId || !testMessage.trim() || testingVoice}
                >
                  {testingVoice ? 'Testing...' : 'Test Voice'}
                </Button>
              </div>
              {testAudioUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audio Preview
                  </label>
                  <audio controls className="w-full" src={testAudioUrl}>
                    Your browser does not support the audio element.
                  </audio>
                  <p className="mt-2 text-xs text-gray-500">
                    <a href={testAudioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Download audio file
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Contacts Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Contacts ({totalCount})</h2>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddContact(true)}
                >
                  <AddIcon className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowBulkUpload(true)}
                >
                  <UploadFileIcon className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No contacts found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Phone Number</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Call Duration</TableHeader>
                      <TableHeader>Credits Consumed</TableHeader>
                      <TableHeader>Carrier</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>{contact.number}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(contact.status)}>
                            {contact.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{contact.call_duration || '0s'}</TableCell>
                        <TableCell>
                          {contact.credit_consumed + contact.credit_consumed_SMS}
                        </TableCell>
                        <TableCell>{contact.carrier || 'N/A'}</TableCell>
                        <TableCell>
                          <DeleteActionButton onClick={() => handleDeleteContact(contact.id)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      hasNext={currentPage < totalPages}
                      hasPrevious={currentPage > 1}
                      totalItems={totalCount}
                      pageSize={25}
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {/* Add Contact Modal */}
        {showAddContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <h3 className="text-lg font-semibold">Add Contact</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={contactFormData.number}
                      onChange={(value) => setContactFormData({ ...contactFormData, number: value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowAddContact(false);
                        setContactFormData({ number: '', other_variables: {} });
                      }}
                      disabled={addingContact}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleAddContact}
                      disabled={addingContact}
                    >
                      {addingContact ? 'Adding...' : 'Add Contact'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <h3 className="text-lg font-semibold">Bulk Upload Contacts</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Excel File <span className="text-red-500">*</span>
                    </label>
                    <FileInput
                      onChange={(files) => setUploadFile(files && files.length > 0 ? files[0] : null)}
                      accept=".xlsx,.xls"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Upload an Excel file with contact numbers
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowBulkUpload(false);
                        setUploadFile(null);
                      }}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleBulkUpload}
                      disabled={uploading || !uploadFile}
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </Container>
  );
};

export default CampaignViewPage;

