import { Award, ExternalLink } from 'lucide-react'

const platformColors = {
  'Coursera': 'bg-blue-100 text-blue-700',
  'Udemy': 'bg-purple-100 text-purple-700',
  'Google': 'bg-green-100 text-green-700',
  'AWS': 'bg-amber-100 text-amber-700',
  'Meta': 'bg-sky-100 text-sky-700',
  'default': 'badge-brand',
}

export default function CertificationCard({ title, platform, link, duration }) {
  const badgeStyle = platformColors[platform] || platformColors.default

  return (
    <div className="card card-hover flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
          <Award size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 text-sm leading-tight">{title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge text-xs ${badgeStyle}`}>{platform}</span>
            {duration && <span className="text-xs text-slate-400">{duration}</span>}
          </div>
        </div>
      </div>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
        >
          <ExternalLink size={13} /> Enroll Now
        </a>
      )}
    </div>
  )
}
