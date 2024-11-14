import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Box } from "@chakra-ui/react";

import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MapLibre component.
 */
export default function MapLibre() {
  const [map, setMap] = useState(null);

  /** First initiate */
  useEffect(() => {
    if (!map) {
      const _map = new maplibregl.Map({
        container: 'map',
        style: {
          version: 8,
          sources: {
            basemap: {
              type: "raster",
              tiles: [
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: "basemap",
              source: "basemap",
              type: "raster"
            }
          ],
          glyphs: "/static/fonts/{fontstack}/{range}.pbf"
        },
        center: [0, 0],
        zoom: 1
      });
      _map.once("load", () => {
        setMap(_map)
      })
      _map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
    }
  }, []);

  return (
    <Box id="map" flexGrow={1}/>
  )
}

