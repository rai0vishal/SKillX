import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Skeleton from '../ui/Skeleton';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        boxShadow: 'var(--shadow-md)',
        fontSize: 13,
      }}>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
        <p style={{ color: 'var(--primary)', margin: '2px 0 0', fontWeight: 700 }}>
          {payload[0].value} exchanges
        </p>
      </div>
    );
  }
  return null;
};

const WeeklyChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="card" style={{ height: 280 }}>
        <Skeleton height="13px" width="50%" className="mb-2" />
        <Skeleton height="30px" width="30%" className="mb-6" />
        <Skeleton height="160px" />
      </div>
    );
  }

  const totalExchanges = data && data.length > 0
    ? data.reduce((acc, curr) => acc + (curr.sessions || 0), 0)
    : 0;

  return (
    <div className="card" style={{ height: 280 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Weekly Exchange Activity
          </h3>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
            {totalExchanges}
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 6 }}>
              this week
            </span>
          </p>
        </div>
        <span
          className="badge badge-exchange"
          style={{ marginTop: 2 }}
        >
          7-day view
        </span>
      </div>

      <div style={{ height: 168 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'var(--bg-surface-2)', radius: 6 }}
            />
            <Bar
              dataKey="sessions"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyChart;
