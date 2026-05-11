import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SearchBar from '../SearchBar'

// Mock lucide-react agar tidak error di lingkungan test
vi.mock('lucide-react', () => ({
  Search: () => <svg data-testid="icon-search" />,
  X: () => <svg data-testid="icon-x" />,
}))

describe('SearchBar Component', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onClear: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  /* ─── Test 1 ─────────────────────────────────────────── */
  it('merender input dengan placeholder default', () => {
    render(<SearchBar {...defaultProps} />)
    const input = screen.getByTestId('search-input')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Cari barang...')
  })

  /* ─── Test 2 ─────────────────────────────────────────── */
  it('merender input dengan placeholder kustom', () => {
    render(<SearchBar {...defaultProps} placeholder="Cari nama barang..." />)
    expect(screen.getByPlaceholderText('Cari nama barang...')).toBeInTheDocument()
  })

  /* ─── Test 3 ─────────────────────────────────────────── */
  it('memanggil onChange saat user mengetik', () => {
    render(<SearchBar {...defaultProps} />)
    const input = screen.getByTestId('search-input')
    fireEvent.change(input, { target: { value: 'kamera' } })
    expect(defaultProps.onChange).toHaveBeenCalledWith('kamera')
  })

  /* ─── Test 4 ─────────────────────────────────────────── */
  it('menampilkan tombol clear saat value tidak kosong', () => {
    render(<SearchBar {...defaultProps} value="kamera" />)
    expect(screen.getByTestId('search-clear-btn')).toBeInTheDocument()
  })

  /* ─── Test 5 ─────────────────────────────────────────── */
  it('tidak menampilkan tombol clear saat value kosong', () => {
    render(<SearchBar {...defaultProps} value="" />)
    expect(screen.queryByTestId('search-clear-btn')).not.toBeInTheDocument()
  })

  /* ─── Test 6 ─────────────────────────────────────────── */
  it('memanggil onChange("") dan onClear saat tombol clear diklik', () => {
    render(<SearchBar {...defaultProps} value="kamera" />)
    fireEvent.click(screen.getByTestId('search-clear-btn'))
    expect(defaultProps.onChange).toHaveBeenCalledWith('')
    expect(defaultProps.onClear).toHaveBeenCalled()
  })

  /* ─── Test 7 ─────────────────────────────────────────── */
  it('memanggil onSubmit saat form disubmit', () => {
    render(<SearchBar {...defaultProps} value="laptop" />)
    fireEvent.submit(screen.getByTestId('search-form'))
    expect(defaultProps.onSubmit).toHaveBeenCalled()
  })

  /* ─── Test 8 ─────────────────────────────────────────── */
  it('menonaktifkan input dan tombol saat disabled=true', () => {
    render(<SearchBar {...defaultProps} disabled />)
    expect(screen.getByTestId('search-input')).toBeDisabled()
    expect(screen.getByTestId('search-submit-btn')).toBeDisabled()
  })
})
