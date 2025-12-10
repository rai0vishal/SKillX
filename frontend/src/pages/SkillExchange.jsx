import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:5000'

const SkillExchange = () => {
  const navigate = useNavigate()
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const currentEmail = storedUser.email

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    name: '',
    skillOffered: '',
    skillWanted: '',
    location: 'Remote',
    matchScore: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [infoMessage, setInfoMessage] = useState(null)

  const fetchEntries = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_BASE_URL}/api/skill-exchange`)
      if (!res.ok) throw new Error('Failed to fetch skill exchange entries')

      const data = await res.json()
      setEntries(data)
    } catch (err) {
      console.error(err)
      setError('Could not load skill exchange data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setInfoMessage(null)

    try {
      if (!currentEmail) {
        setError('You must be signed in to create a skill exchange profile.')
        setSubmitting(false)
        return
      }

      const payload = {
        ...form,
        email: currentEmail,
        matchScore: form.matchScore ? Number(form.matchScore) : 80,
      }

      const res = await fetch(`${API_BASE_URL}/api/skill-exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to create skill exchange entry')

      const newEntry = await res.json()

      setEntries((prev) => [newEntry, ...prev])

      setForm({
        name: '',
        skillOffered: '',
        skillWanted: '',
        location: 'Remote',
        matchScore: '',
      })

      setInfoMessage('Profile saved successfully ✅')
    } catch (err) {
      console.error(err)
      setError('Could not create entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewProfile = (user) => {
    if (!user.email) {
      alert('This user has no linked profile email.')
      return
    }
    navigate(`/user/${encodeURIComponent(user.email)}`)
  }

  const handleRequestExchange = async (user) => {
    try {
      if (!currentEmail) {
        alert('You must be signed in to send a request.')
        return
      }
      if (!user.email) {
        alert('This user has no linked email for exchange requests.')
        return
      }

      const message = `Hi ${user.name}, I would like to exchange my skills (${user.skillWanted}) with yours (${user.skillOffered}).`

      const res = await fetch(`${API_BASE_URL}/api/exchange-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmail: currentEmail,
          toEmail: user.email,
          message,
        }),
      })

      if (!res.ok) throw new Error('Failed to send exchange request')

      alert('Exchange request sent ✅')
    } catch (err) {
      console.error(err)
      alert('Could not send exchange request. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Skill Exchange</h1>
        <p className="text-gray-600 mt-1">
          Find people to exchange skills and grow together. Data is saved in MongoDB.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-md mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Add Your Skill Exchange Profile
        </h2>
        {infoMessage && (
          <div className="mb-3 text-sm bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            {infoMessage}
          </div>
        )}
        {error && (
          <div className="mb-3 text-sm bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleSubmit}
        >
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Remote</option>
              <option>On-site</option>
              <option>Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill You Offer
            </label>
            <input
              type="text"
              name="skillOffered"
              value={form.skillOffered}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. UI/UX Designer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill You Want
            </label>
            <input
              type="text"
              name="skillWanted"
              value={form.skillWanted}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. React JS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Match Score (0–100, optional)
            </label>
            <input
              type="number"
              name="matchScore"
              value={form.matchScore}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 90"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Status + list */}
      <div className="max-w-6xl mx-auto mb-4">
        {loading && <p className="text-sm text-gray-600">Loading matches...</p>}
        {!loading && !error && entries.length === 0 && (
          <p className="text-sm text-gray-600">
            No skill exchange profiles yet. Be the first to add yours!
          </p>
        )}
      </div>

      {/* Cards */}
      {!loading && entries.length > 0 && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((user) => (
            <div
              key={user._id}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">📍 {user.location}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium text-gray-800">Offers:</span>{' '}
                  {user.skillOffered}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Wants:</span>{' '}
                  {user.skillWanted}
                </p>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Match Score {user.matchScore ?? 80}%
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 text-sm border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition"
                  onClick={() => handleViewProfile(user)}
                >
                  View Profile
                </button>
                <button
                  className="flex-1 text-sm bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                  onClick={() => handleRequestExchange(user)}
                >
                  Request Exchange
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SkillExchange
