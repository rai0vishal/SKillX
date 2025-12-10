import React from 'react'
import { Routes, Route } from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import PostGig from './pages/PostGig'
import SkillExchange from './pages/SkillExchange'
import Profile from './pages/Profile'
import GigList from './pages/GigList'
import PublicProfile from './pages/PublicProfile'
import GigDetails from './pages/GigDetails'


import SignIn from './pages/auth/SignIn'
import SignUp from './pages/auth/SignUp'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Footer from './components/Footer'   // 👈 add this

const App = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Fixed navbar */}
      <Navbar />

      {/* Content area (grows) */}
      <main className="pt-16 px-4 pb-6 flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-gig"
            element={
              <ProtectedRoute>
                <PostGig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/skill-exchage"
            element={
              <ProtectedRoute>
                <SkillExchange />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gig-list"
            element={
              <ProtectedRoute>
                <GigList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gigs/:id" 
            element={
              <ProtectedRoute>
                <GigDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/:email"
            element={
              <ProtectedRoute>
                <PublicProfile />
              </ProtectedRoute>
            }
          />

        </Routes>
      </main>

      {/* Footer at bottom */}
      <Footer />
    </div>
  )
}

export default App
