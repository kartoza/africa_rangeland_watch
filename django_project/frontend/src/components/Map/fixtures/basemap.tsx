/**
 * Basemap fixture
 * TODO:
 *   We will remove this and use API
 */
import { Basemap } from "../DataTypes";

export const basemapData: Basemap[] = [
  {
    id: 1,
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    thumbnail: ""
  },
  {
    id: 2,
    name: "Stamen Watercolor",
    url: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg",
    thumbnail: ""
  }
]