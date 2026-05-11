export default function Header({ totalItems = 0 }) {
  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold text-foreground">
        Cloud Sewain
      </h1>
      <span className="text-sm text-muted-foreground">
        Total Items: {totalItems}
      </span>
    </header>
  )
}
