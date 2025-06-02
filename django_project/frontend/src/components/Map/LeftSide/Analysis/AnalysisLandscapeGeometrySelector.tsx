import React, { useEffect } from 'react';
import maplibregl from "maplibre-gl";
import { COMMUNITY_ID } from "../../DataTypes";
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
  const { mapRef, isMapLoaded } = useMap();

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map) {
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
      
  }, [isMapLoaded, landscape, featureIds, enableSelection])

  return <></>
}
