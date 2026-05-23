import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Camera, Pencil, Check, X, AlertCircle,
  Briefcase, CheckCircle2, ArrowLeftRight, BookOpen,
  Star, MessageCircle, CalendarDays, Code2, Link2, Globe,
  Save,
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import { TagInput } from '../components/ui/TagInput'
import { API_BASE_URL } from '../config/api.js'

/* ── Section Card wrapper ───────────────────────────────── */
const Section = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: 28,
    marginBottom: 16,
    boxShadow: 'var(--shadow-sm)',
    ...style,
  }}>
    {children}
  </div>
)

const SectionTitle = ({ icon: Icon, children }) => (
  <h2 style={{
    fontSize: 16, fontWeight: 600, color: 'var(--text-primary)',
    marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
  }}>
    {Icon && <Icon size={18} color="var(--primary)" aria-hidden="true" />}
    {children}
  </h2>
)

/* ── Profile Component ──────────────────────────────────── */
const Profile = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userEmail = storedUser.email

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [avatarHover, setAvatarHover] = useState(false)
  const fileInputRef = useRef(null)

  // Bio toggle state
  const [editingBio, setEditingBio] = useState(false)
  const [bioTemp, setBioTemp] = useState('')

  const [profile, setProfile] = useState({
    email: userEmail || '',
    name: storedUser.name || '',
    role: '',
    location: '',
    bio: '',
    skills: [],
    stats: { gigsPosted: 0, gigsCompleted: 0, skillExchanges: 0, skillExchangesCompleted: 0, averageRating: 0, totalReviews: 0 },
    availability: [],
    customAvailability: [],
  })
  const [socialData, setSocialData] = useState({ github: '', linkedin: '', website: '' })
  const [availabilityMissing, setAvailabilityMissing] = useState(false)

  const fetchProfile = async () => {
    if (!userEmail) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE_URL}/api/profile/${userEmail}`)
      if (res.status === 404) { setLoading(false); return }
      if (!res.ok) throw new Error('Failed to fetch profile')
      const data = await res.json()
      const skillArray = Array.isArray(data.skills)
        ? data.skills
        : (data.skills || '').split(',').map(s => s.trim()).filter(Boolean)
      setProfile({
        email: data.email,
        name: data.name,
        role: data.role || '',
        location: data.location || '',
        bio: data.bio || '',
        skills: skillArray,
        stats: {
          gigsPosted: data.stats?.gigsPosted ?? 0,
          gigsCompleted: data.stats?.gigsCompleted ?? 0,
          skillExchanges: data.stats?.skillExchanges ?? 0,
          skillExchangesCompleted: data.stats?.skillExchangesCompleted ?? 0,
          averageRating: data.stats?.averageRating ?? 0,
          totalReviews: data.stats?.totalReviews ?? 0,
        },
        status: data.status || 'active',
        availability: data.availability || [],
        customAvailability: data.customAvailability || [],
      })
      setBioTemp(data.bio || '')
      if (data.socialLinks) setSocialData(data.socialLinks)
      setAvailabilityMissing(!data.availability || data.availability.length === 0)
    } catch (err) {
      console.error(err)
      setError('Could not load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    if (!userEmail) { setLoadingReviews(false); return }
    try {
      setLoadingReviews(true)
      const res = await fetch(`${API_BASE_URL}/api/reviews/user/${userEmail}`)
      if (res.ok) setReviews(await res.json())
    } catch (err) {
      console.error('Failed to fetch reviews', err)
    } finally {
      setLoadingReviews(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchReviews()
  }, [])

  const handleFieldChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!profile.email || !profile.name) {
      toast.error('Name and email are required.')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills,
          socialLinks: socialData,
        }),
      })
      if (!res.ok) throw new Error('Failed to save profile')
      const data = await res.json()
      const skillArray = Array.isArray(data.skills)
        ? data.skills
        : (data.skills || '').split(',').map(s => s.trim()).filter(Boolean)
      setProfile(prev => ({
        ...prev,
        ...data,
        skills: skillArray,
        stats: {
          gigsPosted: data.stats?.gigsPosted ?? 0,
          gigsCompleted: data.stats?.gigsCompleted ?? 0,
          skillExchanges: data.stats?.skillExchanges ?? 0,
          skillExchangesCompleted: data.stats?.skillExchangesCompleted ?? 0,
          averageRating: data.stats?.averageRating ?? 0,
          totalReviews: data.stats?.totalReviews ?? 0,
        },
      }))
      setAvailabilityMissing(!data.availability || data.availability.length === 0)
      toast.success('Profile saved successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Could not save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    toast.info('Avatar upload coming soon!')
  }

  // If no user
  if (!userEmail) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Not signed in</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Please sign in to view and edit your profile.</p>
        </div>
      </div>
    )
  }

  const stats = profile.stats

  return (
    <main role="main" aria-label="Profile page" style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: 48 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px' }}>

        {/* Profile Completion Banner */}
        {availabilityMissing && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => document.getElementById('availability-section')?.scrollIntoView({ behavior: 'smooth' })}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('availability-section')?.scrollIntoView({ behavior: 'smooth' }) } }}
            style={{
              background: 'var(--warning-bg)', border: '1px solid var(--warning-border)',
              borderLeft: '4px solid var(--warning)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} color="var(--warning)" aria-hidden="true" />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)', margin: 0 }}>Profile Completion: 78%</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>Missing: Availability not added</p>
              </div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, flexShrink: 0 }}>Fix now →</span>
          </div>
        )}

        {/* Status */}
        {loading && <LoadingSpinner message="Fetching your profile…" />}
        {error && <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: 14, marginBottom: 16 }}>{error}</div>}

        {/* ── Top Card: Avatar + Name + Bio ── */}
        <Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div
                style={{ position: 'relative', width: 80, height: 80, cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload profile photo"
                onKeyDown={e => { if (e.key === 'Enter') fileInputRef.current?.click() }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), #7C3AED)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, border: '3px solid var(--border-strong)',
                }}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <AnimatePresence>
                  {avatarHover && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Camera size={20} color="white" aria-hidden="true" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </div>

              {/* Name + role + location */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  placeholder="Your Name"
                  aria-label="Full name"
                  style={{
                    fontSize: 24, fontWeight: 700, color: 'var(--text-primary)',
                    background: 'transparent', border: 'none', borderBottom: '1.5px solid var(--border)',
                    outline: 'none', marginBottom: 8, width: '100%',
                    transition: 'border-color 200ms',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    border: '1px solid var(--border-strong)',
                  }}>
                    {profile.role || 'Member'}
                  </span>
                  {profile.status === 'suspended' && (
                    <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
                      SUSPENDED
                    </span>
                  )}
                  {stats.averageRating > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>
                      <Star size={13} fill="#F59E0B" aria-hidden="true" /> {stats.averageRating}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={profile.location}
                  onChange={e => handleFieldChange('location', e.target.value)}
                  placeholder="Your Location"
                  aria-label="Location"
                  style={{
                    fontSize: 13, color: 'var(--text-secondary)',
                    background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border)',
                    outline: 'none', width: '100%', fontFamily: 'inherit',
                    transition: 'border-color 200ms',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                />
              </div>
            </div>

            {/* Bio toggle */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Bio</label>
              {editingBio ? (
                <div>
                  <textarea
                    value={bioTemp}
                    onChange={e => setBioTemp(e.target.value)}
                    autoFocus
                    rows={3}
                    placeholder="Write a short bio about yourself…"
                    style={{
                      width: '100%', minHeight: 90,
                      background: 'var(--bg-surface-2)', border: '1.5px solid var(--primary)',
                      borderRadius: 'var(--radius-md)', padding: '10px 12px',
                      fontSize: 14, color: 'var(--text-primary)', resize: 'vertical',
                      boxShadow: '0 0 0 3px rgba(91,79,232,0.12)', outline: 'none',
                      fontFamily: 'inherit', lineHeight: 1.6,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => { handleFieldChange('bio', bioTemp); setEditingBio(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Check size={13} aria-hidden="true" /> Save Bio
                    </button>
                    <button
                      onClick={() => { setBioTemp(profile.bio); setEditingBio(false) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                    >
                      <X size={13} aria-hidden="true" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingBio(true)}
                  role="button"
                  tabIndex={0}
                  aria-label="Edit bio"
                  onKeyDown={e => { if (e.key === 'Enter') setEditingBio(true) }}
                  style={{
                    minHeight: 60, padding: '10px 12px',
                    border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-md)',
                    cursor: 'text', fontSize: 14, lineHeight: 1.7,
                    color: profile.bio ? 'var(--text-secondary)' : 'var(--text-muted)',
                    position: 'relative', transition: 'border-color 200ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  {profile.bio || 'Write a short bio about yourself…'}
                  <Pencil size={12} style={{ position: 'absolute', bottom: 8, right: 10, color: 'var(--text-muted)' }} aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Save */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', background: saving ? 'var(--text-muted)' : 'var(--primary)',
                  color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                  fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
              >
                <Save size={15} aria-hidden="true" />
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Activity Overview ── */}
        <Section>
          <SectionTitle icon={Briefcase}>Activity Overview</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Gigs Posted',      value: stats.gigsPosted,              icon: Briefcase,      color: 'var(--primary)' },
              { label: 'Gigs Completed',   value: stats.gigsCompleted,           icon: CheckCircle2,   color: 'var(--success)' },
              { label: 'Exchanges Sent',   value: stats.skillExchanges,          icon: ArrowLeftRight, color: '#0EA5E9' },
              { label: 'Skills Exchanged', value: stats.skillExchangesCompleted, icon: BookOpen,       color: '#D97706' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                style={{
                  background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: 16, textAlign: 'center',
                }}
              >
                <Icon size={18} color={color} style={{ margin: '0 auto 8px' }} aria-hidden="true" />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color }}>
                  <AnimatedCounter to={value} />
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            Stats update automatically from your gigs and skill exchanges.
          </p>
        </Section>

        {/* ── Skills ── */}
        <Section>
          <SectionTitle>Skills</SectionTitle>
          <TagInput
            value={Array.isArray(profile.skills) ? profile.skills : []}
            onChange={tags => handleFieldChange('skills', tags)}
            placeholder="Type a skill and press Enter or comma…"
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Press Enter or comma to add. Backspace removes the last tag.</p>
        </Section>

        {/* ── Social Links ── */}
        <Section>
          <SectionTitle icon={Link2}>Social Links</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'github',   Icon: Code2,  placeholder: 'github.com/username',     label: 'GitHub' },
              { key: 'linkedin', Icon: Link2,  placeholder: 'linkedin.com/in/username', label: 'LinkedIn' },
              { key: 'website',  Icon: Globe,  placeholder: 'yourwebsite.com',          label: 'Website' },
            ].map(({ key, Icon, placeholder, label }) => (
              <div key={key} style={{ position: 'relative' }}>
                <Icon size={15} aria-hidden="true" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  value={socialData[key] || ''}
                  onChange={e => setSocialData(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  aria-label={label}
                  style={{
                    width: '100%', padding: '10px 14px 10px 36px',
                    background: 'var(--bg-surface-2)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)', fontSize: 14,
                    color: 'var(--text-primary)', outline: 'none',
                    transition: 'border-color 200ms', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(91,79,232,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Availability ── */}
        <Section id="availability-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <SectionTitle icon={CalendarDays}>Availability</SectionTitle>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                fontSize: 12, fontWeight: 600,
                background: 'var(--primary-light)', color: 'var(--primary)',
                border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
                padding: '6px 14px', cursor: 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save Availability'}
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Set your preferred times for sessions so others can schedule with you easily.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
              const dayAvail = profile.availability?.find(a => a.day === day) || { day, slots: [] }

              const addSlot = () => {
                const newAvail = [...(profile.availability || [])]
                const idx = newAvail.findIndex(a => a.day === day)
                if (idx >= 0) newAvail[idx].slots.push({ startTime: '09:00', endTime: '10:00' })
                else newAvail.push({ day, slots: [{ startTime: '09:00', endTime: '10:00' }] })
                setProfile(prev => ({ ...prev, availability: newAvail }))
              }

              const updateSlot = (slotIdx, field, value) => {
                const newAvail = [...profile.availability]
                const dayIdx = newAvail.findIndex(a => a.day === day)
                newAvail[dayIdx].slots[slotIdx][field] = value
                setProfile(prev => ({ ...prev, availability: newAvail }))
              }

              const removeSlot = (slotIdx) => {
                const newAvail = [...profile.availability]
                const dayIdx = newAvail.findIndex(a => a.day === day)
                newAvail[dayIdx].slots.splice(slotIdx, 1)
                setProfile(prev => ({ ...prev, availability: newAvail }))
              }

              return (
                <div key={day} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 40, paddingTop: 4, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{day}</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dayAvail.slots.map((slot, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="time" value={slot.startTime}
                          onChange={e => updateSlot(i, 'startTime', e.target.value)}
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 10px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>–</span>
                        <input
                          type="time" value={slot.endTime}
                          onChange={e => updateSlot(i, 'endTime', e.target.value)}
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 10px', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}
                        />
                        <button
                          onClick={() => removeSlot(i)}
                          aria-label="Remove time slot"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={14} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addSlot}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: 'var(--radius-md)', padding: '4px 10px', cursor: 'pointer', alignSelf: 'flex-start' }}
                    >
                      + Add Slot
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* ── Reviews Received ── */}
        <Section>
          <SectionTitle icon={MessageCircle}>
            Reviews Received
            {stats.totalReviews > 0 && (
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>
                ({stats.totalReviews} · ⭐ {stats.averageRating} avg)
              </span>
            )}
          </SectionTitle>

          {loadingReviews ? (
            <LoadingSpinner message="Fetching reviews…" />
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
              <MessageCircle size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.5 }} aria-hidden="true" />
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>No reviews yet</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Complete sessions to receive your first review!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.slice(0, 10).map(review => (
                <div
                  key={review._id}
                  style={{
                    background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                        {review.reviewerEmail[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {review.reviewerEmail.split('@')[0]}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={13}
                          fill={star <= review.rating ? '#F59E0B' : 'none'}
                          color={star <= review.rating ? '#F59E0B' : 'var(--border-strong)'}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                  {review.feedback && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 6px' }}>
                      "{review.feedback}"
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </main>
  )
}

export default Profile
