import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import maplibregl from 'maplibre-gl';
import { Box } from "@chakra-ui/react";
import { BasemapControl, LegendControl } from "./control";
import { Layer } from "./DataTypes";
import { hasSource, removeLayer } from "./utils";
import { initialBound } from "./fixtures/map";

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

interface Props {

}

/**
 * MapLibre component.
 */
export const MapLibre = forwardRef(
  (props: Props, ref
  ) => {
    const legendRef = useRef(null);
    const [map, setMap] = useState(null);
    const [layers, setLayers] = useState<Array<Layer> | null>(null);

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
            legendRef?.current?.renderLayer(layer)
          }
        }
      },
      /** Hide layer */
      removeLayer(layer: Layer) {
        if (map) {
          const ID = `layer-${layer.id}`
          removeLayer(map, ID)
          legendRef?.current?.removeLayer(layer)
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
        _map.addControl(new LegendControl(legendRef), 'top-left');
        _map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
      }
    }, []);

    return (
      <Box id="map" flexGrow={1}/>
    )
  }
)

