import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Brand */}
        <div>
          <h2 className="text-xl font-bold text-indigo-600 mb-2">SkillX</h2>
          <p className="text-sm text-gray-600">
            A platform to exchange skills, post gigs, and grow together.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link></li>
            <li><Link to="/post-gig" className="hover:text-indigo-600">Post Gig</Link></li>
            <li><Link to="/gig-list" className="hover:text-indigo-600">Browse Gigs</Link></li>
            <li><Link to="/skill-exchage" className="hover:text-indigo-600">Skill Exchange</Link></li>
          </ul>
        </div>

        {/* Contact / Social */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Contact
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Email: support@skillx.com</li>
            <li>Phone: +91 98765 43210</li>
            <li className="flex gap-3 pt-1">
              <span className="cursor-pointer hover:text-indigo-600">🌐</span>
              <span className="cursor-pointer hover:text-indigo-600">🐦</span>
              <span className="cursor-pointer hover:text-indigo-600">💼</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-100 text-center text-xs text-gray-500 py-3">
        © {new Date().getFullYear()} SkillX. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
