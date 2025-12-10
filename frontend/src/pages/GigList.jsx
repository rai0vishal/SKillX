import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:5000' // backend URL

const GigList = () => {
  const navigate = useNavigate()

  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGigs = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_BASE_URL}/api/gigs`)
      if (!res.ok) {
        throw new Error('Failed to fetch gigs')
      }

      const data = await res.json()
      setGigs(data)
    } catch (err) {
      console.error('Error fetching gigs:', err)
      setError('Could not load gigs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Delete this gig?')
    if (!confirmDelete) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/gigs/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete gig')
      }

      // Remove gig from UI
      setGigs((prev) => prev.filter((g) => g._id !== id))
    } catch (err) {
      console.error('Error deleting gig:', err)
      alert('Error deleting gig')
    }
  }

  useEffect(() => {
    fetchGigs()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Available Gigs
          </h1>
          <p className="text-gray-600 mt-1">
            These gigs are coming directly from your backend (MongoDB).
          </p>
        </div>

        <button
          onClick={fetchGigs}
          className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Loading / Error / Empty states */}
      <div className="max-w-6xl mx-auto">
        {loading && (
          <p className="text-gray-600 text-sm">Loading gigs...</p>
        )}

        {error && (
          <div className="mb-4 text-sm bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && gigs.length === 0 && (
          <p className="text-gray-600 text-sm">
            No gigs found. Try posting one from the{' '}
            <span className="font-medium">Post Gig</span> page.
          </p>
        )}
      </div>

      {/* Gig Cards */}
      {!loading && !error && gigs.length > 0 && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {gigs.map((gig) => {
            // 🔹 Make sure skills is always an array
            const skillList = Array.isArray(gig.skills)
              ? gig.skills
              : (gig.skills || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)

            return (
              <div
                key={gig._id}
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition flex flex-col justify-between"
              >
                {/* Title */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-1">
                    {gig.title}
                  </h2>

                  {/* Category + type */}
                  <p className="text-xs text-indigo-600 font-medium mb-2">
                    {gig.category || 'General'} • {gig.type || 'One-time Project'}
                  </p>

                  {/* Skills */}
                  {skillList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {skillList.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {gig.description}
                  </p>

                  {/* Details */}
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <p>
                      <span className="font-medium">Budget:</span>{' '}
                      {gig.budget ? `₹${gig.budget}` : 'Not specified'}
                    </p>
                    <p>
                      <span className="font-medium">Duration:</span>{' '}
                      {gig.duration || 'Not specified'}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{' '}
                      {gig.location || 'Remote'}
                    </p>
                    {gig.postedBy && (
                      <p className="text-xs text-gray-500">
                        Posted by: {gig.postedBy}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/gigs/${gig._id}`)}
                    className="text-sm text-indigo-600 font-medium hover:underline"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(gig._id)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GigList
