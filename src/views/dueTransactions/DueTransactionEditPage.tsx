import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dueTransactionService } from '../../api/services/dueTransactionService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import type { DueTransaction, DueTransactionParticular } from '../../types/dueTransaction';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

const DueTransactionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [dueTransaction, setDueTransaction] = useState<DueTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subtotal: 0,
    vat: 0,
    total: 0,
    renew_date: '',
    expire_date: '',
  });
  const [particulars, setParticulars] = useState<DueTransactionParticular[]>([]);

  useEffect(() => {
    if (id) {
      loadDueTransaction();
    }
  }, [id]);

  const loadDueTransaction = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await dueTransactionService.getDueTransactionById(parseInt(id));
      
      if (result.success && result.data) {
        setDueTransaction(result.data);
        setFormData({
          subtotal: result.data.subtotal,
          vat: result.data.vat,
          total: result.data.total,
          renew_date: result.data.renew_date.split('T')[0], // Extract date part
          expire_date: result.data.expire_date.split('T')[0], // Extract date part
        });
        setParticulars(result.data.particulars);
      } else {
        setError(result.error || 'Failed to load due transaction');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Recalculate total if subtotal or VAT changes
    if (field === 'subtotal' || field === 'vat') {
      const newSubtotal = field === 'subtotal' ? Number(value) : formData.subtotal;
      const newVat = field === 'vat' ? Number(value) : formData.vat;
      setFormData(prev => ({
        ...prev,
        total: newSubtotal + newVat
      }));
    }
  };

  const handleParticularChange = (index: number, field: string, value: string | number) => {
    const updatedParticulars = [...particulars];
    updatedParticulars[index] = {
      ...updatedParticulars[index],
      [field]: value
    };
    
    // Recalculate particular total
    if (field === 'amount' || field === 'quantity') {
      const amount = field === 'amount' ? Number(value) : updatedParticulars[index].amount;
      const quantity = field === 'quantity' ? Number(value) : updatedParticulars[index].quantity;
      updatedParticulars[index].total = amount * quantity;
    }
    
    setParticulars(updatedParticulars);
    
    // Recalculate transaction totals
    const newSubtotal = updatedParticulars.reduce((sum, p) => sum + p.total, 0);
    const vatPercent = (formData.vat / formData.subtotal) * 100 || 0;
    const newVat = (newSubtotal * vatPercent) / 100;
    const newTotal = newSubtotal + newVat;
    
    setFormData(prev => ({
      ...prev,
      subtotal: newSubtotal,
      vat: newVat,
      total: newTotal
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dueTransaction) return;

    try {
      setSaving(true);
      
      // For now, we'll update the main transaction fields
      // Note: Updating particulars would require a more complex API endpoint
      // This is a simplified version that updates the main transaction
      
      // Calculate totals from particulars if they exist
      const calculatedSubtotal = particulars.reduce((sum, p) => sum + p.total, 0);
      const finalSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : formData.subtotal;
      const finalVat = formData.vat;
      const finalTotal = finalSubtotal + finalVat;
      
      // Prepare update data with particulars
      const updateData = {
        subtotal: finalSubtotal,
        vat: finalVat,
        total: finalTotal,
        renew_date: formData.renew_date + 'T00:00:00', // Add time component
        expire_date: formData.expire_date + 'T23:59:59', // Add time component
        is_paid: dueTransaction.is_paid,
        pay_date: dueTransaction.pay_date,
        particulars: particulars.map(p => ({
          particular: p.particular,
          type: p.type,
          institute: p.institute || null,
          amount: p.amount,
          quantity: p.quantity
        }))
      };
      
      const result = await dueTransactionService.updateDueTransaction(dueTransaction.id, updateData);
      if (result.success) {
        showSuccess('Updated', 'Due transaction updated successfully');
        navigate(`/due-transactions/${dueTransaction.id}`);
      } else {
        showError('Update Failed', result.error || 'Failed to update due transaction');
      }
    } catch (error) {
      showError('Update Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return 'Rs. 0.00';
    }
    return `Rs. ${numAmount.toFixed(2)}`;
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

  if (error || !dueTransaction) {
    return (
      <Container>
        <Card>
          <CardBody>
            <Alert variant="error">{error || 'Due transaction not found'}</Alert>
            <Button
              variant="secondary"
              onClick={() => navigate('/due-transactions')}
              style={{ marginTop: '1rem' }}
            >
              <ArrowBackIcon style={{ marginRight: '0.5rem' }} />
              Back to List
            </Button>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <RoleBasedWidget allowedRoles={['Super Admin']}>
      <Container>
        <Card>
          <CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h1>Edit Due Transaction #{dueTransaction.id}</h1>
              <Button
                variant="secondary"
                onClick={() => navigate(`/due-transactions/${dueTransaction.id}`)}
              >
                <ArrowBackIcon style={{ marginRight: '0.5rem' }} />
                Back
              </Button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Transaction Details */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Transaction Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Subtotal (Rs.)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.subtotal.toString()}
                      onChange={(value) => handleInputChange('subtotal', parseFloat(value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      VAT (Rs.)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.vat.toString()}
                      onChange={(value) => handleInputChange('vat', parseFloat(value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Total (Rs.)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.total.toString()}
                      onChange={(value) => handleInputChange('total', parseFloat(value) || 0)}
                      required
                      readOnly
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Renew Date
                    </label>
                    <Input
                      type="date"
                      value={formData.renew_date}
                      onChange={(value) => handleInputChange('renew_date', value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Expire Date
                    </label>
                    <Input
                      type="date"
                      value={formData.expire_date}
                      onChange={(value) => handleInputChange('expire_date', value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Particulars */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Particulars</h2>
                {particulars.length === 0 ? (
                  <Alert variant="info">No particulars found.</Alert>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Particular</TableHeader>
                        <TableHeader>Type</TableHeader>
                        <TableHeader>Amount</TableHeader>
                        <TableHeader>Quantity</TableHeader>
                        <TableHeader>Total</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {particulars.map((particular, index) => (
                        <TableRow key={particular.id}>
                          <TableCell>
                            <Input
                              type="text"
                              value={particular.particular}
                              onChange={(value) => handleParticularChange(index, 'particular', value)}
                              style={{ width: '100%' }}
                            />
                          </TableCell>
                          <TableCell>
                            <span
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                backgroundColor: particular.type === 'vehicle' ? '#e3f2fd' : '#f3e5f5',
                                color: particular.type === 'vehicle' ? '#1976d2' : '#7b1fa2',
                                textTransform: 'capitalize'
                              }}
                            >
                              {particular.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={particular.amount.toString()}
                              onChange={(value) => handleParticularChange(index, 'amount', parseFloat(value) || 0)}
                              style={{ width: '100px' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={particular.quantity.toString()}
                              onChange={(value) => handleParticularChange(index, 'quantity', parseInt(value) || 1)}
                              style={{ width: '80px' }}
                            />
                          </TableCell>
                          <TableCell>
                            <strong>{formatCurrency(particular.total)}</strong>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* User Info (Read-only) */}
              <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>User Information</h3>
                <div>
                  <strong>Name:</strong> {dueTransaction.user_info.name || 'N/A'}
                </div>
                <div>
                  <strong>Phone:</strong> {dueTransaction.user_info.phone || 'N/A'}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/due-transactions/${dueTransaction.id}`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                >
                  <SaveIcon style={{ marginRight: '0.5rem' }} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </Container>
    </RoleBasedWidget>
  );
};

export default DueTransactionEditPage;

