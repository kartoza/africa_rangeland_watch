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

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: polygonCoordinates[0], // Center the map on the first coordinate
      zoom: 10,
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
    />
  );
};

export default MiniMap;
