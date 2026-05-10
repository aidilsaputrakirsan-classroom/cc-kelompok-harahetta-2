import { useState } from 'react'

const defaultForm = {
  nama: '',
  deskripsi: '',
  harga_per_hari: '',
  stok: 1,
}

/**
 * ItemForm – form tambah / edit barang.
 *
 * Props:
 *   initialData – data awal form (untuk mode edit)
 *   onSubmit    – callback (formData) => void
 *   onCancel    – callback () => void
 *   loading     – tampilkan state loading pada tombol submit
 */
export default function ItemForm({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [form, setForm] = useState(
    initialData
      ? {
          nama: initialData.nama ?? '',
          deskripsi: initialData.deskripsi ?? '',
          harga_per_hari: initialData.harga_per_hari ?? '',
          stok: initialData.stok ?? 1,
        }
      : { ...defaultForm }
  )

  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.nama.trim()) errs.nama = 'Nama barang wajib diisi'
    if (!form.harga_per_hari || Number(form.harga_per_hari) <= 0)
      errs.harga_per_hari = 'Harga harus lebih dari 0'
    if (Number(form.stok) < 0) errs.stok = 'Stok tidak boleh negatif'
    return errs
  }

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    // clear error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit?.({
      ...form,
      harga_per_hari: parseFloat(form.harga_per_hari),
      stok: parseInt(form.stok),
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate data-testid="item-form">
      {/* Nama */}
      <div className="mb-4">
        <label htmlFor="item-nama" className="block text-sm font-medium mb-1">
          Nama Barang <span className="text-destructive">*</span>
        </label>
        <input
          id="item-nama"
          type="text"
          placeholder="Kamera Sony A7III"
          value={form.nama}
          onChange={handleChange('nama')}
          aria-describedby={errors.nama ? 'item-nama-error' : undefined}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          data-testid="input-nama"
        />
        {errors.nama && (
          <p id="item-nama-error" role="alert" className="text-xs text-destructive mt-1" data-testid="error-nama">
            {errors.nama}
          </p>
        )}
      </div>

      {/* Deskripsi */}
      <div className="mb-4">
        <label htmlFor="item-deskripsi" className="block text-sm font-medium mb-1">
          Deskripsi
        </label>
        <textarea
          id="item-deskripsi"
          placeholder="Jelaskan kondisi dan fitur barang..."
          value={form.deskripsi}
          onChange={handleChange('deskripsi')}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          data-testid="input-deskripsi"
        />
      </div>

      {/* Harga & Stok */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="item-harga" className="block text-sm font-medium mb-1">
            Harga / Hari (Rp) <span className="text-destructive">*</span>
          </label>
          <input
            id="item-harga"
            type="number"
            min="0"
            placeholder="250000"
            value={form.harga_per_hari}
            onChange={handleChange('harga_per_hari')}
            aria-describedby={errors.harga_per_hari ? 'item-harga-error' : undefined}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="input-harga"
          />
          {errors.harga_per_hari && (
            <p id="item-harga-error" role="alert" className="text-xs text-destructive mt-1" data-testid="error-harga">
              {errors.harga_per_hari}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="item-stok" className="block text-sm font-medium mb-1">
            Stok
          </label>
          <input
            id="item-stok"
            type="number"
            min="0"
            placeholder="1"
            value={form.stok}
            onChange={handleChange('stok')}
            aria-describedby={errors.stok ? 'item-stok-error' : undefined}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="input-stok"
          />
          {errors.stok && (
            <p id="item-stok-error" role="alert" className="text-xs text-destructive mt-1" data-testid="error-stok">
              {errors.stok}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            data-testid="btn-cancel"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          data-testid="btn-submit"
        >
          {loading ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Tambah Barang'}
        </button>
      </div>
    </form>
  )
}
