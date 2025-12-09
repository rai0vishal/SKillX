import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    // TODO: clear your auth state / Firebase signOut
    localStorage.removeItem('user')
    navigate('/signin')
  }

  const navLinkClass =
    'text-sm font-medium text-gray-700 hover:text-indigo-600 transition'

  const activeClass =
    'text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-1'

  return (
    <nav className="fixed top-0 left-0 right-0 z-20 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
            S
          </span>
          <span className="text-xl font-bold text-gray-800">SkillX</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? activeClass : navLinkClass)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/post-gig"
            className={({ isActive }) => (isActive ? activeClass : navLinkClass)}
          >
            Post Gig
          </NavLink>
          <NavLink
            to="/gig-list"
            className={({ isActive }) => (isActive ? activeClass : navLinkClass)}
          >
            Gigs
          </NavLink>
          <NavLink
            to="/skill-exchage"
            className={({ isActive }) => (isActive ? activeClass : navLinkClass)}
          >
            Skill Exchange
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? activeClass : navLinkClass)}
          >
            Profile
          </NavLink>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/signin"
            className="text-sm text-gray-700 hover:text-indigo-600"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Sign Up
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-100"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="sr-only">Toggle menu</span>
          <div className="space-y-1">
            <span className="block w-5 h-0.5 bg-gray-700" />
            <span className="block w-5 h-0.5 bg-gray-700" />
            <span className="block w-5 h-0.5 bg-gray-700" />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 flex flex-col gap-3">
            <NavLink
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className={navLinkClass}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/post-gig"
              onClick={() => setIsOpen(false)}
              className={navLinkClass}
            >
              Post Gig
            </NavLink>
            <NavLink
              to="/gig-list"
              onClick={() => setIsOpen(false)}
              className={navLinkClass}
            >
              Gigs
            </NavLink>
            <NavLink
              to="/skill-exchage"
              onClick={() => setIsOpen(false)}
              className={navLinkClass}
            >
              Skill Exchange
            </NavLink>
            <NavLink
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={navLinkClass}
            >
              Profile
            </NavLink>

            <div className="border-t border-gray-200 pt-3 flex gap-3">
              <Link
                to="/signin"
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-700 hover:text-indigo-600"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsOpen(false)}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
