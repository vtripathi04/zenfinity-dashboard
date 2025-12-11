import { useEffect, useState, useRef } from 'react';
import { api, ALLOWED_IMEIS } from '../services/api';
import type { CycleSnapshot } from '../types';
import { Layout } from '../components/Layout';
import { TempDistribution } from '../components/TempDistribution';
import { ChargingHabits } from '../components/ChargingHabits';
import { 
  ChevronLeft, ChevronRight, AlertTriangle, Zap, Activity, AlertCircle, 
  Search, Download, FileText, TrendingUp, Gauge, Calendar, Clock 
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export const Dashboard = () => {
  const [selectedImei, setSelectedImei] = useState(ALLOWED_IMEIS[0]);
  const [cycleNumber, setCycleNumber] = useState<number>(0);
  const [maxCycle, setMaxCycle] = useState<number>(0);
  const [data, setData] = useState<CycleSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  // 1. Initialize
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const summaries = await api.getSummary();
        const currentSummary = summaries.find(s => s.imei === selectedImei);
        if (currentSummary) {
          setMaxCycle(currentSummary.last_cycle);
          setCycleNumber(currentSummary.last_cycle);
          const latestData = await api.getCycleDetails(selectedImei, currentSummary.last_cycle);
          if (latestData) setData(latestData);
        }
      } catch (err) { console.error("Init failed", err); } finally { setLoading(false); }
    };
    initData();
  }, [selectedImei]);

  // 2. Fetch Cycle
  useEffect(() => {
    if (!maxCycle) return; 
    const fetchCycle = async () => {
      setLoading(true);
      try {
        const cycleData = await api.getCycleDetails(selectedImei, cycleNumber);
        setData(cycleData);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchCycle();
  }, [cycleNumber, selectedImei, maxCycle]);

  // Export functions (JSON/PDF) - kept concise
  const downloadJson = () => {
    if (!data) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `report_${selectedImei}_cycle_${cycleNumber}.json`;
    link.click();
  };

  const exportToPDF = async () => {
    const element = dashboardRef.current;
    if (!element) return;
    document.body.style.cursor = 'wait';
    try {
      const { scrollWidth, scrollHeight } = element;
      const imgData = await toPng(element, {
        cacheBust: true, backgroundColor: '#11212F', width: scrollWidth, height: scrollHeight,
        style: { width: `${scrollWidth}px`, height: `${scrollHeight}px`, transform: 'none' },
      });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [scrollWidth * 0.264583, scrollHeight * 0.264583] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`Analytics_Report_${selectedImei}_C${cycleNumber}.pdf`);
    } catch (err) { console.error(err); alert("PDF Failed"); } finally { document.body.style.cursor = 'default'; }
  };

  // Helper for Date Formatting
  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading && !data) return <Layout><div className="flex h-full items-center justify-center animate-pulse text-zen-accent">Loading Data...</div></Layout>;

  return (
    <Layout>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">System Monitor</h2>
          <p className="text-gray-400 text-sm mt-1 font-mono">IMEI: {selectedImei}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={downloadJson} disabled={!data} className="flex items-center gap-2 bg-zen-card hover:bg-zen-cardHover text-gray-300 px-3 py-2 rounded-lg border border-gray-700 transition-colors">
            <Download size={18} /><span className="hidden sm:inline text-sm font-medium">JSON</span>
          </button>
          <button onClick={exportToPDF} disabled={!data} className="flex items-center gap-2 bg-zen-accent hover:bg-opacity-90 text-white px-3 py-2 rounded-lg transition-colors shadow-lg">
            <FileText size={18} /><span className="hidden sm:inline text-sm font-medium">Export PDF</span>
          </button>
          <div className="h-6 w-px bg-gray-700 mx-2"></div>
          <select className="bg-zen-card border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-zen-accent outline-none text-white cursor-pointer" value={selectedImei} onChange={e => setSelectedImei(e.target.value)}>
            {ALLOWED_IMEIS.map(imei => <option key={imei} value={imei}>{imei}</option>)}
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-zen-card border border-gray-800 rounded-xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between shadow-lg gap-4">
         <button onClick={() => setCycleNumber(c => Math.max(0, c - 1))} className="p-2 hover:bg-zen-cardHover rounded-lg text-zen-accent disabled:opacity-30" disabled={loading || cycleNumber <= 0}><ChevronLeft size={24} /></button>
         <div className="flex items-center gap-3 bg-zen-dark px-4 py-2 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-500 uppercase tracking-widest hidden sm:block">Cycle #</span>
            <div className="relative">
              <select value={cycleNumber} onChange={(e) => setCycleNumber(Number(e.target.value))} className="appearance-none bg-transparent text-xl font-mono font-bold text-white outline-none cursor-pointer pr-8 border-b border-dashed border-gray-600 hover:border-zen-accent hover:text-zen-accent transition-colors" disabled={loading}>
                {Array.from({ length: maxCycle + 1 }, (_, i) => maxCycle - i).map((num) => <option key={num} value={num} className="bg-zen-card text-base">{num}</option>)}
              </select>
              <Search size={14} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
            </div>
            <span className="text-sm text-gray-600 font-mono">/ {maxCycle}</span>
         </div>
         <button onClick={() => setCycleNumber(c => Math.min(maxCycle, c + 1))} className="p-2 hover:bg-zen-cardHover rounded-lg text-zen-accent disabled:opacity-30" disabled={loading || cycleNumber >= maxCycle}><ChevronRight size={24} /></button>
      </div>

      <div ref={dashboardRef} className="pb-4">
        {data ? (
          <>
            {/* UPDATED: Metric Grid - Now 6 Columns to include Avg Speed */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <MetricCard icon={Activity} label="Avg SOC" value={`${data.average_soc.toFixed(1)}%`} />
              <MetricCard icon={Zap} label="SOH Drop" value={`${data.soh_drop.toFixed(2)}%`} color={data.soh_drop > 0 ? 'text-red-400' : 'text-green-400'} />
              <MetricCard label="Duration" value={`${data.cycle_duration_hours.toFixed(1)}h`} />
              <MetricCard label="Distance" value={`${data.total_distance.toFixed(1)} km`} />
              
              {/* Added Avg Speed */}
              <MetricCard 
                label="Avg Speed" 
                value={`${data.average_speed.toFixed(1)} km/h`} 
                icon={Gauge} 
                color="text-yellow-400"
              />

              <MetricCard 
                label="Efficiency" 
                value={(() => {
                  const socUsed = data.max_soc - data.min_soc;
                  if (socUsed <= 0 || data.total_distance <= 0) return 'N/A';
                  return `${(data.total_distance / socUsed).toFixed(2)} km/%`;
                })()} 
                color="text-blue-400"
                icon={TrendingUp}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TempDistribution data={data} />
              
              {/* Right Column */}
              <div className="flex flex-col gap-6">
                 
                 {/* NEW: Cycle Statistics (Start/End Time) */}
                 <div className="bg-zen-card p-6 rounded-xl border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">Cycle Statistics</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="text-gray-400 mt-1" size={18} />
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">Start Time</p>
                          <p className="text-white font-mono">{formatDate(data.cycle_start_time)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="text-gray-400 mt-1" size={18} />
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">End Time</p>
                          <p className="text-white font-mono">{formatDate(data.cycle_end_time)}</p>
                        </div>
                      </div>
                    </div>
                 </div>

                 <div className="flex-1">
                   <ChargingHabits data={data} />
                 </div>
                 
                 <div className="bg-zen-card p-6 rounded-xl border border-gray-800 flex-1">
                   <h3 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">Safety Logs</h3>
                   {data.alert_details?.warnings?.length === 0 && data.alert_details?.protections?.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-24 text-green-500">
                       <span className="font-medium">System Healthy</span>
                     </div>
                   ) : (
                     <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                       {data.alert_details?.warnings?.map((w, i) => (
                         <div key={`w-${i}`} className="flex items-center gap-2 text-yellow-500 bg-yellow-900/10 p-2 rounded text-sm"><AlertTriangle size={14} />{w}</div>
                       ))}
                       {data.alert_details?.protections?.map((p, i) => (
                         <div key={`p-${i}`} className="flex items-center gap-2 text-red-400 bg-red-900/10 p-2 rounded text-sm"><AlertCircle size={14} />{p}</div>
                       ))}
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 bg-zen-card/50 rounded-xl border border-dashed border-gray-700">
             <AlertCircle className="text-gray-500 mb-4" size={32} />
             <p className="text-gray-400">No Data for Cycle #{cycleNumber}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

const MetricCard = ({ label, value, icon: Icon, color = 'text-white' }: any) => (
  <div className="bg-zen-card p-5 rounded-xl border border-gray-800 hover:border-zen-accent/50 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">{Icon && <Icon size={48} />}</div>
    <div className="flex justify-between items-start mb-2 relative z-10">
      <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-2xl font-bold font-mono relative z-10 ${color}`}>{value}</div>
  </div>
);