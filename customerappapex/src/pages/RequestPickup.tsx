import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { FiPackage, FiCheckCircle, FiAlertCircle, FiPlus, FiMapPin, FiNavigation } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { formatKilograms } from '../lib/units';

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
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBin, setManualBin] = useState({
    serial: '',
    type: 'Standard (110.4 kg)',
    notes: '',
    urgency: 'normal'
  });
  const [storeLocation, setStoreLocation] = useState({
    address: '',
    lat: '',
    lng: '',
    locatingGps: false,
    gpsError: '',
  });

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setStoreLocation(prev => ({ ...prev, gpsError: 'Geolocation is not supported by your browser' }));
      return;
    }
    setStoreLocation(prev => ({ ...prev, locatingGps: true, gpsError: '' }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStoreLocation(prev => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          locatingGps: false,
        }));
      },
      (err) => {
        setStoreLocation(prev => ({
          ...prev,
          locatingGps: false,
          gpsError: err.code === 1 ? 'Location permission denied. Please allow location access or enter address manually.' : 'Unable to detect location. Please enter address manually.',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
    if (selectedBins.size === 0 && !manualBin.serial.trim()) {
      setError('Please select at least one bin or enter a bin manually');
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
        pickup_address: storeLocation.address || customerData.address || '',
        dropoff_address: 'Apex Oil Collection Center',
        job_type: 'oil_collection',
        description: `Oil collection for ${selectedBins.size} bin(s)${manualBin.serial ? ` + manual bin: ${manualBin.serial} (${manualBin.type})` : ''}`,
        status: 'pending',
        notes: `Customer ID: ${userId}\nBin Serial Numbers: ${selectedBinsList.map(b => b.bin_serial_number).join(', ')}${manualBin.serial ? `\nManual Bin: ${manualBin.serial} (${manualBin.type})` : ''}\nBin IDs: ${Array.from(selectedBins).join(', ')}\nUrgency: ${manualBin.urgency}${storeLocation.lat && storeLocation.lng ? `\nGPS Location: ${storeLocation.lat}, ${storeLocation.lng}` : ''}${storeLocation.address ? `\nStore Address: ${storeLocation.address}` : ''}${manualBin.notes ? `\nAdditional Notes: ${manualBin.notes}` : ''}`
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
                            <span style={{ fontWeight: 500 }}>{formatKilograms(capacity)}</span>
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

            {/* Store Location */}
            <div style={{ marginBottom: '24px' }}><Card>
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiMapPin size={18} style={{ color: 'var(--primary)' }} />
                  Store / Pickup Location
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Share your location so the driver can find you easily.
                </p>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-muted)' }}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={storeLocation.address}
                      onChange={e => setStoreLocation(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g., 45 Main Road, Durban, 4001"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={storeLocation.locatingGps}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--primary)',
                        background: 'transparent', color: 'var(--primary)', fontSize: '0.875rem',
                        cursor: storeLocation.locatingGps ? 'wait' : 'pointer', fontWeight: 500,
                      }}
                    >
                      <FiNavigation size={16} />
                      {storeLocation.locatingGps ? 'Detecting...' : 'Use My Current Location'}
                    </button>
                    {storeLocation.lat && storeLocation.lng && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiCheckCircle size={14} /> GPS: {storeLocation.lat}, {storeLocation.lng}
                      </span>
                    )}
                  </div>
                  {storeLocation.gpsError && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--error, #ef4444)' }}>
                      {storeLocation.gpsError}
                    </p>
                  )}
                </div>
              </div>
            </Card></div>

            {/* Manual Bin Entry */}
            <div style={{ marginBottom: '24px' }}><Card>
              <div style={{ padding: '20px' }}>
                <div 
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: showManualEntry ? '16px' : 0 }}
                >
                  <FiPlus size={20} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {showManualEntry ? 'Hide' : 'Add'} Manual Bin Entry
                  </span>
                </div>
                {showManualEntry && (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-muted)' }}>
                        Bin Serial Number
                      </label>
                      <input
                        type="text"
                        value={manualBin.serial}
                        onChange={e => setManualBin(prev => ({ ...prev, serial: e.target.value }))}
                        placeholder="e.g., BIN-001 or IBC-A23"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-muted)' }}>
                          Bin Type
                        </label>
                        <select
                          value={manualBin.type}
                          onChange={e => setManualBin(prev => ({ ...prev, type: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)' }}
                        >
                          <option>Standard (110.4 kg)</option>
                          <option>Large (220.8 kg)</option>
                          <option>Small (73.6 kg)</option>
                          <option>Commercial (607.2 kg)</option>
                          <option>Industrial (920.0 kg IBC)</option>
                          <option>Drum (193.2 kg)</option>
                          <option>Storage Tank</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-muted)' }}>
                          Urgency
                        </label>
                        <select
                          value={manualBin.urgency}
                          onChange={e => setManualBin(prev => ({ ...prev, urgency: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)' }}
                        >
                          <option value="normal">Normal</option>
                          <option value="urgent">Urgent</option>
                          <option value="scheduled">Scheduled</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-muted)' }}>
                        Additional Notes
                      </label>
                      <textarea
                        value={manualBin.notes}
                        onChange={e => setManualBin(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Location details, special instructions, etc."
                        rows={3}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', resize: 'vertical', background: 'var(--bg)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card></div>

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
                disabled={(selectedBins.size === 0 && !manualBin.serial.trim()) || submitting}
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
