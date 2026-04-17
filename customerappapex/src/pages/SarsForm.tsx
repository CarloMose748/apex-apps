import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { FiFileText, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { supabase } from '../lib/supabase';

export function SarsForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    tradingName: '',
    registrationNumber: '',
    vatNumber: '',
    taxReferenceNumber: '',
    physicalAddress: '',
    postalAddress: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    financialYearEnd: '',
    wasteType: 'Used Cooking Oil (UCO)',
    totalVolumeCollected: '',
    totalValueDeclared: '',
    periodFrom: '',
    periodTo: '',
    declaration: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('sars_declarations').insert({
          user_email: user?.email || '',
          company_name: formData.companyName,
          company_registration: formData.registrationNumber,
          vat_number: formData.vatNumber,
          tax_reference: formData.taxReferenceNumber,
          waste_type: formData.wasteType,
          waste_volume: formData.totalVolumeCollected ? parseFloat(formData.totalVolumeCollected) : null,
          waste_value: formData.totalValueDeclared ? parseFloat(formData.totalValueDeclared) : null,
          period_from: formData.periodFrom || null,
          period_to: formData.periodTo || null,
          declaration_date: new Date().toISOString().split('T')[0],
          form_data: formData,
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error saving SARS declaration:', err);
      alert('Error saving declaration. Please try again.');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: 500,
    marginBottom: '4px', color: 'var(--text-muted)',
  };

  if (submitted) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title">SARS Waste Disposal Declaration</h1>
        </div>
        <div className="page__content">
          <Card>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
              <h2 style={{ marginBottom: '8px' }}>Form Submitted Successfully</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>
                Your SARS waste disposal declaration has been saved. You can download a copy below.
              </p>
              <Button onClick={() => setSubmitted(false)}>
                <FiFileText style={{ marginRight: '8px' }} /> Submit Another
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">SARS Waste Disposal Declaration</h1>
        <p className="page__subtitle">Complete the form for SARS tax compliance reporting</p>
      </div>

      <div className="page__content">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>
                <FiFileText style={{ marginRight: '8px' }} /> Company Information
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Registered Company Name *</label>
                    <input name="companyName" value={formData.companyName} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Trading Name</label>
                    <input name="tradingName" value={formData.tradingName} onChange={handleChange} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Registration Number *</label>
                    <input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>VAT Number</label>
                    <input name="vatNumber" value={formData.vatNumber} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Tax Reference Number *</label>
                    <input name="taxReferenceNumber" value={formData.taxReferenceNumber} onChange={handleChange} required style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
            </Card>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Contact Details</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Physical Address *</label>
                  <input name="physicalAddress" value={formData.physicalAddress} onChange={handleChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Postal Address</label>
                  <input name="postalAddress" value={formData.postalAddress} onChange={handleChange} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Contact Person *</label>
                    <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <input name="contactPhone" type="tel" value={formData.contactPhone} onChange={handleChange} required style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
            </Card>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Waste Disposal Declaration</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Financial Year End *</label>
                    <input name="financialYearEnd" type="date" value={formData.financialYearEnd} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Waste Type</label>
                    <select name="wasteType" value={formData.wasteType} onChange={handleChange} style={inputStyle}>
                      <option>Used Cooking Oil (UCO)</option>
                      <option>Gum Oil</option>
                      <option>Winterized Oil</option>
                      <option>Acid Oil</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Reporting Period From *</label>
                    <input name="periodFrom" type="date" value={formData.periodFrom} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Reporting Period To *</label>
                    <input name="periodTo" type="date" value={formData.periodTo} onChange={handleChange} required style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Total Mass Collected (kg) *</label>
                    <input name="totalVolumeCollected" type="number" value={formData.totalVolumeCollected} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Total Value Declared (ZAR) *</label>
                    <input name="totalValueDeclared" type="number" step="0.01" value={formData.totalValueDeclared} onChange={handleChange} required style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} id="sarsDeclaration" required />
                  <label htmlFor="sarsDeclaration" style={{ fontSize: '0.875rem' }}>
                    I declare that the information provided is true and correct to the best of my knowledge.
                  </label>
                </div>
              </div>
            </div>
            </Card>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button type="submit">
              <FiDownload style={{ marginRight: '8px' }} /> Submit Declaration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
