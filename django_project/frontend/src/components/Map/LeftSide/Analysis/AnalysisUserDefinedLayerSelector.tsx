import React, { useEffect, useState } from 'react';
import {Geometry} from "geojson";
import maplibregl from "maplibre-gl";
import { Layer } from '../../../../store/layerSlice';
import { useMap } from '../../../../MapContext';
import { removeSource } from '../../utils';

const USER_DEFINED_LAYER_ID = 'user-defined-analysis-layer';
const DEFAULT_FALLBACK_FEATURE_ID = 'id';
const DEFAULT_FEATURE_NAME = 'name';
const DEFAULT_EMPTY_NAME = 'User Defined Geometry';
const DEFAULT_EMPTY_ID = 'User Defined ID';

interface Props {
  layers: Layer[];
  enableSelection: boolean;
  onSelected: (geometry: Geometry, latitude: number, longitude: number, userDefinedFeatureName: string, userDefinedFeatureId: string) => void;
  featureId?: string;
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

const getIdValue = (value: string) => {
  if (/^-?\d+$/.test(value)) {
    return parseInt(value);
  }
  return value;
}


/** User defined layer selector. */
export default function AnalysisUserDefinedLayerSelector(
  { layers, enableSelection, onSelected, featureId }: Props
) {
  const { map } = useMap();
  const [attributeId, setAttributeId] = useState<LayerAttributeIdDict>({})
  useEffect(() => {
    try {
      if (!map) {
        return
      }
      const userDefinedLayers = layers.filter(layer => layer.group === 'user-defined')
      if (!userDefinedLayers || userDefinedLayers.length === 0) {
        return
      }
      let _atrribs: LayerAttributeIdDict = {}
      userDefinedLayers.forEach(layer => {
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
      layers.filter(layer => layer.group === 'user-defined').forEach(layer => {
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
      const originalLayerId = layerId.replace('-fill', '')
      const attrId = originalLayerId in attributeId ? attributeId[originalLayerId]: DEFAULT_FALLBACK_FEATURE_ID
      if (enableSelection) {
        // Click event
        let clickFunction: ClickFunction = (e: maplibregl.MapMouseEvent) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [layerId],
          });
          if (features.length > 0) {
            // get first feature
            const feature = features[0]
            if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
              const featureName = feature.properties[DEFAULT_FEATURE_NAME] !== undefined ? feature.properties[DEFAULT_FEATURE_NAME] : DEFAULT_EMPTY_NAME
              const featureId = feature.properties[attrId] !== undefined ? feature.properties[attrId] : DEFAULT_EMPTY_ID
              onSelected(feature.geometry, e.lngLat.lat, e.lngLat.lng, featureName, originalLayerId+','+featureId)
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

      if (featureId) {
        const splits = featureId.split(',')
        if (splits.length === 2 && splits[1] !== DEFAULT_EMPTY_ID && splits[0] === originalLayerId) {
          map.setFilter(
            originalLayerId + '-highlight',
            ["==", attrId, getIdValue(splits[1].trim())]
          )
        } else if (splits.length === 2 && splits[0] !== originalLayerId) {
          map.setFilter(
            originalLayerId + '-highlight',
            ["==", attrId, '']
          )
        }
      } else {
        map.setFilter(
          originalLayerId + '-highlight',
          ["==", attrId, '']
        )
      }
    })

    return () => {
      if (!map) {
        return
      }

      removeEventListener(map, layerDict)
      layerDict = []
    }
  }, [map, attributeId, featureId, enableSelection])

  return <></>
}
