import { useState, useEffect, useRef } from 'react';
import { Table } from '../components/UI/Table';
import { DateRangePicker } from '../components/UI/DateRange';
import { FiSearch, FiExternalLink, FiDownload, FiHelpCircle, FiRefreshCw, FiGlobe, FiShield, FiUpload, FiCheckCircle, FiFileText, FiX } from 'react-icons/fi';
import { generateCertificatePdf, generateCertificatePdfAsync } from '../lib/certificatePdf';
import { generateCertificatePdfFromTemplate } from '../lib/certificateTemplatePdf';
import { downloadFile, forceDownload, saveFileDirectly, isMobileWebview } from '../lib/mobileDownload';
import { supabase, useMockData } from '../lib/supabase';
import type { Certificate, TableColumn, DateRange } from '../lib/types';

export function Certificates() {
  const [activeTab, setActiveTab] = useState<'certificates' | 'iscc'>('certificates');
  const demoCert: any = {
    id: 'demo-cert-001',
    org_id: 'demo-org',
    collection_id: 'demo-collection',
    certificate_no: 'CERT-DEMO-2026-001',
    pdf_url: '',
    hash_sha256: '',
    issued_at: new Date().toISOString(),
    verifier_url: '#',
    customer_name: 'Demo Client',
    job_address: '123 Demo Street, Demo City'
  };
  const [certificates, setCertificates] = useState<Certificate[]>([demoCert]);
  const [filteredCertificates, setFilteredCertificates] = useState<Certificate[]>([demoCert]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);
  const [generatedPdfs, setGeneratedPdfs] = useState<Map<string, { blob: Blob; filename: string }>>(new Map());
  const [generatingPdf, setGeneratingPdf] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (useMockData() || !supabase) {
          // Fallback mock
          const mockCerts: Certificate[] = [
            { id: '1', org_id: '1', collection_id: '1', certificate_no: 'CERT-2025-001', pdf_url: '', hash_sha256: 'demo', issued_at: new Date().toISOString(), verifier_url: '#' },
          ];
          setCertificates(mockCerts);
          setFilteredCertificates(mockCerts);
          return;
        }

        // 1) Fetch certificate photos
        const { data: photos, error: photoError } = await supabase
          .from('oil_collection_photos')
          .select('id, collection_id, photo_type, file_name, caption, created_at')
          .eq('photo_type', 'certificate')
          .order('created_at', { ascending: false });

        if (photoError) throw photoError;
        const collectionIds = (photos || []).map(p => p.collection_id).filter(Boolean);

        // 2) Fetch collections referenced by certificates
        let collections: any[] = [];
        if (collectionIds.length) {
          const { data: colls, error: collError } = await supabase
            .from('oil_collections')
            .select('id, customerName, jobAddress, timestamp')
            .in('id', collectionIds);
          if (collError) throw collError;
          collections = colls || [];
        }

        // 3) Map into Certificate rows, attach customer data
        const certs: (Certificate & { customer_name?: string; job_address?: string })[] = (photos || []).map((p: any) => {
          const col = collections.find(c => c.id === p.collection_id);
          const certNo = p.file_name?.replace(/\.png$/i, '') || `CERT-${new Date(p.created_at).toISOString().slice(0,10).replace(/-/g,'')}-${p.id}`;
          return {
            id: p.id,
            org_id: '1',
            collection_id: p.collection_id,
            certificate_no: certNo,
            pdf_url: '',
            hash_sha256: '',
            issued_at: p.created_at,
            verifier_url: '#',
            customer_name: col?.customerName,
            job_address: col?.jobAddress
          };
        });

        // Fallback: if no certificates are found, add one dummy for viewing
        const fallbackCerts = certs.length ? certs : [
          {
            id: 'demo-cert-001',
            org_id: 'demo-org',
            collection_id: 'demo-collection',
            certificate_no: 'CERT-DEMO-2026-001',
            pdf_url: '',
            hash_sha256: '',
            issued_at: new Date().toISOString(),
            verifier_url: '#',
            customer_name: 'Demo Client',
            job_address: '123 Demo Street, Demo City'
          } as any
        ];

        setCertificates(fallbackCerts as any);
        setFilteredCertificates(fallbackCerts as any);
      } catch (err) {
        console.error('Failed to load certificates:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let filtered = certificates.filter(cert =>
      cert.certificate_no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (dateRange) {
      filtered = filtered.filter(cert => {
        const issueDate = new Date(cert.issued_at);
        return issueDate >= dateRange.from && issueDate <= dateRange.to;
      });
    }

    setFilteredCertificates(filtered);
  }, [searchTerm, dateRange, certificates]);

  const columns: TableColumn<Certificate>[] = [
    {
      key: 'certificate_no',
      label: 'Certificate Number',
      render: (value) => (
        <span className="font-medium font-mono">{value}</span>
      )
    },
    {
      key: 'issued_at',
      label: 'Issue Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'hash_sha256',
      label: 'Hash',
      render: (value) => (
        <span className="font-mono text-sm text-muted">
          {value.substring(0, 12)}...
        </span>
      )
    },
    {
      key: 'pdf_url',
      label: 'Actions',
      render: (_, item) => {
        const certId = item.certificate_no;
        const isGenerating = generatingPdf.has(certId);
        const generatedPdf = generatedPdfs.get(certId);
        
        return (
          <div className="certificates-actions">
            {!generatedPdf && !isGenerating && (
              <button
                className="btn btn--primary btn--sm"
                onClick={async () => {
                  try {
                    setGeneratingPdf(prev => new Set(prev).add(certId));
                    
                    // Build data for PDF
                    const payload = {
                      customerName: (item as any).customer_name || 'Client',
                      certificateNo: item.certificate_no,
                      issuedDate: new Date(item.issued_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }),
                      companyName: 'APEX CHEM (PTY) LTD',
                      complianceManager: 'S Brijlal'
                    };
                    
                    const filename = `${item.certificate_no}.pdf`;
                    
                    // Generate PDF
                    let blob: Blob;
                    try {
                      blob = await generateCertificatePdfFromTemplate({
                        customerName: payload.customerName,
                        certificateNo: payload.certificateNo,
                        issuedDate: payload.issuedDate,
                        siteAddress: (item as any).job_address,
                        complianceManager: payload.complianceManager,
                        companyName: payload.companyName,
                      });
                    } catch (e) {
                      // Fallback: try PNG background, then simple jsPDF
                      blob = await generateCertificatePdfAsync(payload, '/certificate-template.png').catch(() => generateCertificatePdf(payload));
                    }
                    
                    // Store generated PDF
                    setGeneratedPdfs(prev => new Map(prev).set(certId, { blob, filename }));
                    
                  } catch (error) {
                    const message = isMobileWebview() 
                      ? 'Failed to generate certificate. Please try again.'
                      : 'Failed to generate certificate. Please try again.';
                    alert(message);
                    console.error('Certificate generation error:', error);
                  } finally {
                    setGeneratingPdf(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(certId);
                      return newSet;
                    });
                  }
                }}
              >
                <FiDownload size={14} />
                Generate PDF
              </button>
            )}
            
            {isGenerating && (
              <button className="btn btn--primary btn--sm" disabled>
                <FiRefreshCw size={14} className="spin" />
                Generating...
              </button>
            )}
            
            {generatedPdf && (
              <>
                <button
                  className="btn btn--success btn--sm"
                  onClick={async () => {
                    try {
                      // Try multiple direct download methods to avoid "Open" option
                      await forceDownload(generatedPdf.blob, generatedPdf.filename);
                    } catch (error) {
                      try {
                        await saveFileDirectly(generatedPdf.blob, generatedPdf.filename);
                      } catch (error2) {
                        try {
                          await downloadFile(generatedPdf.blob, generatedPdf.filename, 'application/pdf');
                        } catch (fallbackError) {
                          const message = isMobileWebview() 
                            ? 'Unable to save certificate. Please check permissions and try again.'
                            : 'Failed to save certificate. Please try again.';
                          alert(message);
                          console.error('All download methods failed:', fallbackError);
                        }
                      }
                    }
                  }}
                >
                  <FiDownload size={14} />
                  Download PDF
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setGeneratedPdfs(prev => {
                      const newMap = new Map(prev);
                      newMap.delete(certId);
                      return newMap;
                    });
                  }}
                  title="Regenerate PDF"
                >
                  <FiRefreshCw size={14} />
                </button>
              </>
            )}
            
            <a
              href={item.verifier_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost btn--sm"
            >
              <FiExternalLink size={14} />
              Verify
            </a>
          </div>
        );
      }
    }
  ];

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__header-content">
          <h1 className="page__title">Certificates & Compliance</h1>
          <p className="page__subtitle">Download compliance certificates and submit ISCC sustainability declarations.</p>
        </div>
      </div>

      <div className="page__content">
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('certificates')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'certificates' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              color: activeTab === 'certificates' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'certificates' ? 600 : 400,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <FiShield size={16} /> Certificates
          </button>
          <button
            onClick={() => setActiveTab('iscc')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'iscc' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              color: activeTab === 'iscc' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'iscc' ? 600 : 400,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <FiGlobe size={16} /> ISCC Declaration
          </button>
        </div>

        {activeTab === 'certificates' && (
          <>
            {/* Filter Bar */}
            <div className="certificates-filter-bar">
              <div className="certificates-search">
                <FiSearch className="certificates-search__icon" size={16} />
                <input
                  type="text"
                  className="certificates-search__input"
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="certificates-date-range">
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
            </div>

            {/* Certificates Table */}
            <div className="certificates-table-wrapper">
              <Table
                data={filteredCertificates}
                columns={columns}
                loading={loading}
                emptyMessage="No certificates found"
              />
            </div>
            
            {/* Mobile Help */}
            <div className="certificates-help">
              <div className="certificates-help__icon">
                <FiHelpCircle size={24} />
              </div>
              <h3 className="certificates-help__title">Need Help?</h3>
              <p className="certificates-help__text">
                Click "Generate PDF" to create your compliance certificate. Once generated, 
                use "Download PDF" to save it to your device. Each certificate includes 
                blockchain verification for authenticity.
              </p>
            </div>
          </>
        )}

        {activeTab === 'iscc' && <IsccFormEmbedded />}
      </div>
    </div>
  );
}

