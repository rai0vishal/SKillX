import React from 'react'

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-sm text-gray-500">Total Gigs</h2>
          <p className="text-3xl font-bold text-indigo-600 mt-2">12</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-sm text-gray-500">Skill Exchanges</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">5</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-sm text-gray-500">Profile Views</h2>
          <p className="text-3xl font-bold text-purple-600 mt-2">148</p>
        </div>

      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Activity
        </h2>

        <ul className="space-y-3 text-gray-600">
          <li>✅ You posted a new gig: <span className="font-medium text-gray-800">Web Design</span></li>
          <li>🤝 Skill exchanged with <span className="font-medium text-gray-800">Aman</span></li>
          <li>👀 Profile viewed by <span className="font-medium text-gray-800">3 users</span></li>
        </ul>
      </div>

    </div>
  )
}

export default Dashboard
