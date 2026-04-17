import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Input } from '../components/UI/Input';
import { StatusPill } from '../components/UI/StatusPill';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import { formatDate } from '../lib/format';
import { formatKilograms } from '../lib/units';
import type { TableColumn } from '../lib/types';

interface OilCollection {
  id: string;
  collection_date: string;
  collected_volume: number;
  oil_type: string;
  oil_condition: string;
  status: string;
  verified_by: string;
  verified_at: string;
  payment_amount: number;
  notes: string;
  drivers?: {
    full_name: string;
    phone_number: string;
    vehicle_type: string;
  } | null;
}

interface CollectionStats {
  totalCollections: number;
  totalVolume: number;
  totalPayments: number;
  verifiedCollections: number;
}

export function OilCollections() {
  const [collections, setCollections] = useState<OilCollection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<OilCollection[]>([]);
  const [stats, setStats] = useState<CollectionStats>({
    totalCollections: 0,
    totalVolume: 0,
    totalPayments: 0,
    verifiedCollections: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    // Filter collections based on search term
    const filtered = collections.filter(collection => {
      const searchLower = searchTerm.toLowerCase();
      return (
        collection.oil_type?.toLowerCase().includes(searchLower) ||
        collection.drivers?.full_name?.toLowerCase().includes(searchLower) ||
        collection.status?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredCollections(filtered);
  }, [collections, searchTerm]);

  const loadCollections = async () => {
    const startTime = Date.now();
    try {
      setLoading(true);
      setError(null);
      
      console.log('[OilCollections] Starting load...');
      
      // Get current user
      if (!supabase) {
        setError('Supabase not initialized');
        setLoading(false);
        return;
      }
      
      console.log('[OilCollections] Checking session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[OilCollections] Session check took:', Date.now() - startTime, 'ms');
      
      if (!session?.user) {
        console.log('[OilCollections] No valid session, redirecting to login...');
        window.location.href = '/login';
        return;
      }
      
      const user = session.user;
      
      // Get customer record
      console.log('[OilCollections] Fetching customer record...');
      const customerStart = Date.now();
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      
      console.log('[OilCollections] Customer fetch took:', Date.now() - customerStart, 'ms');
        
      if (customerError) {
        console.error('[OilCollections] Customer error:', customerError);
        setError('Error loading customer data');
        setLoading(false);
        return;
      }
      
      if (!customer) {
        // Customer doesn't exist yet - show empty state
        console.log('[OilCollections] No customer record found');
        setCollections([]);
        setLoading(false);
        return;
      }
      
      console.log('[OilCollections] Loading collections for customer:', customer.id);
      
      // Fetch collections for this customer
      const collectionsStart = Date.now();
      const { data, error } = await supabase
        .from('oil_collections')
        .select(`
          id,
          collection_date,
          collected_volume,
          unit,
          oil_type,
          oil_condition,
          collection_method,
          status,
          verified_at,
          verified_by,
          cost_collection_fee,
          notes,
          quality_assessment,
          disposal_method,
          drivers:driver_id (
            full_name,
            phone_number,
            vehicle_type
          )
        `)
        .eq('customer_id', customer.id)
        .order('collection_date', { ascending: false });
      
      console.log('[OilCollections] Collections fetch took:', Date.now() - collectionsStart, 'ms');
        
      if (error) {
        console.error('[OilCollections] Error fetching collections:', error);
        setError('Error loading collections');
        setLoading(false);
        return;
      }
      
      console.log('[OilCollections] Loaded collections:', data?.length || 0, 'items');
      console.log('[OilCollections] Total time:', Date.now() - startTime, 'ms');
      
      setCollections((data as any[])?.map((item: any) => ({
        ...item,
        payment_amount: item.cost_collection_fee || 0, // Map cost_collection_fee to payment_amount
        drivers: Array.isArray(item.drivers) ? item.drivers[0] : item.drivers
      })) || []);
      
      // Calculate stats
      const totalVolume = (data || []).reduce((sum, c) => sum + (c.collected_volume || 0), 0);
      const totalPayments = (data || []).reduce((sum, c) => sum + (c.cost_collection_fee || 0), 0);
      const verifiedCollections = (data || []).filter(c => c.verified_by).length;
      
      setStats({
        totalCollections: data?.length || 0,
        totalVolume,
        totalPayments,
        verifiedCollections
      });
      
    } catch (err) {
      console.error('[OilCollections] Error loading collections:', err);
      
      // If it's an auth timeout, clear the session and reload
      if (err instanceof Error && err.message === 'Auth timeout') {
        console.log('[OilCollections] Auth timeout detected, clearing session...');
        await supabase?.auth.signOut();
        window.location.href = '/login';
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, verified: boolean): string => {
    if (verified) return 'success';
    if (status === 'pending_verification') return 'warning';
    if (status === 'completed') return 'info';
    return 'default';
  };

  const columns: TableColumn<OilCollection>[] = [
    {
      key: 'collection_date',
      label: 'Date',
      render: (_, collection) => formatDate(collection.collection_date)
    },
    {
      key: 'collected_volume',
      label: 'Recovered Mass',
      render: (_, collection) => formatKilograms(collection.collected_volume || 0)
    },
    {
      key: 'oil_type',
      label: 'Oil Type',
      render: (_, collection) => collection.oil_type || 'Unknown'
    },
    {
      key: 'oil_condition',
      label: 'Condition',
      render: (_, collection) => collection.oil_condition || 'N/A'
    },
    {
      key: 'drivers',
      label: 'Driver',
      render: (_, collection) => collection.drivers?.full_name || 'Unknown'
    },
    {
      key: 'payment_amount',
      label: 'Payment',
      render: (_, collection) => `R${(collection.payment_amount || 0).toFixed(2)}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, collection) => (
        <StatusPill 
          status={collection.verified_by ? 'Verified' : collection.status?.replace('_', ' ').toUpperCase() || 'COMPLETED'}
          variant={getStatusColor(collection.status, !!collection.verified_by) as any}
        />
      )
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <FiRefreshCw className="animate-spin" style={{ width: '2rem', height: '2rem', color: 'var(--primary)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="error-state__message">{error}</p>
        <button onClick={loadCollections} className="error-state__button">
          <FiRefreshCw style={{ width: '1rem', height: '1rem' }} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div className="page__header-content">
          <div>
            <h1 className="page__title">Collection History</h1>
            <p className="page__subtitle">Track your oil collection records and history</p>
          </div>
          <button onClick={loadCollections} className="btn btn--secondary">
            <FiRefreshCw style={{ width: '1rem', height: '1rem' }} />
            Refresh
          </button>
        </div>
      </div>

      <div className="page__content">
        {/* Stats Cards */}
        <div className="stats-grid-4">
          <div className="stat-card">
            <div className="stat-card__value">{stats.totalCollections}</div>
            <p className="stat-card__label">Total Collections</p>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{(stats.totalVolume * 0.92).toFixed(1)} kg</div>
            <p className="stat-card__label">Total Recovered Mass</p>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">R{stats.totalPayments.toFixed(2)}</div>
            <p className="stat-card__label">Total Payments</p>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{stats.verifiedCollections}</div>
            <p className="stat-card__label">Verified Collections</p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <div className="card__content">
            <Input
              type="text"
              placeholder="Search collections by oil type, driver, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<FiSearch style={{ width: '1rem', height: '1rem' }} />}
            />
          </div>
        </Card>

        {/* Collections Table */}
        <Card>
          {filteredCollections.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="empty-state__icon">🛢️</div>
              <h3 className="empty-state__title">
                {collections.length === 0 ? 'No Collections Yet' : 'No matching collections'}
              </h3>
              <p className="empty-state__description">
                {collections.length === 0 
                  ? 'Your oil collection history will appear here once collections are completed.'
                  : 'Try adjusting your search terms.'}
              </p>
            </div>
          ) : (
            <Table 
              data={filteredCollections}
              columns={columns}
            />
          )}
        </Card>
      </div>
    </div>
  );
}