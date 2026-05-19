import React from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('user') // TODO: replace with real auth

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  return children
}

export default ProtectedRoute
