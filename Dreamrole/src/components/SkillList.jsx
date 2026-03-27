import { CheckCircle2, XCircle } from 'lucide-react'

export default function SkillList({ skills = [], variant = 'default', title }) {
  const variantStyles = {
    default: 'badge-brand',
    matched: 'badge bg-emerald-100 text-emerald-700',
    missing: 'badge bg-red-100 text-red-600',
  }

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {variant === 'matched' && <CheckCircle2 size={18} className="text-emerald-500" />}
          {variant === 'missing' && <XCircle size={18} className="text-red-400" />}
          <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className={variantStyles[variant] || variantStyles.default}>
            {skill}
          </span>
        ))}
        {skills.length === 0 && (
          <p className="text-sm text-slate-400 italic">No skills listed</p>
        )}
      </div>
    </div>
  )
}
