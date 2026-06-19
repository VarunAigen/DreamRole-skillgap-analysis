import { useState, useEffect } from 'react'
import MentorCard from '../components/MentorCard'
import { Users, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function MentorPage() {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const { selectedRole } = useApp()

  useEffect(() => {
    const url = selectedRole
      ? `/api/mentors?role=${encodeURIComponent(selectedRole)}`
      : '/api/mentors'
    fetch(url)
      .then(r => r.json())
      .then(data => { if (data.mentors) setMentors(data.mentors) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedRole])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-heading">Mentor Guidance</h1>
        <p className="section-sub">Connect with industry professionals to accelerate your career growth.</p>
      </div>

      {loading ? (
        <div className="card flex items-center gap-3 text-indigo-400">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm font-medium">Finding mentors...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Users size={18} className="text-indigo-400" />
            <p className="text-sm text-indigo-300 font-medium">
              {mentors.length} mentors available · Click "Request Guidance" to connect
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mentors.map((m) => (
              <MentorCard key={m.name} {...m} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
