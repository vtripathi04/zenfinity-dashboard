// Based on api-snapshots-summary.json
export interface BatterySummary {
  imei: string;
  total_cycles: number;
  avg_soc_across_cycles: number;
  avg_soh_across_cycles: number;
  avg_temp_across_cycles: number;
  total_distance_all_cycles: number;
  last_cycle_time: string;
  last_cycle: number;
}

// Based on api-snapshots-imei-latest.json
export interface CycleSnapshot {
  imei: string;
  cycle_number: number;
  cycle_start_time: string;
  cycle_end_time: string;
  cycle_duration_hours: number;
  soh_drop: number;
  average_soc: number;
  average_temperature: number;
  total_distance: number;
  average_speed: number;
  max_speed: number;
  average_charge_start_soc: number; 

  // Complex objects
  temperature_dist_5deg: Record<string, number>;
  temperature_dist_10deg: Record<string, number>;
  temperature_dist_15deg: Record<string, number>;
  temperature_dist_20deg: Record<string, number>;
  
  alert_details: {
    protections: string[];
    warnings: string[];
  };
  
  // Health metrics
  min_soc: number;
  max_soc: number;
  min_soh: number;
  max_soh: number;
  charging_instances_count: number;
  
  // Voltage metrics (Used in Trends page)
  voltage_avg: number;
  voltage_min: number;
  voltage_max: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  summary?: T; 
}