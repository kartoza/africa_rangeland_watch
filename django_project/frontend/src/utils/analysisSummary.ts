interface AnalysisSummary {
    title: string;
    projectName: string;
    locationName: string;
    analysisType: string;
    latitude?: number;
    longitude?: number;
  }


  export const getAnalysisSummary = (analysis: any): AnalysisSummary => {
      const { analysis_results } = analysis || {};
      const { results, data } = analysis_results || {};
    
      const features = results?.[0]?.features || [];
      const { analysisType = "Analysis", latitude, longitude, landscape } = data || {};
    
      // Extract properties safely
      const projectName = features?.[0]?.properties?.Project || "Unknown Project";
    
      // Construct a meaningful title
      const title =
        landscape && landscape !== "Unknown Landscape" 
          ? `${analysisType} Analysis of ${landscape}`
          : projectName === "Unknown Project"
          ? `${analysisType} Results from Area`
          : `${analysisType} Analysis of ${landscape} in the ${projectName} Landscape.`;
      
      return {
        title,
        projectName,
        locationName: landscape,
        analysisType,
        latitude,
        longitude,
      };
    };