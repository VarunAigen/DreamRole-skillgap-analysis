import { Github, ExternalLink } from 'lucide-react'

export default function ProjectCard({ title, description, github, tags = [] }) {
  return (
    <div className="glass-card card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <Github size={20} style={{ color: '#818cf8' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm leading-tight">{title}</h4>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{description}</p>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="badge-brand text-xs">{tag}</span>
          ))}
        </div>
      )}
      {github && (
        <a href={github} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors mt-auto"
          style={{ color: '#818cf8' }}>
          <ExternalLink size={13} /> View on GitHub
        </a>
      )}
    </div>
  )
}
