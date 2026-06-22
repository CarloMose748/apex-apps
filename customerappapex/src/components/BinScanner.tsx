import { useEffect, useRef, useState } from 'react';
import { FiX, FiCamera, FiAlertCircle } from 'react-icons/fi';

declare global {
  interface Window {
    Html5Qrcode?: any;
    Html5QrcodeSupportedFormats?: any;
  }
}

interface BinScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  expectedSerials?: string[];   // optional — only accept scans whose payload matches one of these
  title?: string;
}

/**
 * QR scanner modal that uses html5-qrcode (loaded once in index.html).
 * Resolves a bin by its serial number (the QR payload) and calls onScan.
 */
export function BinScanner({ onScan, onClose, expectedSerials, title }: BinScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef   = useRef<any>(null);
  const [error, setError] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [lastScan, setLastScan] = useState<string>('');
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (startedRef.current) return;
      if (!window.Html5Qrcode) {
        setError('QR scanner library not loaded. Please refresh the page.');
        return;
      }
      if (!containerRef.current) return;
      try {
        const id = 'bin-scanner-region';
        containerRef.current.id = id;
        const scanner = new window.Html5Qrcode(id, /* verbose */ false);
        scannerRef.current = scanner;
        startedRef.current = true;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => {
            if (cancelled) return;
            const payload = parseBinPayload(decodedText);
            setLastScan(payload);
            // If expectedSerials provided, validate
            if (expectedSerials && expectedSerials.length > 0) {
              if (!expectedSerials.includes(payload)) {
                setError(`Scanned "${payload}" is not one of your bins. Try a different bin.`);
                return;
              }
            }
            // Stop scanner then notify parent
            scanner.stop().catch(() => { /* ignore */ }).finally(() => {
              setRunning(false);
              onScan(payload);
            });
          },
          (_err: string) => { /* ignore per-frame errors */ }
        );
        setRunning(true);
      } catch (e: any) {
        console.error('Scanner start failed:', e);
        setError(e?.message || 'Failed to start camera. Check browser permissions.');
        setRunning(false);
      }
    }
    start();
    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        try { s.stop().catch(() => {}); } catch { /* noop */ }
        try { s.clear(); } catch { /* noop */ }
      }
    };
  }, [onScan, expectedSerials]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: 'var(--bg)', color: 'var(--text-primary)',
        borderRadius: 16, padding: 18, maxWidth: 480, width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCamera /> {title || 'Scan Bin QR'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>
            <FiX />
          </button>
        </div>

        <div ref={containerRef} style={{
          width: '100%', minHeight: 280, borderRadius: 12, overflow: 'hidden',
          background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {!running && !error && (
            <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>
              <FiCamera size={32} style={{ marginBottom: 8 }} />
              <div>Starting camera…</div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: 12, borderRadius: 8,
            background: 'rgba(239,68,68,0.1)', color: '#dc2626',
            display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.88rem'
          }}>
            <FiAlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>{error}</div>
          </div>
        )}

        {lastScan && !error && (
          <div style={{
            marginTop: 12, padding: 10, borderRadius: 8,
            background: 'rgba(16,185,129,0.1)', color: '#10b981',
            fontSize: '0.88rem', textAlign: 'center'
          }}>
            ✓ Scanned: <strong>{lastScan}</strong>
          </div>
        )}

        {expectedSerials && expectedSerials.length > 0 && (
          <div style={{ marginTop: 10, fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Expected bins: {expectedSerials.slice(0, 3).join(', ')}{expectedSerials.length > 3 ? ` +${expectedSerials.length - 3} more` : ''}
          </div>
        )}

        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'var(--bg-secondary, #1a2433)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 8, padding: 10, fontWeight: 600, cursor: 'pointer'
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// QR payload format generated by the admin bulk generator:
//   {"type":"bin","version":1,"serial":"BIN001","customer_id":null,"issued_at":"..."}
// We accept the serial regardless of whether the JSON envelope is present.
function parseBinPayload(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj.serial === 'string') return obj.serial;
    } catch { /* fall through */ }
  }
  return trimmed;
}
