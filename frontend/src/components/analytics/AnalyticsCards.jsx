import React from 'react';

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

  const cards = [
    { title: 'Completed Exchanges', value: data.completedExchanges, icon: '✅' },
    { title: 'Active Sessions', value: data.activeSessions, icon: '📅' },
    { title: 'Average Rating', value: `⭐ ${data.averageRating}`, icon: '🏆' },
    { title: 'Requests Sent', value: data.requestsSent, icon: '📤' },
    { title: 'Requests Accepted', value: data.requestsAccepted, icon: '🤝' },
    { title: 'Success Rate', value: `${data.successRate}%`, icon: '📈' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{card.icon}</span>
            <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
          </div>
          <p className="text-2xl font-bold text-gray-800">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsCards;
