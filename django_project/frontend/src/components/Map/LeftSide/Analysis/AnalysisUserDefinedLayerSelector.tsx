import React, { useEffect, useState } from 'react';
import {FeatureCollection} from "geojson";
import maplibregl from "maplibre-gl";
import { Layer } from '../../../../store/layerSlice';
import { useMap } from '../../../../MapContext';
import { removeSource } from '../../utils';

const USER_DEFINED_LAYER_ID = 'user-defined-analysis-layer';
const DEFAULT_FALLBACK_FEATURE_ID = 'id';

interface Props {
  layers: Layer[];
  enableSelection: boolean;
  onSelected: (geometry: FeatureCollection) => void;
}

type LayerAttributeIdDict = { [key: string]: string };

type HoverFunction = (ev: maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
} & Object) => void;
type ClickFunction = (ev: maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
} & Object) => void;

interface LayerDict {
  hoverFunc: HoverFunction;
  clickFunc: ClickFunction;
  layerId: string;
}

let layerDict: LayerDict[] = [];

const renderLayer = (map: maplibregl.Map, layer: Layer) => {
    const ID = `${USER_DEFINED_LAYER_ID}-${layer.id}`
    map.addSource(ID, {
        type: "vector",
        url: `${layer.url}`,
        promoteId: layer.metadata?.attributeId ? layer.metadata?.attributeId : DEFAULT_FALLBACK_FEATURE_ID
      }
    )
    map.addLayer({
        'id': ID,
        'type': 'line',
        'source': ID,
        'source-layer': 'default',
        'paint': {
            'line-color': '#0B6623',
            'line-width': 2
        }
    });
    map.addLayer({
        'id': ID + '-highlight',
        'type': 'fill',
        'source': ID,
        'source-layer': 'default',
        'paint': {
            'fill-color': '#0B6623',
            'fill-opacity': 0.5
        },
        "filter": ["==", "id", 0]
    });
    map.addLayer({
        'id': ID + '-fill',
        'type': 'fill',
        'source': ID,
        'source-layer': 'default',
        'paint': {
            'fill-color': '#777777',
            'fill-opacity': 0
        }
    });

    // add on click
}

const removeLayer = (map: maplibregl.Map, layer: Layer) => {
    const ID = `${USER_DEFINED_LAYER_ID}-${layer.id}`
    removeSource(map, ID)
}

const removeEventListener = (map: maplibregl.Map, dict: LayerDict[]) => {
  dict.forEach(layer => {
    map.off('click', layer.layerId, layer.clickFunc);
    map.off('mousemove', layer.layerId.replace('-fill', ''), layer.hoverFunc);
  })
}

/** User defined layer selector. */
export default function AnalysisUserDefinedLayerSelector(
  { layers, enableSelection, onSelected }: Props
) {
  const { map } = useMap();
  const [attributeId, setAttributeId] = useState<LayerAttributeIdDict>({})

  useEffect(() => {
    try {
      if (!map) {
        return
      }
      if (!layers || layers.length === 0) {
        return
      }
      let _atrribs: LayerAttributeIdDict = {}
      layers.forEach(layer => {
        renderLayer(map, layer)
        _atrribs[layer.id] = layer.metadata?.attributeId ? layer.metadata?.attributeId : DEFAULT_FALLBACK_FEATURE_ID
      });
      setAttributeId(_atrribs)
    } catch (err) {
        console.log(err)
    }
    return () => {
      if (!map) {
        return
      }
      layers.forEach(layer => {
        removeLayer(map, layer);
      });
    }
  }, [map, layers])

  useEffect(() => {
    if (!map) {
      return
    }
    const userDefinedLayers = map.getStyle().layers
      .filter(layer => layer.id.startsWith(`${USER_DEFINED_LAYER_ID}-`) && layer.id.endsWith('-fill'))
      .map(layer => layer.id)
    
    if (userDefinedLayers.length === 0) {
      return
    }

    removeEventListener(map, layerDict)
    layerDict = []
    userDefinedLayers.forEach(layerId => {
      if (enableSelection) {
        // Click event
        let clickFunction: ClickFunction = (e: any) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [layerId],
          });
          if (features.length > 0) {
            // get first feature
            const feature = features[0]
            if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
              // TODO: call on selected
              console.log("Clicked Polygon from Layer:", feature, feature.layer.id, feature.geometry.coordinates);
            }
            const originalLayerId = layerId.replace('-fill', '')
            const attrId = originalLayerId in attributeId ? attributeId[originalLayerId]: DEFAULT_FALLBACK_FEATURE_ID
            if (feature.properties[attrId] !== undefined) {
              map.setFilter(
                originalLayerId + '-highlight',
                ["==", attrId, feature.properties[attrId]]
              )
            }
          }
        }
        map.on('click', layerId, clickFunction);

        // Create effect
        let hoverFunction: HoverFunction = function (e) {
          if (e.features.length <= 0) {
            return
          }
          map.getCanvas().style.cursor = 'pointer';
        }
        map.on('mousemove', layerId.replace('-fill', ''), hoverFunction);

        layerDict.push({
          hoverFunc: hoverFunction,
          clickFunc: clickFunction,
          layerId: layerId
        })
      }
    })

    return () => {
      if (!map) {
        return
      }

      removeEventListener(map, layerDict)
      layerDict = []
    }
  }, [map, attributeId, enableSelection])

  return <></>
}
