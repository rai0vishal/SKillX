/**
 * Profile.jsx
 * Displays and manages the user's public and private profile details, stats, and reviews.
 */
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: firebaseUser } = useAuth();
  const storedUser = firebaseUser || {};
  const currentUserEmail = storedUser.email;
  const currentUid = storedUser.uid;

  const targetEmail = userId || currentUserEmail;
  const targetUid = userId || currentUid;
  const isOwnProfile = targetEmail === currentUserEmail;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [exchangeRequests, setExchangeRequests] = useState({ sent: [], received: [] });
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview | gigs | exchanges | reviews

  const [showSocialInput, setShowSocialInput] = useState(false);
  const [newSocialType, setNewSocialType] = useState('github');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddSocialLink = async () => {
    if (!newSocialUrl) return;
    setIsSaving(true);
    try {
      const updatedLinks = [...(profile.socialLinks || []), { type: newSocialType, url: newSocialUrl, label: newSocialType }];
      
      const res = await apiFetch(`/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: profile.name,
          socialLinks: updatedLinks,
          stats: profile.stats,
          skills: profile.skills
        })
      });
      
      if (res.ok) {
        setProfile({ ...profile, socialLinks: updatedLinks });
        setShowSocialInput(false);
        setNewSocialUrl('');
        toast.success('Social link added!');
      } else {
        toast.error('Failed to add social link.');
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!targetEmail) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const profRes = await apiFetch(`/api/profile/${targetEmail}`);
        if (profRes.ok) {
          const profData = await profRes.json();
          // Initialize socialLinks if undefined
          profData.socialLinks = profData.socialLinks || [];
          setProfile(profData);
        }

        const gigsRes = await apiFetch(`/api/gigs`);
        if (gigsRes.ok) {
          const allGigs = await gigsRes.json();
          // Filter by creator email
          setGigs(allGigs.filter(g => g.creatorEmail === targetEmail));
        }

        const exRes = await apiFetch(`/api/skill-exchange?userId=${targetUid}`);
        if (exRes.ok) {
          setExchanges(await exRes.json());
        }

        const reqRes = await apiFetch(`/api/exchange-requests?userId=${targetUid}`);
        if (reqRes.ok) {
          setExchangeRequests(await reqRes.json());
        }

        const revRes = await apiFetch(`/api/reviews/user/${targetEmail}`);
        if (revRes.ok) {
          setReviews(await revRes.json());
        }

      } catch (err) {
        console.error('Failed to fetch profile data', err);
        toast.error('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetEmail]);

  if (!targetEmail) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: 32 }}>
          <h1 className="text-h2" style={{ marginBottom: 8 }}>Not signed in</h1>
          <p className="text-caption">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: 32 }}>
          <h1 className="text-h2" style={{ marginBottom: 8 }}>Profile not found</h1>
          <p className="text-caption">This user does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const stats = profile.stats || { gigsPosted: 0, gigsCompleted: 0, skillExchanges: 0, skillExchangesCompleted: 0, averageRating: 0, totalReviews: 0 };
  const skillArray = Array.isArray(profile.skills) ? profile.skills : (profile.skills || '').split(',').map(s => s.trim()).filter(Boolean);

  const handleUpdateRequest = async (id, newStatus) => {
    try {
      const res = await apiFetch(`/api/exchange-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update request')
      
      const updated = await res.json()
      
      setExchangeRequests(prev => ({
        received: prev.received.map(r => r._id === updated._id ? updated : r),
        sent: prev.sent.map(r => r._id === updated._id ? updated : r),
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

  const calculateCompleteness = () => {
    let score = 0;
    if (profile.bio) score++;
    if (profile.location) score++;
    if (skillArray.length > 0) score++;
    if (profile.socialLinks && profile.socialLinks.length > 0) score++;
    if (profile.name) score++; // Avatar placeholder
    return (score / 5) * 100;
  };

  const completeness = calculateCompleteness();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 64 }}>
      {/* ── PROFILE HERO ── */}
      <div style={{ background: 'var(--panel)', borderBottom: '0.5px solid var(--border)', paddingTop: 22, paddingBottom: 0, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 24 }}>
          
          {/* Avatar Left */}
          <div style={{ position: 'relative', flexShrink: 0, marginBottom: 24 }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'var(--accent-dim)', border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: 'var(--accent-light)'
            }}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
            </div>
            {isOwnProfile && (
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 20, height: 20, borderRadius: '50%',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', cursor: 'pointer'
              }}>
                <i className="ti ti-camera" style={{ fontSize: 12 }} />
              </div>
            )}
          </div>

          {/* Center Column */}
          <div style={{ flex: 1, paddingBottom: 24 }}>
            <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
              {profile.name}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-map-pin" /> {profile.location || 'Unknown Location'}
              </span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-calendar" /> Joined {profile.joinedDate || 'Recently'}
              </span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-device-laptop" /> {profile.role || 'Member'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <i key={star} className={star <= Math.round(stats.averageRating) ? "ti ti-star-filled" : "ti ti-star"} style={{ color: star <= Math.round(stats.averageRating) ? 'var(--amber)' : 'var(--border)', fontSize: 14 }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {stats.averageRating.toFixed(1)} · {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16, maxWidth: 600 }}>
              {profile.bio || 'No bio provided.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {skillArray.map((skill, i) => (
                <span key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 11, color: 'var(--accent-light)', fontWeight: 500 }}>
                  {skill}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(profile.socialLinks || []).map((link, i) => {
                const getIcon = (type) => {
                  switch(type?.toLowerCase()) {
                    case 'github': return 'ti-brand-github';
                    case 'linkedin': return 'ti-brand-linkedin';
                    case 'twitter': return 'ti-brand-twitter';
                    default: return 'ti-world';
                  }
                };
                return (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: 'var(--text)', textDecoration: 'none' }}>
                    <i className={`ti ${getIcon(link.type)}`} style={{ color: 'var(--text-muted)' }} />
                    {link.label || link.type}
                  </a>
                );
              })}
              {isOwnProfile && !showSocialInput && (
                <button 
                  onClick={() => setShowSocialInput(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.color='var(--accent)'} onMouseOut={(e) => e.currentTarget.style.color='var(--text-dim)'}>
                  <i className="ti ti-plus" /> Add link
                </button>
              )}
              {isOwnProfile && showSocialInput && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '4px' }}>
                  <select 
                    value={newSocialType}
                    onChange={(e) => setNewSocialType(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 11, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="github" style={{ background: 'var(--bg-input)' }}>GitHub</option>
                    <option value="linkedin" style={{ background: 'var(--bg-input)' }}>LinkedIn</option>
                    <option value="twitter" style={{ background: 'var(--bg-input)' }}>Twitter</option>
                    <option value="portfolio" style={{ background: 'var(--bg-input)' }}>Portfolio</option>
                  </select>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 12, width: 120, outline: 'none' }}
                  />
                  <button onClick={handleAddSocialLink} disabled={isSaving} style={{ background: 'var(--brand-purple)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>
                    {isSaving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setShowSocialInput(false)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', fontSize: 14, cursor: 'pointer' }}>
                    &times;
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls */}
          {isOwnProfile && (
            <div style={{ width: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 8 }}>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, marginBottom: 16, width: '100%', justifyContent: 'center' }}>
                Edit profile
              </button>
              
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                  <span>Profile complete</span>
                  <span style={{ color: 'var(--accent-light)' }}>{Math.round(completeness)}%</span>
                </div>
                <div style={{ width: '100%', height: 3, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${completeness}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div style={{ background: 'var(--panel)', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex' }}>
          {[
            { label: 'Gigs Posted', value: stats.gigsPosted },
            { label: 'Gigs Completed', value: stats.gigsCompleted },
            { label: 'Exchanges Sent', value: stats.skillExchanges },
            { label: 'Sessions Done', value: stats.skillExchangesCompleted },
          ].map((stat, i) => (
            <div key={i} style={{ flex: 1, padding: '16px 0', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{stat.value}</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{ background: 'var(--panel)', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 32 }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'gigs', label: `My Gigs ${gigs.length}` },
            { id: 'exchanges', label: `Exchanges ${exchanges.length}` },
            { id: 'reviews', label: `Reviews ${reviews.length}` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 0', background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                color: activeTab === tab.id ? 'var(--accent-light)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{ maxWidth: 900, margin: '32px auto 0' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h3 className="text-h3" style={{ marginBottom: 16 }}>Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Total Gigs', value: stats.gigsPosted, icon: 'ti-briefcase', color: 'var(--accent)' },
                  { label: 'Completed', value: stats.gigsCompleted, icon: 'ti-circle-check', color: 'var(--green)' },
                  { label: 'Exchanges', value: stats.skillExchanges, icon: 'ti-arrows-exchange', color: 'var(--blue)' },
                  { label: 'Avg Rating', value: stats.averageRating.toFixed(1), icon: 'ti-star', color: 'var(--amber)' },
                ].map((s, i) => (
                  <div key={i} className="card-glass" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                      <i className={`ti ${s.icon}`} style={{ fontSize: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-h3" style={{ marginBottom: 16 }}>Badges</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: 'Early Adopter', progress: 100, earned: true },
                  { name: 'Top Rated', progress: Math.min((stats.totalReviews / 5) * 100, 100), earned: stats.averageRating >= 4.5 && stats.totalReviews >= 5 },
                  { name: 'Mentor', progress: Math.min((stats.skillExchangesCompleted / 5) * 100, 100), earned: stats.skillExchangesCompleted >= 5 },
                  { name: 'Active Networker', progress: Math.min((stats.skillExchanges / 10) * 100, 100), earned: stats.skillExchanges >= 10 },
                ].map((badge, i) => (
                  <div key={i} className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: badge.earned ? 'var(--surface2)' : 'var(--surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: badge.earned ? 1 : 0.6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: badge.earned ? 'var(--accent-dim)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: badge.earned ? 'var(--accent)' : 'var(--text-muted)' }}>
                        <i className="ti ti-award" style={{ fontSize: 14 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: badge.earned ? 600 : 500, color: 'var(--text)' }}>{badge.name}</span>
                      {badge.earned && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--accent-light)', fontWeight: 600 }}>Earned</span>}
                    </div>
                    {!badge.earned && (
                      <div style={{ paddingLeft: 38 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>
                          <span>Progress</span>
                          <span>{Math.round(badge.progress)}%</span>
                        </div>
                        <div style={{ width: '100%', height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${badge.progress}%`, height: '100%', background: 'var(--accent-dim)', borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MY GIGS TAB */}
        {activeTab === 'gigs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 className="text-h3">Gigs {isOwnProfile ? "you've posted" : "they've posted"}</h3>
              {isOwnProfile && (
                <button className="btn-primary" onClick={() => navigate('/post-gig')} style={{ padding: '6px 16px', fontSize: 13 }}>
                  Post new gig
                </button>
              )}
            </div>

            {gigs.length === 0 ? (
              <p className="text-caption">No gigs found.</p>
            ) : (
              gigs.map(gig => (
                <div key={gig._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', padding: 20, gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)', flexShrink: 0 }}>
                      <i className="ti ti-briefcase" style={{ fontSize: 20 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{gig.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{gig.description}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(gig.tags || []).map((tag, i) => (
                          <span key={i} style={{ background: 'var(--surface2)', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: 'var(--text-muted)' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
                      <span style={{ background: gig.status === 'active' ? 'var(--green-bg)' : 'var(--surface2)', color: gig.status === 'active' ? 'var(--green)' : 'var(--text-muted)', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>
                        {gig.status || 'Active'}
                      </span>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                      <span><i className="ti ti-eye" /> {gig.views || 0} views</span>
                      <span><i className="ti ti-check" /> {gig.completions || 0} completed</span>
                      <span>{new Date(gig.createdAt).toLocaleDateString()}</span>
                    </div>
                    {isOwnProfile && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>Edit</button>
                        <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11, color: 'var(--red)', borderColor: 'var(--red)' }}>Unpublish</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isOwnProfile && (
              <div 
                onClick={() => navigate('/post-gig')}
                className="card" 
                style={{ border: '1px dashed var(--border)', padding: 24, textAlign: 'center', cursor: 'pointer', background: 'transparent' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ color: 'var(--accent-light)', fontSize: 13, fontWeight: 500 }}>+ Post another gig</span>
              </div>
            )}
          </div>
        )}

        {/* EXCHANGES TAB */}
        {activeTab === 'exchanges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* SECTION A — My Exchange Profile */}
            <div>
              <h4 className="text-h4" style={{ marginBottom: 16, color: 'var(--text)' }}>
                {isOwnProfile ? 'My Exchange Profile' : 'Exchange Profile'}
              </h4>
              {exchanges.length === 0 ? (
                <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                  <i className="ti ti-arrows-exchange" style={{ fontSize: 32, color: 'var(--text-muted)', marginBottom: 16 }} />
                  <p className="text-caption">No posted exchanges yet.</p>
                </div>
              ) : (
                exchanges.map(exchange => (
                  <div key={exchange._id} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                        Offers: {exchange.skillOffered}
                      </span>
                      <i className="ti ti-arrows-exchange" style={{ color: 'var(--text-muted)' }} />
                      <span style={{ background: 'var(--surface2)', color: 'var(--text)', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                        Wants: {exchange.skillWanted}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Posted on {new Date(exchange.createdAt).toLocaleDateString()} • {exchange.location}</span>
                      <span style={{ 
                        background: 'var(--green-bg)', color: 'var(--green)', 
                        padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 
                      }}>Active</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* SECTION B — Exchange Requests */}
            {isOwnProfile && (
              <div>
                <h4 className="text-h4" style={{ marginBottom: 16, color: 'var(--text)' }}>Exchange Requests</h4>
                
                <div style={{ display: 'flex', gap: 24, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ paddingBottom: 8, borderBottom: '2px solid var(--accent)', color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>
                    Received ({exchangeRequests.received?.length || 0})
                  </div>
                  <div style={{ paddingBottom: 8, color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
                    Sent ({exchangeRequests.sent?.length || 0})
                  </div>
                </div>

                {/* Received Requests */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {exchangeRequests.received?.length === 0 ? (
                    <p className="text-caption">No pending incoming requests.</p>
                  ) : (
                    exchangeRequests.received?.map(req => (
                      <div key={req._id} className="card" style={{ display: 'flex', borderLeft: req.status === 'pending' ? '2px solid var(--accent)' : req.status === 'accepted' ? '2px solid var(--green)' : '2px solid var(--border)', padding: 20, gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
                          <i className="ti ti-user" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                            Request from {req.fromEmail || 'another user'}
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>"{req.message}"</p>
                          {req.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleUpdateRequest(req._id, 'accepted')} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>Accept</button>
                              <button onClick={() => handleUpdateRequest(req._id, 'rejected')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12, color: 'var(--red)', border: 'none', background: 'transparent' }}>Decline</button>
                            </div>
                          )}
                          {req.status === 'accepted' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => navigate('/chat')} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12, background: 'var(--green)' }}>Message</button>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                          {req.status === 'pending' && <span style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 600 }}>Pending</span>}
                          {req.status === 'accepted' && <span style={{ background: 'var(--green-bg)', color: 'var(--green)', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 600 }}>Accepted</span>}
                          {req.status === 'rejected' && <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 600 }}>Declined</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Sent Requests */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                  <h5 className="text-h5" style={{ color: 'var(--text-muted)' }}>Sent Requests</h5>
                  {exchangeRequests.sent?.length === 0 ? (
                    <p className="text-caption">You haven't sent any exchange requests yet.</p>
                  ) : (
                    exchangeRequests.sent?.map(req => (
                      <div key={req._id} className="card" style={{ display: 'flex', borderLeft: req.status === 'pending' ? '2px solid var(--amber)' : req.status === 'accepted' ? '2px solid var(--green)' : '2px solid var(--red)', padding: 16, gap: 12, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <p className="text-sm font-medium text-white mb-1">Request sent to {req.toUserId}</p>
                          <p className="text-xs text-gray-400">
                            Sent {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: req.status === 'pending' ? 'var(--amber-bg)' : req.status === 'accepted' ? 'var(--green-bg)' : 'var(--red-bg)',
                          color: req.status === 'pending' ? 'var(--amber)' : req.status === 'accepted' ? 'var(--green)' : 'var(--red)',
                          border: `1px solid ${req.status === 'pending' ? 'var(--amber)' : req.status === 'accepted' ? 'var(--green)' : 'var(--red)'}`
                        }}>
                          {req.status === 'pending' ? 'Pending' : req.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reviews.length === 0 ? (
              <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                <i className="ti ti-message-star" style={{ fontSize: 32, color: 'var(--text-muted)', marginBottom: 16 }} />
                <p className="text-caption">No reviews yet — complete your first session to receive one</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="card" style={{ padding: 20, background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
                        {review.reviewerEmail.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{review.reviewerEmail.split('@')[0]}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <i key={star} className={star <= review.rating ? "ti ti-star-filled" : "ti ti-star"} style={{ color: star <= review.rating ? 'var(--amber)' : 'var(--surface2)', fontSize: 14 }} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{review.feedback}</p>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
