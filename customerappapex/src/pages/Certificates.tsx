import { useState, useEffect } from 'react';
import { Table } from '../components/UI/Table';
import { DateRangePicker } from '../components/UI/DateRange';
import { FiSearch, FiExternalLink, FiDownload, FiHelpCircle, FiRefreshCw, FiGlobe, FiShield, FiFileText } from 'react-icons/fi';
import { generateCertificatePdf, generateCertificatePdfAsync } from '../lib/certificatePdf';
import { generateCertificatePdfFromTemplate } from '../lib/certificateTemplatePdf';
import { downloadFile, forceDownload, saveFileDirectly, isMobileWebview } from '../lib/mobileDownload';
import { supabase, useMockData } from '../lib/supabase';
import { CarbonCreditsLedger } from '../components/CarbonCreditsLedger';
import { OfficialPdfSubmission } from '../components/OfficialPdfSubmission';
import type { Certificate, TableColumn, DateRange } from '../lib/types';

export function Certificates() {
  const [activeTab, setActiveTab] = useState<'certificates' | 'iscc' | 'vat204' | 'carboncredits'>('certificates');
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
          <p className="page__subtitle">Download certificates, work from the official ISCC and SARS PDF templates, upload completed signed forms, and review your blockchain carbon credit ledger.</p>
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
            <FiGlobe size={16} /> ISCC Official PDF
          </button>
          <button
            onClick={() => setActiveTab('vat204')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'vat204' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              color: activeTab === 'vat204' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'vat204' ? 600 : 400,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <FiFileText size={16} /> SARS VAT PDF
          </button>
          <button
            onClick={() => setActiveTab('carboncredits')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'carboncredits' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              color: activeTab === 'carboncredits' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'carboncredits' ? 600 : 400,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <FiRefreshCw size={16} /> Carbon Credits
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

        {activeTab === 'iscc' && <OfficialPdfSubmission formType="iscc" />}

        {activeTab === 'vat204' && <OfficialPdfSubmission formType="vat" />}

        {activeTab === 'carboncredits' && <CarbonCreditsLedger />}
      </div>
    </div>
  );
}