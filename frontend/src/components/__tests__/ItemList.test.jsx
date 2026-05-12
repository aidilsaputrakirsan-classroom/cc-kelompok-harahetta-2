import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ItemList from '../ItemList'

// Mock lucide-react untuk menghindari SVG rendering error
vi.mock('lucide-react', () => ({
  Package: () => <svg data-testid="icon-package" />,
}))

// Mock ItemCard agar test ItemList terisolasi dari implementasi ItemCard
vi.mock('../ItemCard', () => ({
  default: ({ item, onEdit, onDelete }) => (
    <div data-testid="item-card" data-item-id={item.id}>
      <span>{item.name}</span>
      <button onClick={() => onEdit(item)}>Edit</button>
      <button onClick={() => onDelete(item.id)}>Hapus</button>
    </div>
  ),
}))

const mockItems = [
  { id: 1, name: 'Laptop', description: 'Laptop gaming', price: 150000, quantity: 3 },
  { id: 2, name: 'Kamera', description: 'Kamera mirrorless', price: 200000, quantity: 1 },
  { id: 3, name: 'Drone', description: 'Drone DJI', price: 350000, quantity: 2 },
]

describe('ItemList Component', () => {
  /* ─── Test 1 ─────────────────────────────────────────── */
  it('menampilkan empty state saat items kosong', () => {
    render(<ItemList items={[]} />)
    expect(screen.getByTestId('item-list-empty')).toBeInTheDocument()
    expect(screen.getByTestId('empty-title')).toHaveTextContent('Tidak ada barang')
  })

  /* ─── Test 2 ─────────────────────────────────────────── */
  it('menampilkan pesan emptyMessage kustom', () => {
    render(<ItemList items={[]} emptyMessage="Tambah barang pertama Anda!" />)
    expect(screen.getByTestId('empty-message')).toHaveTextContent('Tambah barang pertama Anda!')
  })

  /* ─── Test 3 ─────────────────────────────────────────── */
  it('menampilkan skeleton loading saat prop loading=true', () => {
    render(<ItemList loading />)
    expect(screen.getByTestId('item-list-loading')).toBeInTheDocument()
    // empty state TIDAK ditampilkan
    expect(screen.queryByTestId('item-list-empty')).not.toBeInTheDocument()
  })

  /* ─── Test 4 ─────────────────────────────────────────── */
  it('merender semua item yang diberikan', () => {
    render(<ItemList items={mockItems} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const cards = screen.getAllByTestId('item-card')
    expect(cards).toHaveLength(3)
  })

  /* ─── Test 5 ─────────────────────────────────────────── */
  it('menampilkan nama setiap item dengan benar', () => {
    render(<ItemList items={mockItems} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.getByText('Kamera')).toBeInTheDocument()
    expect(screen.getByText('Drone')).toBeInTheDocument()
  })

  /* ─── Test 6 ─────────────────────────────────────────── */
  it('tidak menampilkan empty state saat ada items', () => {
    render(<ItemList items={mockItems} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByTestId('item-list-empty')).not.toBeInTheDocument()
  })
})
