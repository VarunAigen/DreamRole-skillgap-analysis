export default function TestQuestion({ question, options, selected, onSelect, index }) {
  const letters = ['A', 'B', 'C', 'D']

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <p className="text-base font-semibold text-slate-800 leading-snug pt-0.5">{question}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-10">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left text-sm font-medium transition-all duration-150
              ${selected === i
                ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                : 'border-surface-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
              }`}
          >
            <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border transition-colors
              ${selected === i ? 'bg-brand-600 text-white border-brand-600' : 'border-surface-300 text-slate-400'}`}>
              {letters[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
