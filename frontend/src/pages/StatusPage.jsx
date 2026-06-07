/**
 * StatusPage — Health Dashboard
 * Menampilkan status real-time semua services dengan metrics.
 * Tugas 14: Lead Frontend — feature/status-page-polish
 *
 * Fitur:
 * - Auto-refresh setiap 10 detik dengan countdown indicator
 * - Timestamp last checked
 * - Visual bar chart error rate
 * - Responsive design (mobile-friendly)
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost';
const REFRESH_INTERVAL = 10; // detik

// ─── Warna status ──────────────────────────────────────────────
const STATUS_COLORS = {
  healthy:     { bg: '#dcfce7', text: '#16a34a', border: '#22c55e', dot: '#22c55e' },
  degraded:    { bg: '#fef9c3', text: '#ca8a04', border: '#eab308', dot: '#eab308' },
  unhealthy:   { bg: '#fee2e2', text: '#dc2626', border: '#ef4444', dot: '#ef4444' },
  unreachable: { bg: '#f1f5f9', text: '#64748b', border: '#94a3b8', dot: '#94a3b8' },
};

// ─── Formatters ────────────────────────────────────────────────
function fmtUptime(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${s}d`;
  return `${s}d`;
}

function fmtTime(date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Mini bar chart ─────────────────────────────────────────────
function ErrorRateBar({ rate }) {
  const MAX_RATE = 20; // anggap 20% = 100% bar
  const pct = Math.min((rate / MAX_RATE) * 100, 100);
  const color = rate === 0 ? '#22c55e' : rate < 5 ? '#eab308' : '#ef4444';

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
        <span>Error Rate</span>
        <strong style={{ color }}>{rate}%</strong>
      </div>
      <div style={{
        height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ─── Latency bar chart ──────────────────────────────────────────
function LatencyBars({ latency }) {
  if (!latency) return null;
  const MAX_MS = 500;
  const bars = [
    { label: 'p50', value: latency.p50_ms, color: '#3b82f6' },
    { label: 'p95', value: latency.p95_ms, color: '#8b5cf6' },
    { label: 'avg', value: latency.avg_ms, color: '#06b6d4' },
  ];

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Latency (ms)</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 48 }}>
        {bars.map(({ label, value, color }) => {
          const pct = Math.min((value / MAX_MS) * 100, 100);
          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{value}ms</span>
              <div style={{
                width: '100%',
                height: `${Math.max(pct, 4)}%`,
                maxHeight: 36,
                minHeight: 4,
                background: color,
                borderRadius: 3,
                transition: 'height 0.6s ease',
              }} />
              <span style={{ fontSize: 10, color: '#64748b' }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Single service card ────────────────────────────────────────
function ServiceCard({ name, icon, healthUrl, metricsUrl }) {
  const [health, setHealth]   = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastOk, setLastOk]   = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch(healthUrl);
      const data = await res.json();
      setHealth(data);
      if (data.status === 'healthy') setLastOk(new Date());
    } catch {
      setHealth({ status: 'unreachable' });
    }

    if (metricsUrl) {
      try {
        const mRes  = await fetch(metricsUrl);
        const mData = await mRes.json();
        setMetrics(mData);
      } catch {
        setMetrics(null);
      }
    }

    setLoading(false);
  }, [healthUrl, metricsUrl]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const status = health?.status || 'unreachable';
  const col    = STATUS_COLORS[status] || STATUS_COLORS.unreachable;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: `1px solid ${col.border}`,
      borderLeft: `5px solid ${col.border}`,
      padding: '18px 20px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{name}</div>
            {lastOk && (
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Last OK: {fmtTime(lastOk)}
              </div>
            )}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: col.bg, border: `1px solid ${col.border}`,
          borderRadius: 20, padding: '4px 12px',
        }}>
          {/* Pulse dot */}
          <span style={{
            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
            background: col.dot,
            boxShadow: status === 'healthy' ? `0 0 0 2px ${col.dot}33` : 'none',
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: col.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {loading ? '…' : status}
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      {metrics && (
        <div style={{ marginTop: 14 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 12px',
            fontSize: 13, color: '#475569',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Requests</div>
              <strong style={{ color: '#1e293b', fontSize: 15 }}>{metrics.total_requests ?? 0}</strong>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Errors</div>
              <strong style={{
                color: metrics.total_errors > 0 ? '#ef4444' : '#22c55e', fontSize: 15,
              }}>{metrics.total_errors ?? 0}</strong>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Uptime</div>
              <strong style={{ color: '#1e293b', fontSize: 15 }}>{fmtUptime(metrics.uptime_seconds)}</strong>
            </div>
          </div>

          {/* Error rate bar */}
          <ErrorRateBar rate={metrics.error_rate_percent ?? 0} />

          {/* Latency bars */}
          <LatencyBars latency={metrics.latency} />
        </div>
      )}

      {/* No metrics available */}
      {!metricsUrl && !loading && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
          Metrics tidak tersedia untuk service ini.
        </div>
      )}
    </div>
  );
}

// ─── Countdown ring ─────────────────────────────────────────────
function RefreshCountdown({ seconds, total }) {
  const pct  = ((total - seconds) / total) * 100;
  const r    = 14;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
      <svg width={36} height={36} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={18} cy={18} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3} />
        <circle
          cx={18} cy={18} r={r}
          fill="none" stroke="#3b82f6" strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
        <text
          x={18} y={18}
          textAnchor="middle" dominantBaseline="central"
          style={{ transform: 'rotate(90deg)', transformOrigin: '18px 18px', fontSize: 9, fill: '#64748b', fontWeight: 700 }}
        >
          {seconds}
        </text>
      </svg>
      <span>Refresh dalam <strong>{seconds}d</strong></span>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────
const SERVICES = [
  {
    name:       'Auth Service',
    icon:       '🔐',
    healthUrl:  `${API_URL}/auth/health`,
    metricsUrl: `${API_URL}/auth/metrics`,
  },
  {
    name:       'Item Service',
    icon:       '📦',
    healthUrl:  `${API_URL}/items/health`,
    metricsUrl: `${API_URL}/items/metrics`,
  },
  {
    name:       'API Gateway',
    icon:       '🚪',
    healthUrl:  `${API_URL}/health`,
    metricsUrl: null,
  },
];

export default function StatusPage() {
  const [lastChecked,   setLastChecked]   = useState(new Date());
  const [countdown,     setCountdown]     = useState(REFRESH_INTERVAL);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const timerRef = useRef(null);

  // Global auto-refresh countdown
  useEffect(() => {
    setCountdown(REFRESH_INTERVAL);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setLastChecked(new Date());
          setRefreshKey(k => k + 1);
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleManualRefresh = () => {
    setLastChecked(new Date());
    setRefreshKey(k => k + 1);
    setCountdown(REFRESH_INTERVAL);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)',
      padding: '40px 20px',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
            📊 System Status
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
            Pantau kesehatan semua services secara real-time — Sewain Platform
          </p>

          {/* Refresh indicator row */}
          <div style={{
            marginTop: 16, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              🕐 Last checked:{' '}
              <strong style={{ color: '#1e293b' }}>{fmtTime(lastChecked)}</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <RefreshCountdown seconds={countdown} total={REFRESH_INTERVAL} />
              <button
                onClick={handleManualRefresh}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  border: '1px solid #cbd5e1', background: '#fff',
                  color: '#475569', cursor: 'pointer', fontSize: 13,
                  fontWeight: 600,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                onMouseLeave={e => e.target.style.background = '#fff'}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Service cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} key={refreshKey}>
          {SERVICES.map(svc => (
            <ServiceCard key={svc.name} {...svc} />
          ))}
        </div>

        {/* Footer note */}
        <p style={{ marginTop: 28, fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
          Auto-refresh setiap {REFRESH_INTERVAL} detik · Data bersumber dari /health &amp; /metrics endpoint masing-masing service
        </p>
      </div>
    </div>
  );
}
