import { useState, useEffect } from 'react'
import ProjectCard from '../components/ProjectCard'
import CertificationCard from '../components/CertificationCard'
import { Lightbulb, Award, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function RoadmapPage() {
  const [projects, setProjects] = useState([])
  const [certifications, setCertifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { selectedRole } = useApp()

  useEffect(() => {
    const role = selectedRole || 'Frontend Developer'
    fetch(`/api/recommendations?role=${encodeURIComponent(role)}`)
      .then(r => r.json())
      .then(data => {
        if (data.projects) setProjects(data.projects)
        if (data.certifications) setCertifications(data.certifications)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedRole])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-heading">Improvement Roadmap</h1>
        <p className="section-sub">
          Personalized projects and certifications{selectedRole ? ` for ${selectedRole}` : ''} to bridge your skill gaps.
        </p>
      </div>

      {loading ? (
        <div className="card flex items-center gap-3 text-brand-600">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading personalized recommendations...</span>
        </div>
      ) : (
        <>
          {/* Projects */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={18} className="text-brand-600" />
              <h2 className="text-base font-bold text-slate-800">Recommended Projects</h2>
              <span className="badge-brand ml-auto">{projects.length} projects</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <ProjectCard key={p.title} {...p} />
              ))}
            </div>
          </section>

          {/* Certifications */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Award size={18} className="text-amber-500" />
              <h2 className="text-base font-bold text-slate-800">Recommended Certifications</h2>
              <span className="badge-brand ml-auto">{certifications.length} certs</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {certifications.map((c) => (
                <CertificationCard key={c.title} {...c} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
