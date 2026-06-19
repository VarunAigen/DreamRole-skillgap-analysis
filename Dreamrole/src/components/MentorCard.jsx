import { Linkedin, MessageCircle } from 'lucide-react'
import { useState } from 'react'

export default function MentorCard({ name, domain, company, linkedin, avatar }) {
  const [showMsg, setShowMsg] = useState(false)
  const [msg, setMsg] = useState('')
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="glass-card card-hover flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {initials}
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-white text-sm truncate">{name}</h4>
          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{domain}</p>
          <p className="text-xs font-medium truncate" style={{ color: '#818cf8' }}>{company}</p>
        </div>
      </div>

      {showMsg && (
        <div className="space-y-2">
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2}
            placeholder="Write a short message..." className="input-field resize-none text-xs" />
          <button className="btn-primary text-xs py-1.5 px-3">Send Request</button>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <button onClick={() => setShowMsg(!showMsg)} className="btn-primary flex-1 text-xs py-2">
          <MessageCircle size={14} />
          {showMsg ? 'Cancel' : 'Request Guidance'}
        </button>
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-2 px-3">
            <Linkedin size={14} />
          </a>
        )}
      </div>
    </div>
  )
}
