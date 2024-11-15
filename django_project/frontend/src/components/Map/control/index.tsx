import maplibregl from "maplibre-gl";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import BasemapSelector from "./Basemaps";
import { removeSource } from "../utils";

/**
 * Basemap control class
 */
const ID = 'basemap'

export class BasemapControl {
  private map: maplibregl.Map;
  private container: HTMLDivElement;
  private root: Root;

  onAdd(map: maplibregl.Map) {
    this.map = map;

    // Create a container for the control
    this.container = document.createElement('div');
    this.container.className = 'maplibre-basemap-control';
    this.root = createRoot(this.container);
    this.root.render(
      <BasemapSelector
        onSelected={(basemap) => {
          removeSource(map, ID)
          map.addSource(ID, {
              type: "raster",
              tiles: [basemap.url],
              tileSize: 256
            }
          )
          map.addLayer(
            {
              id: ID,
              source: ID,
              type: "raster"
            },
            map.getStyle().layers[0]?.id
          )
        }}
      />
    );

    return this.container;
  }

  onRemove() {
    this.root.unmount();
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}