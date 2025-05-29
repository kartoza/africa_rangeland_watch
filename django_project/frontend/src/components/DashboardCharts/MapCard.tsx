import React, { useRef } from "react";
import { Box } from "@chakra-ui/react";
import "maplibre-gl/dist/maplibre-gl.css";
import { ReusableMapLibre } from "../Map/MapLibre";

import { Layer } from "../../store/layerSlice";


interface MiniMapProps {
  uuid: string; // Unique identifier for the map instance
  analysisResults?: any[]; // Optional analysis results for the map
}

const MiniMap: React.FC<MiniMapProps> = ({ uuid, analysisResults }) => {
  const mapLibreRef = useRef(null);

  const analysisResult = analysisResults?.[0];
  // use the last raster output if available
  const rasterLayer = analysisResult?.raster_output_list?.length ? analysisResult.raster_output_list[analysisResult.raster_output_list.length - 1] : undefined;

  let layer: Layer = null;
  if (rasterLayer) {
    layer = {
      id: rasterLayer.id,
      uuid: rasterLayer.id,
      name: rasterLayer.name,
      type: "raster",
      group: "analysis_output",
      url: rasterLayer.url
    };
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
      <ReusableMapLibre ref={mapLibreRef} mapContainerId={`map-${uuid}`} initialBound={rasterLayer?.bounds} layer={layer}/>
    </Box>
  );
};

export default MiniMap;
