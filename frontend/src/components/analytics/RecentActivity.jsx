import React from 'react';
import { CheckCircle2, Star, ArrowLeftRight, Leaf } from 'lucide-react';
import Skeleton from '../ui/Skeleton';

const getActivityConfig = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('session') || t.includes('complete')) {
    return { Icon: CheckCircle2, bg: 'var(--success-bg)', color: 'var(--success)' };
  }
  if (t.includes('review') || t.includes('rating')) {
    return { Icon: Star, bg: '#FFFBEB', color: '#F59E0B' };
  }
  if (t.includes('exchange') || t.includes('request')) {
    return { Icon: ArrowLeftRight, bg: 'var(--primary-light)', color: 'var(--primary)' };
  }
  return { Icon: Leaf, bg: 'var(--bg-surface-2)', color: 'var(--text-secondary)' };
};

const RecentActivity = ({ activities, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton height="32px" width="32px" style={{ borderRadius: '50%', flexShrink: 0 }} />
              <div className="flex-1 space-y-2">
                <Skeleton height="13px" width="55%" />
                <Skeleton height="11px" width="35%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
        Recent Activity
      </h3>

      {activities.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '36px 16px',
          background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-strong)',
        }}>
          <Leaf size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} aria-hidden="true" />
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 4 }}>
            No activity yet
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Start a skill exchange to see your activity here.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const { Icon, bg, color } = getActivityConfig(activity.type || activity.title);
            return (
              <div key={activity.id} className="flex gap-3 group">
                {/* Icon container */}
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'transform var(--transition-fast)',
                  }}
                  className="group-hover:scale-110"
                  aria-hidden="true"
                >
                  <Icon size={15} color={color} strokeWidth={2} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px', lineHeight: 1.4 }}>
                    {activity.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }} className="line-clamp-1">
                    {activity.description}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    {new Date(activity.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(activity.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