/* ─── Embedded ISCC Form with Signature & Upload ─── */

function IsccFormEmbedded() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Signature pad handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSigned) {
      alert('Please sign the declaration before submitting.');
      return;
    }
    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        const signatureData = canvasRef.current?.toDataURL('image/png') || null;
        const gpsParts = formData.gpsCoordinates.split(',').map(s => parseFloat(s.trim()));
        await supabase.from('iscc_declarations').insert({
          user_email: user?.email || '',
          company_name: formData.companyName,
          certificate_number: formData.isccCertificateNumber,
          certificate_valid_from: formData.validFrom || null,
          certificate_valid_to: formData.validUntil || null,
          site_name: formData.companyName,
          site_address: formData.physicalAddress,
          site_gps_lat: gpsParts[0] || null,
          site_gps_lng: gpsParts[1] || null,
          feedstock_type: formData.feedstockType,
          feedstock_volume: formData.annualVolume ? parseFloat(formData.annualVolume) : null,
          ghg_value: formData.ghgEmissionValue ? parseFloat(formData.ghgEmissionValue) : null,
          sustainability_criteria: {
            sustainabilityCriteria: formData.sustainabilityCriteria,
            landUseCriteria: formData.landUseCriteria,
            ghgCriteria: formData.ghgCriteria,
          },
          signature_data: signatureData,
          form_data: formData,
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error saving ISCC declaration:', err);
      alert('Error saving declaration. Please try again.');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)', color: 'var(--text)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: 500,
    marginBottom: '4px', color: 'var(--text-muted)',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '20px', marginBottom: '20px',
  };

  if (submitted) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
        <h2 style={{ marginBottom: '8px' }}>ISCC Declaration Submitted</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
          Your signed ISCC sustainability declaration has been saved.
        </p>
        {uploadedFiles.length > 0 && (
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            {uploadedFiles.length} supporting document{uploadedFiles.length > 1 ? 's' : ''} uploaded.
          </p>
        )}
        <button
          className="btn btn--primary"
          onClick={() => { setSubmitted(false); clearSignature(); setUploadedFiles([]); }}
        >
          <FiFileText style={{ marginRight: '8px' }} /> Submit Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Certification Details */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiGlobe size={18} /> Certification Details
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

      {/* Site Information */}
      <div style={cardStyle}>
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

      {/* Feedstock & Volume */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Feedstock & Volume</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Feedstock Type *</label>
              <select name="feedstockType" value={formData.feedstockType} onChange={handleChange} style={inputStyle}>
                <option>Used Cooking Oil (UCO)</option>
                <option>Gum Oil</option>
                <option>Winterized Oil</option>
                <option>Acid Oil</option>
                <option>Waste Vegetable Oil</option>
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

      {/* Sustainability Compliance */}
      <div style={cardStyle}>
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
        </div>
      </div>

      {/* Signature Pad */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Signature *</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Draw your signature below to confirm this declaration.
        </p>
        <div style={{ position: 'relative', border: '2px dashed var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '150px', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasSigned && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', fontSize: '0.875rem', pointerEvents: 'none' }}>
              Sign here
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={clearSignature}
          style={{ marginTop: '8px', padding: '6px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.8125rem', cursor: 'pointer' }}
        >
          Clear Signature
        </button>
      </div>

      {/* File Upload */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Supporting Documents</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Upload any supporting certificates, audit reports, or compliance documents.
        </p>
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', border: '2px dashed var(--border)', borderRadius: '8px', cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}>
          <FiUpload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Click to upload files (PDF, images, documents)</span>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        {uploadedFiles.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadedFiles.map((file, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: 'var(--bg)', borderRadius: '6px', fontSize: '0.875rem',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiFileText size={14} /> {file.name}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </span>
                <button type="button" onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Declaration & Submit */}
      <div style={{ ...cardStyle, marginBottom: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} id="isccDeclaration" required />
          <label htmlFor="isccDeclaration" style={{ fontSize: '0.875rem' }}>
            I declare that the above information is complete and accurate in accordance with ISCC requirements.
          </label>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiUpload size={14} /> Sign & Submit Declaration
          </button>
        </div>
      </div>
    </form>
  );
}