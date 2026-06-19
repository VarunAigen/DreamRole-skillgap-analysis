import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileText, X } from 'lucide-react'

export default function UploadBox({ onFileAccepted, file, onClear }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop: (accepted) => accepted[0] && onFileAccepted(accepted[0]),
  })

  if (file) {
    return (
      <div className="rounded-2xl p-8 flex items-center gap-4"
        style={{ background: 'rgba(99,102,241,0.08)', border: '2px solid rgba(99,102,241,0.2)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.15)' }}>
          <FileText size={24} style={{ color: '#818cf8' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{file.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{(file.size / 1024).toFixed(1)} KB · PDF</p>
        </div>
        <button onClick={onClear} className="p-2 rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
          <X size={18} />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className="rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200"
      style={isDragActive ? {
        border: '2px dashed rgba(99,102,241,0.5)',
        background: 'rgba(99,102,241,0.06)',
        transform: 'scale(1.01)',
      } : {
        border: '2px dashed rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
      }}
      onMouseEnter={e => { if (!isDragActive) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.03)' }}}
      onMouseLeave={e => { if (!isDragActive) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}}
    >
      <input {...getInputProps()} />
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-colors"
        style={isDragActive ? { background: 'rgba(99,102,241,0.15)', color: '#818cf8' } : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>
        <UploadCloud size={32} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-white/80">
          {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
        </p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          or <span style={{ color: '#818cf8' }} className="underline">browse files</span> · PDF only
        </p>
      </div>
    </div>
  )
}
