import { Award, ExternalLink } from 'lucide-react'

const platformColors = {
  'Coursera': { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  'Udemy': { bg: 'rgba(168,85,247,0.1)', color: '#c084fc', border: 'rgba(168,85,247,0.2)' },
  'Google': { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' },
  'AWS': { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
  'Meta': { bg: 'rgba(6,182,212,0.1)', color: '#22d3ee', border: 'rgba(6,182,212,0.2)' },
}

export default function CertificationCard({ title, platform, link, duration }) {
  const style = platformColors[platform] || { bg: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: 'rgba(99,102,241,0.2)' }

  return (
    <div className="glass-card card-hover flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <Award size={20} style={{ color: '#fbbf24' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm leading-tight">{title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge text-xs" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
              {platform}
            </span>
            {duration && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{duration}</span>}
          </div>
        </div>
      </div>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: '#818cf8' }}>
          <ExternalLink size={13} /> Enroll Now
        </a>
      )}
    </div>
  )
}
