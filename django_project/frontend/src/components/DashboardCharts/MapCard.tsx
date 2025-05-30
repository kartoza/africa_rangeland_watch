import React, { useRef } from "react";
import { Box } from "@chakra-ui/react";
import "maplibre-gl/dist/maplibre-gl.css";
import { ReusableMapLibre } from "../Map/MapLibre";

import { Layer } from "../../store/layerSlice";


interface MiniMapProps {
  uuid: string; // Unique identifier for the map instance
  analysisResults?: any[]; // Optional analysis results for the map
  rasterOutputIdx?: number; // Optional index for raster output
}

const MiniMap: React.FC<MiniMapProps> = ({ uuid, analysisResults, rasterOutputIdx }) => {
  const mapLibreRef = useRef(null);

  const analysisResult = analysisResults?.[0];
  // use the last raster output if available
  const rasterOutputIndex = rasterOutputIdx !== undefined ? rasterOutputIdx : (analysisResult?.raster_output_list?.length ? analysisResult.raster_output_list.length - 1 : undefined);
  const rasterLayer = analysisResult?.raster_output_list?.length ? analysisResult.raster_output_list[rasterOutputIndex] : undefined;

  let layer: Layer = null;
  let featuresIds: string[] = [];
  if (rasterLayer) {
    if (rasterLayer.status === 'COMPLETED') {
      // If the raster layer is completed, we can use it to create the layer object
      layer = {
        id: rasterLayer.id,
        uuid: rasterLayer.id,
        name: rasterLayer.name,
        type: "raster",
        group: "analysis_output",
        url: rasterLayer.url
      };
    }    

    rasterLayer.analysis.locations.forEach((location: any) => {
      featuresIds.push(location.communityFeatureId);
    });
  }

  return (
    <Box
      width="100%"
      height="100%"
      borderRadius="10px"
      background="gray.200"
      display={'flex'}
      position={'relative'}
      flexGrow={1}
    >
      <ReusableMapLibre ref={mapLibreRef} mapContainerId={`map-${uuid}`} initialBound={rasterLayer?.bounds} layer={layer} selectedCommmunityIds={featuresIds}/>
    </Box>
  );
};

export default MiniMap;
