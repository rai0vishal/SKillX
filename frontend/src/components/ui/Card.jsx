import React from 'react'

const Card = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) => {
  const variantClasses = {
    default: 'card',
    hover:   'card card-hover',
    spring:  'card card-spring',
    metric:  'card-metric',
    glass:   'card-glass',
  }

  return (
    <div
      className={`${variantClasses[variant] ?? 'card'} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
