import maplibregl from 'maplibre-gl';


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
