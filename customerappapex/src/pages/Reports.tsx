import { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Select } from '../components/UI/Select';
import { Button } from '../components/UI/Button';
import { DateRangePicker } from '../components/UI/DateRange';
import { FiDownload, FiFileText, FiTrendingUp } from 'react-icons/fi';
import type { DateRange, EsgSummary } from '../lib/types';

export function Reports() {
  const [period, setPeriod] = useState('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [report, setReport] = useState<EsgSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock data
    setReport({
      id: '1',
      org_id: '1',
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      total_l: 1247.3,
      co2e_kg: 2547.8,
      pdf_url: '/esg-report-jan-2024.pdf'
    });
  }, []);

  const periodOptions = [
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleGenerateReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Report generated! Check downloads folder.');
    }, 2000);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">ESG Reports</h1>
        <p className="page__subtitle">View your environmental impact and carbon savings from waste oil recycling.</p>
      </div>

      <div className="page__content">
        <div className="grid grid--cols-2 gap-6">
          {/* Report Configuration */}
          <Card title="Report Configuration">
            <div className="form">
              <Select
                label="Report Period"
                options={periodOptions}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />

              {period === 'custom' && (
                <DateRangePicker
                  label="Custom Date Range"
                  value={dateRange}
                  onChange={setDateRange}
                />
              )}

              <div className="button-group">
                <Button onClick={handleGenerateReport} loading={loading}>
                  <FiFileText />
                  Download ESG Report
                </Button>
                
                <Button variant="secondary">
                  <FiDownload />
                  Export Carbon Data
                </Button>
              </div>
            </div>
          </Card>

          {/* Current Period Summary */}
          <Card title="Your Environmental Impact">
            {report && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-success-bg rounded">
                  <div>
                    <p className="text-sm text-success">Your Oil Recycled This Month</p>
                    <p className="text-2xl font-bold text-success">{report.total_l.toFixed(1)}L</p>
                  </div>
                  <FiTrendingUp className="text-success" size={32} />
                </div>

                <p className="text-sm text-muted">
                  Period: {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                </p>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}