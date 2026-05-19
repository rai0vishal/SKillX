import React, { useEffect, useState } from 'react'

import { API_BASE_URL } from '../config/api.js';

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userEmail = storedUser.email

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const [profile, setProfile] = useState({
    email: userEmail || '',
    name: storedUser.name || '',
    role: '',
    location: '',
    bio: '',
    skills: [],
    stats: {
      gigsPosted: 0,
      gigsCompleted: 0,
      skillExchanges: 0,
      skillExchangesCompleted: 0,
    },
  })

  // Load profile from backend
  const fetchProfile = async () => {
    if (!userEmail) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_BASE_URL}/api/profile/${userEmail}`)
      if (res.status === 404) {
        // No profile yet – use defaults
        setLoading(false)
        return
      }

      if (!res.ok) throw new Error('Failed to fetch profile')

      const data = await res.json()
      setProfile({
        email: data.email,
        name: data.name,
        role: data.role || '',
        location: data.location || '',
        bio: data.bio || '',
        skills: data.skills || [],
        stats: {
          gigsPosted: data.stats?.gigsPosted ?? 0,
          gigsCompleted: data.stats?.gigsCompleted ?? 0,
          skillExchanges: data.stats?.skillExchanges ?? 0,
          skillExchangesCompleted:
            data.stats?.skillExchangesCompleted ?? 0,
          averageRating: data.stats?.averageRating ?? 0,
          totalReviews: data.stats?.totalReviews ?? 0,
        },
      })
    } catch (err) {
      console.error(err)
      setError('Could not load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchReviews = async () => {
    if (!userEmail) {
      setLoadingReviews(false)
      return
    }
    try {
      setLoadingReviews(true)
      const res = await fetch(`${API_BASE_URL}/api/reviews/user/${userEmail}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!profile.email || !profile.name) {
      setError('Name and email are required.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setMessage(null)

      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          skills:
            typeof profile.skills === 'string'
              ? profile.skills
              : profile.skills.join(', '),
        }),
      })

      if (!res.ok) throw new Error('Failed to save profile')

      const data = await res.json()

      setProfile({
        email: data.email,
        name: data.name,
        role: data.role || '',
        location: data.location || '',
        bio: data.bio || '',
        skills: data.skills || [],
        stats: {
          gigsPosted: data.stats?.gigsPosted ?? 0,
          gigsCompleted: data.stats?.gigsCompleted ?? 0,
          skillExchanges: data.stats?.skillExchanges ?? 0,
          skillExchangesCompleted:
            data.stats?.skillExchangesCompleted ?? 0,
          averageRating: data.stats?.averageRating ?? 0,
          totalReviews: data.stats?.totalReviews ?? 0,
        },
      })

      setMessage('Profile saved successfully ✅')
    } catch (err) {
      console.error(err)
      setError('Could not save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            You&apos;re not signed in
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Please sign in to view and edit your profile.
          </p>
        </div>
      </div>
    )
  }

  const skillsString =
    Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills

  // helper so we don't repeat profile.stats everywhere
  const stats = profile.stats || {
    gigsPosted: 0,
    gigsCompleted: 0,
    skillExchanges: 0,
    skillExchangesCompleted: 0,
    averageRating: 0,
    totalReviews: 0,
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Status messages */}
        {loading && (
          <p className="text-sm text-gray-600 mb-3">Loading profile...</p>
        )}
        {error && (
          <div className="mb-3 text-sm bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-3 text-sm bg-green-100 text-green-800 px-4 py-2 rounded-lg">
            {message}
          </div>
        )}

        {/* Top Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold relative">
              {profile.name ? profile.name.charAt(0) : 'U'}
              {stats.averageRating > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-2 py-0.5 shadow-md border border-gray-100 flex items-center gap-1">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span className="text-xs font-bold text-gray-800">{stats.averageRating}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 bg-transparent border-b border-gray-200 focus:outline-none focus:border-indigo-500 text-center md:text-left"
                placeholder="Your Name"
              />

              <input
                type="text"
                value={profile.role}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                className="text-indigo-600 font-medium mt-1 bg-transparent border-b border-gray-200 focus:outline-none focus:border-indigo-500 text-center md:text-left text-sm md:text-base"
                placeholder="MERN Developer"
              />

              <p className="text-gray-500 text-sm mt-1">
                📍{' '}
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) =>
                    handleFieldChange('location', e.target.value)
                  }
                  className="bg-transparent border-b border-gray-200 focus:outline-none focus:border-indigo-500 text-center md:text-left text-sm"
                  placeholder="Your Location"
                />
              </p>

              <textarea
                value={profile.bio}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                rows={3}
                className="w-full mt-4 text-sm text-gray-600 bg-transparent border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                placeholder="Write a short bio about yourself..."
              />

              {/* Save button */}
              <div className="flex flex-col sm:flex-row gap-3 mt-5 justify-center md:justify-start">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats + Skills (matches your screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Activity Overview card (left, spans 2 columns) */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Activity Overview
            </h2>

            <div className="grid grid-cols-4 gap-6 text-center">
              {/* Gigs Posted */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Gigs Posted</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.gigsPosted}
                </p>
              </div>

              {/* Gigs Completed */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Gigs Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.gigsCompleted}
                </p>
              </div>

              {/* Skill Exchanges Sent */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Skill Exchg. Sent</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.skillExchanges}
                </p>
              </div>

              {/* Skill Exchanges Completed */}
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Skills Exchanged
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.skillExchangesCompleted}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              These numbers are updated automatically from your gigs and skill
              exchanges.
            </p>
          </div>

          {/* Skills card (right) */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Skills
            </h2>
            <textarea
              value={skillsString}
              onChange={(e) => handleFieldChange('skills', e.target.value)}
              rows={3}
              className="w-full text-sm text-gray-700 bg-transparent border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              placeholder="Comma separated skills e.g. React, Node.js, MongoDB"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {skillsString
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((skill, index) => (
                  <span
                    key={index}
                    className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">About</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            This is your profile section. You can keep your details up to date
            so others can understand your background and collaborate better with
            you on SkillX.
          </p>
        </div>

        {/* Reviews Received */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>💬</span> Reviews Received
            {stats.totalReviews > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''} • ⭐ {stats.averageRating} avg)
              </span>
            )}
          </h2>

          {loadingReviews ? (
            <p className="text-sm text-gray-500">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No reviews yet.</p>
              <p className="text-xs mt-1">Complete sessions to receive your first review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 10).map((review) => (
                <div
                  key={review._id}
                  className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                        {review.reviewerEmail[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {review.reviewerEmail.split('@')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className="text-sm"
                          style={{ filter: star <= review.rating ? 'none' : 'grayscale(100%) opacity(0.2)' }}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.feedback && (
                    <p className="text-sm text-gray-600 italic mt-1">
                      "{review.feedback}"
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
