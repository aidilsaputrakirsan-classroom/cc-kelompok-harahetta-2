function SortDropdown({ sortBy, onSortChange }) {
  return (
    <div style={styles.container}>
      <label style={styles.label}>Urutkan berdasarkan:</label>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        style={styles.select}
      >
        <option value="newest">Terbaru</option>
        <option value="oldest">Terlama</option>
        <option value="name_asc">Nama (A-Z)</option>
        <option value="name_desc">Nama (Z-A)</option>
        <option value="price_asc">Harga (Termurah)</option>
        <option value="price_desc">Harga (Termahal)</option>
      </select>
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1rem",
    padding: "0.75rem 1rem",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  label: {
    fontSize: "0.9rem",
    color: "#555",
    fontWeight: "500",
  },
  select: {
    padding: "0.5rem 1rem",
    fontSize: "0.9rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "#f8f9fa",
    cursor: "pointer",
    outline: "none",
    minWidth: "160px",
  },
}

export default SortDropdown
