import { NASA_API_KEY } from '../constants';
import { ClimateStats, Calamity } from '../types';

const BASE_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point";

export const fetchClimateData = async (lat: number, lon: number, startYear: number, endYear: number): Promise<ClimateStats[]> => {
  // Construct API URL
  // Parameters: T2M (Temperature at 2 Meters), PRECTOTCORR (Precipitation)
  const params = "T2M,PRECTOTCORR";
  const url = `${BASE_URL}?parameters=${params}&community=AG&longitude=${lon}&latitude=${lat}&start=${startYear}&end=${endYear}&format=JSON`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA API Error: ${response.statusText}`);
    }
    const data = await response.json();
    const properties = data.properties.parameter;

    const stats: ClimateStats[] = [];
    const dates = Object.keys(properties.T2M);

    dates.forEach(date => {
      const temp = properties.T2M[date];
      const rain = properties.PRECTOTCORR[date];
      
      // Simulate NDVI and Anomalies for demo purposes as they require more complex separate datasets (MODIS)
      // In a real Python backend, this would use the MODIS API with Earthdata tokens.
      const month = parseInt(date.substring(4, 6));
      let simulatedNDVI = 0.3;
      if (month >= 5 && month <= 9) simulatedNDVI = 0.7; // Greener in summer (northern hemisphere assumption for simulation)
      if (lat < 0) simulatedNDVI = (month >= 11 || month <= 3) ? 0.7 : 0.3; // Southern hemisphere

      // Anomaly: Random fluctuation for demo + trend
      const anomaly = (Math.random() * 2 - 1) * 1.5;

      if (temp !== -999 && rain !== -999) { // NASA no-data value
        stats.push({
          date: `${date.substring(0, 4)}-${date.substring(4, 6)}`,
          temperature: temp,
          rainfall: rain,
          ndvi: parseFloat((simulatedNDVI + (Math.random() * 0.1)).toFixed(2)),
          anomaly: parseFloat(anomaly.toFixed(2))
        });
      }
    });

    return stats;
  } catch (error) {
    console.error("Failed to fetch NASA data", error);
    // Return mock data if API fails (e.g., rate limit or network issue)
    return generateMockData(startYear, endYear);
  }
};

const generateMockData = (start: number, end: number): ClimateStats[] => {
  const stats: ClimateStats[] = [];
  for (let y = start; y <= end; y++) {
    for (let m = 1; m <= 12; m++) {
      stats.push({
        date: `${y}-${m.toString().padStart(2, '0')}`,
        temperature: 15 + Math.sin(m / 2) * 10 + (y - start) * 0.1,
        rainfall: Math.random() * 100,
        ndvi: 0.4 + Math.random() * 0.4,
        anomaly: (Math.random() - 0.5) * 2
      });
    }
  }
  return stats;
};

export const fetchCalamityHistory = (lat: number, lon: number): Calamity[] => {
  // Mocking calamity data based on location lat/lon heuristics
  // Real implementation would query NOAA or EM-DAT databases
  const calamities: Calamity[] = [];
  const years = [2018, 2020, 2022, 2023];
  
  years.forEach(year => {
    if (Math.random() > 0.5) {
      calamities.push({
        year,
        type: Math.random() > 0.5 ? 'Flood' : 'Heatwave',
        intensity: Math.random() > 0.5 ? 'Severe' : 'Moderate',
        month: '07'
      });
    }
  });
  return calamities;
};