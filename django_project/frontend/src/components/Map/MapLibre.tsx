import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';
import maplibregl from 'maplibre-gl';
import { Box } from "@chakra-ui/react";
import { BasemapControl } from "./control";
import { Layer } from "./DataTypes";
import { hasSource, removeLayer } from "./utils";

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { initialBound } from "./DataFixtures";

interface Props {

}

/**
 * MapLibre component.
 */
export const MapLibre = forwardRef(
  (props: Props, ref
  ) => {
    const [map, setMap] = useState(null);

    // Toggle
    useImperativeHandle(ref, () => ({
      /** Render layer */
      renderLayer(layer: Layer) {
        if (map) {
          const ID = `layer-${layer.id}`
          removeLayer(map, ID)
          if (layer.type == "raster") {
            if (!hasSource(map, ID)) {
              map.addSource(ID, {
                  type: "raster",
                  tiles: [layer.url],
                  tileSize: 256
                }
              )
            }
            map.addLayer(
              {
                id: ID,
                source: ID,
                type: "raster"
              }
            )
          }
        }
      },
      /** Hide layer */
      removeLayer(layer: Layer) {
        if (map) {
          const ID = `layer-${layer.id}`
          removeLayer(map, ID)
        }
      }
    }));

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

          // TODO:
          //  We put this on admin
          _map.fitBounds(initialBound,
            {
              pitch: 0,
              bearing: 0
            }
          )
        })
        _map.addControl(new BasemapControl(), 'bottom-left');
        _map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
      }
    }, []);

    return (
      <Box id="map" flexGrow={1}/>
    )
  }
)

