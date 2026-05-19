import React, { useState } from 'react'

import { API_BASE_URL } from '../config/api.js';
const MAX_REGENERATIONS = 5

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

  // AI Enhancement state
  const [enhancedText, setEnhancedText] = useState(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState(null)
  const [regenCount, setRegenCount] = useState(0)

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
      setEnhancedText(null)
      setRegenCount(0)
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Something went wrong while posting gig ❌' })
    } finally {
      setLoading(false)
    }
  }

  // --- AI Enhancement handlers ---
  const handleEnhance = async () => {
    if (!form.title.trim() || !form.category.trim() || !form.skills.trim()) {
      setEnhanceError('Title, Category, and at least one Skill are required to generate an AI description.')
      return
    }

    if (regenCount >= MAX_REGENERATIONS) {
      setEnhanceError(`Maximum enhancement limit reached (${MAX_REGENERATIONS}). Please use or discard the current result.`)
      return
    }

    try {
      setIsEnhancing(true)
      setEnhanceError(null)

      const skillsArray = form.skills.split(',').map((s) => s.trim()).filter(Boolean)

      const payload = {
        title: form.title,
        category: form.category,
        skills: skillsArray,
        description: form.description,
      }

      const res = await fetch(`${API_BASE_URL}/api/gigs/enhance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to enhance description')
      }

      const data = await res.json()
      setEnhancedText(data.enhanced)
      setRegenCount((prev) => prev + 1)
    } catch (err) {
      setEnhanceError(err.message || 'Something went wrong. Try again.')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleUseDescription = () => {
    if (enhancedText) {
      setForm((prev) => ({ ...prev, description: enhancedText }))
      setEnhancedText(null)
      setEnhanceError(null)
    }
  }

  const handleRegenerate = () => {
    if (regenCount >= MAX_REGENERATIONS) {
      setEnhanceError(`Maximum enhancement limit reached (${MAX_REGENERATIONS}).`)
      return
    }
    handleEnhance()
  }

  const handleDiscardEnhanced = () => {
    setEnhancedText(null)
    setEnhanceError(null)
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Gig Description (Optional details for AI)
              </label>
              <div className="flex flex-col items-end">
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={isEnhancing || !form.title.trim() || !form.category.trim() || !form.skills.trim()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isEnhancing || !form.title.trim() || !form.category.trim() || !form.skills.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {isEnhancing ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>✨ Generate AI Description</>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 mt-1">
                  Uses: Title + Category + Skills + Description
                </p>
              </div>
            </div>
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

          {/* AI Enhancement Error */}
          {enhanceError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex items-start gap-2 text-sm">
              <span>⚠️</span>
              <p className="font-medium">{enhanceError}</p>
            </div>
          )}

          {/* AI Enhanced Preview Card */}
          {enhancedText && (
            <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 flex items-center gap-2">
                <span className="text-white text-sm">✨</span>
                <h4 className="text-sm font-bold text-white">AI Enhanced Description</h4>
                <span className="ml-auto text-xs text-indigo-100 bg-white/20 px-2 py-0.5 rounded-full">
                  {regenCount}/{MAX_REGENERATIONS} used
                </span>
              </div>

              {/* Enhanced Text */}
              <div className="p-4">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {enhancedText}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 px-4 pb-4">
                <button
                  type="button"
                  onClick={handleUseDescription}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  ✅ Use Description
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isEnhancing || regenCount >= MAX_REGENERATIONS}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    regenCount >= MAX_REGENERATIONS
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  🔄 Regenerate ({MAX_REGENERATIONS - regenCount} left)
                </button>
                <button
                  type="button"
                  onClick={handleDiscardEnhanced}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-400 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  🗑️ Discard
                </button>
              </div>
            </div>
          )}

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
              onClick={() => {
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
                setEnhancedText(null)
                setRegenCount(0)
                setEnhanceError(null)
              }}
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
