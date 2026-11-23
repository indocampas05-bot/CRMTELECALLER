import React from 'react';
import {
  PieChart as RPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { name: 'New Lead', value: 10, color: '#2563eb' },
  { name: 'In Progress', value: 8, color: '#7c3aed' },
  { name: 'Interested', value: 2, color: '#16a34a' },
  { name: 'Not Interested', value: 6, color: '#dc2626' },
  { name: 'Call Back', value: 0, color: '#d97706' },
  { name: 'Converted', value: 0, color: '#7b1113' },
];

const RADIAN = Math.PI / 180;

const PieChart = () => {
  return (
    <div style={{ width: '100%', height: 200, marginBottom: '24px' }}>   {/* 👈 GAP ADDED */}
      <ResponsiveContainer width="100%" height="100%">
        <RPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontFamily: 'Public Sans',
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #f0f0f0',
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={8}
              wrapperStyle={{
                right: -15,

  }}
            formatter={(value, entry) => (
              <span style={{ fontSize: 11, color: '#4a4a6a', fontFamily: 'Public Sans' }}>
                {value} <strong style={{ color: '#1a1a2e' }}>{entry.payload.value}</strong>
              </span>
            )}
          />
        </RPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;