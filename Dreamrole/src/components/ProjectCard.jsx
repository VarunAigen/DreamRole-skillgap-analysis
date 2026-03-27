import { Github, ExternalLink } from 'lucide-react'

export default function ProjectCard({ title, description, github, tags = [] }) {
  return (
    <div className="card card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-600 flex-shrink-0">
          <Github size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 text-sm leading-tight">{title}</h4>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
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
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors mt-auto"
        >
          <ExternalLink size={13} /> View on GitHub
        </a>
      )}
    </div>
  )
}
