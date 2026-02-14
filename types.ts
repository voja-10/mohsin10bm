
export interface Ingredient {
  name: string;
  status: 'SAFE' | 'CAUTION' | 'HARMFUL';
  description: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ProductAnalysis {
  name: string;
  brand: string;
  safetyScore: number;
  ratingText: string;
  analysisSummary: string;
  skinAnalysis: string;
  ingredients: Ingredient[];
  sources?: GroundingSource[];
}

export interface Product {
  barcode: string;
  name: string;
  brand: string;
  image?: string;
  ingredientsText?: string;
  analysis?: ProductAnalysis;
  timestamp: number;
}

export enum SkinType {
  OILY = 'Oily',
  DRY = 'Dry',
  SENSITIVE = 'Sensitive',
  COMBINATION = 'Combination',
  NORMAL = 'Normal'
}

export interface UserProfile {
  name: string;
  skinTypes: SkinType[];
}
