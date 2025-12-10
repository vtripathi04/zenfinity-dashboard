import type { CycleSnapshot } from '../types';
import { Zap } from 'lucide-react';

export const ChargingHabits = ({ data }: { data: CycleSnapshot }) => {
  const startSoc = data.average_charge_start_soc;
  
  // Determine if behavior is good/bad
  // Li-ion likes shallow cycles (e.g. 20-80%). Deep discharges (<10%) are bad.
  const getStatusColor = (soc: number) => {
    if (soc < 15) return 'text-red-400'; // Deep discharge warning
    if (soc > 80) return 'text-yellow-400'; // Shallow charge
    return 'text-green-400'; // Healthy zone
  };

  return (
    <div className="bg-zen-card p-6 rounded-xl border border-gray-800 h-full">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-2">
        <Zap className="text-yellow-400" size={20} />
        <h3 className="text-lg font-semibold text-gray-200">Charging Habits</h3>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Avg Charge Start SOC</span>
            <span className={`font-bold ${getStatusColor(startSoc)}`}>{startSoc.toFixed(1)}%</span>
          </div>
          {/* Visual Bar for SOC */}
          <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${startSoc < 20 ? 'bg-red-500' : 'bg-green-500'}`} 
              style={{ width: `${Math.min(startSoc, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {startSoc < 20 
              ? "⚠️ Deep discharge detected. Battery health risk." 
              : "✅ Healthy charging threshold."}
          </p>
        </div>

        <div className="flex justify-between items-center bg-zen-dark p-3 rounded-lg border border-gray-700">
          <span className="text-gray-400 text-sm">Charging Sessions</span>
          <span className="text-xl font-mono font-bold text-white">
            {data.charging_instances_count}
          </span>
        </div>
      </div>
    </div>
  );
};