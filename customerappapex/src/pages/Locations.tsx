import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import { FiSearch, FiPlus } from 'react-icons/fi';
import type { LocationWithStats, TableColumn } from '../lib/types';

export function Locations() {
  const [locations, setLocations] = useState<LocationWithStats[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      const mockLocations: LocationWithStats[] = [
        {
          id: '1',
          org_id: '1',
          name: 'Downtown Kitchen',
          address: '123 Main St, Downtown',
          lat: 40.7128,
          lng: -74.0060,
          bins_count: 3,
          last_collection_date: '2024-01-15',
          next_pickup_date: '2024-01-22'
        },
        {
          id: '2',
          org_id: '1',
          name: 'Westside Deli',
          address: '456 West Ave, Westside',
          bins_count: 2,
          last_collection_date: '2024-01-14'
        },
        {
          id: '3',
          org_id: '1',
          name: 'East Coast Cafe',
          address: '789 East Blvd, Eastside',
          bins_count: 1,
          last_collection_date: '2024-01-12',
          next_pickup_date: '2024-01-20'
        }
      ];
      setLocations(mockLocations);
      setFilteredLocations(mockLocations);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    const filtered = locations.filter(location =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredLocations(filtered);
  }, [searchTerm, locations]);

  const columns: TableColumn<LocationWithStats>[] = [
    {
      key: 'name',
      label: 'Location',
      render: (value, item) => (
        <Link to={`/locations/${item.id}`} className="table__link">
          {value}
        </Link>
      )
    },
    {
      key: 'address',
      label: 'Address',
      render: (value) => value || '-'
    },
    {
      key: 'bins_count',
      label: 'Bins',
      render: (value) => `${value} bins`
    },
    {
      key: 'last_collection_date',
      label: 'Last Collection',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    {
      key: 'next_pickup_date',
      label: 'Next Pickup',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Not scheduled'
    }
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-content">
          <div>
            <h1 className="page__title">My Locations</h1>
            <p className="page__subtitle">Manage your business locations and waste oil collection bins.</p>
          </div>
          <Button variant="primary">
            <FiPlus />
            Add Location
          </Button>
        </div>
      </div>

      <div className="page__content">
        <Card>
          <div className="filter-bar">
            <div className="filter-bar__group">
              <label className="filter-bar__label">Search</label>
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<FiSearch />}
              />
            </div>
          </div>

          <Table
            data={filteredLocations}
            columns={columns}
            loading={loading}
            emptyMessage="No locations found"
            onRowClick={(location) => window.location.href = `/locations/${location.id}`}
          />
        </Card>
      </div>
    </div>
  );
}