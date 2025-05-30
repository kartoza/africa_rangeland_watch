import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Box } from "@chakra-ui/react";
import "maplibre-gl/dist/maplibre-gl.css";
import { Feature, Polygon } from "geojson";

interface MiniMapProps {
  polygonCoordinates: [number, number][]; // Expecting a list of [longitude, latitude] pairs
}

const MiniMap: React.FC<MiniMapProps> = ({ polygonCoordinates }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || polygonCoordinates.length === 0) return;

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

    mapInstanceRef.current = map;

    map.on("load", () => {
      const polygonFeature: Feature<Polygon> = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [polygonCoordinates], // ✅ Correct GeoJSON format (nested array)
        },
        properties: {},
      };

      map.addSource("polygonSource", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [polygonFeature],
        },
      });

      map.addLayer({
        id: "polygonLayer",
        type: "fill",
        source: "polygonSource",
        paint: {
          "fill-color": "#008000",
          "fill-opacity": 0.5,
        },
      });

      const bounds = new maplibregl.LngLatBounds();
      polygonCoordinates.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds, { padding: 20 });
    });

    return () => {
      map.remove();
    };
  }, [polygonCoordinates]);

  return (
    <Box
      ref={mapContainerRef}
      width="100%"
      height="100%"
      borderRadius="10px"
      overflow="hidden"
      background="gray.200"
      display={'flex'}
      position={'relative'}
      flexGrow={1}
    >
      <ReusableMapLibre ref={mapLibreRef} mapContainerId={`map-${uuid}`}
        initialBound={rasterLayer?.bounds} layer={layer} selectedCommmunityIds={featuresIds}
        referenceLayer={rasterLayer?.analysis.reference_layer}
        referenceLayerId={rasterLayer?.analysis.reference_layer_id}
      />
    </Box>
  );
};

export default MiniMap;
