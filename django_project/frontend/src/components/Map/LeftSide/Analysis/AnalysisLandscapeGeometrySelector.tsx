import React, { useEffect } from 'react';
import maplibregl from "maplibre-gl";
import { COMMUNITY_ID, EARTH_EANGER_EVENT } from "../../DataTypes";
import { Community, Landscape } from "../../../../store/landscapeSlice";
import { useMap } from '../../../../MapContext';

const COMMUNITY_FILL_ID = COMMUNITY_ID + '-fill';

interface Props {
  landscape: Landscape;
  enableSelection: boolean;
  onSelected: (value: Community) => void;
  featureIds?: string[];
}

let hoverFunction: (ev: maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
} & Object) => void = null
let clickFunction: (ev: maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
} & Object) => void = null

/** Landscape geometry selector. */
export default function AnalysisLandscapeGeometrySelector(
  { landscape, enableSelection, onSelected, featureIds }: Props
) {
  const { map } = useMap();

  useEffect(() => {
    try {
      if (!map) {
        return
      }
      // render Earth Ranger Events
      map.addSource(
        EARTH_EANGER_EVENT, {
          type: 'vector',
          tiles: [
            document.location.origin + '/frontend-api/earth-ranger/events/vector_tile/{z}/{x}/{y}/'
          ]
        }
      );
      map.addLayer({
        'id': EARTH_EANGER_EVENT,
        'type': 'circle',
        'source': EARTH_EANGER_EVENT,
        'source-layer': 'default',
        'paint': {
          'circle-radius': 15,
          'circle-color': '#FF0000',
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 1
        }
      });


      // render community layer
      map.addSource(
        COMMUNITY_ID, {
          type: 'vector',
          tiles: [
            document.location.origin + '/frontend-api/landscapes/vector_tile/{z}/{x}/{y}/'
          ]
        }
      );
      map.addLayer({
        'id': COMMUNITY_ID,
        'type': 'line',
        'source': COMMUNITY_ID,
        'source-layer': 'default',
        'paint': {
          'line-color': '#777777',
          'line-width': 1
        }
      });
      map.addLayer({
        'id': COMMUNITY_ID + '-community',
        'type': 'line',
        'source': COMMUNITY_ID,
        'source-layer': 'default',
        'paint': {
          'line-color': '#0B6623',
          'line-width': 2
        },
        "filter": ["==", "landscape_id", 0]
      });
      map.addLayer({
        'id': COMMUNITY_ID + '-highlight',
        'type': 'fill',
        'source': COMMUNITY_ID,
        'source-layer': 'default',
        'paint': {
          'fill-color': '#0B6623',
          'fill-opacity': 0.5
        },
        "filter": ["==", "landscape_id", 0]
      });
      map.addLayer({
        'id': COMMUNITY_FILL_ID,
        'type': 'fill',
        'source': COMMUNITY_ID,
        'source-layer': 'default',
        'paint': {
          'fill-color': '#777777',
          'fill-opacity': 0
        }
      });
    } catch (err) {
      console.log(err)
    }
  }, [map])

  useEffect(() => {
    if (!map) {
      return
    }
    if (typeof map.getSource(COMMUNITY_ID) === 'undefined') {
      return;
    }
    map.setFilter(
      (COMMUNITY_ID + '-community'), ["==", "landscape_id", 0]
    );
    map.setFilter(
      (COMMUNITY_ID + '-highlight'), ["==", "landscape_id", 0]
    );

    if (!landscape?.bbox) {
      return
    }
    map.setFilter(
      (COMMUNITY_ID + '-community'), ["==", "landscape_id", landscape.id]
    );


    // @ts-ignore
    map.fitBounds(landscape.bbox,
      {
        pitch: 0,
        bearing: 0
      }
    )

    // Click event
    map.off('click', COMMUNITY_FILL_ID, clickFunction);
    if (enableSelection) {
      clickFunction = (e: any) => {
        if (!landscape) {
          return
        }
        const hit = e.features.find((feature: any) => feature.properties.landscape_id === landscape.id)
        if (hit) {
          onSelected(
            {
              id: hit.properties['community_id'],
              name: hit.properties['community_name'],
              latitude: e.lngLat.lat,
              longitude: e.lngLat.lng,
              featureId: hit.properties.id
            }
          )
          map.setFilter(
            (COMMUNITY_ID + '-highlight'), ["==", "id", hit.properties.id]
          );
        }
      }
      map.on('click', COMMUNITY_FILL_ID, clickFunction);
    }
    
    // Create effect
    map.off('mousemove', COMMUNITY_ID, hoverFunction);
    if (enableSelection) {
      hoverFunction = function (e) {
        if (e.features.length <= 0) {
          return
        }
        const hit = e.features.find(feature => feature.properties.landscape_id === landscape.id)
        if (hit) {
          map.getCanvas().style.cursor = 'pointer';
        } else {
          map.getCanvas().style.cursor = '';
        }
      }
      map.on('mousemove', COMMUNITY_ID, hoverFunction);
    }

    if (featureIds && featureIds.length > 0) {
      map.setFilter(
        (COMMUNITY_ID + '-highlight'), ["in", "id", ...featureIds]
      );
    } else {
      map.setFilter(
        (COMMUNITY_ID + '-highlight'), ["==", "id", '']
      );
    }

    return () => {
      map.off('click', COMMUNITY_FILL_ID, clickFunction);
      map.off('mousemove', COMMUNITY_ID, hoverFunction);
    }
      
  }, [map, landscape, featureIds, enableSelection])

  return <></>
}
