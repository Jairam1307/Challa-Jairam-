import { GoogleGenAI, Type, Chat } from "@google/genai";
import { ClimateStats, Prediction, NewsResult, MapResult, GroundingSource } from "../types";

// NOTE: The API Key is accessed via process.env.API_KEY as mandated.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Feature: Think more when needed
// Feature: Gemini intelligence (Complex tasks)
export const getClimateInsights = async (
  stats: ClimateStats[],
  lat: number,
  lon: number
): Promise<{ summary: string; predictions: Prediction[] }> => {
  try {
    const recentStats = stats.slice(-24); // Last 2 years
    const prompt = `
      Analyze the following climate data for location (${lat}, ${lon}).
      Data (Last 24 months): ${JSON.stringify(recentStats)}
      
      Task:
      1. Provide a concise summary of recent trends (temperature, rainfall, vegetation).
      2. Predict potential risks for the next 12 months based on historical patterns.
      3. Identify if there are signs of drought or flood risks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Required for Thinking Mode
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget for deep analysis
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  month: { type: Type.STRING },
                  riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                  predictedTemp: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    // When using responseSchema, response.text contains the valid JSON string.
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      summary: "AI Analysis unavailable. Displaying raw data only.",
      predictions: [
        { month: "Next Month", riskLevel: "Medium", predictedTemp: 0, description: "Prediction unavailable" }
      ]
    };
  }
};

// Feature: Use Google Search data
export const getLocalNews = async (lat: number, lon: number): Promise<NewsResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Required for Search Grounding
      contents: `Find recent (last 6 months) climate, weather, or environmental news events near coordinates ${lat}, ${lon}. Summarize the key situations.`,
      config: {
        tools: [{ googleSearch: {} }] // Enable Google Search
      }
    });

    const sources: GroundingSource[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });

    return {
      summary: response.text || "No recent news found.",
      sources
    };
  } catch (e) {
    console.error("Search Error", e);
    return { summary: "Could not fetch news.", sources: [] };
  }
};

// Feature: Use Google Maps data
export const getNearbyResources = async (lat: number, lon: number): Promise<MapResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Required for Maps Grounding
      contents: "List nearby emergency shelters, hospitals, and disaster relief centers.",
      config: {
        tools: [{ googleMaps: {} }], // Enable Google Maps
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lon
            }
          }
        }
      }
    });

    const points: GroundingSource[] = [];
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      // Extract map URIs
      if (chunk.maps) {
        points.push({ title: chunk.maps.title, uri: chunk.maps.uri });
      } else if (chunk.web) {
        points.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });

    return {
      answer: response.text || "No resources found.",
      points
    };
  } catch (e) {
    console.error("Maps Error", e);
    return { answer: "Could not fetch resources.", points: [] };
  }
};

// Feature: AI powered chatbot
export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are ROTATER's advanced climate AI assistant. Answer questions about weather patterns, climate science, and interpret the data on the dashboard for the user."
    }
  });
};