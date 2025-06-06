import React, { useRef } from 'react';
import {
  Box,
  VStack} from '@chakra-ui/react';
import { WidgetHeight } from '../../store/dashboardSlice';
import { ReusableMapLibre } from "../Map/MapLibre";

import { Layer } from "../../store/layerSlice";


const MapWidget: React.FC<{ widgetId: string, data: any, height: WidgetHeight, config?: any }> = ({ widgetId, data, height, config }) => {
  const mapLibreRef = useRef(null);
  const mapHeight = height === 'small' ? '120px' : height === 'medium' ? '180px' : height === 'large' ? '280px' : '380px';

  let rasterLayer = data || null;
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
    <VStack spacing={4} align="stretch" h="full" overflow="hidden">
      <Box
        h={mapHeight}
        bg="gray.50"
        borderRadius="md"
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        border="1px solid"
        borderColor="gray.200"
      >
        <Box
          width="100%"
          height="100%"
          display={'flex'}
          position={'relative'}
          flexGrow={1}
        >
          <ReusableMapLibre ref={mapLibreRef} mapContainerId={`map-${widgetId}`}
            initialBound={rasterLayer?.bounds} layer={layer} selectedCommmunityIds={featuresIds}
            referenceLayer={rasterLayer?.analysis.reference_layer}
            referenceLayerId={rasterLayer?.analysis.reference_layer_id}
          />
        </Box>
        
      </Box>
    </VStack>
  );
};

export default MapWidget;