import React from 'react'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:   'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] border-transparent',
  secondary: 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--border-strong)] hover:bg-[var(--primary-muted)] hover:border-[var(--primary)]',
  ghost:     'bg-transparent text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]',
  danger:    'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)] hover:bg-[var(--danger)] hover:text-white',
  success:   'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)] hover:bg-[var(--success)] hover:text-white',
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
    'inline-flex items-center gap-2 font-semibold rounded-[10px] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed select-none'

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
