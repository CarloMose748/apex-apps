import { useEffect, useMemo, useState } from 'react';
import { FiActivity, FiExternalLink, FiLink2 } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { buildCarbonCreditBlocks, type CarbonCreditBlock, type CarbonCreditSourceRecord } from '../lib/carbonCredits';
import { formatKilograms } from '../lib/units';

const ADMIN_CARBON_CREDITS_URL = 'https://apex-admin-panel-pi.vercel.app/?section=carboncredits';

function shortHash(hash: string): string {
  if (!hash) {
    return '-';
  }

  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

export function CarbonCreditsLedger() {
  const [blocks, setBlocks] = useState<CarbonCreditBlock[]>([]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLedger = async () => {
      if (!supabase) {
        setLoading(false);
        setError('Carbon credit ledger is unavailable because Supabase is not configured.');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          throw new Error('Please sign in to view your carbon credit ledger.');
        }

        setCustomerEmail(user.email);

        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id, full_name, company_name')
          .eq('email', user.email)
          .single();

        if (customerError || !customer) {
          throw new Error('Customer profile not found for this account.');
        }

        setCustomerName(customer.company_name || customer.full_name || user.email);

        const { data: collections, error: collectionsError } = await supabase
          .from('oil_collections')
          .select('id, verified_at, collected_volume, net_mass_kg, oil_type')
          .eq('customer_id', customer.id)
          .not('verified_at', 'is', null)
          .order('verified_at', { ascending: true });

        if (collectionsError) {
          throw collectionsError;
        }

        const sourceRecords: CarbonCreditSourceRecord[] = (collections || []).map((collection: any) => ({
          id: collection.id,
          verifiedAt: collection.verified_at,
          collectedVolumeLitres: collection.collected_volume,
          netMassKg: collection.net_mass_kg,
          oilType: collection.oil_type,
        }));

        const ledgerBlocks = await buildCarbonCreditBlocks(sourceRecords);
        setBlocks(ledgerBlocks);
      } catch (loadError) {
        console.error('Failed to load carbon credit ledger:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load carbon credit ledger.');
      } finally {
        setLoading(false);
      }
    };

    loadLedger();
  }, []);

  const totals = useMemo(() => {
    return blocks.reduce(
      (summary, block) => ({
        recoveredMassKg: summary.recoveredMassKg + block.recoveredMassKg,
        co2eAvoidedKg: summary.co2eAvoidedKg + block.co2eAvoidedKg,
        estimatedCredits: summary.estimatedCredits + block.estimatedCredits,
      }),
      { recoveredMassKg: 0, co2eAvoidedKg: 0, estimatedCredits: 0 },
    );
  }, [blocks]);

  const adminLink = customerEmail
    ? `${ADMIN_CARBON_CREDITS_URL}&customerEmail=${encodeURIComponent(customerEmail)}`
    : ADMIN_CARBON_CREDITS_URL;

  if (loading) {
    return <div className="loading">Building carbon credit chain...</div>;
  }

  if (error) {
    return <div className="error-state__message">{error}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="stat-card">
          <p className="stat-card__label">Verified Collections</p>
          <div className="stat-card__value">{blocks.length}</div>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Recovered Mass</p>
          <div className="stat-card__value">{totals.recoveredMassKg.toFixed(1)} kg</div>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">CO2e Avoided</p>
          <div className="stat-card__value">{totals.co2eAvoidedKg.toFixed(1)} kg</div>
        </div>
        <div className="stat-card">
          <p className="stat-card__label">Estimated Credits</p>
          <div className="stat-card__value">{totals.estimatedCredits.toFixed(3)}</div>
        </div>
      </div>

      <div className="certificates-help" style={{ textAlign: 'left' }}>
        <div className="certificates-help__icon">
          <FiActivity size={24} />
        </div>
        <h3 className="certificates-help__title">Blockchain Carbon Credit Ledger</h3>
        <p className="certificates-help__text">
          Each verified collection becomes a hashed block in your customer ledger. The chain is derived from your verified collections, recovered mass, and estimated carbon savings so the admin team can audit the same record trail.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          <a className="btn btn--primary" href={adminLink} target="_blank" rel="noopener noreferrer">
            <FiExternalLink size={14} />
            Open In Admin Panel
          </a>
          <div className="btn btn--ghost" style={{ cursor: 'default' }}>
            <FiLink2 size={14} />
            {customerName || customerEmail}
          </div>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="no-data">No verified collections have been added to the carbon credit chain yet.</div>
      ) : (
        <div className="certificates-table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Block</th>
                <th>Verified</th>
                <th>Oil Type</th>
                <th>Recovered Mass</th>
                <th>Credits</th>
                <th>Previous Hash</th>
                <th>Block Hash</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.collectionId}>
                  <td>#{block.blockNumber}</td>
                  <td>{new Date(block.verifiedAt).toLocaleDateString('en-ZA')}</td>
                  <td>{block.oilType}</td>
                  <td>{formatKilograms(block.recoveredMassKg)}</td>
                  <td>{block.estimatedCredits.toFixed(3)}</td>
                  <td><span className="font-mono text-sm">{shortHash(block.previousHash)}</span></td>
                  <td><span className="font-mono text-sm">{shortHash(block.blockHash)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
