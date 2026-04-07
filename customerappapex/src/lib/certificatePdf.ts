import { jsPDF } from 'jspdf';

export type CertificatePdfData = {
  customerName: string;
  certificateNo: string;
  issuedDate: string; // formatted date
  siteAddress?: string;
  complianceManager?: string;
  companyName?: string;
};

// Simple A4 landscape PDF generator matching the provided style cues
export function generateCertificatePdf(data: CertificatePdfData): Blob {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  // Background gradient/shape approximation
  pdf.setFillColor(240, 244, 250);
  pdf.rect(0, 0, width, height, 'F');

  // Heading
  pdf.setTextColor(33, 37, 41);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(48);
  pdf.text('CERTIFICATE', width / 2, 140, { align: 'center' });

  pdf.setFontSize(20);
  pdf.text('SAFE DISPOSAL', width / 2, 100, { align: 'center' });

  pdf.setFont('times', 'normal');
  pdf.setFontSize(16);
  pdf.text('OF USED COOKING OIL', width / 2, 170, { align: 'center' });

  // Presented to / From section
  pdf.setFont('times', 'bold');
  pdf.text('IS HEREBY PRESENTED TO', width / 2, 210, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(24);
  pdf.text(data.customerName, width / 2, 250, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(16);
  pdf.text('FROM', width / 2, 290, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  pdf.text(data.companyName ?? 'APEX CHEM (PTY) LTD', width / 2, 320, { align: 'center' });

  // Body paragraph
  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  const body = `THIS IS TO CERTIFY THAT ALL WASTE/USED COOKING OIL COLLECTED FROM THIS STORE BY YOUR COMPANY NAME, IS ONLY SOLD FOR THE MANUFACTURING PURPOSES OR RENEWABLE ENERGY PRODUCTS & THAT NO COLLECTED WASTE / USED OIL ARE DISTRIBUTED FOR HUMAN USE`;
  const bodyLines = pdf.splitTextToSize(body, width - 160);
  pdf.text(bodyLines, 80, 360);

  // Footer signatures and meta
  pdf.setFont('times', 'bold');
  pdf.text('DATE VALID', 140, height - 120);
  pdf.text('COMPLIANCE MANAGER', width - 260, height - 120);

  pdf.setFont('times', 'normal');
  pdf.text(data.issuedDate, 140, height - 90);
  pdf.text(data.complianceManager ?? 'S Brijlal', width - 240, height - 90);

  // Certificate number small tag
  pdf.setFontSize(10);
  pdf.text(`Certificate: ${data.certificateNo}`, width - 140, 40, { align: 'right' });

  return pdf.output('blob');
}

// Async variant that can draw a background image template before adding text.
export async function generateCertificatePdfAsync(
  data: CertificatePdfData,
  templateImageUrl?: string
): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  // Try draw template image if provided
  if (templateImageUrl) {
    try {
      const imgData = await loadImageAsDataUrl(templateImageUrl);
      pdf.addImage(imgData, 'PNG', 0, 0, width, height, undefined, 'FAST');
    } catch (e) {
      // Fallback to flat background if template fails
      pdf.setFillColor(240, 244, 250);
      pdf.rect(0, 0, width, height, 'F');
    }
  } else {
    pdf.setFillColor(240, 244, 250);
    pdf.rect(0, 0, width, height, 'F');
  }

  // Overlay text content (same as basic generator)
  pdf.setTextColor(33, 37, 41);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(48);
  pdf.text('CERTIFICATE', width / 2, 140, { align: 'center' });

  pdf.setFontSize(20);
  pdf.text('SAFE DISPOSAL', width / 2, 100, { align: 'center' });

  pdf.setFont('times', 'normal');
  pdf.setFontSize(16);
  pdf.text('OF USED COOKING OIL', width / 2, 170, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.text('IS HEREBY PRESENTED TO', width / 2, 210, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(24);
  pdf.text(data.customerName, width / 2, 250, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(16);
  pdf.text('FROM', width / 2, 290, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  pdf.text(data.companyName ?? 'APEX CHEM (PTY) LTD', width / 2, 320, { align: 'center' });

  pdf.setFont('times', 'normal');
  pdf.setFontSize(12);
  const body = `THIS IS TO CERTIFY THAT ALL WASTE/USED COOKING OIL COLLECTED FROM THIS STORE BY YOUR COMPANY NAME, IS ONLY SOLD FOR THE MANUFACTURING PURPOSES OR RENEWABLE ENERGY PRODUCTS & THAT NO COLLECTED WASTE / USED OIL ARE DISTRIBUTED FOR HUMAN USE`;
  const bodyLines = pdf.splitTextToSize(body, width - 160);
  pdf.text(bodyLines, 80, 360);

  pdf.setFont('times', 'bold');
  pdf.text('DATE VALID', 140, height - 120);
  pdf.text('COMPLIANCE MANAGER', width - 260, height - 120);

  pdf.setFont('times', 'normal');
  pdf.text(data.issuedDate, 140, height - 90);
  pdf.text(data.complianceManager ?? 'S Brijlal', width - 240, height - 90);

  pdf.setFontSize(10);
  pdf.text(`Certificate: ${data.certificateNo}`, width - 140, 40, { align: 'right' });

  return pdf.output('blob');
}

async function loadImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
