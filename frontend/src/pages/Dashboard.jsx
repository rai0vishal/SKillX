import React, { useEffect, useState } from 'react'

const API_BASE_URL = 'http://localhost:5000'

const Dashboard = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userEmail = storedUser.email

  const [stats, setStats] = useState({
    totalGigs: 0,
    totalSkillExchanges: 0,
    totalProfiles: 0,
    user: null,
  })
  const [requests, setRequests] = useState({
    received: [],
    sent: [],
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    try {
      setLoadingStats(true)
      const url = userEmail
        ? `${API_BASE_URL}/api/dashboard?email=${encodeURIComponent(
            userEmail,
          )}`
        : `${API_BASE_URL}/api/dashboard`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
      setError('Could not load dashboard data. Please try again.')
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchRequests = async () => {
    try {
      if (!userEmail) {
        setLoadingRequests(false)
        return
      }
      setLoadingRequests(true)
      const res = await fetch(
        `${API_BASE_URL}/api/exchange-requests?email=${encodeURIComponent(
          userEmail,
        )}`,
      )
      if (!res.ok) throw new Error('Failed to fetch requests')
      const data = await res.json()
      setRequests({
        received: data.received || [],
        sent: data.sent || [],
      })
    } catch (err) {
      console.error(err)
      setError('Could not load exchange requests. Please try again.')
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleUpdateRequest = async (id, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/exchange-requests/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      )
      if (!res.ok) throw new Error('Failed to update request')
      const updated = await res.json()

      // Update local state
      setRequests(prev => ({
        received: prev.received.map(r =>
          r._id === updated._id ? updated : r,
        ),
        sent: prev.sent.map(r =>
          r._id === updated._id ? updated : r,
        ),
      }))

      if (newStatus === 'accepted') {
        alert('You accepted the exchange request ✅')
      } else if (newStatus === 'rejected') {
        alert('You rejected the exchange request.')
      }
    } catch (err) {
      console.error(err)
      alert('Could not update request. Please try again.')
    }
  }

  useEffect(() => {
    fetchStats()
    if (userEmail) {
      fetchRequests()
    } else {
      setLoadingRequests(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail])

  const userStats = stats.user?.stats || {
    gigsPosted: 0,
    gigsCompleted: 0,
    skillExchanges: 0,
  }

  const pendingReceivedCount = requests.received.filter(
    r => r.status === 'pending',
  ).length

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex justify-center">
      <div className="w-full max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of gigs, skill exchanges, your activity, and requests.
            </p>
            {userEmail && pendingReceivedCount > 0 && (
              <p className="mt-2 text-sm text-purple-700 font-medium">
                🔔 You have {pendingReceivedCount} pending skill exchange
                request{pendingReceivedCount > 1 ? 's' : ''}.
              </p>
            )}
          </div>
          <button
            onClick={() => {
              fetchStats()
              if (userEmail) fetchRequests()
            }}
            className="self-start text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Refresh
          </button>
        </div>

        {/* Errors */}
        {error && (
          <div className="text-sm bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Top stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-md p-5">
            <p className="text-sm text-gray-500">Total Gigs</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">
              {stats.totalGigs}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              All gigs posted on the platform.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5">
            <p className="text-sm text-gray-500">Skill Exchange Profiles</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.totalSkillExchanges}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              People ready to exchange skills.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-5">
            <p className="text-sm text-gray-500">User Profiles</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              {stats.totalProfiles}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Users who created their SkillX profiles.
            </p>
          </div>
        </div>

        {/* User overview & activity */}
        {userEmail && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Your Overview
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Signed in as{' '}
                <span className="font-medium text-gray-800">
                  {userEmail}
                </span>
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <span className="font-medium">Name:</span>{' '}
                  {stats.user?.name || 'Not set'}
                </li>
                <li>
                  <span className="font-medium">Gigs Posted:</span>{' '}
                  {userStats.gigsPosted}
                </li>
                <li>
                  <span className="font-medium">Gigs Completed:</span>{' '}
                  {userStats.gigsCompleted}
                </li>
                <li>
                  <span className="font-medium">Skill Exchanges:</span>{' '}
                  {userStats.skillExchanges}
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Activity Snapshot
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Gigs Posted</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {userStats.gigsPosted}
                  </p>
                </div>
                <div className="border border-gray-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">
                    Gigs Completed
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {userStats.gigsCompleted}
                  </p>
                </div>
                <div className="border border-gray-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">
                    Skill Exchanges
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {userStats.skillExchanges}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                You can edit these numbers from your{' '}
                <span className="font-medium">Profile</span> page for now.
                Later we can auto-link them to your real activity.
              </p>
            </div>
          </div>
        )}

        {!userEmail && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Sign in to see personalized stats
            </h2>
            <p className="text-sm text-gray-600">
              You&apos;re currently not logged in with an email in
              localStorage. Sign in so we can show your own gigs, profile
              and activity here.
            </p>
          </div>
        )}

        {/* Exchange Requests Section */}
        {userEmail && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requests for you */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Skill Exchange Requests For You
              </h2>
              {loadingRequests ? (
                <p className="text-sm text-gray-600">
                  Loading your requests...
                </p>
              ) : requests.received.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No one has requested a skill exchange with you yet.
                </p>
              ) : (
                <>
                  {/* Pending requests with actions */}
                  <div className="space-y-3">
                    {requests.received
                      .filter(req => req.status === 'pending')
                      .map(req => (
                        <div
                          key={req._id}
                          className="border border-gray-100 rounded-xl p-3 text-sm"
                        >
                          <p className="text-gray-800">
                            <span className="font-medium">From: </span>
                            {req.fromEmail}
                          </p>
                          <p className="text-gray-600 mt-1">
                            {req.message || 'No message provided.'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Status:{' '}
                            <span className="text-yellow-600 font-medium">
                              pending
                            </span>
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              className="px-3 py-1 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                              onClick={() =>
                                handleUpdateRequest(req._id, 'accepted')
                              }
                            >
                              Accept
                            </button>
                            <button
                              className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                              onClick={() =>
                                handleUpdateRequest(req._id, 'rejected')
                              }
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* History of accepted/rejected */}
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      Previous decisions
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {requests.received
                        .filter(req => req.status !== 'pending')
                        .map(req => (
                          <div
                            key={req._id}
                            className="border border-gray-100 rounded-xl p-3 text-xs"
                          >
                            <p className="text-gray-800">
                              <span className="font-medium">From: </span>
                              {req.fromEmail}
                            </p>
                            <p className="text-gray-600 mt-1 line-clamp-2">
                              {req.message || 'No message provided.'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Status:{' '}
                              <span
                                className={
                                  req.status === 'accepted'
                                    ? 'text-green-600 font-medium'
                                    : 'text-red-600 font-medium'
                                }
                              >
                                {req.status}
                              </span>
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Requests you sent */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Skill Exchange Requests You Sent
              </h2>
              {loadingRequests ? (
                <p className="text-sm text-gray-600">
                  Loading your sent requests...
                </p>
              ) : requests.sent.length === 0 ? (
                <p className="text-sm text-gray-600">
                  You haven&apos;t sent any skill exchange requests yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {requests.sent.map(req => (
                    <div
                      key={req._id}
                      className="border border-gray-100 rounded-xl p-3 text-sm"
                    >
                      <p className="text-gray-800">
                        <span className="font-medium">To: </span>
                        {req.toEmail}
                      </p>
                      <p className="text-gray-600 mt-1">
                        {req.message || 'No message provided.'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status:{' '}
                        <span
                          className={
                            req.status === 'accepted'
                              ? 'text-green-600 font-medium'
                              : req.status === 'rejected'
                              ? 'text-red-600 font-medium'
                              : 'text-yellow-600 font-medium'
                          }
                        >
                          {req.status}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
