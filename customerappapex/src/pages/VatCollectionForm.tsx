import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { FiFileText, FiCheckCircle, FiDownload } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import { supabase } from '../lib/supabase';

export function VatCollectionForm() {
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collection') || '';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    vatNumber: '',
    companyRegistration: '',
    collectionDate: new Date().toISOString().split('T')[0],
    collectionReference: collectionId,
    volumeCollected: '',
    oilType: 'Used Cooking Oil (UCO)',
    siteAddress: '',
    driverName: '',
    vehicleRegistration: '',
    declaration: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Signature pad
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

  const generateVatPdf = () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const w = pdf.internal.pageSize.getWidth();

    // Header
    pdf.setFillColor(26, 32, 44);
    pdf.rect(0, 0, w, 80, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('VAT COLLECTION DECLARATION', w / 2, 35, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('APEX CHEM (PTY) LTD — 1 Lodestar Avenue, Umbogintwini, eManzimtoti, 4026', w / 2, 58, { align: 'center' });

    pdf.setTextColor(33, 37, 41);
    let y = 110;
    const left = 60;
    const valX = 240;

    const addRow = (label: string, value: string) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(label, left, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value || '—', valX, y);
      y += 22;
    };

    // Section: Customer
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('Customer Details', left, y);
    y += 20;
    addRow('Customer Name:', formData.customerName);
    addRow('VAT Number:', formData.vatNumber);
    addRow('Company Registration:', formData.companyRegistration);
    addRow('Site Address:', formData.siteAddress);

    y += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('Collection Details', left, y);
    y += 20;
    addRow('Collection Date:', new Date(formData.collectionDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }));
    addRow('Collection Reference:', formData.collectionReference);
    addRow('Weight Collected:', `${formData.volumeCollected} kg`);
    addRow('Oil Type:', formData.oilType);
    addRow('Driver Name:', formData.driverName);
    addRow('Vehicle Registration:', formData.vehicleRegistration);

    // Declaration text
    y += 20;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const declText = 'I hereby declare that the above information is true and correct. This document serves as confirmation that the waste cooking oil collection was conducted in compliance with applicable VAT regulations and environmental standards. Apex Chem (Pty) Ltd is a registered VAT vendor.';
    const lines = pdf.splitTextToSize(declText, w - 120);
    pdf.text(lines, left, y);
    y += lines.length * 14 + 20;

    // Signature
    const canvas = canvasRef.current;
    if (canvas && hasSigned) {
      const sigData = canvas.toDataURL('image/png');
      pdf.addImage(sigData, 'PNG', left, y, 200, 60);
      y += 70;
    }

    pdf.setDrawColor(100);
    pdf.line(left, y, left + 200, y);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Customer Signature', left, y + 14);

    pdf.line(w - 260, y, w - 60, y);
    pdf.text('Date', w - 260, y + 14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }), w - 260, y + 28);

    // Download
    pdf.save(`VAT-Declaration-${formData.collectionReference || 'form'}.pdf`);
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
        await supabase.from('vat_declarations').insert({
          user_email: user?.email || '',
          customer_name: formData.customerName,
          vat_number: formData.vatNumber,
          company_registration: formData.companyRegistration,
          site_address: formData.siteAddress,
          collection_date: formData.collectionDate || null,
          collection_reference: formData.collectionReference || null,
          volume_litres: formData.volumeCollected ? parseFloat(formData.volumeCollected) : null,
          oil_type: formData.oilType,
          driver_name: formData.driverName,
          vehicle_registration: formData.vehicleRegistration,
          signature_data: signatureData,
          form_data: formData,
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error saving VAT declaration:', err);
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

  if (submitted) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title">VAT Collection Declaration</h1>
        </div>
        <div className="page__content">
          <Card>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <FiCheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
              <h2 style={{ marginBottom: '8px' }}>Declaration Submitted</h2>
              <p className="text-muted" style={{ marginBottom: '24px' }}>
                Your signed VAT collection declaration has been recorded.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Button onClick={generateVatPdf}>
                  <FiDownload style={{ marginRight: '8px' }} /> Download PDF
                </Button>
                <Button variant="secondary" onClick={() => { setSubmitted(false); clearSignature(); }}>
                  <FiFileText style={{ marginRight: '8px' }} /> Submit Another
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">VAT Collection Declaration</h1>
        <p className="page__subtitle">Sign the VAT declaration for a completed oil collection</p>
      </div>

      <div className="page__content">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}><Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiFileText size={18} /> Customer Details
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Customer / Company Name *</label>
                    <input name="customerName" value={formData.customerName} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>VAT Number *</label>
                    <input name="vatNumber" value={formData.vatNumber} onChange={handleChange} required placeholder="e.g., 4123456789" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Company Registration Number</label>
                    <input name="companyRegistration" value={formData.companyRegistration} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Site / Collection Address *</label>
                    <input name="siteAddress" value={formData.siteAddress} onChange={handleChange} required style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
          </Card></div>

          <div style={{ marginBottom: '20px' }}><Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Collection Details</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Collection Date *</label>
                    <input name="collectionDate" type="date" value={formData.collectionDate} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Collection / Job Reference</label>
                    <input name="collectionReference" value={formData.collectionReference} onChange={handleChange} placeholder="e.g., JOB-2026-001" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Weight Collected (kg) *</label>
                    <input name="volumeCollected" type="number" value={formData.volumeCollected} onChange={handleChange} required style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Oil Type</label>
                    <select name="oilType" value={formData.oilType} onChange={handleChange} style={inputStyle}>
                      <option>Used Cooking Oil (UCO)</option>
                      <option>Gum Oil</option>
                      <option>Winterized Oil</option>
                      <option>Acid Oil</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Driver Name</label>
                    <input name="driverName" value={formData.driverName} onChange={handleChange} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Vehicle Registration</label>
                    <input name="vehicleRegistration" value={formData.vehicleRegistration} onChange={handleChange} style={inputStyle} />
                  </div>
                </div>
              </div>
            </div>
          </Card></div>

          {/* Signature */}
          <div style={{ marginBottom: '20px' }}><Card>
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Customer Signature *</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                By signing below, you confirm this collection took place and the details above are correct.
              </p>
              <div style={{ position: 'relative', border: '2px dashed var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '120px', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
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
          </Card></div>

          {/* Declaration */}
          <Card>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '16px' }}>
                <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} id="vatDeclaration" required style={{ marginTop: '4px' }} />
                <label htmlFor="vatDeclaration" style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                  I declare that the above information is true and correct. This document serves as confirmation that the waste cooking oil collection was conducted in compliance with applicable VAT regulations and environmental standards. Apex Chem (Pty) Ltd is a registered VAT vendor.
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button type="submit">
                  <FiFileText style={{ marginRight: '8px' }} /> Sign & Submit Declaration
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
