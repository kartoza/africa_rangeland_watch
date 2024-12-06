import React, { useEffect, useState } from 'react';
import maplibregl from "maplibre-gl";
import { COMMUNITY_ID } from "../../DataTypes";
import { Community, Landscape } from "../../../../store/landscapeSlice";

const COMMUNITY_FILL_ID = COMMUNITY_ID + '-fill';

interface Props {
  landscape: Landscape;
  onSelected: (value: Community) => void;
}

let hoverFunction: (ev: maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
} & Object) => void = null
let clickFunction: (ev: maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
} & Object) => void = null

/** Landscape geometry selector. */
export default function AnalysisLandscapeGeometrySelector(
  { landscape, onSelected }: Props
) {
  const [map, setMap] = useState<maplibregl.Map>(null);

  useEffect(() => {
    try {
      window.map.getStyle()
      const _map = window.map
      setMap(_map)

      // render community layer
      _map.addSource(
        COMMUNITY_ID, {
          type: 'vector',
          tiles: [
            document.location.origin + '/frontend-api/landscapes/vector_tile/{z}/{x}/{y}/'
          ]
        }
      );
      _map.addLayer({
        'id': COMMUNITY_ID,
        'type': 'line',
        'source': COMMUNITY_ID,
        'source-layer': 'default',
        'paint': {
          'line-color': '#777777',
          'line-width': 1
        }
      });
      _map.addLayer({
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
      _map.addLayer({
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
      _map.addLayer({
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
  }, [window.map])

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
    map.on('click', COMMUNITY_FILL_ID, (e: any) => {
      if (!landscape) {
        return
      }
      const hit = e.features.find((feature: any) => feature.properties.landscape_id === landscape.id)
      if (hit) {
        onSelected(
          {
            id: hit.properties['community_id'],
            name: hit.properties['community_name']
          }
        )
        map.setFilter(
          (COMMUNITY_ID + '-highlight'), ["==", "id", hit.properties.id]
        );
      }
    });

    // Create effect
    map.off('mousemove', COMMUNITY_FILL_ID, hoverFunction);
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


  }, [map, landscape])

  return <></>
}

