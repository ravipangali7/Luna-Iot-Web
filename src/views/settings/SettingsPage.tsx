import React, { useState, useEffect } from 'react';
import { settingsService } from '../../api/services/settingsService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import type { MySetting } from '../../types/settings';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import SaveIcon from '@mui/icons-material/Save';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<MySetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    mypay_balance: 0,
    vat_percent: 0,
    call_price: 0,
    sms_price: 0,
    parent_price: 0,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await settingsService.getSettings();
      
      if (result.success && result.data) {
        setSettings(result.data);
        setFormData({
          mypay_balance: result.data.mypay_balance,
          vat_percent: result.data.vat_percent,
          call_price: result.data.call_price,
          sms_price: result.data.sms_price,
          parent_price: result.data.parent_price,
        });
      } else {
        setError(result.error || 'Failed to load settings');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      
      const result = await settingsService.updateSettings(formData);
      
      if (result.success && result.data) {
        setSettings(result.data);
        showSuccess('Updated', 'Settings updated successfully');
      } else {
        showError('Update Failed', result.error || 'Failed to update settings');
      }
    } catch (error) {
      showError('Update Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Card>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner />
            </div>
          </CardBody>
        </Card>
      </Container>
    );
  }

  if (error && !settings) {
    return (
      <Container>
        <Card>
          <CardBody>
            <Alert variant="error">{error}</Alert>
            <Button
              variant="secondary"
              onClick={loadSettings}
              style={{ marginTop: '1rem' }}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <CardBody>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1>System Settings</h1>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              Manage system-wide settings and pricing
            </p>
          </div>

          {error && (
            <Alert variant="error" style={{ marginBottom: '1rem' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
              <div>
                <label htmlFor="mypay_balance" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  MyPay Balance (Rs.)
                </label>
                <Input
                  id="mypay_balance"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.mypay_balance.toString()}
                  onChange={(value) => handleInputChange('mypay_balance', value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="vat_percent" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  VAT Percent (%)
                </label>
                <Input
                  id="vat_percent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.vat_percent.toString()}
                  onChange={(value) => handleInputChange('vat_percent', value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="call_price" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Call Price (Rs.)
                </label>
                <Input
                  id="call_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.call_price.toString()}
                  onChange={(value) => handleInputChange('call_price', value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="sms_price" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  SMS Price (Rs.)
                </label>
                <Input
                  id="sms_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sms_price.toString()}
                  onChange={(value) => handleInputChange('sms_price', value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="parent_price" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Parent Price (Rs.)
                </label>
                <Input
                  id="parent_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.parent_price.toString()}
                  onChange={(value) => handleInputChange('parent_price', value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                >
                  <SaveIcon style={{ marginRight: '0.5rem' }} />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={loadSettings}
                  disabled={saving}
                >
                  Reset
                </Button>
              </div>
            </div>
          </form>
        </CardBody>
      </Card>
    </Container>
  );
};

export default SettingsPage;

