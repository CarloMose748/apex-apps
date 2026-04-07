import { useState } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { FiFileText, FiDownload, FiCheckCircle, FiGlobe } from 'react-icons/fi';

export function IsccForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    isccCertificateNumber: '',
    certificationScope: 'Collection Point',
    validFrom: '',
    validUntil: '',
    physicalAddress: '',
    gpsCoordinates: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    feedstockType: 'Used Cooking Oil (UCO)',
    feedstockOrigin: '',
    annualVolume: '',
    volumeUnit: 'litres',
    ghgEmissionValue: '',
    massBalanceSystem: 'Yes',
    traceabilitySystem: '',
    sustainabilityCriteria: false,
    landUseCriteria: false,
    ghgCriteria: false,
    auditFrequency: 'Annual',
    lastAuditDate: '',
    nonConformities: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
          <h1 className="page__title">ISCC Sustainability Declaration</h1>
        </div>
        <div className="page__content">
          <Card>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
              <h2 style={{ marginBottom: '8px' }}>Declaration Submitted Successfully</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>
                Your ISCC sustainability declaration has been saved.
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
        <h1 className="page__title">ISCC Sustainability Declaration</h1>
        <p className="page__subtitle">International Sustainability & Carbon Certification compliance form</p>
      </div>

      <div className="page__content">
        <form onSubmit={handleSubmit}>
          <Card style={{ marginBottom: '20px' }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>
                <FiGlobe style={{ marginRight: '8px' }} /> Certification Details
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Company Name *</label>
                    <input name="companyName" value={formData.companyName} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ISCC Certificate Number</label>
                    <input name="isccCertificateNumber" value={formData.isccCertificateNumber} onChange={handleChange} placeholder="e.g., ISCC-PLUS-Cert-DE123-45678901" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Certification Scope *</label>
                    <select name="certificationScope" value={formData.certificationScope} onChange={handleChange} style={inputStyle}>
                      <option>Collection Point</option>
                      <option>First Gathering Point</option>
                      <option>Processing Unit</option>
                      <option>Storage Facility</option>
                      <option>Trading Company</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Valid From *</label>
                    <input name="validFrom" type="date" value={formData.validFrom} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Valid Until *</label>
                    <input name="validUntil" type="date" value={formData.validUntil} onChange={handleChange} required style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: '20px' }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Site Information</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Physical Address *</label>
                    <input name="physicalAddress" value={formData.physicalAddress} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>GPS Coordinates</label>
                    <input name="gpsCoordinates" value={formData.gpsCoordinates} onChange={handleChange} placeholder="-29.8587, 31.0218" style={inputStyle} />
                  </div>
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

          <Card style={{ marginBottom: '20px' }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Feedstock & Volume</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Feedstock Type *</label>
                    <select name="feedstockType" value={formData.feedstockType} onChange={handleChange} style={inputStyle}>
                      <option>Used Cooking Oil (UCO)</option>
                      <option>Animal Fat (Tallow)</option>
                      <option>Waste Vegetable Oil</option>
                      <option>Palm Fatty Acid Distillate (PFAD)</option>
                      <option>Other Waste/Residue</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Origin / Source</label>
                    <input name="feedstockOrigin" value={formData.feedstockOrigin} onChange={handleChange} placeholder="e.g., Restaurants, Food Processing" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Annual Volume *</label>
                    <input name="annualVolume" type="number" value={formData.annualVolume} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Unit</label>
                    <select name="volumeUnit" value={formData.volumeUnit} onChange={handleChange} style={inputStyle}>
                      <option value="litres">Litres</option>
                      <option value="tonnes">Tonnes</option>
                      <option value="kg">Kilograms</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>GHG Emission Value (gCO2eq/MJ)</label>
                    <input name="ghgEmissionValue" type="number" step="0.01" value={formData.ghgEmissionValue} onChange={handleChange} style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: '20px' }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Sustainability Compliance</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Mass Balance System *</label>
                    <select name="massBalanceSystem" value={formData.massBalanceSystem} onChange={handleChange} style={inputStyle}>
                      <option>Yes</option>
                      <option>No</option>
                      <option>In Progress</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Traceability System</label>
                    <input name="traceabilitySystem" value={formData.traceabilitySystem} onChange={handleChange} placeholder="e.g., Nabisy, ISCC trace" style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <label style={{ ...labelStyle, marginBottom: '8px' }}>Criteria Met:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="sustainabilityCriteria" checked={formData.sustainabilityCriteria} onChange={handleChange} id="sustainabilityCriteria" />
                    <label htmlFor="sustainabilityCriteria" style={{ fontSize: '0.875rem' }}>Sustainability Criteria (Art. 29(2-7) RED II)</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="landUseCriteria" checked={formData.landUseCriteria} onChange={handleChange} id="landUseCriteria" />
                    <label htmlFor="landUseCriteria" style={{ fontSize: '0.875rem' }}>Land Use Criteria Compliance</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="ghgCriteria" checked={formData.ghgCriteria} onChange={handleChange} id="ghgCriteria" />
                    <label htmlFor="ghgCriteria" style={{ fontSize: '0.875rem' }}>GHG Emission Savings Criteria Met</label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  <div>
                    <label style={labelStyle}>Audit Frequency</label>
                    <select name="auditFrequency" value={formData.auditFrequency} onChange={handleChange} style={inputStyle}>
                      <option>Annual</option>
                      <option>Semi-Annual</option>
                      <option>Quarterly</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Last Audit Date</label>
                    <input name="lastAuditDate" type="date" value={formData.lastAuditDate} onChange={handleChange} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Non-Conformities / Corrective Actions</label>
                  <textarea name="nonConformities" value={formData.nonConformities} onChange={handleChange} rows={3} placeholder="Describe any non-conformities and corrective actions taken..." style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} id="isccDeclaration" required />
                  <label htmlFor="isccDeclaration" style={{ fontSize: '0.875rem' }}>
                    I declare that the above information is complete and accurate in accordance with ISCC requirements.
                  </label>
                </div>
              </div>
            </div>
          </Card>

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
