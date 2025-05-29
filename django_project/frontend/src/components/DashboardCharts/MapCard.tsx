import React, { useRef } from "react";
import { Box } from "@chakra-ui/react";
import "maplibre-gl/dist/maplibre-gl.css";
import { ReusableMapLibre } from "../Map/MapLibre";


interface MiniMapProps {
  uuid: string; // Unique identifier for the map instance
}

const MiniMap: React.FC<MiniMapProps> = ({ uuid }) => {
  const mapLibreRef = useRef(null);

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
      <ReusableMapLibre ref={mapLibreRef} mapContainerId={`map-${uuid}`} initialBound={null}/>
    </Box>
  );
};

export default MiniMap;
