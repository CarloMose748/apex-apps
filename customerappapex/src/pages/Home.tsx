import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { FiArchive, FiShield, FiEye, FiTruck } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import type { HomeKpis, CollectionWithRelations, TableColumn } from '../lib/types';
import { DEFAULT_LOCATION } from '../lib/constants';

export function Home() {
  const [kpis, setKpis] = useState<HomeKpis>({
    monthly_collections_count: 0,
    certificates_ready_count: 0
  });
  const [recentCollections, setRecentCollections] = useState<CollectionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      if (!supabase) {
        console.error('Supabase not initialized');
        setLoading(false);
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[Home] No valid session, redirecting to login...');
        window.location.href = '/login';
        return;
      }
      
      const user = session.user;
      
      // Get customer record
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();
        
      if (customerError || !customer) {
        console.error('Customer not found:', customerError);
        // Set default values for no data
        setKpis({
          monthly_collections_count: 0,
          certificates_ready_count: 0
        });
        setRecentCollections([]);
        setLoading(false);
        return;
      }
      
      // Fetch all collections for this customer
      const { data: collections, error: collectionsError } = await supabase
        .from('oil_collections')
        .select(`
          id,
          collection_date,
          collected_volume,
          unit,
          oil_type,
          status,
          verified_by,
          verified_at
        `)
        .eq('customer_id', customer.id)
        .order('collection_date', { ascending: false });
        
      if (collectionsError) {
        console.error('Error fetching collections:', collectionsError);
        // Set default values
        setKpis({
          monthly_collections_count: 0,
          certificates_ready_count: 0
        });
        setRecentCollections([]);
        setLoading(false);
        return;
      }
      
      // Calculate KPIs
      const now = new Date();
      const thisMonth = collections?.filter(c => {
        const collectionDate = new Date(c.collection_date);
        return collectionDate.getMonth() === now.getMonth() && 
               collectionDate.getFullYear() === now.getFullYear();
      }) || [];
      
      const certificatesReady = collections?.filter(c => c.verified_by)?.length || 0;
      
      setKpis({
        monthly_collections_count: thisMonth.length,
        certificates_ready_count: certificatesReady
      });
      
      // Map to CollectionWithRelations format for the table
      const mappedCollections = (collections?.slice(0, 5) || []).map(c => ({
        id: c.id,
        org_id: '1',
        location_id: DEFAULT_LOCATION.id,
        bin_id: '1',
        completed_at: c.collection_date,
        volume_l: c.collected_volume || 0,
        location: DEFAULT_LOCATION,
        certificate: c.verified_by ? {
          id: c.id,
          org_id: '1',
          collection_id: c.id,
          certificate_no: `CERT-${c.id.slice(0, 8)}`,
          pdf_url: '#',
          hash_sha256: '',
          issued_at: c.verified_at || c.collection_date,
          verifier_url: '#'
        } : undefined
      }));
      
      setRecentCollections(mappedCollections);
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setLoading(false);
    }
  };

  const collectionsColumns: TableColumn<CollectionWithRelations>[] = [
    {
      key: 'completed_at',
      label: 'Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'location',
      label: 'Location',
      render: (_, item) => item.location?.name || '-'
    },
    {
      key: 'volume_l',
      label: 'Volume (L)',
      render: (value) => value ? `${value.toFixed(1)}L` : '-'
    },
    {
      key: 'certificate',
      label: 'Certificate',
      render: (_, item) => item.certificate ? 
        <span className="text-success font-medium">Available</span> : 
        <span className="text-muted">Pending</span>
    }
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-content">
          <div>
            <h1 className="page__title">Dashboard</h1>
            <p className="page__subtitle">Welcome to your Apex Customer Portal. Track your collections, carbon impact, and more.</p>
          </div>
          <Link to="/request-pickup" className="btn btn--primary">
            <FiTruck style={{ width: '1rem', height: '1rem' }} />
            Request Pickup
          </Link>
        </div>
      </div>

      <div className="page__content">
        {/* KPI Cards */}
        <div className="stats-grid-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'var(--primary-light)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <FiArchive size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p className="stat-card__label" style={{ marginBottom: '0.25rem' }}>Your Collections This Month</p>
                <p className="stat-card__value" style={{ margin: 0 }}>{kpis.monthly_collections_count}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'var(--warning-bg)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <FiShield size={24} style={{ color: 'var(--warning)' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p className="stat-card__label" style={{ marginBottom: '0.25rem' }}>Your Certificates Ready</p>
                <p className="stat-card__value" style={{ margin: 0 }}>{kpis.certificates_ready_count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Recent Collections */}
        <Card 
          title="Your Recent Collections"
          extra={
            <Link to="/collections" className="btn btn--ghost btn--sm">
              <FiEye style={{ width: '1rem', height: '1rem' }} />
              View Collection History
            </Link>
          }
        >
          <Table
            data={recentCollections}
            columns={collectionsColumns}
            loading={loading}
            emptyMessage="No collections found"
          />
        </Card>
      </div>
    </div>
  );
}