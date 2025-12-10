import { useEffect, useState } from 'react';
import { api, ALLOWED_IMEIS } from '../services/api';
import type { CycleSnapshot } from '../types';
import { Layout } from '../components/Layout';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const Trends = () => {
  const [selectedImei, setSelectedImei] = useState(ALLOWED_IMEIS[0]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTrends = async () => {
      setLoading(true);
      try {
        const cycles = await api.getAllCycles(selectedImei, 1000);
        
        // 1. Sort by cycle number to ensure time continuity
        const sortedCycles = cycles.sort((a: any, b: any) => a.cycle_number - b.cycle_number);

        // 2. Calculate Cumulative SOH Drop
        // The API gives "drop per cycle", so we sum them up to get total health lost.
        let accumulatedDrop = 0;

        const formatted = sortedCycles.map((c: CycleSnapshot) => {
          accumulatedDrop += c.soh_drop;
          return {
            cycle: c.cycle_number,
            soh: 100 - accumulatedDrop, // Current Health
            temp: c.average_temperature,
            soc: c.average_soc,         // Added SOC
          };
        });
          
        setTrendData(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTrends();
  }, [selectedImei]);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="text-zen-accent" /> Long-term Analysis
          </h2>
          <p className="text-gray-400 text-sm mt-1">Lifecycle degradation, charging habits & thermal trends</p>
        </div>
        <select 
          className="bg-zen-card border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:border-zen-accent outline-none"
          value={selectedImei}
          onChange={e => setSelectedImei(e.target.value)}
        >
          {ALLOWED_IMEIS.map(imei => <option key={imei} value={imei}>{imei}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zen-accent animate-pulse">Loading historical data...</div>
      ) : (
        <div className="space-y-6">
          
          <div className="bg-zen-card p-6 rounded-xl border border-gray-800 shadow-lg h-[500px]">
            <h3 className="text-lg font-semibold mb-2 text-gray-200">Health (SOH) vs. Usage (SOC) vs. Temp</h3>
            
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={trendData} 
                // Increased bottom margin to 60px for label spacing
                margin={{ top: 20, right: 90, left: 30, bottom: 60 }} 
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                
                <XAxis 
                  dataKey="cycle" 
                  stroke="#9ca3af" 
                  tickLine={false}
                  dy={10} 
                  // Pushed label further down (-25 offset)
                  label={{ value: 'Cycle Number', position: 'insideBottom', offset: -25, fill: '#9ca3af' }} 
                />
                
                {/* Left Axis: SOH & SOC (0-100%) */}
                <YAxis 
                  yAxisId="left" 
                  stroke="#e2e8f0" 
                  domain={[0, 100]} 
                  tickLine={false}
                  label={{ 
                    value: 'Percentage (%)', 
                    angle: -90, 
                    position: 'insideLeft', 
                    dx: -15, 
                    fill: '#e2e8f0',
                    style: { textAnchor: 'middle' }
                  }} 
                />
                
                {/* Right Axis: Temperature */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#f59e0b" 
                  tickLine={false}
                  label={{ 
                    value: 'Avg Temp (°C)', 
                    angle: 90, 
                    position: 'insideRight', 
                    dx: 15,
                    fill: '#f59e0b',
                    style: { textAnchor: 'middle' }
                  }} 
                />
                
                <Tooltip 
                  contentStyle={{ backgroundColor: '#17293C', borderColor: '#374151', color: '#fff' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                
                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                
                {/* SOH Line (Green, Top) */}
                <Line 
                  yAxisId="left" 
                  type="step" 
                  dataKey="soh" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  name="State of Health" 
                  dot={false} 
                />

                {/* SOC Line (Blue/Cyan, Middle) */}
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="soc" 
                  stroke="#22d3ee" // Cyan color
                  strokeWidth={2} 
                  name="Avg SOC" 
                  dot={false} 
                  opacity={0.8}
                />

                {/* Temperature Area (Orange, Bottom) */}
                <Area 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="temp" 
                  fill="#f59e0b" 
                  stroke="#f59e0b" 
                  fillOpacity={0.1} 
                  name="Avg Temperature" 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zen-card p-6 rounded-xl border border-gray-800">
              <h4 className="text-gray-400 text-xs uppercase font-bold tracking-widest">Lifetime Avg SOC</h4>
              <p className="text-3xl font-bold font-mono text-cyan-400 mt-2">
                 {(trendData.reduce((acc, c) => acc + c.soc, 0) / (trendData.length || 1)).toFixed(1)}%
              </p>
            </div>
            <div className="bg-zen-card p-6 rounded-xl border border-gray-800">
               <h4 className="text-gray-400 text-xs uppercase font-bold tracking-widest">Avg Lifetime Temp</h4>
               <p className="text-3xl font-bold font-mono text-orange-400 mt-2">
                 {(trendData.reduce((acc, c) => acc + c.temp, 0) / (trendData.length || 1)).toFixed(1)}°C
               </p>
            </div>
            <div className="bg-zen-card p-6 rounded-xl border border-gray-800">
               <h4 className="text-gray-400 text-xs uppercase font-bold tracking-widest">Current Health</h4>
               <p className="text-3xl font-bold font-mono text-green-400 mt-2">
                 {trendData[trendData.length - 1]?.soh.toFixed(2)}%
               </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};