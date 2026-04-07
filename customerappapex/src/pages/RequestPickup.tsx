import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { FiPackage, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

interface Bin {
  id: string;
  customer_id: string;
  bin_serial_number: string;
  bin_type?: string;
  bin_size_liters?: number;
  bin_status?: string;
  location_notes?: string;
  special_instructions?: string;
  last_collection_date?: string;
  next_scheduled_collection?: string;
  collection_frequency?: string;
}

export function RequestPickup() {
  const navigate = useNavigate();
  const [bins, setBins] = useState<Bin[]>([]);
  const [selectedBins, setSelectedBins] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    fetchUserBins();
  }, []);

  const fetchUserBins = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current user
      if (!supabase) {
        setError('Unable to connect to database');
        setLoading(false);
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('Please log in to request pickup');
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Fetch bins for this customer
      const { data, error: binsError } = await supabase
        .from('bins')
        .select('*')
        .eq('customer_id', user.id)
        .eq('bin_status', 'active')
        .order('bin_serial_number');

      if (binsError) {
        console.error('Error fetching bins:', binsError);
        setError('Failed to load your bins. Please try again.');
        return;
      }

      setBins(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleBinSelection = (binId: string) => {
    const newSelection = new Set(selectedBins);
    if (newSelection.has(binId)) {
      newSelection.delete(binId);
    } else {
      newSelection.add(binId);
    }
    setSelectedBins(newSelection);
  };

  const handleSubmit = async () => {
    if (selectedBins.size === 0) {
      setError('Please select at least one bin for pickup');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (!supabase) {
        setError('Unable to connect to database');
        return;
      }

      // Get customer details for the job
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('full_name, address, phone_number, email')
        .eq('id', userId)
        .single();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
        setError('Failed to create pickup request');
        return;
      }

      // Create a job for the selected bins
      const selectedBinsList = bins.filter(bin => selectedBins.has(bin.id));
      
      const jobData = {
        customer_name: customerData.full_name,
        customer_phone: customerData.phone_number || '',
        customer_email: customerData.email || '',
        pickup_address: customerData.address || '',
        dropoff_address: 'Apex Oil Collection Center', // Default dropoff location
        job_type: 'oil_collection',
        description: `Oil collection for ${selectedBins.size} bin(s)`,
        status: 'pending',
        notes: `Customer ID: ${userId}\nBin Serial Numbers: ${selectedBinsList.map(b => b.bin_serial_number).join(', ')}\nBin IDs: ${Array.from(selectedBins).join(', ')}`
      };

      const { error: jobError } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      if (jobError) {
        console.error('Error creating job:', jobError);
        setError(`Failed to create pickup request: ${jobError.message}`);
        return;
      }

      // Success - navigate back to home with success message
      alert('Pickup request submitted successfully! A driver will be assigned soon.');
      navigate('/');
      
    } catch (err) {
      console.error('Error submitting pickup request:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Request Pickup</h1>
        <p className="page__subtitle">Select the bins you'd like collected</p>
      </div>

      <div className="page__content">
        {error && (
          <div className="alert alert--error" style={{ marginBottom: '24px' }}>
            <FiAlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <Card>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p className="text-muted">Loading your bins...</p>
            </div>
          </Card>
        ) : bins.length === 0 ? (
          <Card>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <FiPackage size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
              <p className="text-muted">No bins found. Please contact support to register your bins.</p>
            </div>
          </Card>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              {bins.map((bin) => {
                // Calculate days until next collection for priority indication
                const nextCollection = bin.next_scheduled_collection 
                  ? new Date(bin.next_scheduled_collection) 
                  : null;
                const daysUntilCollection = nextCollection 
                  ? Math.ceil((nextCollection.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                const isPriority = daysUntilCollection !== null && daysUntilCollection <= 3;
                
                const capacity = bin.bin_size_liters || 0;
                const location = bin.location_notes || 'Location not specified';
                
                return (
                <div
                  key={bin.id}
                  onClick={() => toggleBinSelection(bin.id)}
                  style={{ 
                    cursor: 'pointer',
                    borderRadius: 'var(--border-radius)',
                    border: selectedBins.has(bin.id) ? '2px solid var(--primary)' : '1px solid var(--border)',
                    transition: 'all 0.2s ease',
                    background: 'var(--bg)',
                    padding: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div 
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: selectedBins.has(bin.id) ? 'var(--primary)' : 'var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {selectedBins.has(bin.id) && (
                        <FiCheckCircle size={20} style={{ color: 'var(--primary)' }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px' }}>
                            Bin {bin.bin_serial_number}
                          </h3>
                          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                            {location}
                          </p>
                        </div>
                        {isPriority && (
                          <span 
                            className="badge bg-warning-bg"
                            style={{ fontSize: '0.875rem' }}
                          >
                            <span className="text-warning">
                              Due in {daysUntilCollection} day{daysUntilCollection !== 1 ? 's' : ''}
                            </span>
                          </span>
                        )}
                        {!isPriority && nextCollection && (
                          <span 
                            className="badge bg-success-bg"
                            style={{ fontSize: '0.875rem' }}
                          >
                            <span className="text-success">
                              Next: {new Date(nextCollection).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem' }}>
                          <div>
                            <span className="text-muted">Type: </span>
                            <span style={{ fontWeight: 500 }}>{bin.bin_type || 'Standard'}</span>
                          </div>
                          <div>
                            <span className="text-muted">Size: </span>
                            <span style={{ fontWeight: 500 }}>{capacity}L</span>
                          </div>
                          <div>
                            <span className="text-muted">Frequency: </span>
                            <span style={{ fontWeight: 500 }}>{bin.collection_frequency || 'Weekly'}</span>
                          </div>
                        </div>
                        {bin.last_collection_date && (
                          <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '8px' }}>
                            Last collected: {new Date(bin.last_collection_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>

            <div style={{ 
              position: 'sticky', 
              bottom: '20px', 
              background: 'var(--bg)',
              padding: '20px',
              borderRadius: 'var(--border-radius)',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Selected Bins
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {selectedBins.size} bin{selectedBins.size !== 1 ? 's' : ''}
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/')}
                variant="secondary"
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button 
                onClick={handleSubmit}
                disabled={selectedBins.size === 0 || submitting}
              >
                {submitting ? 'Submitting...' : 'Request Pickup'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
