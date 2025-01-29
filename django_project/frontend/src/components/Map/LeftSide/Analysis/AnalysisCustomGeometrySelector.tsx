import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {FeatureCollection} from "geojson";
import { combine } from "@turf/combine";
import { area } from "@turf/area";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {CUSTOM_GEOM_ID} from "../../DataTypes";
import { removeSource } from '../../utils';
import { useMap } from '../../../../MapContext';

export const CUSTOM_GEOM_FILL_ID = CUSTOM_GEOM_ID + "-fill";

interface Props {
  isDrawing: boolean;
  onSelected: (geometry: FeatureCollection, area: number) => void;
}

const styles = [
    // ACTIVE (being drawn)
    // line stroke
    {
        "id": "gl-draw-line",
        "type": "line",
        "filter": ["all", ["==", "$type", "LineString"]],
        "layout": {
          "line-cap": "round",
          "line-join": "round"
        },
        "paint": {
          "line-color": "#D20C0C",
          "line-width": 2
        }
    },
    // polygon fill
    {
      "id": "gl-draw-polygon-fill",
      "type": "fill",
      "filter": ["all", ["==", "$type", "Polygon"]],
      "paint": {
        "fill-color": "#D20C0C",
        "fill-outline-color": "#D20C0C",
        "fill-opacity": 0.1
      }
    },
    // polygon mid points
    {
      'id': 'gl-draw-polygon-midpoint',
      'type': 'circle',
      'filter': ['all',
        ['==', '$type', 'Point'],
        ['==', 'meta', 'midpoint']],
      'paint': {
        'circle-radius': 3,
        'circle-color': '#fbb03b'
      }
    },
    // polygon outline stroke
    // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
    {
      "id": "gl-draw-polygon-stroke-active",
      "type": "line",
      "filter": ["all", ["==", "$type", "Polygon"]],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": "#D20C0C",
        "line-width": 2
      }
    },
    // vertex point halos
    {
      "id": "gl-draw-polygon-and-line-vertex-halo-active",
      "type": "circle",
      "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      "paint": {
        "circle-radius": 5,
        "circle-color": "#FFF"
      }
    },
    // vertex points
    {
      "id": "gl-draw-polygon-and-line-vertex-active",
      "type": "circle",
      "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      "paint": {
        "circle-radius": 3,
        "circle-color": "#D20C0C",
      }
    }
];

/** Custom geometry selector. */
export const AnalysisCustomGeometrySelector = forwardRef((
  { isDrawing, onSelected }: Props, ref
) => {
    const { map } = useMap();
    const drawingRef = useRef(null);

    const drawGeom = (geom: FeatureCollection) => {
      // add geom to map
      map.addSource(
        CUSTOM_GEOM_ID, {
          type: 'geojson',
          data: geom
        }
      );
      map.addLayer({
        'id': CUSTOM_GEOM_ID,
        'type': 'line',
        'source': CUSTOM_GEOM_ID,
        'paint': {
          "line-color": "#D20C0C",
          "line-width": 2
        }
      });
      map.addLayer({
        'id': CUSTOM_GEOM_FILL_ID,
        'type': 'fill',
        'source': CUSTOM_GEOM_ID,
        'paint': {
          "fill-color": "#D20C0C",
          "fill-outline-color": "#D20C0C",
          "fill-opacity": 0.1
        }
      });
    }

    useImperativeHandle(ref, () => ({
        /** Remove layer */
        removeLayer() {
          if (map) {
            removeSource(map, CUSTOM_GEOM_ID);
          }
        },
        drawLayer(geom: FeatureCollection) {
          if (map) {
            drawGeom(geom);
          }
        }
      }));

    const checkArea = (geom: FeatureCollection) => {
      try {
        return area(geom)
      } catch(err) {
        console.log(err) 
      }
      return 0
    }

    useEffect(() => {
        if (!map) {
            return;
        }

        if (isDrawing) {
            removeSource(map, CUSTOM_GEOM_ID);

            // workaround for control issue
            // https://github.com/maplibre/maplibre-gl-js/issues/2601#issuecomment-1564747778
            // MapboxDraw requires the canvas's class order to have the class 
            // "mapboxgl-canvas" first in the list for the key bindings to work
            map.getCanvas().className = 'mapboxgl-canvas maplibregl-canvas';
            map.getContainer().classList.add('mapboxgl-map');
            const canvasContainer = map.getCanvasContainer();
            canvasContainer.classList.add('mapboxgl-canvas-container');
            if (canvasContainer.classList.contains('maplibregl-interactive')) {
                canvasContainer.classList.add('mapboxgl-interactive');
            }

            drawingRef.current = new MapboxDraw({
                displayControlsDefault: false,
                defaultMode: 'draw_polygon',
                controls: {
                    'polygon': true,
                    'trash': true
                },
                styles: styles
            });
            const originalOnAdd = drawingRef.current.onAdd.bind(drawingRef.current);
            drawingRef.current.onAdd = (map: maplibregl.Map) => {
                const controlContainer = originalOnAdd(map);
                controlContainer.classList.add('maplibregl-ctrl', 'maplibregl-ctrl-group');
                return controlContainer;
            };
            map.addControl(drawingRef.current, 'bottom-left');
        } else if (drawingRef.current) {
            // get geometry
            let geom = combine(drawingRef.current.getAll())
            let area = checkArea(geom)

            // remove control
            map.removeControl(drawingRef.current)
            drawingRef.current = null

            if (area === 0) {
              onSelected(null, 0)
            } else {
              drawGeom(geom);
              onSelected(geom, area);
            }
        }
    }, [map, isDrawing])

    return <></>
})
