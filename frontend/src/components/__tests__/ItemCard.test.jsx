import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ItemCard from '../ItemCard'

const mockItem = {
  id: 1,
  name: 'Laptop',
  description: 'Laptop untuk cloud computing',
  price: 15000000,
  quantity: 5,
}

describe('ItemCard Component', () => {
  it('menampilkan nama dan harga item', () => {
    render(
      <ItemCard
        item={mockItem}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.getByText(/15/)).toBeInTheDocument()
  })

  it('memanggil onEdit saat tombol edit diklik', () => {
    const handleEdit = vi.fn()
    render(
      <ItemCard
        item={mockItem}
        onEdit={handleEdit}
        onDelete={() => {}}
      />
    )
    // Sesuaikan selector dengan teks tombol edit di komponen Anda
    const editButton = screen.getByText(/edit/i)
    fireEvent.click(editButton)
    expect(handleEdit).toHaveBeenCalledWith(mockItem)
  })

  it('memanggil onDelete saat tombol hapus diklik', () => {
    const handleDelete = vi.fn()
    render(
      <ItemCard
        item={mockItem}
        onEdit={() => {}}
        onDelete={handleDelete}
      />
    )
    const deleteButton = screen.getByText(/hapus|delete/i)
    fireEvent.click(deleteButton)
    expect(handleDelete).toHaveBeenCalledWith(mockItem.id)
  })
})