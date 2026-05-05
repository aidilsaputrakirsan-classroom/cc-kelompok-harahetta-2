import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from '../Header'

describe('Header Component', () => {
  it('menampilkan judul aplikasi', () => {
    render(<Header totalItems={0} />)
    // Sesuaikan dengan teks judul di Header Anda
    expect(screen.getByText(/cloud/i)).toBeInTheDocument()
  })

  it('menampilkan jumlah total items', () => {
    render(<Header totalItems={5} />)
    expect(screen.getByText(/5/)).toBeInTheDocument()
  })
})