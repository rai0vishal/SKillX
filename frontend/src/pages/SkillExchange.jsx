import React, { useEffect, useState } from 'react'

const API_BASE_URL = 'http://localhost:5000' // backend URL

const SkillExchange = () => {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    skillOffered: '',
    skillWanted: '',
    location: 'Remote',
    matchScore: '',
  })

  const [submitting, setSubmitting] = useState(false)

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

    try {
      const payload = {
        ...form,
        matchScore: form.matchScore ? Number(form.matchScore) : 80,
      }

      const res = await fetch(`${API_BASE_URL}/api/skill-exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to create skill exchange entry')

      const newEntry = await res.json()

      // Add to UI without reload
      setEntries((prev) => [newEntry, ...prev])

      // Reset form
      setForm({
        name: '',
        skillOffered: '',
        skillWanted: '',
        location: 'Remote',
        matchScore: '',
      })
    } catch (err) {
      console.error(err)
      setError('Could not create entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Skill Exchange
        </h1>
        <p className="text-gray-600 mt-1">
          Find people to exchange skills and grow together. Data is saved in MongoDB.
        </p>
      </div>

      {/* Create Entry Form */}
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Add Your Skill Exchange Profile
        </h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
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
              placeholder="e.g. UI/UX Design"
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
              className="w-full md:w-auto px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Status */}
      <div className="max-w-6xl mx-auto mb-4">
        {loading && <p className="text-sm text-gray-600">Loading matches...</p>}
        {error && (
          <div className="text-sm bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}
        {!loading && !error && entries.length === 0 && (
          <p className="text-sm text-gray-600">
            No skill exchange profiles yet. Be the first to add yours!
          </p>
        )}
      </div>

      {/* Cards */}
      {!loading && !error && entries.length > 0 && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((user) => (
            <div
              key={user._id}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition"
            >
              {/* User Info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    📍 {user.location}
                  </p>
                </div>
              </div>

              {/* Skills */}
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

              {/* Match Score */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  Match Score {user.matchScore ?? 80}%
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 text-sm border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition">
                  View Profile
                </button>
                <button className="flex-1 text-sm bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
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
