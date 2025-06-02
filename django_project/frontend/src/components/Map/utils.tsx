import maplibregl, { FillLayerSpecification } from 'maplibre-gl';
import { Layer } from '../../store/layerSlice';

/** Return if layer exist or not */
export const hasLayer = (map: maplibregl.Map, id: string) => {
  if (!map) {
    return false
  }
  return typeof map.getLayer(id) !== 'undefined'
}

/** Return if layer exist or not */
export const removeLayer = (map: maplibregl.Map, id: string) => {
  if (hasLayer(map, id)) {
    map.removeLayer(id)
  }
}

/** Return if source exist or not */
export const hasSource = (map: maplibregl.Map, id: string) => {
  return typeof map.getSource(id) !== 'undefined'
}

/** Return if source exist or not */
export const removeSource = (map: maplibregl.Map, id: string) => {
  map.getStyle().layers.filter(
    (layer: maplibregl.LayerSpecification) => {
      return layer.type !== "background" && layer?.source === id
    }
  ).forEach(layer => {
    removeLayer(map, layer.id)
  })

  if (typeof map.getSource(id) !== 'undefined') {
    map.removeSource(id);
  }
}

export const doRenderLayer = (mapRef: React.MutableRefObject<maplibregl.Map | null>, layer: Layer, layerIdBefore: string, legendRef?: React.MutableRefObject<any>) => {
  if (mapRef.current) {
    const map = mapRef.current;
    const ID = `layer-${layer.id}`
    removeLayer(map, ID)
    if (layer.type === 'vector') {
      if (!hasSource(map, ID)) {
        if (layer.url.startsWith('pmtiles://')) {
          map.addSource(ID, {
              type: "vector",
              url: `${layer.url}`
            }
          )
        } else {
          map.addSource(ID, {
              type: "vector",
              tiles: [
                `${layer.url}`
              ]
            }
          )
        }
      }
      let layerStyle: FillLayerSpecification = {
        "source": ID,
        "id": ID,
        "type": "fill",
        "paint": {
          "fill-color": "#ff7800",
          "fill-opacity": 0.8
        },
        "filter": [
          "==",
          "$type",
          "Polygon"
        ],
        "source-layer": "default"
      }
      if (layer.style) {
        // @ts-ignore
        layerStyle = { ...layer.style['layers'][0] }
        layerStyle['source'] = ID
        layerStyle['id'] = ID
      }
      map.addLayer(layerStyle, layerIdBefore)
    } else if (layer.type === "raster") {
      if (!hasSource(map, ID)) {
        if (layer.url.startsWith('cog://')) {
          map.addSource(ID, {
              type: "raster",
              url: `${layer.url}`,
              tileSize: 256
            }
          )
        } else {
          map.addSource(ID, {
              type: "raster",
              tiles: [layer.url],
              tileSize: 256
            }
          )
        }
      }
      map.addLayer(
        {
          id: ID,
          source: ID,
          type: "raster"
        },
        layerIdBefore
      )
      if (legendRef) {
        legendRef?.current?.renderLayer(layer)
      }
    }
  }
}

export const doRemoveLayer = (mapRef: React.MutableRefObject<maplibregl.Map | null>, layer: Layer, isRemoveSource?: boolean, legendRef?: React.MutableRefObject<any>) => {
  const map = mapRef.current;
  if (map) {
    const ID = `layer-${layer.id}`
    if (isRemoveSource) {
      removeSource(map, ID)
    } else {
      removeLayer(map, ID)
    }

    if (legendRef) {
      legendRef?.current?.removeLayer(layer)
    }
  }
}
