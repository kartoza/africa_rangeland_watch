/**
 * All data types that being used on Map
 */

export interface AnalysisDataPeriod {
  year?: number | number[];
  quarter?: number | number[];
  month?: number | number[];
}

export interface AnalysisData {
  latitude?: number;
  longitude?: number;
  landscape?: string;
  analysisType?: string;
  temporalResolution?: string;
  variable?: string;
  period?: AnalysisDataPeriod;
  comparisonPeriod?: AnalysisDataPeriod;
  community?: string;
  communityName?: string;
  communityFeatureId?: string;
  reference_layer?: object;
  reference_layer_id?: string|number;
  custom_geom?: object;
  userDefinedFeatureName?: string;
  userDefinedFeatureId?: string;
  spatialStartYear?: number;
  spatialEndYear?: number;
  baselineStartDate?: string;
  baselineEndDate?: string;
}

export const GroupName = {
  BaselineGroup: 'baseline',
  NearRealtimeGroup: 'near-real-time',
  UserDefinedGroup: 'user-defined'
}
export const COMMUNITY_ID = 'Communities'
export const CUSTOM_GEOM_ID = 'CustomGeom'
