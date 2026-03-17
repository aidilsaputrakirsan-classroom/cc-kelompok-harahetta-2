import { useState, useEffect, useCallback, useMemo } from "react"
import Header from "./components/Header"
import SearchBar from "./components/SearchBar"
import SortDropdown from "./components/SortDropdown"
import ItemForm from "./components/ItemForm"
import ItemList from "./components/ItemList"
import LoginPage from "./components/LoginPage"
import ToastContainer from "./components/Toast"
import {
  fetchItems, createItem, updateItem, deleteItem,
  checkHealth, login, register, clearToken,
} from "./services/api"

function App() {
  // ==================== AUTH STATE ====================
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ==================== APP STATE ====================
  const [items, setItems] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  // ==================== TOAST STATE ====================
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = "info") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // ==================== LOAD DATA ====================
  const loadItems = useCallback(async (search = "") => {
    setLoading(true)
    try {
      const data = await fetchItems(search)
      setItems(data.items)
      setTotalItems(data.total)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") {
        handleLogout()
        addToast("Sesi berakhir, silakan login kembali", "error")
      } else {
        console.error("Error loading items:", err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth().then(setIsConnected)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadItems()
    }
  }, [isAuthenticated, loadItems])

  // ==================== AUTH HANDLERS ====================

  const handleLogin = async (email, password) => {
    const data = await login(email, password)
    setUser(data.user)
    setIsAuthenticated(true)
    addToast(`Selamat datang, ${data.user.name}!`, "success")
  }

  const handleRegister = async (userData) => {
    await register(userData)
    await handleLogin(userData.email, userData.password)
    addToast("Registrasi berhasil!", "success")
  }

  const handleLogout = () => {
    clearToken()
    setUser(null)
    setIsAuthenticated(false)
    setItems([])
    setTotalItems(0)
    setEditingItem(null)
    setSearchQuery("")
  }

  // ==================== ITEM HANDLERS ====================

  const handleSubmit = async (itemData, editId) => {
    try {
      if (editId) {
        await updateItem(editId, itemData)
        setEditingItem(null)
        addToast("Item berhasil diupdate!", "success")
      } else {
        await createItem(itemData)
        addToast("Item berhasil ditambahkan!", "success")
      }
      loadItems(searchQuery)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") {
        handleLogout()
        addToast("Sesi berakhir, silakan login kembali", "error")
      } else {
        addToast(err.message || "Gagal menyimpan item", "error")
        throw err
      }
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    const item = items.find((i) => i.id === id)
    if (!window.confirm(`Yakin ingin menghapus "${item?.name}"?`)) return

    try {
      await deleteItem(id)
      addToast("Item berhasil dihapus!", "success")
      loadItems(searchQuery)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") {
        handleLogout()
        addToast("Sesi berakhir, silakan login kembali", "error")
      } else {
        addToast("Gagal menghapus: " + err.message, "error")
      }
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    loadItems(query)
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy)
  }

  // ==================== SORTED ITEMS ====================
  const sortedItems = useMemo(() => {
    const itemsCopy = [...items]

    switch (sortBy) {
      case "name_asc":
        return itemsCopy.sort((a, b) => a.name.localeCompare(b.name))
      case "name_desc":
        return itemsCopy.sort((a, b) => b.name.localeCompare(a.name))
      case "price_asc":
        return itemsCopy.sort((a, b) => a.price - b.price)
      case "price_desc":
        return itemsCopy.sort((a, b) => b.price - a.price)
      case "oldest":
        return itemsCopy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      case "newest":
      default:
        return itemsCopy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  }, [items, sortBy])

  // ==================== RENDER ====================

  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
      </>
    )
  }

  return (
    <div style={styles.app}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div style={styles.container}>
        <Header
          totalItems={totalItems}
          isConnected={isConnected}
          user={user}
          onLogout={handleLogout}
        />
        <ItemForm
          onSubmit={handleSubmit}
          editingItem={editingItem}
          onCancelEdit={handleCancelEdit}
        />
        <SearchBar onSearch={handleSearch} />
        <SortDropdown sortBy={sortBy} onSortChange={handleSortChange} />
        <ItemList
          items={sortedItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
    </div>
  )
}

const styles = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "2rem",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
}

export default App
