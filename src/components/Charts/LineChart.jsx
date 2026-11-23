import React from 'react';
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const data = [
  { time: '10 AM', calls: 20 },
  { time: '11 AM', calls: 45 },
  { time: '12 PM', calls: 30 },
  { time: '01 PM', calls: 60 },
  { time: '02 PM', calls: 40 },
  { time: '03 PM', calls: 75 },
  { time: '04 PM', calls: 55 },
  { time: '05 PM', calls: 85 },
];

const LineChart = () => {
  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#8888aa', fontFamily: 'Public Sans' }} />
          <YAxis tick={{ fontSize: 11, fill: '#8888aa', fontFamily: 'Public Sans' }} />
          <Tooltip
            contentStyle={{
              fontFamily: 'Public Sans',
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          />
          <Line
            type="monotone"
            dataKey="calls"
            stroke="#7b1113"
            strokeWidth={2.5}
            dot={{ fill: '#7b1113', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
