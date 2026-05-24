import React from 'react'
import { Link } from 'react-router-dom'
import { Code2, Link2, Share2 } from 'lucide-react'

const Footer = () => {
  return (
    <footer
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '40px 24px 20px',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: 40,
            marginBottom: 32,
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', marginBottom: 10 }}
            >
              Skill<span
                style={{
                  background: 'linear-gradient(135deg, #5B4FE8, #EC4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >X</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-muted)', maxWidth: 240, margin: '0 0 16px' }}>
              A platform to exchange skills, post gigs, and grow together — completely free.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                              { Icon: Code2,  label: 'GitHub',   href: 'https://github.com/rai0vishal/SKillX' },
                { Icon: Link2,  label: 'LinkedIn', href: '#' },
                { Icon: Share2, label: 'Twitter',  href: '#' },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', textDecoration: 'none',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--accent)'
                    e.currentTarget.style.borderColor = 'var(--border-strong)'
                    e.currentTarget.style.background = 'var(--accent-dim)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--surface2)'
                  }}
                >
                  <Icon size={14} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 14, letterSpacing: '0.01em' }}>
              Quick Links
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { to: '/dashboard',     label: 'Dashboard' },
                { to: '/post-gig',      label: 'Post Gig' },
                { to: '/gig-list',      label: 'Browse Gigs' },
                { to: '/skill-exchage', label: 'Skill Exchange' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 150ms' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 14, letterSpacing: '0.01em' }}>
              Contact
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <li style={{ fontSize: 13, color: 'var(--text-muted)' }}>support@skillx.com</li>
              <li style={{ fontSize: 13, color: 'var(--text-muted)' }}>+91 98765 43210</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 16,
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          © {new Date().getFullYear()} SkillX. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
