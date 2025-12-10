import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:5000'

const PublicProfile = () => {
  const { email } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_BASE_URL}/api/profile/${email}`)
      if (res.status === 404) {
        setError('Profile not found for this user.')
        setLoading(false)
        return
      }

      if (!res.ok) throw new Error('Failed to fetch profile')

      const data = await res.json()
      setProfile(data)
    } catch (err) {
      console.error(err)
      setError('Could not load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [email])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white p-6 rounded-2xl shadow-md max-w-md w-full text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  const skills = profile.skills || []

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
            {profile.name ? profile.name.charAt(0) : 'U'}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-800">
              {profile.name}
            </h1>
            <p className="text-sm text-indigo-600 mt-1">
              {profile.role || 'No role specified'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              📧 {profile.email}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              📍 {profile.location || 'Unknown location'}
            </p>

            <p className="text-sm text-gray-600 mt-4">
              {profile.bio || 'No bio provided yet.'}
            </p>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicProfile
