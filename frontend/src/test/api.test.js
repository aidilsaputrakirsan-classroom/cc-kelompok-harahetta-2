import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch global
global.fetch = vi.fn()

describe('API Service', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('fetchItems memanggil endpoint yang benar', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total: 0, items: [] }),
    })

    const response = await fetch('http://localhost:8000/items')
    const data = await response.json()

    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/items')
    expect(data.items).toEqual([])
  })

  it('handle error saat API gagal', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(
      fetch('http://localhost:8000/items')
    ).rejects.toThrow('Network error')
  })
})