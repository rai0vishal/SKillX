// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
    setUser(storedUser)
  }, [location])

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

  const navLinkBase =
    'text-lg px-5 py-2.5 rounded-xl transition-all duration-200'
  const navLinkInactive =
    'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
  const navLinkActive =
    'bg-indigo-100 text-indigo-700 font-bold shadow-sm'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        
        {/* ✅ LOGO (BIGGER) */}
        <Link
          to="/"
          className="text-3xl font-extrabold text-indigo-600 tracking-wide"
        >
          SkillX
        </Link>

        {/* ✅ CENTER NAV TABS (BIGGER) */}
        <div className="hidden md:flex items-center gap-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${navLinkBase} ${
                isActive ? navLinkActive : navLinkInactive
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/post-gig"
            className={({ isActive }) =>
              `${navLinkBase} ${
                isActive ? navLinkActive : navLinkInactive
              }`
            }
          >
            Post Gig
          </NavLink>

          <NavLink
            to="/gig-list"
            className={({ isActive }) =>
              `${navLinkBase} ${
                isActive ? navLinkActive : navLinkInactive
              }`
            }
          >
            Gigs
          </NavLink>

          <NavLink
            to="/skill-exchage"
            className={({ isActive }) =>
              `${navLinkBase} ${
                isActive ? navLinkActive : navLinkInactive
              }`
            }
          >
            Skill Exchange
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `${navLinkBase} ${
                isActive ? navLinkActive : navLinkInactive
              }`
            }
          >
            Profile
          </NavLink>
        </div>

        {/* ✅ RIGHT AUTH SECTION (BIGGER BUTTONS) */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-gray-700 font-medium max-w-[220px] truncate">
                👤 {user.name || user.email}
              </span>

              <button
                onClick={handleLogout}
                className="text-base bg-red-500 text-white px-6 py-2.5 rounded-xl hover:bg-red-600 transition shadow"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="text-base text-gray-700 font-medium hover:text-indigo-600"
              >
                Sign In
              </Link>

              <Link
                to="/signup"
                className="text-base bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
