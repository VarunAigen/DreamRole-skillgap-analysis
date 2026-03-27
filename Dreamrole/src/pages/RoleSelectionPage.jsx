import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, ArrowRight, ChevronDown, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function RoleSelectionPage() {
  const [domains, setDomains] = useState([])
  const [rolesByDomain, setRolesByDomain] = useState({})
  const [selectedDomain, setSelectedDomain] = useState('')
  const [selectedRole, setLocalSelectedRole] = useState('')
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(true)
  const { setSelectedRole: setAppSelectedRole } = useApp()
  const navigate = useNavigate()

  const finalRole = custom.trim() || selectedRole

  useEffect(() => {
    fetch('/api/recommendations?grouped=true')
      .then(r => r.json())
      .then(data => { 
        if (data.domains) setDomains(data.domains)
        if (data.rolesByDomain) setRolesByDomain(data.rolesByDomain)
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const handleProceed = () => {
    if (!finalRole) return
    setAppSelectedRole(finalRole)
    navigate('/dashboard/skills')
  }

  const availableRoles = selectedDomain && rolesByDomain[selectedDomain] ? rolesByDomain[selectedDomain] : []

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="section-heading">Select Your Dream Role</h1>
        <p className="section-sub">Choose your target career role to begin the skill gap analysis.</p>
      </div>

      <div className="card space-y-5">
        {/* Domain Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            1. Select a Domain {loading && <Loader size={12} className="inline animate-spin ml-1" />}
          </label>
          <div className="relative">
            <select
              value={selectedDomain}
              onChange={(e) => { 
                setSelectedDomain(e.target.value); 
                setLocalSelectedRole(''); 
                setCustom(''); 
              }}
              className="input-field appearance-none pr-10"
              disabled={loading}
            >
              <option value="">-- Choose a Domain --</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Role Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            2. Choose your Target Role
          </label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => { setLocalSelectedRole(e.target.value); setCustom('') }}
              className={`input-field appearance-none pr-10 ${!selectedDomain ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!selectedDomain || loading}
            >
              <option value="">-- Choose a Role --</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-200" />
          <span className="text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-surface-200" />
        </div>

        {/* Custom input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Enter a custom role</label>
          <input
            type="text"
            placeholder="e.g. Blockchain Developer"
            className="input-field"
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setLocalSelectedRole(''); setSelectedDomain('') }}
          />
        </div>

        {/* Selected badge */}
        {finalRole && (
          <div className="flex items-center gap-2 p-3 bg-brand-50 border border-brand-200 rounded-xl">
            <Target size={15} className="text-brand-600" />
            <span className="text-sm font-semibold text-brand-700">Selected: {finalRole}</span>
          </div>
        )}

        <button
          onClick={handleProceed}
          disabled={!finalRole}
          className={`btn-primary w-full justify-center ${!finalRole ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Proceed to Skill Analysis <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
