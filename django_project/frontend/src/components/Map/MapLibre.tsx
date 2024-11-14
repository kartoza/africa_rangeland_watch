import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Box } from "@chakra-ui/react";
import { BasemapControl } from "./control";

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

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
          sources: {},
          layers: [],
          glyphs: "/static/fonts/{fontstack}/{range}.pbf"
        },
        center: [0, 0],
        zoom: 1
      });
      _map.once("load", () => {
        setMap(_map)
      })
      _map.addControl(new BasemapControl(), 'bottom-left');
      _map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
    }
  }, []);

  return (
    <Box id="map" flexGrow={1}/>
  )
}

