import { Component } from 'react'

/**
 * ErrorBoundary — React class component untuk menangkap error UI secara global.
 * Menampilkan pesan user-friendly ketika terjadi API error atau crash komponen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log ke console untuk debugging
    console.error('[ErrorBoundary] Uncaught error:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '1rem',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '480px',
            background: '#fff',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
          }}>
            {/* Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              background: '#fef2f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '28px',
            }}>
              ⚠️
            </div>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.75rem',
            }}>
              Terjadi Kesalahan
            </h1>

            <p style={{
              color: '#64748b',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '1.5rem',
            }}>
              Oops! Sesuatu yang tidak terduga terjadi. Silakan muat ulang halaman
              atau hubungi tim Sewain jika masalah berlanjut.
            </p>

            {/* Detail error — hanya tampil di dev mode */}
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                textAlign: 'left',
                background: '#fef9f0',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.8rem',
                color: '#92400e',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Detail Error (Dev Mode)
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#0f766e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => e.target.style.background = '#0d6560'}
                onMouseOut={e => e.target.style.background = '#0f766e'}
              >
                🔄 Muat Ulang
              </button>
              <button
                onClick={() => { window.location.href = '/' }}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => e.target.style.background = '#e2e8f0'}
                onMouseOut={e => e.target.style.background = '#f1f5f9'}
              >
                🏠 Ke Beranda
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
