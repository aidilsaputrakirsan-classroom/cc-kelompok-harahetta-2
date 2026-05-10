import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ItemForm from '../ItemForm'

describe('ItemForm Component', () => {
  const mockSubmit = vi.fn()
  const mockCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  /* ─── Test 1 ─────────────────────────────────────────── */
  it('merender form dengan semua field yang diperlukan', () => {
    render(<ItemForm onSubmit={mockSubmit} />)
    expect(screen.getByTestId('input-nama')).toBeInTheDocument()
    expect(screen.getByTestId('input-deskripsi')).toBeInTheDocument()
    expect(screen.getByTestId('input-harga')).toBeInTheDocument()
    expect(screen.getByTestId('input-stok')).toBeInTheDocument()
  })

  /* ─── Test 2 ─────────────────────────────────────────── */
  it('menampilkan tombol "Tambah Barang" pada mode tambah', () => {
    render(<ItemForm onSubmit={mockSubmit} />)
    expect(screen.getByTestId('btn-submit')).toHaveTextContent('Tambah Barang')
  })

  /* ─── Test 3 ─────────────────────────────────────────── */
  it('menampilkan tombol "Simpan Perubahan" pada mode edit', () => {
    const editData = { nama: 'Laptop', deskripsi: '', harga_per_hari: 100000, stok: 2 }
    render(<ItemForm initialData={editData} onSubmit={mockSubmit} />)
    expect(screen.getByTestId('btn-submit')).toHaveTextContent('Simpan Perubahan')
  })

  /* ─── Test 4 ─────────────────────────────────────────── */
  it('mengisi form dan berhasil submit dengan data yang valid', () => {
    render(<ItemForm onSubmit={mockSubmit} onCancel={mockCancel} />)

    fireEvent.change(screen.getByTestId('input-nama'), { target: { value: 'Drone DJI' } })
    fireEvent.change(screen.getByTestId('input-deskripsi'), { target: { value: 'Drone untuk aerial' } })
    fireEvent.change(screen.getByTestId('input-harga'), { target: { value: '350000' } })
    fireEvent.change(screen.getByTestId('input-stok'), { target: { value: '3' } })

    fireEvent.submit(screen.getByTestId('item-form'))

    expect(mockSubmit).toHaveBeenCalledOnce()
    expect(mockSubmit).toHaveBeenCalledWith({
      nama: 'Drone DJI',
      deskripsi: 'Drone untuk aerial',
      harga_per_hari: 350000,
      stok: 3,
    })
  })

  /* ─── Test 5 ─────────────────────────────────────────── */
  it('validasi: menampilkan error saat nama kosong dan tidak memanggil onSubmit', () => {
    render(<ItemForm onSubmit={mockSubmit} />)

    // isi harga saja, nama dibiarkan kosong
    fireEvent.change(screen.getByTestId('input-harga'), { target: { value: '100000' } })
    fireEvent.submit(screen.getByTestId('item-form'))

    expect(mockSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('error-nama')).toBeInTheDocument()
    expect(screen.getByTestId('error-nama')).toHaveTextContent('Nama barang wajib diisi')
  })

  /* ─── Test 6 ─────────────────────────────────────────── */
  it('validasi: menampilkan error saat harga 0 atau kosong', () => {
    render(<ItemForm onSubmit={mockSubmit} />)

    fireEvent.change(screen.getByTestId('input-nama'), { target: { value: 'Kamera' } })
    // harga dibiarkan kosong (default '')
    fireEvent.submit(screen.getByTestId('item-form'))

    expect(mockSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('error-harga')).toBeInTheDocument()
  })

  /* ─── Test 7 ─────────────────────────────────────────── */
  it('memanggil onCancel saat tombol Batal diklik', () => {
    render(<ItemForm onSubmit={mockSubmit} onCancel={mockCancel} />)
    fireEvent.click(screen.getByTestId('btn-cancel'))
    expect(mockCancel).toHaveBeenCalled()
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  /* ─── Test 8 ─────────────────────────────────────────── */
  it('menampilkan "Menyimpan..." dan menonaktifkan tombol saat loading=true', () => {
    render(<ItemForm onSubmit={mockSubmit} loading />)
    const btn = screen.getByTestId('btn-submit')
    expect(btn).toHaveTextContent('Menyimpan...')
    expect(btn).toBeDisabled()
  })
})
