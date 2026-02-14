
import { GoogleGenAI, Type } from "@google/genai";
import { ProductAnalysis, Ingredient, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    brand: { type: Type.STRING },
    safetyScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
    ratingText: { type: Type.STRING, description: "E.g., Excellent, Good, Fair, Poor" },
    analysisSummary: { type: Type.STRING },
    skinAnalysis: { type: Type.STRING, description: "Detailed explanation for specific skin types" },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["SAFE", "CAUTION", "HARMFUL"] },
          description: { type: Type.STRING }
        },
        required: ["name", "status", "description"]
      }
    }
  },
  required: ["name", "brand", "safetyScore", "ratingText", "analysisSummary", "skinAnalysis", "ingredients"]
};

const extractSources = (response: any): GroundingSource[] => {
  const sources: GroundingSource[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks && Array.isArray(chunks)) {
    chunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri && chunk.web.title) {
        sources.push({
          title: chunk.web.title,
          uri: chunk.web.uri
        });
      }
    });
  }
  // Remove duplicates
  return sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
};

export const analyzeProduct = async (productName: string, brand: string, ingredientsText: string, userSkinTypes: string[]): Promise<ProductAnalysis | null> => {
  try {
    const prompt = `
      Search for and analyze this cosmetic product using the most up-to-date information:
      Name: ${productName}
      Brand: ${brand}
      Known Ingredients: ${ingredientsText}
      
      User has the following skin types: ${userSkinTypes.join(", ")}.
      
      Provide a detailed safety and ingredient analysis based on current dermatology standards and recent news or recalls.
      Detect harmful ingredients like parabens, sulfates, microplastics, and restricted fragrance allergens.
      
      IMPORTANT: Return ONLY valid JSON that matches the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    const resultText = response.text;
    if (!resultText) return null;
    
    const analysis = JSON.parse(resultText) as ProductAnalysis;
    analysis.sources = extractSources(response);
    
    return analysis;
  } catch (error) {
    console.error("AI Analysis error:", error);
    return null;
  }
};

export const analyzeProductFromImage = async (base64Data: string, mimeType: string, userSkinTypes: string[]): Promise<ProductAnalysis | null> => {
  try {
    const prompt = `
      Identify this cosmetic product from the image. 
      Use Google Search to find its exact current ingredient list and safety profile.
      User skin types: ${userSkinTypes.join(", ")}.
      
      If the ingredient list is not visible, use Google Search to find the official ingredient list for the identified product.
      
      IMPORTANT: Return ONLY valid JSON that matches the schema.
    `;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    const resultText = response.text;
    if (!resultText) return null;
    
    const analysis = JSON.parse(resultText) as ProductAnalysis;
    analysis.sources = extractSources(response);
    
    return analysis;
  } catch (error) {
    console.error("AI Image Analysis error:", error);
    return null;
  }
};
