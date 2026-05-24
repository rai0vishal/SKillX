import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CalendarDays, Star, Send, Handshake, TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';
import Skeleton from '../ui/Skeleton';

const AnalyticsCards = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="card-metric">
            <Skeleton height="13px" width="60%" className="mb-3" />
            <Skeleton height="32px" width="40%" className="mb-2" />
            <Skeleton height="11px" width="50%" />
          </div>
        ))}
      </div>
    );
  }

  const topCards = [
    {
      title: 'Completed Exchanges',
      value: data.completedExchanges || 0,
      Icon: CheckCircle2,
      iconBg: 'var(--green-bg)',
      iconColor: 'var(--green)',
      trend: '+12% this week',
      trendUp: true,
      noData: data.completedExchanges == null,
    },
    {
      title: 'Active Sessions',
      value: data.activeSessions || 0,
      Icon: CalendarDays,
      iconBg: 'var(--blue-bg)',
      iconColor: 'var(--blue)',
      trend: '2 upcoming',
      trendUp: true,
      noData: data.activeSessions == null,
    },
    {
      title: 'Average Rating',
      value: data.averageRating || 'N/A',
      Icon: Star,
      iconBg: '#FFFBEB',
      iconColor: '#F59E0B',
      trend: 'Based on reviews',
      trendUp: true,
      noData: data.averageRating == null,
    },
  ];

  const bottomCards = [
    {
      title: 'Requests Sent',
      value: data.requestsSent || 0,
      Icon: Send,
      iconBg: 'var(--accent-dim)',
      iconColor: 'var(--accent)',
      trend: 'Total sent',
      trendUp: null,
      noData: data.requestsSent == null,
    },
    {
      title: 'Requests Accepted',
      value: data.requestsAccepted || 0,
      Icon: Handshake,
      iconBg: 'var(--green-bg)',
      iconColor: 'var(--green)',
      trend: '85% acceptance rate',
      trendUp: true,
      noData: data.requestsAccepted == null,
    },
    {
      title: 'Success Rate',
      value: data.successRate != null ? `${data.successRate}%` : '0%',
      Icon: TrendingUp,
      iconBg: 'var(--accent-dim)',
      iconColor: 'var(--accent)',
      trend: '+5% this month',
      trendUp: true,
      noData: data.successRate == null,
    },
  ];

  const hasExchangeActivity = (data.requestsSent || 0) > 0 || (data.requestsAccepted || 0) > 0;

  const MetricCard = ({ title, value, Icon, iconBg, iconColor, trend, trendUp, noData }) => (
    <div className="card-metric flex flex-col gap-3 hover:shadow-[var(--shadow-md)] transition-shadow">
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <Icon size={14} color={iconColor} strokeWidth={2} aria-hidden="true" />
        </div>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>{title}</h3>
      </div>

      <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1 }}>
        {typeof value === 'number' ? <AnimatedCounter to={value} /> : value}
      </p>

      <div>
        {noData ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>No data yet</p>
        ) : (
          <p style={{
            fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4,
            color: trendUp === true ? 'var(--green)' : trendUp === false ? 'var(--red)' : 'var(--text-muted)',
            background: trendUp === true ? 'var(--green-bg)' : trendUp === false ? 'var(--red-bg)' : 'var(--surface2)',
            padding: '2px 8px', borderRadius: 9999, fontWeight: 500,
          }}>
            {trendUp === true && <TrendingUp size={10} aria-hidden="true" />}
            {trendUp === false && <TrendingDown size={10} aria-hidden="true" />}
            {trend}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topCards.map((card, i) => <MetricCard key={i} {...card} />)}
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {hasExchangeActivity ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {bottomCards.map((card, i) => <MetricCard key={i} {...card} />)}
        </div>
      ) : (
        <div
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent)', margin: 0 }}>
              Ready to start exchanging?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Send your first skill exchange request to see your stats here.
            </p>
          </div>
          <Link
            to="/skill-exchage"
            style={{
              background: 'var(--accent)', color: '#fff',
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              fontSize: 13, textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background var(--transition-fast)',
            }}
          >
            Find a Partner →
          </Link>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCards;
