import React from 'react'
const Loader2 = ({ className, size, color, style }) => <i className={`ti ti-loader ${className || ''}`} style={{ fontSize: size || 'inherit', color, ...style }} />

const variants = {
  primary:   'bg-[var(--accent)] text-white hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] border-transparent',
  secondary: 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--border-strong)] hover:bg-[var(--primary-muted)] hover:border-[var(--accent)]',
  ghost:     'bg-transparent text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface2)] hover:text-[var(--text)] hover:border-[var(--border-strong)]',
  danger:    'bg-[var(--red-bg)] text-[var(--red)] border border-[var(--red)] hover:bg-[var(--red)] hover:text-white',
  success:   'bg-[var(--green-bg)] text-[var(--green)] border border-[var(--green)] hover:bg-[var(--green)] hover:text-white',
}

const sizes = {
  sm: 'text-[12px] px-3 py-1.5',
  md: 'text-[13px] px-4 py-2',
  lg: 'text-[15px] px-6 py-3',
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const base =
    'inline-flex items-center gap-2 font-semibold rounded-[10px] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed select-none'

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

export default Button
