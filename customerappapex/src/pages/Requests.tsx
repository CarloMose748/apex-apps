import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { StatusPill } from '../components/UI/StatusPill';
import { FiPlus, FiTruck, FiMapPin, FiClock, FiRefreshCw } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

interface JobRequest {
  id: string;
  customer_name: string;
  pickup_address: string;
  description: string;
  status: string;
  notes: string;
  created_at: string;
  driver_id?: string;
  assigned_driver?: string;
}

export function Requests() {
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');

      if (!supabase) {
        setError('Unable to connect to database');
        setLoading(false);
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Please log in to view your requests');
        setLoading(false);
        return;
      }

      // Fetch jobs for this customer — match by email or by customer_id in notes
      const { data: customer } = await supabase
        .from('customers')
        .select('id, full_name, email')
        .eq('email', user.email)
        .single();

      if (!customer) {
        setLoading(false);
        return;
      }

      // Query jobs that belong to this customer
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .or(`customer_email.eq.${customer.email},customer_name.eq.${customer.full_name}`)
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        // Fallback: try querying with notes containing customer ID
        const { data: fallbackJobs } = await supabase
          .from('jobs')
          .select('*')
          .ilike('notes', `%${customer.id}%`)
          .order('created_at', { ascending: false });
        
        setRequests(fallbackJobs || []);
      } else {
        setRequests(jobs || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (status) {
      case 'completed': case 'verified': return 'success';
      case 'in_progress': case 'assigned': case 'en_route': return 'warning';
      case 'rejected': case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting Assignment';
      case 'assigned': return 'Driver Assigned';
      case 'in_progress': return 'In Progress';
      case 'en_route': return 'Driver En Route';
      case 'completed': return 'Completed';
      case 'verified': return 'Verified';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      default: return status.replace(/_/g, ' ').toUpperCase();
    }
  };

  const extractGps = (notes: string) => {
    const match = notes?.match(/GPS Location:\s*([-\d.]+),\s*([-\d.]+)/);
    if (match) return { lat: match[1], lng: match[2] };
    return null;
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-content">
          <div>
            <h1 className="page__title">My Pickup Requests</h1>
            <p className="page__subtitle">Track the status of your waste oil collection requests.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={loadRequests} disabled={loading}>
              <FiRefreshCw size={16} style={{ marginRight: '4px' }} />
              Refresh
            </Button>
            <Link to="/request-pickup">
              <Button variant="primary">
                <FiPlus size={16} style={{ marginRight: '4px' }} />
                New Request
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="page__content">
        {error && (
          <div className="alert alert--error" style={{ marginBottom: '16px' }}>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <Card>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p className="text-muted">Loading your requests...</p>
            </div>
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <FiTruck size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', display: 'block' }} />
              <h3 style={{ marginBottom: '8px' }}>No pickup requests yet</h3>
              <p className="text-muted" style={{ marginBottom: '24px' }}>
                Request a pickup and it will appear here so you can track its progress.
              </p>
              <Link to="/request-pickup">
                <Button variant="primary">
                  <FiPlus size={16} style={{ marginRight: '4px' }} />
                  Request Your First Pickup
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {requests.map((job) => {
              const gps = extractGps(job.notes || '');
              return (
                <div
                  key={job.id}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--border-radius)',
                    padding: '20px',
                    borderLeft: `4px solid ${
                      job.status === 'completed' || job.status === 'verified' ? 'var(--success, #10b981)' :
                      job.status === 'pending' ? 'var(--primary)' :
                      job.status === 'in_progress' || job.status === 'assigned' ? '#f59e0b' :
                      'var(--border)'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>
                        {job.description || 'Oil Collection Request'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        <FiClock size={12} />
                        {new Date(job.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' at '}
                        {new Date(job.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <StatusPill 
                      status={getStatusLabel(job.status)} 
                      variant={getStatusVariant(job.status)} 
                    />
                  </div>

                  {job.pickup_address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <FiMapPin size={12} />
                      {job.pickup_address}
                    </div>
                  )}

                  {gps && (
                    <div style={{ marginTop: '8px' }}>
                      <a
                        href={`https://www.google.com/maps?q=${gps.lat},${gps.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none' }}
                      >
                        View on Map
                      </a>
                    </div>
                  )}

                  {job.status === 'completed' && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <Link to={`/vat-declaration?collection=${job.id}`} style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        Sign VAT Declaration
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}