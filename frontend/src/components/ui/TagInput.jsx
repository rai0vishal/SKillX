import { useState } from 'react'
import { X } from 'lucide-react'

export function TagInput({ value = [], onChange, placeholder = 'Add a skill…' }) {
  const [input, setInput] = useState('')

  const addTag = (raw) => {
    const clean = raw.trim().toLowerCase()
    if (clean && !value.includes(clean)) {
      onChange([...value, clean])
    }
    setInput('')
  }

  const removeTag = (tag) => onChange(value.filter(t => t !== tag))

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        minHeight: 44, padding: '8px 10px',
        background: 'var(--bg-surface-2)', border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-md)', cursor: 'text',
        transition: 'border-color 200ms',
      }}
      onClick={e => e.currentTarget.querySelector('input')?.focus()}
    >
      {value.map(tag => (
        <span
          key={tag}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 9999,
            background: 'var(--primary-light)', color: 'var(--primary)',
            border: '1px solid var(--border-strong)', fontSize: 12, fontWeight: 500,
          }}
        >
          {tag}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); removeTag(tag) }}
            aria-label={`Remove ${tag}`}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--primary)', padding: 0,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={11} aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{
          flex: 1, minWidth: 120,
          background: 'none', border: 'none', outline: 'none',
          fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

export default TagInput
