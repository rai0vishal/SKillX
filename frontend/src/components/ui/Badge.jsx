import React from 'react'

// Status badge: badge-active | badge-pending | badge-declined | badge-exchange | badge-info
// Skill tag: variant="skill"
const Badge = ({ children, variant = 'exchange', icon: Icon, className = '' }) => {
  if (variant === 'skill') {
    return (
      <span className={`skill-tag ${className}`}>
        {Icon && <Icon size={12} aria-hidden="true" />}
        {children}
      </span>
    )
  }

  const variantMap = {
    active:   'badge-active',
    pending:  'badge-pending',
    declined: 'badge-declined',
    exchange: 'badge-exchange',
    info:     'badge-info',
  }

  return (
    <span className={`badge ${variantMap[variant] ?? 'badge-exchange'} ${className}`}>
      {Icon && <Icon size={10} aria-hidden="true" />}
      {children}
    </span>
  )
}

export default Badge
