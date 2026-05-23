import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Hand, ArrowLeftRight, UserCircle, Bell, LayoutDashboard, Briefcase,
  Brain, RefreshCw, Plus, Search, CalendarDays, Globe,
  CheckCircle2, MessageCircle
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner';
import LearningRoadmap from '../components/LearningRoadmap'
import MyLearningHub from '../components/MyLearningHub'
import SessionCard from '../components/SessionCard'
import SessionModal from '../components/SessionModal'
import ReviewModal from '../components/ReviewModal'
import AnalyticsCards from '../components/analytics/AnalyticsCards'
import WeeklyChart from '../components/analytics/WeeklyChart'
import SkillDistributionChart from '../components/analytics/SkillDistributionChart'
import Achievements from '../components/analytics/Achievements'
import RecentActivity from '../components/analytics/RecentActivity'
import SessionCountdownCard from '../components/session/SessionCountdownCard'
import UpcomingSessionsModal from '../components/session/UpcomingSessionsModal'

import { API_BASE_URL } from '../config/api.js'

const Dashboard = () => {
  const navigate = useNavigate()
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userEmail = storedUser.email
  const [hubRefreshKey, setHubRefreshKey] = useState(0)
  
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState('overview')

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

  // ✅ NEW: state for gig applications
  const [gigApplications, setGigApplications] = useState({
    received: [],
    sent: [],
  })

  // ✅ NEW: state for upcoming sessions
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [isSubmittingSession, setIsSubmittingSession] = useState(false)
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false)

  // Review states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewingSession, setReviewingSession] = useState(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({
    user: null,
    activity: [],
    skills: [],
    badges: [],
    recentActivity: [],
  })
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)


  const [loadingRequests, setLoadingRequests] = useState(true)
  const [loadingGigApps, setLoadingGigApps] = useState(true)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [error, setError] = useState(null)

  // ------------ DASHBOARD STATS ------------
  const fetchStats = async () => {
    try {
      const url = userEmail
        ? `${API_BASE_URL}/api/dashboard?email=${encodeURIComponent(userEmail)}`
        : `${API_BASE_URL}/api/dashboard`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
      setError('Could not load dashboard data. Please try again.')
    }
  }

  // ------------ SKILL EXCHANGE REQUESTS ------------
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

      setRequests(prev => ({
        received: prev.received.map(r =>
          r._id === updated._id ? updated : r,
        ),
        sent: prev.sent.map(r =>
          r._id === updated._id ? updated : r,
        ),
      }))

      if (newStatus === 'accepted') {
        toast.success('Exchange request accepted!')
      } else if (newStatus === 'rejected') {
        toast.info('Exchange request rejected.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not update request. Please try again.')
    }
  }

  // ------------ GIG APPLICATIONS (NEW) ------------
  const fetchGigApplications = async () => {
    try {
      if (!userEmail) {
        setLoadingGigApps(false)
        return
      }
      setLoadingGigApps(true)
      const res = await fetch(
        `${API_BASE_URL}/api/gig-applications?email=${encodeURIComponent(
          userEmail,
        )}`,
      )
      if (!res.ok) throw new Error('Failed to fetch gig applications')

      const data = await res.json()
      setGigApplications({
        received: data.received || [],
        sent: data.sent || [],
      })
    } catch (err) {
      console.error(err)
      setError('Could not load gig applications. Please try again.')
    } finally {
      setLoadingGigApps(false)
    }
  }

  const handleUpdateGigApplication = async (id, newStatus) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/gig-applications/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        },
      )
      if (!res.ok) throw new Error('Failed to update gig application')

      const updated = await res.json()

      setGigApplications(prev => ({
        received: prev.received.map(a =>
          a._id === updated._id ? updated : a,
        ),
        sent: prev.sent.map(a =>
          a._id === updated._id ? updated : a,
        ),
      }))

      if (newStatus === 'accepted') {
        toast.success('Gig application accepted!')
      } else if (newStatus === 'rejected') {
        toast.info('Gig application rejected.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Could not update gig application. Please try again.')
    }
  }

  // ------------ SESSIONS ------------
  const fetchUpcomingSessions = async () => {
    try {
      if (!userEmail) {
        setLoadingSessions(false)
        return
      }
      setLoadingSessions(true)
      const res = await fetch(`${API_BASE_URL}/api/sessions?email=${encodeURIComponent(userEmail)}`)
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
      setUpcomingSessions(data.filter(s => ['Scheduled', 'Rescheduled', 'Pending'].includes(s.status)))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleSessionSubmit = async (sessionData) => {
    setIsSubmittingSession(true)
    try {
      if (editingSession && editingSession._id) {
        const res = await fetch(`${API_BASE_URL}/api/sessions/${editingSession._id}/reschedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData),
        })
        if (!res.ok) throw new Error(await res.text())
        setIsSessionModalOpen(false)
        setEditingSession(null)
        fetchUpcomingSessions()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmittingSession(false)
    }
  }

  const handleSessionAction = async (sessionId, action) => {
    if (action === 'cancel' && !window.confirm('Are you sure you want to cancel this session?')) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/${action}`, { method: 'PUT' })
      if (!res.ok) throw new Error(`Failed to ${action} session`)
      fetchUpcomingSessions()
      if (action === 'accept') toast.success('Session accepted!')
      else if (action === 'cancel') toast.info('Session cancelled.')
      else if (action === 'complete') toast.success('Session marked as completed!')
    } catch (error) {
      console.error('Failed session action', error)
      toast.error(`Could not ${action} session. Please try again.`)
    }
  }

  // ------------ REVIEWS ------------
  const handleReviewSubmit = async ({ sessionId, reviewedUserEmail, rating, feedback }) => {
    setIsSubmittingReview(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerEmail: userEmail,
          reviewedUserEmail,
          sessionId,
          rating,
          feedback,
        }),
      })
      if (!res.ok) {
        const errData = await res.json()
        alert(errData.message || 'Failed to submit review')
        return
      }
      setIsReviewModalOpen(false)
      setReviewingSession(null)
      fetchUpcomingSessions()
    } catch (error) {
      console.error('Failed to submit review', error)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // ------------ ANALYTICS ------------
  const fetchAnalytics = async () => {
    if (!userEmail) return
    setLoadingAnalytics(true)
    try {
      const [userRes, activityRes, skillsRes, badgesRes, recentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/analytics/user?email=${encodeURIComponent(userEmail)}`),
        fetch(`${API_BASE_URL}/api/analytics/activity?email=${encodeURIComponent(userEmail)}`),
        fetch(`${API_BASE_URL}/api/analytics/skills?email=${encodeURIComponent(userEmail)}`),
        fetch(`${API_BASE_URL}/api/analytics/badges?email=${encodeURIComponent(userEmail)}`),
        fetch(`${API_BASE_URL}/api/analytics/recent-activity?email=${encodeURIComponent(userEmail)}`),
      ])

      setAnalyticsData({
        user: userRes.ok ? await userRes.json() : null,
        activity: activityRes.ok ? await activityRes.json() : [],
        skills: skillsRes.ok ? await skillsRes.json() : [],
        badges: badgesRes.ok ? await badgesRes.json() : [],
        recentActivity: recentRes.ok ? await recentRes.json() : [],
      })
    } catch (error) {
      console.error('Failed to fetch analytics', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // ------------ EFFECT ------------
  useEffect(() => {
    fetchStats()
    if (userEmail) {
      fetchRequests()
      fetchGigApplications()
      fetchUpcomingSessions()
      fetchAnalytics()
    } else {
      setLoadingRequests(false)
      setLoadingGigApps(false)
      setLoadingSessions(false)
      setLoadingAnalytics(false)
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
    <motion.main
      role="main"
      aria-label="Dashboard"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '0 0 48px' }}
    >
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Welcome Banner */}
        {userEmail && (
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '22px 28px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Hand size={22} aria-hidden="true" style={{ opacity: 0.9, flexShrink: 0 }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Welcome back, {storedUser?.name?.split(' ')[0] || 'there'}!
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '0.85rem', opacity: 0.85 }}>
                Here's what's happening with your skill exchanges today.
              </p>
            </div>
          </div>
        )}

        {/* Quick-Action Cards */}
        {userEmail && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { Icon: ArrowLeftRight, label: 'Browse Exchanges', desc: 'Find skills to trade', path: '/skill-exchange', color: '#5B4FE8', bg: 'var(--primary-light)' },
              { Icon: UserCircle,     label: 'Update Profile',   desc: 'Keep your skills fresh', path: '/profile', color: '#0EA5E9', bg: 'var(--info-bg)' },
              { Icon: Bell,           label: 'Notifications',    desc: 'See latest activity', path: '/dashboard', color: '#F59E0B', bg: 'var(--warning-bg)' },
            ].map(({ Icon, label, desc, path, color, bg }, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                aria-label={label}
                onClick={() => navigate(path)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(path); } }}
                className="card card-spring"
                style={{ cursor: 'pointer', padding: '16px' }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 10,
                  }}
                  aria-hidden="true"
                >
                  <Icon size={18} color={color} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
              Overview of gigs, skill exchanges, your activity, and requests.
            </p>
            {userEmail && pendingReceivedCount > 0 && (
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bell size={13} aria-hidden="true" />
                {pendingReceivedCount} pending skill exchange request{pendingReceivedCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              fetchStats()
              if (userEmail) {
                fetchRequests()
                fetchGigApplications()
                fetchUpcomingSessions()
                fetchAnalytics()
              }
            }}
            className="inline-flex items-center gap-2 self-start"
            style={{
              fontSize: 13, background: 'var(--bg-surface-2)', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', padding: '7px 14px',
              borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500,
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <RefreshCw size={13} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {/* Errors */}
        {error && (
          <div style={{ fontSize: 13, background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}>
            {error}
          </div>
        )}

        {/* --- Tab Navigation --- */}
        {userEmail && (
          <div
            className="flex overflow-x-auto hide-scrollbar"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex min-w-max" style={{ gap: 4 }}>
              {[
                { id: 'overview',  label: 'Overview',  Icon: LayoutDashboard },
                { id: 'network',   label: 'Network',   Icon: ArrowLeftRight },
                { id: 'gigs',      label: 'Gigs',      Icon: Briefcase },
                { id: 'learning',  label: 'Learning',  Icon: Brain },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '12px 14px',
                    borderBottom: activeTab === id ? '2px solid var(--primary)' : '2px solid transparent',
                    color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === id ? 600 : 500,
                    fontSize: 13,
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap',
                  }}
                  aria-selected={activeTab === id}
                  role="tab"
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- OVERVIEW TAB --- */}
        {userEmail && activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Top Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-4">
                <SessionCountdownCard 
                  userEmail={userEmail} 
                  onViewAll={() => setIsUpcomingModalOpen(true)} 
                />
                
                {/* Quick Actions (New) */}
                <div className="card">
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { to: '/post-gig', Icon: Plus,         label: 'Post Gig',    color: '#5B4FE8', bg: 'var(--primary-light)' },
                      { to: '/search',   Icon: Search,        label: 'Find Skills', color: '#10B981', bg: '#ECFDF5' },
                      { to: '/chat',     Icon: CalendarDays,  label: 'Schedule',    color: '#0EA5E9', bg: '#E0F2FE' },
                    ].map(({ to, Icon, label, color, bg }) => (
                      <Link
                        key={to}
                        to={to}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', gap: 8, padding: '12px 8px',
                          borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                          background: bg, textDecoration: 'none',
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                      >
                        <Icon size={18} color={color} strokeWidth={1.8} aria-hidden="true" />
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
                      </Link>
                    ))}
                    <button
                      onClick={() => setActiveTab('network')}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', gap: 8, padding: '12px 8px',
                        borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                        background: '#E0F2FE', cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                    >
                      <Globe size={18} color="#0EA5E9" strokeWidth={1.8} aria-hidden="true" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0EA5E9' }}>Network</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Summary / Profile Stats */}
              <div className="card flex flex-col">
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Quick Summary</h3>
                <div className="flex-1 flex flex-col justify-center gap-5">
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'var(--primary-light)', color: 'var(--primary)',
                        fontSize: 22, fontWeight: 800,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 10, border: '2px solid var(--border-strong)',
                      }}
                    >
                      {userEmail.charAt(0).toUpperCase()}
                    </div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{userEmail.split('@')[0]}</h2>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>SkillX Member</p>
                  </div>
                  <div
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                      borderTop: '1px solid var(--border)', paddingTop: 16,
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{userStats.gigsCompleted}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 2 }}>Gigs Done</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{userStats.skillExchanges}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 2 }}>Exchanges</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Middle Section: Analytics & Charts */}
            <div className="mt-8">
              <AnalyticsCards data={analyticsData.user || {}} loading={loadingAnalytics} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <WeeklyChart data={analyticsData.activity} loading={loadingAnalytics} />
                <SkillDistributionChart data={analyticsData.skills} loading={loadingAnalytics} />
              </div>
            </div>

            {/* Bottom Section: Activity & Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <RecentActivity activities={analyticsData.recentActivity} loading={loadingAnalytics} />
              <Achievements badges={analyticsData.badges} loading={loadingAnalytics} />
            </div>

            {!loadingSessions && upcomingSessions.length > 0 && (
              <div className="card" style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Upcoming Sessions</span>
                  <span className="badge badge-exchange">{upcomingSessions.length}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingSessions.map(session => (
                    <SessionCard
                      key={session._id}
                      session={session}
                      userEmail={userEmail}
                      onReschedule={(s) => {
                        setEditingSession(s)
                        setIsSessionModalOpen(true)
                      }}
                      onAccept={(id) => handleSessionAction(id, 'accept')}
                      onSuggestAlternative={(s) => {
                        setEditingSession(s)
                        setIsSessionModalOpen(true)
                      }}
                      onCancel={(id) => handleSessionAction(id, 'cancel')}
                      onComplete={(id) => handleSessionAction(id, 'complete')}
                      onReview={(s) => {
                        const otherUser = s.participants.find(p => p !== userEmail)
                        setReviewingSession({ ...s, reviewedUserEmail: otherUser })
                        setIsReviewModalOpen(true)
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- NETWORK TAB --- */}
        {userEmail && activeTab === 'network' && (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {stats.matches && stats.matches.length > 0 && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
                <h2 className="text-2xl font-bold flex items-center gap-3 relative z-10">
                  <span className="text-3xl">✨</span> Perfect Matches Found!
                </h2>
                <p className="text-sm text-indigo-100 mt-2 mb-6 relative z-10 max-w-2xl">
                  Our smart algorithm detected that these users are offering exactly what you need, and they need exactly what you are offering!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                  {stats.matches.map((match, i) => (
                    <div key={i} className="bg-white/10 rounded-xl p-5 border border-white/20 backdrop-blur-md shadow-inner flex flex-col justify-between hover:bg-white/20 transition duration-300">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                            {match.matchedExchange.name ? match.matchedExchange.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <p className="font-bold text-lg">{match.matchedExchange.name}</p>
                        </div>
                        <div className="space-y-1 mt-3">
                          <p className="text-sm flex items-center gap-2">
                            <span className="opacity-70 w-14">Offers:</span>
                            <span className="font-semibold text-emerald-300 bg-emerald-900/30 px-2 py-0.5 rounded text-xs">{match.matchedExchange.skillOffered}</span>
                          </p>
                          <p className="text-sm flex items-center gap-2">
                            <span className="opacity-70 w-14">Needs:</span>
                            <span className="font-semibold text-pink-300 bg-pink-900/30 px-2 py-0.5 rounded text-xs">{match.matchedExchange.skillWanted}</span>
                          </p>
                        </div>
                      </div>
                      <Link to={`/user/${match.matchedExchange.email}`} className="mt-5 text-center bg-white text-indigo-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:shadow-md transition w-full block">
                        View Profile &amp; Message
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Skill Exchange Requests For You</h2>
                {loadingRequests ? (
                  <LoadingSpinner message="Fetching your data…" />
                ) : requests.received.length === 0 ? (
                  <p className="text-sm text-gray-600">No one has requested a skill exchange with you yet.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {requests.received.filter(req => req.status === 'pending').map(req => (
                        <div key={req._id} className="border border-gray-100 rounded-xl p-3 text-sm">
                          <p className="text-gray-800"><span className="font-medium">From: </span>{req.fromEmail}</p>
                          <p className="text-gray-600 mt-1">{req.message || 'No message provided.'}</p>
                          <p className="text-xs text-gray-500 mt-1">Status: <span className="text-yellow-600 font-medium">pending</span></p>
                          <div className="flex gap-2 mt-2">
                            <button className="px-3 py-1 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition" onClick={() => handleUpdateRequest(req._id, 'accepted')}>Accept</button>
                            <button className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition" onClick={() => handleUpdateRequest(req._id, 'rejected')}>Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Previous decisions</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {requests.received.filter(req => req.status !== 'pending').map(req => (
                          <div key={req._id} className="border border-gray-100 rounded-xl p-3 text-xs">
                            <p className="text-gray-800"><span className="font-medium">From: </span>{req.fromEmail}</p>
                            <p className="text-gray-600 mt-1 line-clamp-2">{req.message || 'No message provided.'}</p>
                            <p className="text-xs text-gray-500 mt-1">Status: <span className={req.status === 'accepted' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{req.status}</span></p>
                            {req.status === 'accepted' && (<Link to="/chat" className="inline-block mt-2 text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded hover:bg-indigo-100 transition">💬 Go to Messages</Link>)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Skill Exchange Requests You Sent</h2>
                {loadingRequests ? (
                  <LoadingSpinner message="Fetching your data…" />
                ) : requests.sent.length === 0 ? (
                  <p className="text-sm text-gray-600">You haven&apos;t sent any skill exchange requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {requests.sent.map(req => (
                      <div key={req._id} className="border border-gray-100 rounded-xl p-3 text-sm">
                        <p className="text-gray-800"><span className="font-medium">To: </span>{req.toEmail}</p>
                        <p className="text-gray-600 mt-1">{req.message || 'No message provided.'}</p>
                        <p className="text-xs text-gray-500 mt-1">Status: <span className={req.status === 'accepted' ? 'text-green-600 font-medium' : req.status === 'rejected' ? 'text-red-600 font-medium' : 'text-yellow-600 font-medium'}>{req.status}</span></p>
                        {req.status === 'accepted' && (<Link to="/chat" className="inline-block mt-2 text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded hover:bg-indigo-100 transition">💬 Go to Messages</Link>)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- GIGS TAB --- */}
        {userEmail && activeTab === 'gigs' && (
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Gig Applications For Your Gigs</h2>
                {loadingGigApps ? (
                  <LoadingSpinner message="Fetching your data…" />
                ) : gigApplications.received.length === 0 ? (
                  <p className="text-sm text-gray-600">No one has applied to your gigs yet.</p>
                ) : (
                  <div className="space-y-3">
                    {gigApplications.received.map(app => (
                      <div key={app._id} className="border border-gray-100 rounded-xl p-3 text-sm">
                        <p className="text-gray-800"><span className="font-medium">Gig:</span> {app.gigTitle}</p>
                        <p className="text-gray-800"><span className="font-medium">From:</span> {app.applicantEmail}</p>
                        {app.message && (<p className="text-gray-600 mt-1">Message: {app.message}</p>)}
                        <p className="text-xs text-gray-500 mt-1">Status: <span className={app.status === 'accepted' ? 'text-green-600 font-medium' : app.status === 'rejected' ? 'text-red-600 font-medium' : 'text-yellow-600 font-medium'}>{app.status}</span></p>
                        {app.status === 'pending' && (
                          <div className="flex gap-2 mt-2">
                            <button className="px-3 py-1 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition" onClick={() => handleUpdateGigApplication(app._id, 'accepted')}>Accept</button>
                            <button className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 transition" onClick={() => handleUpdateGigApplication(app._id, 'rejected')}>Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Gig Applications You Sent</h2>
                {loadingGigApps ? (
                  <LoadingSpinner message="Fetching your data…" />
                ) : gigApplications.sent.length === 0 ? (
                  <p className="text-sm text-gray-600">You haven&apos;t applied to any gigs yet.</p>
                ) : (
                  <div className="space-y-3">
                    {gigApplications.sent.map(app => (
                      <div key={app._id} className="border border-gray-100 rounded-xl p-3 text-sm">
                        <p className="text-gray-800"><span className="font-medium">Gig:</span> {app.gigTitle}</p>
                        <p className="text-gray-800"><span className="font-medium">Owner:</span> {app.gigOwnerEmail}</p>
                        {app.message && (<p className="text-gray-600 mt-1">Message: {app.message}</p>)}
                        <p className="text-xs text-gray-500 mt-1">Status: <span className={app.status === 'accepted' ? 'text-green-600 font-medium' : app.status === 'rejected' ? 'text-red-600 font-medium' : 'text-yellow-600 font-medium'}>{app.status}</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- LEARNING TAB --- */}
        {userEmail && activeTab === 'learning' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI Learning Roadmap Section */}
            <LearningRoadmap
              userEmail={userEmail}
              onRoadmapSaved={() => setHubRefreshKey((k) => k + 1)}
            />

            {/* My Learning Hub Section */}
            <MyLearningHub userEmail={userEmail} refreshKey={hubRefreshKey} />
          </div>
        )}
      </div>

      {/* Session Modal for Rescheduling */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSubmit={handleSessionSubmit}
        isSubmitting={isSubmittingSession}
        initialData={editingSession}
      />

      <UpcomingSessionsModal 
        isOpen={isUpcomingModalOpen} 
        onClose={() => setIsUpcomingModalOpen(false)} 
        userEmail={userEmail} 
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => { setIsReviewModalOpen(false); setReviewingSession(null) }}
        onSubmit={handleReviewSubmit}
        isSubmitting={isSubmittingReview}
        sessionId={reviewingSession?._id}
        reviewedUserEmail={reviewingSession?.reviewedUserEmail}
      />
    </motion.main>
  )
}

export default Dashboard
