// src/components/Navbar.jsx
import React, { useEffect, useState, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig'
import { API_BASE_URL } from '../config/api.js'
import NotificationBell from './NotificationBell'
import { useTheme } from '../hooks/useTheme'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Briefcase,
  ArrowLeftRight,
  UserCircle,
  MessageCircle,
  Search,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react'

const NAV_LINKS = [
  { to: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/post-gig',     label: 'Post Gig',       icon: Briefcase },
  { to: '/gig-list',     label: 'Gigs',           icon: Briefcase },
  { to: '/skill-exchange', label: 'Skill Exchange', icon: ArrowLeftRight },
  { to: '/profile',      label: 'Profile',        icon: UserCircle },
  { to: '/chat',         label: 'Messages',       icon: MessageCircle },
]

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
    setUser(storedUser)

    if (storedUser?.email) {
      fetch(`${API_BASE_URL}/api/profile/${storedUser.email}`)
        .then(res => res.ok ? res.json() : null)
        .then(profile => { if (profile) setIsAdmin(profile.role === 'admin') })
        .catch(err => console.error('Error fetching role for navbar:', err))
    } else {
      setIsAdmin(false)
    }
  }, [location])

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false) }, [location])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('user')
      setUser(null)
      navigate('/signin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'

  const visibleLinks = user
    ? [...NAV_LINKS, ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : [])]
    : []

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="flex items-center w-full max-w-7xl mx-auto gap-2">
          {/* Logo */}
          <Link
            to="/"
            className="text-[20px] font-extrabold mr-4 shrink-0"
            style={{ color: 'var(--primary)' }}
            aria-label="SkillX Home"
          >
            Skill<span className="gradient-text">X</span>
          </Link>

          {/* Desktop nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-1 flex-1">
              {visibleLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-[10px] transition-all duration-150 ${
                      isActive
                        ? 'nav-link-active'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
                    }`
                  }
                >
                  <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          {/* Spacer for logged-out */}
          {!user && <div className="flex-1" />}

          {/* Right section */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="icon-btn"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark'
                ? <Sun size={16} aria-hidden="true" />
                : <Moon size={16} aria-hidden="true" />}
            </button>

            {user ? (
              <>
                {/* Search */}
                <Link to="/search" className="icon-btn" aria-label="Search">
                  <Search size={16} aria-hidden="true" />
                </Link>

                {/* Notification bell */}
                <NotificationBell />

                {/* Avatar + email */}
                <div className="hidden sm:flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      border: '1.5px solid var(--border-strong)',
                    }}
                    aria-label={`Logged in as ${user.name || user.email}`}
                  >
                    {userInitial}
                  </div>
                  <span className="text-[12px] text-[var(--text-secondary)] max-w-[140px] truncate hidden lg:block">
                    {user.name || user.email}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="icon-btn"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut size={16} aria-hidden="true" />
                </button>

                {/* Mobile hamburger */}
                <button
                  className="md:hidden icon-btn"
                  onClick={() => setMobileOpen(o => !o)}
                  aria-label="Open navigation menu"
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <X size={16} /> : <Menu size={16} />}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-[10px] bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Slide Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 md:hidden flex flex-col"
              style={{
                background: 'var(--bg-surface)',
                borderRight: '1px solid var(--border)',
              }}
              role="dialog"
              aria-label="Navigation menu"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-[18px] font-extrabold" style={{ color: 'var(--primary)' }}>
                  Skill<span className="gradient-text">X</span>
                </span>
                <button className="icon-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <X size={16} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {visibleLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all ${
                        isActive
                          ? 'nav-link-active'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
                      }`
                    }
                  >
                    <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}
              </nav>

              {/* Drawer footer */}
              <div className="px-4 py-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
