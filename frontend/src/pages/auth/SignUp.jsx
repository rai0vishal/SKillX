// src/pages/auth/SignUp.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
// src/pages/auth/SignUp.jsx
import { auth } from '../../firebase/firebaseConfig'

const API_BASE_URL = 'http://localhost:5000'

const SignUp = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      // ✅ Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      )
      const user = userCredential.user

      // ✅ Set displayName in Firebase Auth
      if (form.name) {
        await updateProfile(user, { displayName: form.name })
      }

      // ✅ Create / update profile in your backend (Mongo)
      try {
        await fetch(`${API_BASE_URL}/api/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            name: form.name || form.email,
          }),
        })
      } catch (err) {
        console.error('Profile API error (non-blocking):', err)
        // even if profile creation fails, user can still use app
      }

      // ✅ Store user in localStorage
      localStorage.setItem(
        'user',
        JSON.stringify({
          email: user.email,
          name: form.name || user.displayName || '',
          uid: user.uid,
        })
      )

      navigate('/dashboard')
    } catch (error) {
      console.error('Sign up error:', error)
      let message = 'Failed to sign up. Please try again.'

      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already in use.'
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format.'
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 mt-16">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Sign Up</h1>
        <p className="text-sm text-gray-600 mb-4">
          Create your SkillX account to start posting gigs and exchanging skills.
        </p>

        {error && (
          <div className="mb-4 text-sm bg-red-100 text-red-700 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Already have an account?{' '}
          <Link to="/signin" className="text-indigo-600 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignUp
