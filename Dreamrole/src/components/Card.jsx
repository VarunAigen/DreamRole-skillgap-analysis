export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={`card ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  )
}
