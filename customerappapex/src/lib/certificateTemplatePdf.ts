import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type TemplateCertificateData = {
  customerName: string;
  certificateNo: string;
  issuedDate: string;
  siteAddress?: string;
  complianceManager?: string;
  companyName?: string;
};

// Loads /template.pdf from public and overlays text according to template layout
export async function generateCertificatePdfFromTemplate(
  data: TemplateCertificateData,
  templateUrl: string = '/template.pdf'
): Promise<Blob> {
  const res = await fetch(templateUrl);
  if (!res.ok) throw new Error('Template PDF not found');
  const templateBytes = await res.arrayBuffer();

  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  // Fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper to draw centered text
  const drawCentered = (
    text: string,
    y: number,
    size: number,
    font = fontRegular,
    color = rgb(0, 0, 0)
  ) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    const x = (width - textWidth) / 2;
    page.drawText(text, { x, y, size, font, color });
  };

  // Certificate number at top-right
  {
    const size = 10;
    const text = `Certificate: ${data.certificateNo}`;
    const textWidth = fontRegular.widthOfTextAtSize(text, size);
    page.drawText(text, { x: width - textWidth - 24, y: height - 28, size, font: fontRegular, color: rgb(0.2,0.2,0.2) });
  }

  // Headings (these should already exist in the template, kept minimal)
  // Presented To - Customer Name
  drawCentered(data.customerName, height * 0.58, 24, fontBold);

  // Do not overlay company name or site address; let the template handle these.

  // Do not overlay compliance manager text on the template.
  // The template already contains the signature; adding text causes duplication.

  // Date Valid (issued date)
  {
    const size = 12;
    const text = data.issuedDate;
    const textWidth = fontRegular.widthOfTextAtSize(text, size);
    const x = width * 0.20 - (textWidth / 2); // align near left date line
    const y = height * 0.19;
    page.drawText(text, { x, y, size, font: fontRegular });
  }

  const outBytes = await pdfDoc.save();
  return new Blob([new Uint8Array(outBytes)], { type: 'application/pdf' });
}
