import { useEffect, useState, useRef } from 'react';
import { api, ALLOWED_IMEIS } from '../services/api';
import type { CycleSnapshot } from '../types';
import { Layout } from '../components/Layout';
import { TempDistribution } from '../components/TempDistribution';
import { ChargingHabits } from '../components/ChargingHabits';
import { 
  ChevronLeft, ChevronRight, ChevronDown, AlertTriangle, Zap, Activity, AlertCircle, 
  Download, FileText, TrendingUp, Gauge, Calendar, Clock 
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

  // 1. Initialize: Fetch Summary to get the Max Cycle count
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
      } catch (err) {
        console.error("Initialization failed", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [selectedImei]);

  // 2. Fetch data whenever cycleNumber changes
  useEffect(() => {
    if (!maxCycle) return; 
    const fetchCycle = async () => {
      setLoading(true);
      try {
        const cycleData = await api.getCycleDetails(selectedImei, cycleNumber);
        setData(cycleData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCycle();
  }, [cycleNumber, selectedImei, maxCycle]);

  // Export JSON 
  const downloadJson = () => {
    if (!data) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `report_${selectedImei}_cycle_${cycleNumber}.json`;
    link.click();
  };

  // Export PDF
  const exportToPDF = async () => {
    const element = dashboardRef.current;
    if (!element) return;

    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    try {
      const { scrollWidth, scrollHeight } = element;
      const imgData = await toPng(element, {
        cacheBust: true,
        backgroundColor: '#11212F',
        width: scrollWidth,
        height: scrollHeight,
        style: {
          width: `${scrollWidth}px`,
          height: `${scrollHeight}px`,
          transform: 'none',
        },
      });

      const pxToMm = 0.264583;
      const pdfWidth = scrollWidth * pxToMm;
      const pdfHeight = scrollHeight * pxToMm;

      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Analytics_Report_${selectedImei}_C${cycleNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF. Check console.");
    } finally {
      document.body.style.cursor = originalCursor;
    }
  };

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
          <button 
             onClick={downloadJson}
             disabled={!data}
             className="flex items-center gap-2 bg-zen-card hover:bg-zen-cardHover text-gray-300 px-3 py-2 rounded-lg border border-gray-700 transition-colors"
             title="Download Raw Data"
          >
            <Download size={18} />
            <span className="hidden sm:inline text-sm font-medium">JSON</span>
          </button>

          <button 
             onClick={exportToPDF}
             disabled={!data}
             className="flex items-center gap-2 bg-zen-accent hover:bg-opacity-90 text-white px-3 py-2 rounded-lg transition-colors shadow-lg"
             title="Export Dashboard as PDF"
          >
            <FileText size={18} />
            <span className="hidden sm:inline text-sm font-medium">Export PDF</span>
          </button>
          
          <div className="h-6 w-px bg-gray-700 mx-2"></div>

          <select 
            className="bg-zen-card border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-zen-accent outline-none text-white cursor-pointer"
            value={selectedImei}
            onChange={e => setSelectedImei(e.target.value)}
          >
            {ALLOWED_IMEIS.map(imei => <option key={imei} value={imei}>{imei}</option>)}
          </select>
        </div>
      </div>

      {/* --- COMPACT NAVIGATION BAR --- */}
      <div className="bg-zen-card border border-gray-800 rounded-xl p-3 mb-8 flex flex-col md:flex-row items-center justify-center shadow-lg gap-4 md:gap-6">
         
         {/* Prev Button */}
         <button 
            onClick={() => setCycleNumber(c => Math.max(0, c - 1))} 
            className="p-2 hover:bg-zen-cardHover rounded-lg text-zen-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
            disabled={loading || cycleNumber <= 0}
         >
            <div className="flex items-center gap-2">
              <ChevronLeft size={20} />
              <span className="hidden md:inline font-medium text-sm">Prev</span>
            </div>
         </button>
         
         {/* Refined Selector Wrapper */}
         <div className="flex items-center bg-zen-dark rounded-lg border border-gray-700 px-4 py-2 shadow-inner transition-colors focus-within:border-zen-accent group">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mr-3 select-none">Cycle</span>
            
            <div className="relative">
              <select 
                 value={cycleNumber} 
                 onChange={(e) => setCycleNumber(Number(e.target.value))}
                 className="appearance-none bg-transparent text-white font-mono font-bold text-lg outline-none cursor-pointer pr-8 z-10 relative"
                 disabled={loading}
              >
                {Array.from({ length: maxCycle + 1 }, (_, i) => maxCycle - i).map((num) => (
                  <option key={num} value={num} className="bg-zen-card text-gray-300">
                    {num}
                  </option>
                ))}
              </select>
              {/* Chevron Indicator */}
              <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-zen-accent group-hover:text-white transition-colors" />
            </div>

            <div className="h-5 w-px bg-gray-700 mx-4"></div>
            
            <span className="text-xs text-gray-500 font-mono select-none">
               Max: {maxCycle}
            </span>
         </div>

         {/* Next Button */}
         <button 
            onClick={() => setCycleNumber(c => Math.min(maxCycle, c + 1))} 
            className="p-2 hover:bg-zen-cardHover rounded-lg text-zen-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
            disabled={loading || cycleNumber >= maxCycle}
         >
            <div className="flex items-center gap-2">
              <span className="hidden md:inline font-medium text-sm">Next</span>
              <ChevronRight size={20} />
            </div>
         </button>
      </div>

      {/* Content Area (Ref attached here for PDF capture) */}
      <div ref={dashboardRef} className="pb-4">
        {data ? (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <MetricCard icon={Activity} label="Avg SOC" value={`${data.average_soc.toFixed(1)}%`} />
              <MetricCard icon={Zap} label="SOH Drop" value={`${data.soh_drop.toFixed(2)}%`} color={data.soh_drop > 0 ? 'text-red-400' : 'text-green-400'} />
              <MetricCard label="Duration" value={`${data.cycle_duration_hours.toFixed(1)}h`} />
              <MetricCard label="Distance" value={`${data.total_distance.toFixed(1)} km`} />
              <MetricCard label="Avg Speed" value={`${data.average_speed.toFixed(1)} km/h`} icon={Gauge} color="text-yellow-400" />
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
              {/* Temperature Chart */}
              <TempDistribution data={data} />
              
              {/* Right Column: Widgets */}
              <div className="flex flex-col gap-6">
                 {/* Cycle Stats */}
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
                         <div key={`w-${i}`} className="flex items-center gap-2 text-yellow-500 bg-yellow-900/10 p-2 rounded text-sm">
                           <AlertTriangle size={14} className="shrink-0" />
                           <span>{w}</span>
                         </div>
                       ))}
                       {data.alert_details?.protections?.map((p, i) => (
                         <div key={`p-${i}`} className="flex items-center gap-2 text-red-400 bg-red-900/10 p-2 rounded text-sm">
                           <AlertCircle size={14} className="shrink-0" />
                           <span>{p}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-96 bg-zen-card/50 rounded-xl border border-dashed border-gray-700">
             <div className="bg-gray-800 p-4 rounded-full mb-4">
                <AlertCircle className="text-gray-500" size={32} />
             </div>
             <h3 className="text-xl font-semibold text-gray-300">No Data for Cycle #{cycleNumber}</h3>
             <p className="text-gray-400 mt-2">Cycle snapshot missing or skipped.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Reusable Metric Card
const MetricCard = ({ label, value, icon: Icon, color = 'text-white' }: any) => (
  <div className="bg-zen-card p-5 rounded-xl border border-gray-800 hover:border-zen-accent/50 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
      {Icon && <Icon size={48} />}
    </div>
    <div className="flex justify-between items-start mb-2 relative z-10">
      <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-2xl font-bold font-mono relative z-10 ${color}`}>{value}</div>
  </div>
);