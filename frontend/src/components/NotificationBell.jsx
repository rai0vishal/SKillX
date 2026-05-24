import React from 'react'
const Bell = ({ size, color, style }) => <i className="ti ti-bell" style={{ fontSize: size || 'inherit', color, ...style }} />
import { useState, useEffect, useRef } from 'react'
import NotificationDropdown from './NotificationDropdown'
import { connectSocket } from '../config/socket'
import { API_BASE_URL } from '../config/api.js'

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState('All')
  const [loading, setLoading] = useState(false)

  const dropdownRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const userEmail = user?.email

  useEffect(() => {
    if (!userEmail) return

    const socket = connectSocket(userEmail)

    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const countRes = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
          headers: { 'user-email': userEmail },
        })
        const countData = await countRes.json()
        setUnreadCount(countData.count || 0)

        const notifRes = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { 'user-email': userEmail },
        })
        const notifData = await notifRes.json()
        setNotifications(notifData)
      } catch (error) {
        console.error('Failed to fetch notifications', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    socket.on('newNotification', notification => {
      setNotifications(prev => [notification, ...prev.filter(n => n._id !== notification._id)])
    })
    socket.on('notificationCountUpdated', count => {
      setUnreadCount(count)
    })

    return () => {
      socket.off('newNotification')
      socket.off('notificationCountUpdated')
    }
  }, [userEmail])

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async notification => {
    if (!notification.isRead) {
      try {
        await fetch(`${API_BASE_URL}/api/notifications/${notification._id}/read`, {
          method: 'PUT',
          headers: { 'user-email': userEmail },
        })
        setNotifications(prev =>
          prev.map(n => (n._id === notification._id ? { ...n, isRead: true } : n))
        )
      } catch (error) {
        console.error('Failed to mark read', error)
      }
    }
    setIsOpen(false)
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'user-email': userEmail },
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all read', error)
    }
  }

  const handleClearAll = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/archive`, {
        method: 'PUT',
        headers: { 'user-email': userEmail },
      })
      setNotifications([])
      setUnreadCount(0)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to archive notifications', error)
    }
  }

  if (!userEmail) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="icon-btn relative"
      >
        <Bell size={16} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-white font-bold text-[9px] bg-red-500 rounded-full"
            style={{ width: '16px', height: '16px', lineHeight: 1 }}
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
          onNotificationClick={handleNotificationClick}
          loading={loading}
        />
      )}
    </div>
  )
}

export default NotificationBell
