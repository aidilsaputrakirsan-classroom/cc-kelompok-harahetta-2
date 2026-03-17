import { useEffect } from "react"

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === "success" ? "#E2EFDA" : type === "error" ? "#FBE5D6" : "#DEEBF7"
  const textColor = type === "success" ? "#548235" : type === "error" ? "#C00000" : "#1F4E79"
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"

  return (
    <div style={{ ...styles.toast, backgroundColor: bgColor, color: textColor }}>
      <span style={styles.icon}>{icon}</span>
      <span style={styles.message}>{message}</span>
      <button onClick={onClose} style={{ ...styles.close, color: textColor }}>×</button>
    </div>
  )
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

const styles = {
  container: {
    position: "fixed",
    top: "1rem",
    right: "1rem",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    minWidth: "280px",
    maxWidth: "400px",
    animation: "slideIn 0.3s ease",
  },
  icon: {
    fontSize: "1.1rem",
    fontWeight: "bold",
  },
  message: {
    flex: 1,
    fontSize: "0.9rem",
  },
  close: {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
    opacity: 0.7,
    padding: 0,
  },
}

export default ToastContainer
