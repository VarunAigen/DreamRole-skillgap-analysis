import { ResponsiveContainer } from 'recharts'

export default function ChartContainer({ title, subtitle, children, height = 280 }) {
  return (
    <div className="card">
      {title && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}
