import React, { useEffect, useState } from 'react'

const API_BASE_URL = 'http://localhost:5000' // backend URL

const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userEmail = storedUser.email

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFieldChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleStatsChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [field]: Number(value) || 0,
      },
    }))
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
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
              {profile.name ? profile.name.charAt(0) : 'U'}
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
                placeholder="Your Role (e.g. Full Stack Developer)"
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

        {/* Stats + Skills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Stats */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Activity Overview
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Gigs Posted</p>
                <input
                  type="number"
                  value={profile.stats.gigsPosted}
                  onChange={(e) =>
                    handleStatsChange('gigsPosted', e.target.value)
                  }
                  className="mt-2 text-2xl font-bold text-indigo-600 bg-transparent border-b border-gray-200 focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Gigs Completed</p>
                <input
                  type="number"
                  value={profile.stats.gigsCompleted}
                  onChange={(e) =>
                    handleStatsChange('gigsCompleted', e.target.value)
                  }
                  className="mt-2 text-2xl font-bold text-green-600 bg-transparent border-b border-gray-200 focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Skill Exchanges</p>
                <input
                  type="number"
                  value={profile.stats.skillExchanges}
                  onChange={(e) =>
                    handleStatsChange('skillExchanges', e.target.value)
                  }
                  className="mt-2 text-2xl font-bold text-purple-600 bg-transparent border-b border-gray-200 focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>
            </div>
          </div>

          {/* Skills */}
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
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            About
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            This is your profile section. You can keep your details up to date so others can
            understand your background and collaborate better with you on SkillX.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Profile
