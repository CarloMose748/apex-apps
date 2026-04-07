import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { StatusPill } from '../components/UI/StatusPill';
import { FileDownload } from '../components/UI/FileDownload';
import { FiArrowLeft, FiCamera, FiFileText, FiExternalLink } from 'react-icons/fi';
import type { CollectionWithRelations } from '../lib/types';
import { DEFAULT_LOCATION } from '../lib/constants';

export function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<CollectionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setCollection({
        id: id!,
        org_id: '1',
        location_id: DEFAULT_LOCATION.id,
        bin_id: '1',
        completed_at: '2024-01-15T10:30:00Z',
        driver_id: 'DRV-001',
        volume_l: 45.2,
        density: 0.92,
        net_mass_kg: 41.5,
        contamination_flag: false,
        photos: ['photo1.jpg', 'photo2.jpg'],
        signed_poc_url: '/poc-signed.pdf',
        chain_of_custody_id: 'COC-001',
  location: DEFAULT_LOCATION,
        certificate: { 
          id: '1', 
          org_id: '1', 
          collection_id: id!, 
          certificate_no: 'CERT-001', 
          pdf_url: '/cert-001.pdf', 
          hash_sha256: 'abc123...', 
          issued_at: '2024-01-15', 
          verifier_url: 'https://verify.apex.com/cert-001' 
        }
      });
      setLoading(false);
    }, 800);
  }, [id]);

  if (loading || !collection) {
    return <div className="spinner-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <div className="flex items-center gap-4">
          <Link to="/collections">
            <Button variant="ghost" size="sm">
              <FiArrowLeft />
              Back to Collections
            </Button>
          </Link>
        </div>
        
        <h1 className="page__title">Collection Details</h1>
        <p className="page__subtitle">
          Collection completed on {new Date(collection.completed_at!).toLocaleDateString()}
        </p>
      </div>

      <div className="page__content">
        <div className="grid grid--cols-2 gap-6">
          {/* Collection Info */}
          <Card title="Collection Information">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted">Location:</span>
                <span className="font-medium">{collection.location?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Address:</span>
                <span className="font-medium">{collection.location?.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Driver ID:</span>
                <span className="font-medium">{collection.driver_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Volume:</span>
                <span className="font-medium">{collection.volume_l?.toFixed(1)}L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Mass:</span>
                <span className="font-medium">{collection.net_mass_kg?.toFixed(1)}kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Contamination:</span>
                <StatusPill 
                  status={collection.contamination_flag ? 'Detected' : 'Clean'} 
                  variant={collection.contamination_flag ? 'warning' : 'success'} 
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card title="Documents & Verification">
            <div className="space-y-4">
              {collection.signed_poc_url && (
                <FileDownload href={collection.signed_poc_url} filename="poc-signed.pdf">
                  <FiFileText />
                  Download POC
                </FileDownload>
              )}
              
              {collection.certificate && (
                <>
                  <FileDownload href={collection.certificate.pdf_url} filename={`${collection.certificate.certificate_no}.pdf`}>
                    <FiFileText />
                    Download Certificate
                  </FileDownload>
                  
                  <a 
                    href={collection.certificate.verifier_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button--secondary"
                  >
                    <FiExternalLink />
                    Open Verifier
                  </a>
                </>
              )}
            </div>
          </Card>

          {/* Photos */}
          {collection.photos && collection.photos.length > 0 && (
            <Card title={`Photos (${collection.photos.length})`} className="grid-col-span-2">
              <div className="grid grid--cols-3 gap-4">
                {collection.photos.map((photo, index) => (
                  <div key={index} className="aspect-square bg-panel border rounded flex items-center justify-center">
                    <FiCamera className="text-muted" size={32} />
                    <span className="ml-2 text-sm text-muted">{photo}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}