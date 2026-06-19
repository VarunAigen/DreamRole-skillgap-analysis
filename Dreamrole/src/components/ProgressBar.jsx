export default function ProgressBar({ value = 0, label = '', showPercent = true, color = 'brand', height = 'md' }) {
  const colorMap = {
    brand: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
    green: 'linear-gradient(90deg, #22c55e, #10b981)',
    amber: 'linear-gradient(90deg, #f59e0b, #d97706)',
    red: 'linear-gradient(90deg, #ef4444, #dc2626)',
  }
  const heightMap = { sm: '8px', md: '12px', lg: '16px' }

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>}
          {showPercent && <span className="text-sm font-bold" style={{ color: '#a5b4fc' }}>{Math.round(value)}%</span>}
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', height: heightMap[height] }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: colorMap[color] || colorMap.brand }} />
      </div>
    </div>
  )
}
