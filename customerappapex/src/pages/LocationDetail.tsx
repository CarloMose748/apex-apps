import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Button } from '../components/UI/Button';
import { StatusPill } from '../components/UI/StatusPill';
import { FiArrowLeft, FiMapPin, FiTruck } from 'react-icons/fi';
import type { Location, BinWithLocation, CollectionWithRelations, TableColumn } from '../lib/types';

export function LocationDetail() {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [bins, setBins] = useState<BinWithLocation[]>([]);
  const [collections, setCollections] = useState<CollectionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bins' | 'collections'>('overview');

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setLocation({
        id: id!,
        org_id: '1',
        name: 'Downtown Kitchen',
        address: '123 Main St, Downtown, NY 10001',
        lat: 40.7128,
        lng: -74.0060
      });

      setBins([
        {
          id: '1',
          org_id: '1',
          location_id: id!,
          asset_tag: 'BIN-001',
          capacity_l: 50,
          oil_type: 'Cooking Oil',
          active: true
        },
        {
          id: '2',
          org_id: '1',
          location_id: id!,
          asset_tag: 'BIN-002',
          capacity_l: 30,
          oil_type: 'Fryer Oil',
          active: true
        }
      ]);

      setCollections([
        {
          id: '1',
          org_id: '1',
          location_id: id!,
          bin_id: '1',
          completed_at: '2024-01-15T10:30:00Z',
          volume_l: 45.2,
          net_mass_kg: 41.5
        },
        {
          id: '2',
          org_id: '1',
          location_id: id!,
          bin_id: '2',
          completed_at: '2024-01-10T14:15:00Z',
          volume_l: 28.3,
          net_mass_kg: 26.8
        }
      ]);

      setLoading(false);
    }, 800);
  }, [id]);

  const binsColumns: TableColumn<BinWithLocation>[] = [
    {
      key: 'asset_tag',
      label: 'Asset Tag'
    },
    {
      key: 'capacity_l',
      label: 'Capacity',
      render: (value) => value ? `${value}L` : '-'
    },
    {
      key: 'oil_type',
      label: 'Oil Type',
      render: (value) => value || '-'
    },
    {
      key: 'active',
      label: 'Status',
      render: (value) => (
        <StatusPill 
          status={value ? 'Active' : 'Inactive'} 
          variant={value ? 'success' : 'neutral'} 
        />
      )
    }
  ];

  const collectionsColumns: TableColumn<CollectionWithRelations>[] = [
    {
      key: 'completed_at',
      label: 'Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'volume_l',
      label: 'Volume (L)',
      render: (value) => value ? `${value.toFixed(1)}L` : '-'
    },
    {
      key: 'net_mass_kg',
      label: 'Mass (kg)',
      render: (value) => value ? `${value.toFixed(1)}kg` : '-'
    }
  ];

  if (loading || !location) {
    return <div className="spinner-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <div className="flex items-center gap-4">
          <Link to="/locations">
            <Button variant="ghost" size="sm">
              <FiArrowLeft />
              Back to Locations
            </Button>
          </Link>
        </div>
        
        <h1 className="page__title">{location.name}</h1>
        <p className="page__subtitle">
          <FiMapPin className="inline mr-2" />
          {location.address}
        </p>

        <div className="page__actions">
          <Button variant="primary">
            <FiTruck />
            Request Pickup
          </Button>
        </div>
      </div>

      <div className="page__content">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6">
          {(['overview', 'bins', 'collections'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`button ${activeTab === tab ? 'button--primary' : 'button--ghost'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid--cols-2 gap-6">
            <Card title="Location Stats">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted">Total Bins:</span>
                  <span className="font-medium">{bins.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Active Bins:</span>
                  <span className="font-medium">{bins.filter(b => b.active).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Recent Collections:</span>
                  <span className="font-medium">{collections.length}</span>
                </div>
              </div>
            </Card>

            <Card title="Map">
              <div className="aspect-video bg-panel border rounded flex items-center justify-center text-muted">
                Map placeholder for {location.lat}, {location.lng}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'bins' && (
          <Card title={`Bins (${bins.length})`}>
            <Table
              data={bins}
              columns={binsColumns}
              emptyMessage="No bins found"
            />
          </Card>
        )}

        {activeTab === 'collections' && (
          <Card title={`Recent Collections (${collections.length})`}>
            <Table
              data={collections}
              columns={collectionsColumns}
              emptyMessage="No collections found"
              onRowClick={(collection) => window.location.href = `/collections/${collection.id}`}
            />
          </Card>
        )}
      </div>
    </div>
  );
}