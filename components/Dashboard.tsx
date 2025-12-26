import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bell, Download, Activity, Cpu, MapPin, Newspaper, ExternalLink } from 'lucide-react';
import MapViz from './MapViz';
import ClimateCharts from './ClimateCharts';
import ChatAssistant from './ChatAssistant';
import { fetchClimateData, fetchCalamityHistory } from '../services/nasaService';
import { getClimateInsights, getLocalNews, getNearbyResources } from '../services/geminiService';
import { ClimateStats, Calamity, Prediction, NewsResult, MapResult } from '../types';

const Dashboard: React.FC = () => {
  const [lat, setLat] = useState<number>(20.5937); // Default India center
  const [lon, setLon] = useState<number>(78.9629);
  const [startYear, setStartYear] = useState<number>(2020);
  const [endYear, setEndYear] = useState<number>(2023);
  
  const [data, setData] = useState<ClimateStats[]>([]);
  const [calamities, setCalamities] = useState<Calamity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [prediction, setPrediction] = useState<{ summary: string, predictions: Prediction[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Grounding State
  const [news, setNews] = useState<NewsResult | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [resources, setResources] = useState<MapResult | null>(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setAnalyzing(true);
    setNews(null);
    setResources(null);
    
    // Fetch Data
    const stats = await fetchClimateData(lat, lon, startYear, endYear);
    const events = fetchCalamityHistory(lat, lon);
    
    setData(stats);
    setCalamities(events);
    setLoading(false);

    // Get AI Insights (Deep Think)
    const insights = await getClimateInsights(stats, lat, lon);
    setPrediction(insights);
    setAnalyzing(false);
  }, [lat, lon, startYear, endYear]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load

  const handleLocationSelect = (newLat: number, newLon: number) => {
    setLat(newLat);
    setLon(newLon);
    // Auto-reload optional, or wait for user to click 'Analyze'
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    const result = await getLocalNews(lat, lon);
    setNews(result);
    setNewsLoading(false);
  };

  const fetchResources = async () => {
    setResourcesLoading(true);
    const result = await getNearbyResources(lat, lon);
    setResources(result);
    setResourcesLoading(false);
  };

  const handleDownloadCSV = () => {
    if (data.length === 0) {
      alert("No data available to download.");
      return;
    }
    
    const headers = ['Date', 'Temperature (C)', 'Rainfall (mm)', 'NDVI', 'Anomaly'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => `${row.date},${row.temperature.toFixed(2)},${row.rainfall.toFixed(2)},${row.ndvi.toFixed(2)},${row.anomaly.toFixed(2)}`)
    ].join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `climate_data_${lat.toFixed(2)}_${lon.toFixed(2)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    if (!prediction) {
      alert("Please run analysis first to generate a report.");
      return;
    }
  
    let reportContent = `ROTATER INTELLIGENCE REPORT\n`;
    reportContent += `Generated: ${new Date().toLocaleString()}\n`;
    reportContent += `Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}\n`;
    reportContent += `Date Range: ${startYear} - ${endYear}\n\n`;
    
    reportContent += `==============================\n`;
    reportContent += `AI ANALYSIS SUMMARY\n`;
    reportContent += `==============================\n`;
    reportContent += `${prediction.summary}\n\n`;
    
    reportContent += `==============================\n`;
    reportContent += `RISK PREDICTIONS (Next 12 Months)\n`;
    reportContent += `==============================\n`;
    prediction.predictions.forEach(p => {
      reportContent += `[${p.month}] ${p.riskLevel.toUpperCase()}\n`;
      reportContent += `   Temp: ${p.predictedTemp}°C\n`;
      reportContent += `   Note: ${p.description}\n`;
      reportContent += `------------------------------\n`;
    });
    
    reportContent += `\n==============================\n`;
    reportContent += `RECORDED CALAMITIES\n`;
    reportContent += `==============================\n`;
    if (calamities.length > 0) {
      calamities.forEach(c => {
        reportContent += `${c.year}: ${c.type} (${c.intensity})\n`;
      });
    } else {
      reportContent += `No significant calamities recorded in recent history or simulated data.\n`;
    }

    if (news) {
      reportContent += `\n==============================\n`;
      reportContent += `RECENT LOCAL NEWS\n`;
      reportContent += `==============================\n`;
      reportContent += `${news.summary}\n`;
      if (news.sources.length > 0) {
        reportContent += `\nSources:\n`;
        news.sources.forEach(s => reportContent += `- ${s.title}: ${s.uri}\n`);
      }
    }
  
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `climate_report_${lat.toFixed(2)}_${lon.toFixed(2)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 overflow-y-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-cyan-900/50 pb-4">
        <div className="flex items-center mb-4 md:mb-0">
          <h2 className="text-3xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            ROTATER
          </h2>
          <span className="ml-4 px-2 py-1 bg-cyan-900/30 text-cyan-400 text-xs font-mono rounded border border-cyan-800">
            DASHBOARD V2.0
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="glass-panel px-4 py-2 rounded-full flex items-center">
            <Search size={16} className="text-cyan-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search Lat, Lon..." 
              className="bg-transparent border-none outline-none text-sm text-white w-40"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const parts = e.currentTarget.value.split(',');
                  if (parts.length === 2) {
                    setLat(parseFloat(parts[0]));
                    setLon(parseFloat(parts[1]));
                  }
                }
              }}
            />
          </div>
          <button className="p-2 glass-panel rounded-full hover:bg-cyan-900/40 text-cyan-400 transition-colors">
            <Bell size={20} />
          </button>
          <button 
            onClick={handleDownloadCSV}
            className="p-2 glass-panel rounded-full hover:bg-cyan-900/40 text-cyan-400 transition-colors"
            title="Download Data"
          >
            <Download size={20} />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        
        {/* Controls & Map (Left/Top) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Controls Bar */}
          <div className="glass-panel p-4 rounded-lg flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-400 font-exo">YEAR RANGE</label>
              <input 
                type="number" 
                value={startYear} 
                onChange={e => setStartYear(Number(e.target.value))}
                className="bg-black/50 border border-cyan-900 rounded px-2 py-1 w-20 text-center"
              />
              <span className="text-gray-500">-</span>
              <input 
                type="number" 
                value={endYear} 
                onChange={e => setEndYear(Number(e.target.value))}
                className="bg-black/50 border border-cyan-900 rounded px-2 py-1 w-20 text-center"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-xs text-gray-400">TARGET</div>
                <div className="text-cyan-400 font-mono">{lat.toFixed(2)}°N, {lon.toFixed(2)}°E</div>
              </div>
              <button 
                onClick={loadData}
                disabled={loading}
                className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-exo py-2 px-6 rounded shadow-[0_0_10px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
              >
                {loading ? 'ACQUIRING...' : 'ANALYZE'}
              </button>
            </div>
          </div>

          {/* Map Visualization */}
          <div className="h-96 w-full">
            <MapViz lat={lat} lon={lon} onLocationSelect={handleLocationSelect} />
          </div>

          {/* Charts Section */}
          <ClimateCharts data={data} calamities={calamities} />

          {/* New Grounding Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* News Grounding */}
            <div className="glass-panel p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-cyan-400 font-exo font-bold flex items-center">
                  <Newspaper size={18} className="mr-2" /> Local News (Google Search)
                </h3>
                <button 
                  onClick={fetchNews} 
                  disabled={newsLoading}
                  className="text-xs bg-cyan-900/50 hover:bg-cyan-800 text-cyan-300 px-3 py-1 rounded border border-cyan-700"
                >
                  {newsLoading ? 'Searching...' : 'Fetch News'}
                </button>
              </div>
              <div className="text-sm text-gray-300 min-h-[100px]">
                {news ? (
                  <>
                    <p className="mb-2">{news.summary}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {news.sources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center text-xs bg-black/40 text-cyan-500 px-2 py-1 rounded border border-cyan-900/50 hover:bg-cyan-900/20">
                          {s.title} <ExternalLink size={10} className="ml-1" />
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="italic text-gray-500">Click fetch to see recent climate events near this location.</span>
                )}
              </div>
            </div>

            {/* Maps Grounding */}
            <div className="glass-panel p-4 rounded-lg">
               <div className="flex justify-between items-center mb-4">
                <h3 className="text-green-400 font-exo font-bold flex items-center">
                  <MapPin size={18} className="mr-2" /> Relief Centers (Google Maps)
                </h3>
                <button 
                   onClick={fetchResources}
                   disabled={resourcesLoading}
                   className="text-xs bg-green-900/50 hover:bg-green-800 text-green-300 px-3 py-1 rounded border border-green-700"
                >
                  {resourcesLoading ? 'Locating...' : 'Find Nearby'}
                </button>
              </div>
              <div className="text-sm text-gray-300 min-h-[100px]">
                {resources ? (
                   <>
                    <p className="mb-2">{resources.answer}</p>
                    <div className="flex flex-col gap-2 mt-2 max-h-[120px] overflow-y-auto">
                      {resources.points.map((p, i) => (
                        <a key={i} href={p.uri} target="_blank" rel="noreferrer" className="flex items-center text-xs text-green-400 hover:text-green-300">
                          <MapPin size={12} className="mr-2" /> {p.title}
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="italic text-gray-500">Find emergency shelters and hospitals nearby.</span>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Sidebar: AI Prediction & Alerts (Right) */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* AI Insights Panel */}
          <div className="glass-panel p-6 rounded-lg min-h-[400px] border-t-2 border-t-cyan-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <Cpu size={100} />
            </div>
            
            <h3 className="text-xl font-orbitron font-bold text-white mb-4 flex items-center">
              <Activity className="mr-2 text-cyan-400" />
              DEEP INTELLIGENCE
            </h3>

            {analyzing ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-cyan-900/30 rounded w-3/4"></div>
                <div className="h-4 bg-cyan-900/30 rounded w-full"></div>
                <div className="h-4 bg-cyan-900/30 rounded w-5/6"></div>
                <div className="text-cyan-500 font-mono text-sm mt-4">Running Logic Stream... (Budget: 32k tokens)</div>
              </div>
            ) : prediction ? (
              <div className="space-y-6">
                <div className="bg-black/40 p-4 rounded border-l-2 border-cyan-500">
                  <h4 className="text-cyan-400 text-sm font-bold mb-2 uppercase">Analysis Summary</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {prediction.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-orange-400 text-sm font-bold mb-3 uppercase">Forward Risk Prediction</h4>
                  <div className="space-y-3">
                    {prediction.predictions.map((pred, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded hover:bg-white/10 transition-colors">
                        <div>
                          <div className="text-sm font-bold text-white">{pred.month}</div>
                          <div className="text-xs text-gray-400">{pred.description}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          pred.riskLevel === 'High' ? 'bg-red-500/20 text-red-400' :
                          pred.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {pred.riskLevel.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center mt-10">
                Run analysis to generate predictions.
              </div>
            )}
          </div>

          {/* Research / Export */}
          <div className="glass-panel p-6 rounded-lg">
             <h3 className="text-lg font-exo font-bold text-white mb-4">Research Tools</h3>
             <div className="flex gap-4">
               <button 
                 onClick={handleDownloadCSV}
                 className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded text-sm text-cyan-400 border border-gray-700 transition-colors"
               >
                 Download CSV
               </button>
               <button 
                 onClick={handleExportReport}
                 className="flex-1 bg-gray-800 hover:bg-gray-700 py-2 rounded text-sm text-cyan-400 border border-gray-700 transition-colors"
               >
                 Export Report
               </button>
             </div>
          </div>

        </div>
      </div>
      
      {/* Chat Bot */}
      <ChatAssistant />
    </div>
  );
};

export default Dashboard;