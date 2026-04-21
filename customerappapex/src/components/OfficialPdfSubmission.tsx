import { ChangeEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiDownload, FiExternalLink, FiFileText, FiUpload } from 'react-icons/fi';
import { Button } from './UI/Button';
import { Card } from './UI/Card';
import { supabase } from '../lib/supabase';

type OfficialFormType = 'iscc' | 'vat';

type SubmissionRecord = {
  fileName: string;
  filePath: string;
  uploadedAt: string;
};

const STORAGE_BUCKET = 'compliance-submissions';

const FORM_CONFIG: Record<OfficialFormType, {
  title: string;
  subtitle: string;
  templatePath: string;
  templateDownloadName: string;
  folder: string;
  referenceLabel: string;
  helperText: string;
}> = {
  iscc: {
    title: 'Official ISCC Self-Declaration PDF',
    subtitle: 'Use the official ISCC PDF supplied by Apex, complete it, then upload the finished signed document back to the portal.',
    templatePath: '/forms/iscc-self-declaration-uco.pdf',
    templateDownloadName: 'Apex-ISCC-Self-Declaration.pdf',
    folder: 'iscc',
    referenceLabel: 'Batch / Site Reference',
    helperText: 'If your browser supports fillable PDFs, you can complete the official form directly in the preview or a new tab before uploading the finished PDF.',
  },
  vat: {
    title: 'Official SARS VAT Declaration PDF',
    subtitle: 'This tab now uses the official SARS PDF file placed in the workspace. Complete the authority-issued form and upload the signed PDF as your submission.',
    templatePath: '/forms/sars-vat-declaration.pdf',
    templateDownloadName: 'Apex-SARS-VAT-Declaration.pdf',
    folder: 'vat',
    referenceLabel: 'Collection Reference',
    helperText: 'Open the PDF in a new tab if you need the browser PDF tools, then upload the completed signed copy here for Apex records.',
  },
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

async function openSignedFile(filePath: string) {
  if (!supabase) {
    return;
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(filePath, 60 * 60);

  if (error || !data?.signedUrl) {
    throw error || new Error('Unable to open the uploaded PDF.');
  }

  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

export function OfficialPdfSubmission({ formType }: { formType: OfficialFormType }) {
  const [searchParams] = useSearchParams();
  const config = FORM_CONFIG[formType];
  const initialReference = searchParams.get('collection') || '';
  const [reference, setReference] = useState(initialReference);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [latestSubmission, setLatestSubmission] = useState<SubmissionRecord | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLatestSubmission = async () => {
      if (!supabase) {
        return;
      }

      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) {
          return;
        }

        const { data, error: listError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list(`${config.folder}/${userId}`, {
            limit: 20,
            sortBy: { column: 'name', order: 'desc' },
          });

        if (listError || !data?.length) {
          return;
        }

        const latestPdf = data.find((item) => item.name.toLowerCase().endsWith('.pdf'));
        if (!latestPdf || !isMounted) {
          return;
        }

        setLatestSubmission({
          fileName: latestPdf.name,
          filePath: `${config.folder}/${userId}/${latestPdf.name}`,
          uploadedAt: latestPdf.created_at || latestPdf.updated_at || '',
        });
      } catch (loadError) {
        console.warn(`Unable to load ${formType} submissions:`, loadError);
      }
    };

    loadLatestSubmission();

    return () => {
      isMounted = false;
    };
  }, [config.folder, formType]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Upload the completed PDF before submitting.');
      return;
    }

    if (selectedFile.type && selectedFile.type !== 'application/pdf') {
      setError('Only PDF uploads are supported for official compliance forms.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!supabase) {
        setLatestSubmission({
          fileName: selectedFile.name,
          filePath: '',
          uploadedAt: new Date().toISOString(),
        });
        setSuccessMessage('The completed PDF has been captured in demo mode.');
        setSelectedFile(null);
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      if (!user) {
        throw new Error('You need to be signed in to submit this form.');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = sanitizeFileName(selectedFile.name);
      const filePath = `${config.folder}/${user.id}/${timestamp}-${safeName}`;
      const manifestPath = `${config.folder}/${user.id}/${timestamp}-submission.json`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, selectedFile, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        if (uploadError.message.toLowerCase().includes('bucket')) {
          throw new Error(`Storage bucket "${STORAGE_BUCKET}" is not set up yet. Run the SQL setup file added under /database before using uploads.`);
        }
        throw uploadError;
      }

      const manifest = {
        formType,
        uploadedAt: new Date().toISOString(),
        reference,
        notes,
        originalFileName: selectedFile.name,
        storedFilePath: filePath,
        userId: user.id,
        userEmail: user.email || '',
        templatePath: config.templatePath,
      };

      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });

      const { error: manifestError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(manifestPath, manifestBlob, {
          contentType: 'application/json',
          upsert: true,
        });

      if (manifestError) {
        throw manifestError;
      }

      setLatestSubmission({
        fileName: selectedFile.name,
        filePath,
        uploadedAt: manifest.uploadedAt,
      });
      setSuccessMessage('Official PDF submitted successfully. Apex can now retrieve the uploaded document from secure storage.');
      setSelectedFile(null);
      setNotes('');
    } catch (submitError) {
      console.error(`Error submitting ${formType} PDF:`, submitError);
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit the completed PDF.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <Card>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiFileText size={20} /> {config.title}
            </h2>
            <p className="text-muted" style={{ margin: '8px 0 0 0' }}>{config.subtitle}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <a href={config.templatePath} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button type="button">
                <FiExternalLink style={{ marginRight: '8px' }} /> Open Official PDF
              </Button>
            </a>
            <a href={config.templatePath} download={config.templateDownloadName} style={{ textDecoration: 'none' }}>
              <Button type="button" variant="secondary">
                <FiDownload style={{ marginRight: '8px' }} /> Download Blank Form
              </Button>
            </a>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{config.helperText}</p>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'grid', gap: '16px' }}>
          <h3 style={{ margin: 0 }}>Official PDF Preview</h3>
          <iframe
            src={`${config.templatePath}#toolbar=1&navpanes=0`}
            title={`${config.title} preview`}
            style={{ width: '100%', minHeight: '720px', border: '1px solid var(--border)', borderRadius: '12px', background: '#fff' }}
          />
        </div>
      </Card>

      <Card>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiUpload size={18} /> Upload Completed PDF
            </h3>
            <p className="text-muted" style={{ margin: '8px 0 0 0' }}>
              Submit the completed and signed authority-issued PDF here so it becomes part of the customer record.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>{config.referenceLabel}</label>
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Optional reference"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>Completed PDF</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>Submission Notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes for the uploaded compliance form"
              rows={4}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg)', resize: 'vertical' }}
            />
          </div>

          {selectedFile && (
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', color: 'var(--text)' }}>
              Selected file: <strong>{selectedFile.name}</strong>
            </div>
          )}

          {error && (
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#86efac', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle size={18} /> {successMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button type="button" onClick={handleSubmit} loading={submitting}>
              <FiUpload style={{ marginRight: '8px' }} /> Submit Completed PDF
            </Button>

            {latestSubmission?.filePath && (
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  try {
                    await openSignedFile(latestSubmission.filePath);
                  } catch (openError) {
                    setError(openError instanceof Error ? openError.message : 'Unable to open the last uploaded file.');
                  }
                }}
              >
                <FiExternalLink style={{ marginRight: '8px' }} /> Open Latest Submission
              </Button>
            )}
          </div>

          {latestSubmission && (
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Latest uploaded file: <strong>{latestSubmission.fileName}</strong>
              {latestSubmission.uploadedAt && ` on ${new Date(latestSubmission.uploadedAt).toLocaleString()}`}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}