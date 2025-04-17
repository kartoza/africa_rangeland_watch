import maplibregl from "maplibre-gl";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { BaseMap } from "../../../store/baseMapSlice";
import { BasemapSelector } from "./Basemaps";
import { removeSource } from "../utils";
import { Legend } from "./Legend";


class CustomControl {
  protected map: maplibregl.Map;
  private container: HTMLDivElement;
  private root: Root;

  onRender(): React.ReactNode {
    return null
  }

  clasName(): string {
    return null
  }

  onAdd(map: maplibregl.Map) {
    this.map = map;

    // Create a container for the control
    this.container = document.createElement('div');
    this.container.className = this.clasName();
    this.root = createRoot(this.container);
    this.root.render(this.onRender());
    return this.container;
  }

  onRemove() {
    this.root.unmount();
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
}

/** Basemap control class */
export class BasemapControl extends CustomControl {
  public static ID = 'basemap'
  private baseMaps: BaseMap[];
  private ref: React.LegacyRef<unknown> | undefined;

  constructor(baseMaps: BaseMap[], ref: React.LegacyRef<unknown>) {
    super();
    this.baseMaps = baseMaps;
    this.ref = ref;
  }

  clasName(): string {
    return 'maplibre-basemap-control'
  }

  onRender(): React.ReactNode {
    return <BasemapSelector
      baseMaps={this.baseMaps}
      onSelected={(basemap: BaseMap) => {
        removeSource(this.map, BasemapControl.ID)
        this.map.addSource(BasemapControl.ID, {
            type: "raster",
            tiles: [basemap.url],
            tileSize: 256
          }
        )
        this.map.addLayer(
          {
            id: BasemapControl.ID,
            source: BasemapControl.ID,
            type: "raster"
          },
          this.map.getStyle().layers[0]?.id
        )
      }}
      ref={this.ref}
    />
  }
}

/** Basemap control class */
export class LegendControl extends CustomControl {
  private ref: React.LegacyRef<unknown> | undefined;

  constructor(ref: React.LegacyRef<unknown>) {
    super();
    this.ref = ref;
  }

  clasName(): string {
    return 'maplibre-legend-control'
  }

  onRender(): React.ReactNode {
    return <Legend ref={this.ref} map={this.map}/>
  }
}