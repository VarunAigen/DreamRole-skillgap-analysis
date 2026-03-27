import { Linkedin, MessageCircle } from 'lucide-react'
import { useState } from 'react'

export default function MentorCard({ name, domain, company, linkedin, avatar }) {
  const [showMsg, setShowMsg] = useState(false)
  const [msg, setMsg] = useState('')

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="card card-hover flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-slate-800 text-sm truncate">{name}</h4>
          <p className="text-xs text-slate-500 truncate">{domain}</p>
          <p className="text-xs text-brand-600 font-medium truncate">{company}</p>
        </div>
      </div>

      {/* Message box */}
      {showMsg && (
        <div className="space-y-2">
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={2}
            placeholder="Write a short message..."
            className="input-field resize-none text-xs"
          />
          <button className="btn-primary text-xs py-1.5 px-3">Send Request</button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => setShowMsg(!showMsg)}
          className="btn-primary flex-1 text-xs py-2"
        >
          <MessageCircle size={14} />
          {showMsg ? 'Cancel' : 'Request Guidance'}
        </button>
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-2 px-3"
          >
            <Linkedin size={14} />
          </a>
        )}
      </div>
    </div>
  )
}
