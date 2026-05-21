import React from 'react';
import { Link } from 'react-router-dom';

const AnalyticsCards = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const topCards = [
    { title: 'Completed Exchanges', value: data.completedExchanges || 0, icon: '✓', trend: '+12% this week', noData: data.completedExchanges == null },
    { title: 'Active Sessions', value: data.activeSessions || 0, icon: '📅', trend: '2 upcoming', noData: data.activeSessions == null },
    { title: 'Average Rating', value: data.averageRating || 'N/A', icon: '⭐', trend: 'Based on reviews', noData: data.averageRating == null },
  ];

  const bottomCards = [
    { title: 'Requests Sent', value: data.requestsSent || 0, icon: '📤', trend: 'Total sent', noData: data.requestsSent == null },
    { title: 'Requests Accepted', value: data.requestsAccepted || 0, icon: '🤝', trend: '85% acceptance rate', noData: data.requestsAccepted == null },
    { title: 'Success Rate', value: `${data.successRate || 0}%`, icon: '📈', trend: '+5% this month', noData: data.successRate == null },
  ];

  const hasExchangeActivity = (data.requestsSent || 0) > 0 || (data.requestsAccepted || 0) > 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Completed Exchanges, Active Sessions, Average Rating */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topCards.map((card, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg opacity-80">{card.icon}</span>
              <h3 className="text-xs font-semibold text-gray-500 truncate">{card.title}</h3>
            </div>
            <div className="mb-1">
              <p className="text-2xl font-black text-gray-800 tracking-tight">{card.value}</p>
            </div>
            <div>
              {card.noData ? (
                <p className="text-[10px] text-gray-400 font-medium">No data yet</p>
              ) : (
                <p className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded inline-block">
                  {card.trend}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#f0f0f0', margin: '4px 0' }} />

      {/* Bottom row: Request metrics or nudge card */}
      {hasExchangeActivity ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {bottomCards.map((card, index) => (
            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg opacity-80">{card.icon}</span>
                <h3 className="text-xs font-semibold text-gray-500 truncate">{card.title}</h3>
              </div>
              <div className="mb-1">
                <p className="text-2xl font-black text-gray-800 tracking-tight">{card.value}</p>
              </div>
              <div>
                {card.noData ? (
                  <p className="text-[10px] text-gray-400 font-medium">No data yet</p>
                ) : (
                  <p className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded inline-block">
                    {card.trend}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: '#f5f3ff',
          border: '1px solid #ede9fe',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#5b21b6', margin: 0 }}>
              Ready to start exchanging?
            </p>
            <p style={{ fontSize: '0.82rem', color: '#7c3aed', margin: '4px 0 0' }}>
              Send your first skill exchange request to see your stats here.
            </p>
          </div>
          <Link to="/skill-exchage" style={{
            background: '#7c3aed',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            textDecoration: 'none',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            Find a Partner →
          </Link>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCards;
