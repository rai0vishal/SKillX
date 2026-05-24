import React from 'react';
import { Award, Trophy, Star, Rocket, Lock } from 'lucide-react';
import Skeleton from '../ui/Skeleton';

const ALL_BADGES = [
  {
    id: 'first_exchange',
    name: 'First Exchange',
    desc: 'Complete your first skill exchange',
    Icon: Trophy,
    bg: '#FFFBEB',
    color: '#F59E0B',
    border: '#FDE68A',
  },
  {
    id: 'session_master',
    name: 'Session Master',
    desc: 'Complete 10+ sessions',
    Icon: Award,
    bg: '#FEF2F2',
    color: '#EF4444',
    border: '#FECACA',
  },
  {
    id: 'top_rated',
    name: 'Top Rated',
    desc: 'Maintain 4.8★ or higher',
    Icon: Star,
    bg: '#EEF2FF',
    color: '#5B4FE8',
    border: '#C7D2FE',
  },
  {
    id: 'skill_explorer',
    name: 'Skill Explorer',
    desc: 'Exchange 3+ different skills',
    Icon: Rocket,
    bg: '#F0FDFA',
    color: '#14B8A6',
    border: '#99F6E4',
  },
];

const Achievements = ({ badges, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <Skeleton height="13px" width="50%" className="mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height="88px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
        Achievements & Badges
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ALL_BADGES.map((badgeDef) => {
          const isUnlocked = badges.some(b => b.id === badgeDef.id);
          const { Icon } = badgeDef;

          return (
            <div
              key={badgeDef.id}
              style={{
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8,
                padding: '16px 12px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isUnlocked ? badgeDef.border : 'var(--border)'}`,
                background: isUnlocked ? badgeDef.bg : 'var(--surface2)',
                transition: 'all var(--transition-base)',
                ...(isUnlocked ? { cursor: 'default' } : { opacity: 0.6, filter: 'grayscale(0.6)' }),
              }}
              className={isUnlocked ? 'card-hover' : ''}
            >
              {/* Icon */}
              <div
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: isUnlocked ? badgeDef.color : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-hidden="true"
              >
                <Icon size={20} color={isUnlocked ? '#fff' : 'var(--text-muted)'} strokeWidth={1.8} aria-hidden="true" />
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: isUnlocked ? 'var(--text)' : 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                  {badgeDef.name}
                </p>
              </div>

              {/* Lock overlay */}
              {!isUnlocked && (
                <div
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--border-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-label="Locked"
                >
                  <Lock size={10} color="var(--text-muted)" aria-hidden="true" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
