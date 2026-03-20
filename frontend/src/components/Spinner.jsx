function Spinner({ size = 20, color = "#1F4E79" }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `3px solid ${color}20`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  )
}

function LoadingOverlay({ message = "Memuat..." }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.content}>
        <Spinner size={40} />
        <p style={styles.message}>{message}</p>
      </div>
    </div>
  )
}

function LoadingSpinner({ size = 40, message = "Memuat data..." }) {
  return (
    <div style={styles.container}>
      <Spinner size={size} />
      {message && <p style={styles.text}>{message}</p>}
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    gap: "1rem",
  },
  text: {
    margin: 0,
    color: "#888",
    fontSize: "1rem",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  },
  message: {
    margin: 0,
    color: "#1F4E79",
    fontSize: "1.1rem",
    fontWeight: "500",
  },
}

export { Spinner, LoadingOverlay, LoadingSpinner }
export default Spinner
