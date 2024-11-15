/**
 * All data types that being used on Map
 */

export interface Basemap {
  id: number;
  name: string;
  url: string;
  thumbnail?: string;
}

export const GroupName = {
  BaselineGroup: 'baseline',
  NearRealtimeGroup: 'near-real-time',
  UserDefinedGroup: 'user-defined'
}

export interface Layer {
  id: number;
  name: string;
  url: string;
  type: 'raster' | 'vector';
  group: 'baseline' | 'near-real-time' | 'user-defined';
  metadata?: {
    minValue: number;
    maxValue: number;
    unit?: string;
    colors: string[];
  }
}