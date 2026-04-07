import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Input } from '../components/UI/Input';
import { DateRangePicker } from '../components/UI/DateRange';
import { StatusPill } from '../components/UI/StatusPill';
import { FiSearch } from 'react-icons/fi';
import type { CollectionWithRelations, TableColumn, FilterState } from '../lib/types';
import { DEFAULT_LOCATION } from '../lib/constants';

export function Collections() {
  const [, setAllCollections] = useState<CollectionWithRelations[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<CollectionWithRelations[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      const mockCollections: CollectionWithRelations[] = [
        {
          id: '1',
          org_id: '1',
          location_id: DEFAULT_LOCATION.id,
          bin_id: '1',
          completed_at: '2024-01-15T10:30:00Z',
          volume_l: 45.2,
          net_mass_kg: 41.5,
          contamination_flag: false,
          location: DEFAULT_LOCATION,
          certificate: { id: '1', org_id: '1', collection_id: '1', certificate_no: 'CERT-001', pdf_url: '#', hash_sha256: '', issued_at: '2024-01-15', verifier_url: '#' }
        },
        {
          id: '2',
          org_id: '1',
          location_id: DEFAULT_LOCATION.id,
          bin_id: '2',
          completed_at: '2024-01-14T14:15:00Z',
          volume_l: 32.7,
          net_mass_kg: 30.1,
          contamination_flag: true,
          location: DEFAULT_LOCATION
        }
      ];
      setAllCollections(mockCollections);
      setFilteredCollections(mockCollections);
      setLoading(false);
    }, 800);
  }, []);

  const columns: TableColumn<CollectionWithRelations>[] = [
    {
      key: 'completed_at',
      label: 'Collection Date',
      render: (value, item) => (
        <Link to={`/collections/${item.id}`} className="table__link">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </Link>
      )
    },
    {
      key: 'location',
      label: 'Your Location',
      render: (_, item) => item.location?.name || '-'
    },
    {
      key: 'volume_l',
      label: 'Oil Collected',
      render: (value) => value ? `${value.toFixed(1)}L` : '-'
    },
    {
      key: 'certificate',
      label: 'Certificate Status',
      render: (_, item) => item.certificate ? (
        <StatusPill 
          status="Ready for Download" 
          variant="success" 
        />
      ) : (
        <StatusPill 
          status="Processing" 
          variant="warning" 
        />
      )
    }
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-content">
          <div>
            <h1 className="page__title">Collection History</h1>
            <p className="page__subtitle">View your waste oil collection history and download certificates.</p>
          </div>
          <Link to="/requests" className="btn btn--primary">
            Request Pickup
          </Link>
        </div>
      </div>

      <div className="page__content">
        <Card>
          <div className="filter-bar">
            <div className="filter-bar__group">
              <label className="filter-bar__label">Search</label>
              <Input
                placeholder="Search collections..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                leftIcon={<FiSearch />}
              />
            </div>
            
            <div className="filter-bar__group">
              <label className="filter-bar__label">Date Range</label>
              <DateRangePicker
                value={filters.date_range}
                onChange={(range) => setFilters(prev => ({ ...prev, date_range: range }))}
              />
            </div>
          </div>

          <Table
            data={filteredCollections}
            columns={columns}
            loading={loading}
            emptyMessage="No collections found"
            onRowClick={(collection) => window.location.href = `/collections/${collection.id}`}
          />
        </Card>
      </div>
    </div>
  );
}