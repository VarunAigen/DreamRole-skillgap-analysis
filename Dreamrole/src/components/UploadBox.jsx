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
      <div className="border-2 border-brand-300 bg-brand-50 rounded-2xl p-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
          <FileText size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · PDF</p>
        </div>
        <button onClick={onClear} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
          <X size={18} />
        </button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200
        ${isDragActive
          ? 'border-brand-500 bg-brand-50 scale-[1.01]'
          : 'border-surface-300 bg-white hover:border-brand-400 hover:bg-brand-50'
        }`}
    >
      <input {...getInputProps()} />
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-brand-100 text-brand-600' : 'bg-surface-100 text-slate-400'}`}>
        <UploadCloud size={32} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-700">
          {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
        </p>
        <p className="text-sm text-slate-400 mt-1">or <span className="text-brand-600 underline">browse files</span> · PDF only</p>
      </div>
    </div>
  )
}
