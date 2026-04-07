import { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Table } from '../components/UI/Table';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Select } from '../components/UI/Select';
import { StatusPill } from '../components/UI/StatusPill';
import { FiPlus, FiTruck, FiUpload } from 'react-icons/fi';
import type { PickupRequest, TableColumn, SelectOption } from '../lib/types';
import { PickupRequestStatus } from '../lib/types';

export function Requests() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    bin_id: '',
    reason: '',
    est_volume_l: ''
  });

  useEffect(() => {
    // Mock customer pickup requests
    setTimeout(() => {
      const mockRequests: PickupRequest[] = [
        {
          id: '1',
          org_id: '1',
          bin_id: '1',
          requested_by: 'demo@apex.com',
          reason: 'Bin is 80% full - routine pickup',
          est_volume_l: 180,
          status: PickupRequestStatus.SCHEDULED,
          created_at: '2025-10-15T09:00:00Z',
          scheduled_date: '2025-10-19T10:00:00Z'
        },
        {
          id: '2',
          org_id: '1',
          bin_id: '2',
          requested_by: 'demo@apex.com',
          reason: 'Urgent - bin overflow risk',
          est_volume_l: 240,
          status: PickupRequestStatus.REQUESTED,
          created_at: '2025-10-16T14:30:00Z'
        },
        {
          id: '3',
          org_id: '1',
          bin_id: '3',
          requested_by: 'demo@apex.com',
          reason: 'Weekly scheduled pickup',
          est_volume_l: 95,
          status: PickupRequestStatus.COMPLETED,
          created_at: '2025-10-10T11:15:00Z',
          completed_at: '2025-10-12T15:30:00Z'
        }
      ];
      setRequests(mockRequests);
      setLoading(false);
    }, 800);
  }, []);

  const binOptions: SelectOption[] = [
    { value: '', label: 'Select Bin (Optional)' },
    { value: '1', label: 'BIN-001' },
    { value: '2', label: 'BIN-002' },
    { value: '3', label: 'BIN-003' }
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'rejected': return 'danger';
      case 'en_route': case 'collected': return 'warning';
      default: return 'neutral';
    }
  };

  const columns: TableColumn<PickupRequest>[] = [
    {
      key: 'created_at',
      label: 'Request Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (value) => value || '-'
    },
    {
      key: 'est_volume_l',
      label: 'Est. Volume',
      render: (value) => value ? `${value}L` : '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <StatusPill 
          status={value.replace('_', ' ').toUpperCase()} 
          variant={getStatusVariant(value)} 
        />
      )
    },
    {
      key: 'scheduled_date',
      label: 'Scheduled Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Not scheduled'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission
    alert('Pickup request submitted successfully!');
    setShowCreateForm(false);
    setFormData({ bin_id: '', reason: '', est_volume_l: '' });
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-content">
          <div>
            <h1 className="page__title">Request Pickup</h1>
            <p className="page__subtitle">Request waste oil collection for your locations and track pickup status.</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateForm(true)}
          >
            <FiPlus />
            New Pickup Request
          </Button>
        </div>
      </div>

      <div className="page__content">
        {showCreateForm && (
          <Card title="New Pickup Request" className="mb-6">
            <form onSubmit={handleSubmit} className="form">
              <Select
                label="Bin"
                options={binOptions}
                value={formData.bin_id}
                onChange={(e) => setFormData(prev => ({ ...prev, bin_id: e.target.value }))}
              />

              <Input
                label="Estimated Volume (L)"
                type="number"
                value={formData.est_volume_l}
                onChange={(e) => setFormData(prev => ({ ...prev, est_volume_l: e.target.value }))}
                placeholder="Enter estimated volume"
                help="Optional - helps with scheduling"
              />

              <Input
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Describe why pickup is needed"
                required
              />

              <div className="border-2 border-dashed border-border-light rounded p-4 text-center">
                <FiUpload className="mx-auto mb-2 text-muted" size={24} />
                <p className="text-sm text-muted">Click to upload photos (up to 3)</p>
                <p className="text-xs text-muted mt-1">JPG, PNG up to 5MB each</p>
              </div>

              <div className="button-group">
                <Button type="submit" variant="primary">
                  <FiTruck />
                  Submit Request
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card title="Request History">
          <Table
            data={requests}
            columns={columns}
            loading={loading}
            emptyMessage="No pickup requests found"
          />
        </Card>
      </div>
    </div>
  );
}