import axios from 'axios';
import type { BatterySummary, CycleSnapshot, ApiResponse } from '../types';

const API_BASE_URL = '/api';

export const ALLOWED_IMEIS = ['865044073967657', '865044073949366'];

// Helper to fix inconsistent API data
const normalizeSnapshot = (snapshot: any): CycleSnapshot => {
  // If alert_details is a string (JSON), parse it
  if (typeof snapshot.alert_details === 'string') {
    try {
      snapshot.alert_details = JSON.parse(snapshot.alert_details);
    } catch (e) {
      console.error("Failed to parse alert_details string:", e);
      snapshot.alert_details = { warnings: [], protections: [] };
    }
  }
  
  // Ensure the structure always exists to prevent crashes
  if (!snapshot.alert_details) {
    snapshot.alert_details = { warnings: [], protections: [] };
  }
  
  return snapshot;
};

export const api = {
  getSummary: async (): Promise<BatterySummary[]> => {
    const res = await axios.get<ApiResponse<BatterySummary[]>>(`${API_BASE_URL}/snapshots/summary`);
    return res.data.summary || [];
  },

  getLatestCycle: async (imei: string): Promise<CycleSnapshot> => {
    const res = await axios.get<ApiResponse<CycleSnapshot>>(`${API_BASE_URL}/snapshots/${imei}/latest`);
    return normalizeSnapshot(res.data.data); // Normalize here
  },

  getCycleDetails: async (imei: string, cycleNumber: number): Promise<CycleSnapshot | null> => {
    try {
      const res = await axios.get<ApiResponse<CycleSnapshot>>(`${API_BASE_URL}/snapshots/${imei}/cycles/${cycleNumber}`);
      return normalizeSnapshot(res.data.data); // Normalize here
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  getAllCycles: async (imei: string, limit = 100, offset = 0) => {
    const res = await axios.get(`${API_BASE_URL}/snapshots`, {
        params: { imei, limit, offset }
    });
    // If the list endpoint also has this issue, we map over it
    if (Array.isArray(res.data.data)) {
      return res.data.data.map(normalizeSnapshot);
    }
    return res.data.data;
  }
};