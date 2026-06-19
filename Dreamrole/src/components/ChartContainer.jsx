import { ResponsiveContainer } from 'recharts'

export default function ChartContainer({ title, subtitle, children, height = 280 }) {
  return (
    <div className="glass-card">
      {title && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white/90">{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}
