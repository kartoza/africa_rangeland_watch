import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { GeoJSONSource } from 'maplibre-gl';
import {FeatureCollection, Feature} from "geojson";
import { area } from "@turf/area";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {CUSTOM_GEOM_ID} from "../../DataTypes";
import { hasSource, removeSource } from '../../utils';
import { useMap } from '../../../../MapContext';

export const CUSTOM_GEOM_FILL_ID = CUSTOM_GEOM_ID + "-fill";

interface Props {
  isDrawing: boolean;
  onSelected: (geometry: FeatureCollection, area: number, selected_id: string|number) => void;
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
    // polygon fill selected active
    {
      "id": "gl-draw-polygon-fill-active",
      "type": "fill",
      "filter": ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
      "paint": {
        "fill-color": "#D20C0C",
        "fill-outline-color": "#D20C0C",
        "fill-opacity": 0.5
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
    const { mapRef, isMapLoaded } = useMap();
    const drawingRef = useRef(null);

    const drawGeom = (geom: FeatureCollection, selectedId?: string|number) => {
      const map = mapRef.current;
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
      map.addLayer({
        'id': CUSTOM_GEOM_FILL_ID + '-highlight',
        'type': 'fill',
        'source': CUSTOM_GEOM_ID,
        'paint': {
          "fill-color": "#D20C0C",
          "fill-outline-color": "#D20C0C",
          'fill-opacity': 0.5
        },
        "filter": ["==", "id", 0]
      });
      if (selectedId) {
        map.setFilter(
          CUSTOM_GEOM_FILL_ID + '-highlight',
          ["==", "id", selectedId]
        )
      }
    }

    const getSelectedId = () => {
      const map = mapRef.current;
      const filter = map.getFilter(CUSTOM_GEOM_FILL_ID + "-highlight");
      let featureId: string|number = '';
      if (filter && Array.isArray(filter) && filter.length === 3) {
        featureId = filter[2] as string
      }

      return featureId;
    }

    const getFeatureCollection = () => { 
      const map = mapRef.current;
      const source = map.getSource(CUSTOM_GEOM_ID) as GeoJSONSource;
      let data = null;
      if (source) {
        data = source.serialize().data as GeoJSON.FeatureCollection;
      }

      return data;
    }

    useImperativeHandle(ref, () => ({
        /** Remove layer */
        removeLayer() {
          const map = mapRef.current;
          if (map) {
            removeSource(map, CUSTOM_GEOM_ID);
          }
        },
        drawLayer(geom: FeatureCollection, selectedId?: string) {
          const map = mapRef.current;
          if (map) {
            drawGeom(geom, selectedId);
          }
        }
      }));

    const checkArea = (geom: FeatureCollection | Feature) => {
      try {
        return area(geom)
      } catch(err) {
        console.log(err) 
      }
      return 0
    }

    useEffect(() => {
        const map = mapRef.current;
        if (!isMapLoaded || !map) {
            return;
        }

        if (isDrawing) {
            let existingFeatureCollection: FeatureCollection = null;
            let existingSelectedId: string|number = null;
            if (hasSource(map, CUSTOM_GEOM_ID)) {
              // get the pre-defined FeatureCollection (could be from saved session)
              existingFeatureCollection = getFeatureCollection()
              if (existingFeatureCollection) {
                existingSelectedId = getSelectedId()
              }
              removeSource(map, CUSTOM_GEOM_ID)
            }

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

            // add existing feature collection
            if (existingFeatureCollection) {
              drawingRef.current.set(existingFeatureCollection)
              if (existingSelectedId) {
                drawingRef.current.changeMode('simple_select', {
                  featureIds: [existingSelectedId]
                })
              }
            }
        } else if (drawingRef.current) {
            const drawingObj: MapboxDraw = drawingRef.current
            let allDrawing = drawingObj.getAll()
            const selectedIds = drawingObj.getSelectedIds()
            let selectedId: string|number = ''
            if (selectedIds.length > 0) {
              selectedId = selectedIds[0]
            } else if (allDrawing.features.length > 0) {
              selectedId = allDrawing.features[0].id
            }

            let area = 0
            for (let feature of allDrawing.features) {
              if (feature.id === selectedId) {
                area = checkArea(feature)
              }
              // add id in feature properties
              feature.properties.id = feature.id
            }

            // remove control
            map.removeControl(drawingRef.current)
            drawingRef.current = null

            if (area === 0) {
              onSelected(null, 0, selectedId)
            } else {
              drawGeom(allDrawing, selectedId);
              onSelected(allDrawing, area, selectedId);
            }
        }
    }, [isMapLoaded, isDrawing])

    return <></>
})
