import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPackage, FiClock, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';

interface BinInfo {
  id: string;
  bin_serial_number: string;
  bin_type: string | null;
  bin_size: string | null;
  bin_status: string | null;
  customer_name: string | null;
  address: string | null;
  location_notes: string | null;
  notes: string | null;
  last_status: string | null;
  last_status_at: string | null;
  last_collection_date: string | null;
  next_scheduled_collection: string | null;
  created_at: string;
}

interface OilCollection {
  id: string;
  bin_serial_number: string | null;
  bin_id: string | null;
  collected_at: string;
  volume_kg: number | null;
  net_mass_kg: number | null;
  oil_type: string | null;
  status: string | null;
}

export function BinDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bin, setBin] = useState<BinInfo | null>(null);
  const [history, setHistory] = useState<OilCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadBin = async (showLoader = true) => {
    if (!id) return;
    if (!supabase) {
      setError('Database connection not available.');
      setLoading(false);
      return;
    }
    if (showLoader) setLoading(true);
    setError('');
    try {
      // id might be the bin UUID OR the bin_serial_number
      // Detect by checking if the string is a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabase.from('bins').select('*');
      if (isUuid) query = query.eq('id', id);
      else query = query.eq('bin_serial_number', id);
      const { data, error: err } = await query.maybeSingle();
      if (err) throw err;
      if (!data) {
        setError(`No bin found with id "${id}". The bin may have been removed.`);
        setBin(null);
        setLoading(false);
        return;
      }
      setBin(data as BinInfo);

      // Load recent collection history for this bin
      const { data: hist } = await supabase
        .from('oil_collections')
        .select('id, bin_serial_number, bin_id, collected_at, volume_kg, net_mass_kg, oil_type, status')
        .or(`bin_id.eq.${data.id},bin_serial_number.eq.${data.bin_serial_number}`)
        .order('collected_at', { ascending: false })
        .limit(10);
      setHistory((hist || []) as OilCollection[]);
    } catch (e: any) {
      console.error('Load bin error:', e);
      setError(e?.message || 'Failed to load bin');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadBin(); /* eslint-disable-next-line */ }, [id]);

  // Real-time refresh when last_status_at changes (push)
  useEffect(() => {
    if (!bin?.id) return;
    const sb = supabase;
    if (!sb) return;
    const channel = sb
      .channel(`bin-${bin.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bins', filter: `id=eq.${bin.id}` },
        () => loadBin(false)
      )
      .subscribe();
    return () => { try { sb.removeChannel(channel); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bin?.id]);

  const statusColor = (s?: string | null) => {
    const v = (s || '').toLowerCase();
    if (!v) return '#6b7280';
    if (v.includes('full') || v.includes('dispatched')) return '#dc2626';
    if (v.includes('stored') || v.includes('received')) return '#10b981';
    if (v.includes('transit') || v.includes('in_field')) return '#3b82f6';
    if (v.includes('closed') || v.includes('archived') || v.includes('unassigned')) return '#9ca3af';
    return '#6b7280';
  };

  const lastStatusDisplay = bin?.last_status || bin?.bin_status || 'unknown';

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} aria-label="Back"
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 22, cursor: 'pointer' }}>
          <FiArrowLeft />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page__title" style={{ margin: 0 }}>Bin {bin?.bin_serial_number || '…'}</h1>
          <p className="page__subtitle" style={{ margin: 0 }}>Status & collection history</p>
        </div>
        <Button variant="secondary" onClick={() => { setRefreshing(true); loadBin(); }}>
          <FiRefreshCw className={refreshing ? 'spin' : ''} /> Refresh
        </Button>
      </div>

      <div className="page__content">
        {loading && (
          <Card><div style={{ padding: 32, textAlign: 'center' }}>Loading bin…</div></Card>
        )}

        {error && (
          <Card>
            <div className="alert alert--error" style={{ margin: 0 }}>
              <FiAlertCircle size={20} />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {bin && (
          <>
            {/* Status card */}
            <Card>
              <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                  background: statusColor(lastStatusDisplay) + '22',
                  border: `2px solid ${statusColor(lastStatusDisplay)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FiPackage size={28} color={statusColor(lastStatusDisplay)} />
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Current status
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: statusColor(lastStatusDisplay), textTransform: 'capitalize' }}>
                    {lastStatusDisplay.replace(/_/g, ' ')}
                  </div>
                  {bin.last_status_at && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      Last updated {new Date(bin.last_status_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
              <Card>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>{bin.bin_type || '—'}</div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Size</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>{bin.bin_size || '—'}</div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Allocated</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>
                    {new Date(bin.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last collection</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>
                    {bin.last_collection_date ? new Date(bin.last_collection_date).toLocaleDateString() : 'Never'}
                  </div>
                </div>
              </Card>
              {bin.next_scheduled_collection && (
                <Card>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Next scheduled</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>
                      {new Date(bin.next_scheduled_collection).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              )}
              {bin.customer_name && (
                <Card>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 4 }}>{bin.customer_name}</div>
                  </div>
                </Card>
              )}
            </div>

            {bin.address && (
              <Card>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Address</div>
                  <div style={{ fontSize: '0.95rem', marginTop: 4 }}>{bin.address}</div>
                </div>
              </Card>
            )}

            {bin.location_notes && (
              <Card>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location notes</div>
                  <div style={{ fontSize: '0.95rem', marginTop: 4 }}>{bin.location_notes}</div>
                </div>
              </Card>
            )}

            {/* Collection history */}
            <div style={{ marginTop: 24 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FiClock /> Collection history
              </h3>
              {history.length === 0 ? (
                <Card>
                  <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No collections yet. Once a driver picks this bin up, the history will appear here.
                  </div>
                </Card>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {history.map(c => (
                    <Card key={c.id}>
                      <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <FiCheckCircle size={20} color="#10b981" />
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <div style={{ fontWeight: 600 }}>
                            {c.oil_type ? c.oil_type.replace(/_/g, ' ') : 'Collection'} — {c.net_mass_kg ?? c.volume_kg ?? '?'} kg
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {new Date(c.collected_at).toLocaleString()} • status: {c.status || '—'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Link to="/request-pickup" style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 10, background: 'var(--primary)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                Request a pickup for this bin
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
