// src/pages/auth/SignIn.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
// src/pages/auth/SignUp.jsx
import { auth } from '../../firebase/firebaseConfig'

const API_BASE_URL = 'http://localhost:5000'

const SignIn = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // ✅ Firebase sign in
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      )

      const user = userCredential.user

      // Optional: you can fetch profile from backend and store name too
      // For now, we just set email, uid
      localStorage.setItem(
        'user',
        JSON.stringify({
          email: user.email,
          uid: user.uid,
        })
      )

      navigate('/dashboard')
    } catch (error) {
      console.error('Sign in error:', error)
      let message = 'Failed to sign in. Please try again.'

      if (error.code === 'auth/user-not-found') {
        message = 'No user found with this email.'
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.'
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
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Sign In</h1>
        <p className="text-sm text-gray-600 mb-4">
          Welcome back to SkillX. Continue where you left off.
        </p>

        {error && (
          <div className="mb-4 text-sm bg-red-100 text-red-700 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
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
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-indigo-600 font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignIn
