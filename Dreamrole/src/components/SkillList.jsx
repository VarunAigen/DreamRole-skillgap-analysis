import { CheckCircle2, XCircle } from 'lucide-react'

export default function SkillList({ skills = [], variant = 'default', title }) {
  const variantStyles = {
    default: 'badge-brand',
    matched: 'badge-green',
    missing: 'badge-red',
  }

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {variant === 'matched' && <CheckCircle2 size={18} style={{ color: '#4ade80' }} />}
          {variant === 'missing' && <XCircle size={18} style={{ color: '#f87171' }} />}
          <h4 className="text-sm font-semibold text-white/80">{title}</h4>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className={`badge ${variantStyles[variant] || variantStyles.default}`}>
            {skill}
          </span>
        ))}
        {skills.length === 0 && (
          <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.3)' }}>No skills listed</p>
        )}
      </div>
    </div>
  )
}
