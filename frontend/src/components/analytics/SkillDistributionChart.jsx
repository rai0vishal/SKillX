import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart2 } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-md)',
        fontSize: 13,
      }}>
        <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{payload[0].name}</p>
        <p style={{ color: 'var(--text-muted)' }}>{payload[0].value}% ({payload[0].payload.rawCount} exchanges)</p>
      </div>
    );
  }
  return null;
};

const SkillDistributionChart = ({ data, loading }) => {
  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
    height: 320,
    display: 'flex',
    flexDirection: 'column',
  };

  if (loading) {
    return (
      <div style={{ ...cardStyle, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ ...cardStyle, alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 0 }}>
        <BarChart2 size={40} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} aria-hidden="true" />
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          Skills Exchanged
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
          Complete your first session to see skills here.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          Skills Exchanged
        </p>
        <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
          {data.reduce((acc, curr) => acc + (curr.rawCount || 0), 0)}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>total skills</span>
        </p>
      </div>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%"
              innerRadius={55} outerRadius={78}
              paddingAngle={4} dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom" height={36} iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SkillDistributionChart;
