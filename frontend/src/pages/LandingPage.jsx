import React from 'react'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-600 to-purple-700 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to SkillX 🚀
        </h1>
        <p className="text-gray-600 mb-6">
          Exchange skills, post gigs, and grow together.
        </p>

        <div className="flex flex-col gap-4">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition">
            Get Started
          </button>
          <button className="border border-indigo-600 text-indigo-600 py-2 rounded-lg hover:bg-indigo-50 transition">
            Explore Skills
          </button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
