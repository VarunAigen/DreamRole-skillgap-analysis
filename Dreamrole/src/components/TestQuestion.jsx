export default function TestQuestion({ question, options, selected, onSelect, index }) {
  const letters = ['A', 'B', 'C', 'D']

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
          {index + 1}
        </span>
        <p className="text-base font-semibold text-white leading-snug pt-0.5">{question}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-10">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className="flex items-center gap-3 p-3.5 rounded-xl text-left text-sm font-medium transition-all duration-200"
            style={selected === i ? {
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
              boxShadow: '0 0 15px rgba(99,102,241,0.1)',
            } : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.7)',
            }}
            onMouseEnter={e => { if (selected !== i) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}}
            onMouseLeave={e => { if (selected !== i) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}}
          >
            <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors"
              style={selected === i ? {
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
              } : {
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.35)',
              }}>
              {letters[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
