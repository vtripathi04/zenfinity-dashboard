import { useEffect, useState } from 'react';
import { api, ALLOWED_IMEIS } from '../services/api';
import type { CycleSnapshot } from '../types';
import { Layout } from '../components/Layout';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, AreaChart, ReferenceLine 
} from 'recharts';
import { TrendingUp, Activity, Gauge } from 'lucide-react';

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
          
          // Calculate Voltage Swing (Max - Min)
          // Indicates depth of usage for that cycle
          const voltageSpread = c.voltage_max - c.voltage_min;

          return {
            cycle: c.cycle_number,
            soh: 100 - accumulatedDrop, // Current Health
            temp: c.average_temperature,
            soc: c.average_soc,         // SOC Trend
            speed: c.average_speed,     // For scatter plot
            spread: Number(voltageSpread.toFixed(3)), // For voltage swing chart
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

  // Shared Tooltip Style for consistency and readability
  const tooltipStyle = {
    contentStyle: { 
      backgroundColor: '#17293C', 
      borderColor: '#374151', 
      borderRadius: '8px', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
    },
    itemStyle: { color: '#E2E8F0', fontSize: '12px', fontWeight: 500 }, // Light text for readability
    labelStyle: { color: '#94A3B8', fontSize: '11px', marginBottom: '4px' } // Muted label
  };

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
        <div className="space-y-8">
          
          {/* 1. Main Health Chart */}
          <div className="bg-zen-card p-6 rounded-xl border border-gray-800 shadow-lg h-[500px]">
            <h3 className="text-lg font-semibold mb-2 text-gray-200">Health (SOH) vs. Usage (SOC) vs. Temp</h3>
            
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={trendData} 
                // Increased margins to prevent label clipping
                margin={{ top: 20, right: 80, left: 50, bottom: 60 }} 
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                
                <XAxis 
                  dataKey="cycle" 
                  stroke="#9ca3af" 
                  tickLine={false} 
                  dy={10} 
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
                    dx: -45, // Pushed left
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
                    dx: 40, // Pushed right
                    fill: '#f59e0b', 
                    style: { textAnchor: 'middle' } 
                  }} 
                />
                
                <Tooltip {...tooltipStyle} />
                
                <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                
                {/* SOH Line (Green) */}
                <Line 
                  yAxisId="left" 
                  type="step" 
                  dataKey="soh" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  name="State of Health" 
                  dot={false} 
                />

                {/* SOC Line (Cyan) */}
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="soc" 
                  stroke="#22d3ee" 
                  strokeWidth={2} 
                  name="Avg SOC" 
                  dot={false} 
                  opacity={0.8}
                />

                {/* Temperature Area (Orange) */}
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

          {/* New Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 2. Voltage Swing (Replaces Cell Imbalance) */}
            <div className="bg-zen-card p-6 rounded-xl border border-gray-800 shadow-lg h-[400px]">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="text-blue-400" size={20} />
                <h3 className="text-lg font-semibold text-gray-200">Voltage Swing (Pack)</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Diff. between Max & Min Pack Voltage. Higher swing = deeper discharge/usage.
              </p>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="cycle" stroke="#9ca3af" tickLine={false} />
                  <YAxis 
                    stroke="#60a5fa" 
                    tickLine={false} 
                    label={{ value: 'Swing (V)', angle: -90, position: 'insideLeft', fill: '#60a5fa', dx: -10 }} 
                  />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="spread" stroke="#60a5fa" fill="#3b82f6" fillOpacity={0.2} name="Voltage Delta" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* 3. Operational Stress Scatter Plot */}
            <div className="bg-zen-card p-6 rounded-xl border border-gray-800 shadow-lg h-[400px]">
              <div className="flex items-center gap-2 mb-4">
                <Gauge className="text-purple-400" size={20} />
                <h3 className="text-lg font-semibold text-gray-200">Operational Stress</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Correlation: Avg Speed vs Temperature.
              </p>
              <ResponsiveContainer width="100%" height="85%">
                <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    type="number" 
                    dataKey="speed" 
                    name="Avg Speed" 
                    unit=" km/h" 
                    stroke="#9ca3af" 
                    label={{ value: 'Speed (km/h)', position: 'insideBottom', offset: -10, fill: '#9ca3af' }} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="temp" 
                    name="Temperature" 
                    unit="°C" 
                    stroke="#9ca3af" 
                    label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#9ca3af', dx: -10 }} 
                  />
                  <ZAxis type="number" dataKey="cycle" name="Cycle" range={[60, 60]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} {...tooltipStyle} />
                  <Scatter name="Cycles" data={trendData} fill="#a855f7" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

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