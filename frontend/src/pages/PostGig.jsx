import React, { useState } from 'react'

const API_BASE_URL = 'http://localhost:5000' // backend URL

const PostGig = () => {
  const [form, setForm] = useState({
    title: '',
    category: 'Web Development',
    type: 'One-time Project',
    skills: '',
    description: '',
    budget: '',
    duration: '',
    location: 'Remote',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // convert comma-separated skills -> array
      const skillsArray = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        title: form.title,
        category: form.category,
        type: form.type,
        skills: skillsArray,
        description: form.description,
        budget: Number(form.budget),
        duration: form.duration,
        location: form.location,
        postedBy: JSON.parse(localStorage.getItem('user') || '{}').email || 'Anonymous',
      }

      const res = await fetch(`${API_BASE_URL}/api/gigs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Failed to create gig')
      }

      const data = await res.json()
      console.log('Gig created:', data)

      setMessage({ type: 'success', text: 'Gig posted successfully ✅' })

      // reset form
      setForm({
        title: '',
        category: 'Web Development',
        type: 'One-time Project',
        skills: '',
        description: '',
        budget: '',
        duration: '',
        location: 'Remote',
      })
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Something went wrong while posting gig ❌' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Post a New Gig
          </h1>
          <p className="text-gray-600 mt-1">
            Describe the gig clearly so the right talent can find you.
          </p>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`mb-4 text-sm px-4 py-2 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Gig Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gig Title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Frontend Developer for Portfolio Website"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option>Web Development</option>
                <option>Design</option>
                <option>Content Writing</option>
                <option>Marketing</option>
                <option>Data / Analytics</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gig Type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option>One-time Project</option>
                <option>Part-time</option>
                <option>Full-time</option>
                <option>Skill Exchange</option>
              </select>
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills Required
            </label>
            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              placeholder="e.g. React, Tailwind, API Integration"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate skills with commas.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gig Description
            </label>
            <textarea
              rows="4"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the work, expectations, and any important details..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Budget + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget (₹)
              </label>
              <input
                type="number"
                name="budget"
                value={form.budget}
                onChange={handleChange}
                placeholder="e.g. 3000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="e.g. 1 week, 1 month"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option>Remote</option>
              <option>On-site</option>
              <option>Hybrid</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() =>
                setForm({
                  title: '',
                  category: 'Web Development',
                  type: 'One-time Project',
                  skills: '',
                  description: '',
                  budget: '',
                  duration: '',
                  location: 'Remote',
                })
              }
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading ? 'Posting...' : 'Post Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostGig
