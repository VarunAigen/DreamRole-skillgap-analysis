export default function ProgressBar({ value = 0, label = '', showPercent = true, color = 'brand', height = 'md' }) {
  const colorMap = {
    brand: 'bg-gradient-to-r from-brand-500 to-brand-600',
    green: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
    amber: 'bg-gradient-to-r from-amber-400 to-amber-600',
    red: 'bg-gradient-to-r from-red-400 to-red-600',
  }
  const heightMap = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm font-medium text-slate-600">{label}</span>}
          {showPercent && <span className="text-sm font-bold text-brand-600">{Math.round(value)}%</span>}
        </div>
      )}
      <div className={`w-full bg-surface-200 rounded-full ${heightMap[height]} overflow-hidden`}>
        <div
          className={`${colorMap[color]} ${heightMap[height]} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}
