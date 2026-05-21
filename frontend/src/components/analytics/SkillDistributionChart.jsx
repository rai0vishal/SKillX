import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg text-sm">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-gray-600">{payload[0].value}% ({payload[0].payload.rawCount} exchanges)</p>
      </div>
    );
  }
  return null;
};

const SkillDistributionChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex items-center justify-center animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">Skills Exchanged</h3>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', textAlign: 'center', marginTop: '12px' }}>
          Complete your first session to see skills here.
        </p>
      </div>
    );
  }



  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Skills Exchanged
          </h3>
          <p className="text-2xl font-black text-gray-800">
            {data && data.length > 0 ? data.reduce((acc, curr) => acc + (curr.rawCount || 0), 0) : 0} <span className="text-sm font-medium text-gray-500 font-sans">total skills</span>
          </p>
        </div>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SkillDistributionChart;
