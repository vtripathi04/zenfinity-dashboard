import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid } from 'recharts';
import type { CycleSnapshot } from '../types';

const RESOLUTIONS = [
  { key: 'temperature_dist_5deg', label: '5°C Bins' },
  { key: 'temperature_dist_10deg', label: '10°C Bins' },
  { key: 'temperature_dist_15deg', label: '15°C Bins' },
  { key: 'temperature_dist_20deg', label: '20°C Bins' },
];

export const TempDistribution = ({ data }: { data: CycleSnapshot }) => {
  const [resKey, setResKey] = useState<keyof CycleSnapshot>('temperature_dist_5deg');

  // Helper to extract the numeric start value for sorting
  const getSortValue = (range: string) => {
    if (range.includes('+')) return 1000; // Force "100+" to the very end
    return parseInt(range.split('-')[0], 10); // "20-25" -> 20
  };

  // Transform, Format, and Sort data
  const rawData = (data[resKey] as Record<string, number>) || {};
  
  const chartData = Object.entries(rawData)
    .map(([range, val]) => ({
      range,
      minutes: Number(val.toFixed(1))
    }))
    .sort((a, b) => getSortValue(a.range) - getSortValue(b.range)); // Numeric sort

  // Calculate total minutes to show percentage (Optional context)
  const totalMinutes = chartData.reduce((acc, curr) => acc + curr.minutes, 0);

  return (
    <div className="bg-zen-card p-6 rounded-xl border border-gray-800 shadow-lg col-span-2 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-lg font-semibold text-gray-200">Temperature Distribution</h3>
           <p className="text-xs text-gray-400 mt-1">
             Total time recorded: {totalMinutes.toFixed(0)} mins
           </p>
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex bg-zen-dark rounded-lg p-1 border border-gray-700">
          {RESOLUTIONS.map((res) => (
            <button
              key={res.key}
              onClick={() => setResKey(res.key as keyof CycleSnapshot)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                resKey === res.key 
                ? 'bg-zen-accent text-white shadow' 
                : 'text-gray-400 hover:text-white'
              }`}
            >
              {res.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            
            <XAxis 
              dataKey="range" 
              stroke="#9ca3af" 
              fontSize={12} 
              tickLine={false}
              label={{ value: 'Temperature Range (°C)', position: 'insideBottom', offset: -10, fill: '#6b7280', fontSize: 12 }} 
            />
            
            <YAxis 
              stroke="#9ca3af" 
              fontSize={12} 
              tickLine={false}
              label={{ value: 'Duration (Minutes)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }} 
            />
            
            <Tooltip 
              cursor={{ fill: '#24433C', opacity: 0.4 }}
              contentStyle={{ backgroundColor: '#17293C', borderColor: '#1A8689', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number) => [`${value} mins`, 'Duration']}
            />
            
            <Legend verticalAlign="top" height={36} iconType="circle" />
            
            <Bar dataKey="minutes" name="Time Spent in Range" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.minutes > 0 ? '#1A8689' : '#2d3748'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};