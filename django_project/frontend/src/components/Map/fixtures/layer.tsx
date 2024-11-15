/**
 * Layer fixtures
 * TODO:
 *   We will remove this and use API
 */
import { Layer } from "../DataTypes";

export const layerData: Layer[] = [
  {
    id: 1,
    name: "EVI 2015-2020",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/a2523925be752a0ace08fb6bab4ac62a-ef26184b1d7898b8fec159ca4d09a99c/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "baseline",
    metadata: {
      minValue: 0,
      maxValue: 1,
      unit: "",
      colors: ["#FFFFFF", "#CE7E45", "#DF923D", "#F1B555", "#FCD163", "#99B718", "#74A901", "#66A000", "#529400", "#3E8601", "#207401", "#056201", "#004C00", "#023B01", "#012E01", "#011D01", "#011301"],
    }
  },
  {
    id: 2,
    name: "NDVI 2015-2020",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/78e8d2faf871ae1ac693c30aa30a40a2-988893d19c05e301628736069e64e267/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "baseline",
    metadata: {
      minValue: 0,
      maxValue: 1,
      unit: "",
      colors: ["#FFFFFF", "#CE7E45", "#DF923D", "#F1B555", "#FCD163", "#99B718", "#74A901", "#66A000", "#529400", "#3E8601", "#207401", "#056201", "#004C00", "#023B01", "#012E01", "#011D01", "#011301"],
    }
  },
  {
    id: 3,
    name: "Bare ground cover 2015-2020",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/140395ec7320386e9711ebde4003c0f0-5cf15da34ebf3385a863886a6e3b46cf/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "baseline",
    metadata: {
      minValue: 0,
      maxValue: 60,
      unit: "%",
      colors: ["#FFFFCC", "#FFEDA0", "#FED976", "#FEB24C", "#FD8D3C", "#FC4E2A", "#E31A1C", "#B10026"],
    }
  },
  {
    id: 4,
    name: "Grass cover 2015-2020",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/b442889b6e6196a1e8aa5ee9e3b40ce2-9bb9bdbbe8ab6b001f50c39866465ee0/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "baseline",
    metadata: {
      minValue: 0,
      maxValue: 60,
      unit: "%",
      colors: ["#FFFFD9", "#EDF8B1", "#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8", "#0C2C84"],
    }
  },
  {
    id: 5,
    name: "Woody plant cover 2015-2020",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/afdc6df27cc8cf9f82aca753e30c0588-0ccd5f48f42b1ca53c3b634dfb8e0a35/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "baseline",
    metadata: {
      minValue: 0,
      maxValue: 60,
      unit: "%",
      colors: ["#FFFFE5", "#F7FCB9", "#D9F0A3", "#ADDD8E", "#78C679", "#41AB5D", "#238443", "#005A32"],
    }
  },
  {
    id: 6,
    name: "Grazing capacity 2015-2020",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/79a6f43d750019abbe4d494ef8f59a5c-cd3d247a19aa9bbcd2bde159a43c76aa/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "baseline",
    metadata: {
      minValue: 0,
      maxValue: 0.3,
      unit: "LSU/ha",
      colors: ["#440154", "#472878", "#3E4A89", "#31688E", "#25838E", "#1E9E89", "#35B779", "#6CCE59", "#B5DE2C", "#FDE725"],
    }
  },
  {
    id: 7,
    name: "Fire frequency 2000-2020",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/9f48215836702eae2d704d2969f14a08-d5ade5ee98c6188f85d6c152808880c1/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "baseline",
    metadata: {
      minValue: 0,
      maxValue: 1,
      unit: "fires/year",
      colors: ["#fff600", "#ff9d00", "#ff0000", "#ff07cd"],
    }
  },
  {
    id: 8,
    name: "Soil carbon 1984-2019",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/9d55a572d9adc08799d5e024acf7dea1-627869c3939837313075800707b54757/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "baseline",
    metadata: {
      minValue: 0,
      maxValue: 15,
      unit: "kg/m2",
      colors: ["#fffcb9", "#fcd27d", "#b6bb5c", "#498939", "#0f747b", "#045375", "#3c0f73"],
    }
  },
  {
    id: 9,
    name: "Soil carbon change 1984-2019",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/8baad555a221f5714fe6b4ef55b0c97b-1525b46d5e1f4abf2003bfb522789bb8/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "baseline",
    metadata: {
      minValue: 0,
      maxValue: 0.5,
      unit: "kg/m2",
      colors: ["#B35806", "#E08214", "#FDB863", "#FEE0B6", "#D8DAEB", "#B2ABD2", "#8073AC", "#542788"],
    }
  },
  {
    id: 10,
    name: "EVI",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/996b5e2d853df74b900997dc260c7368-3866cd61a0c8cdd9b103ab01d70c28b2/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "near-real-time",
    metadata: {
      minValue: 0,
      maxValue: 1,
      unit: "",
      colors: ["#FFFFFF", "#CE7E45", "#DF923D", "#F1B555", "#FCD163", "#99B718", "#74A901", "#66A000", "#529400", "#3E8601", "#207401", "#056201", "#004C00", "#023B01", "#012E01", "#011D01", "#011301"],
    }
  },
  {
    id: 11,
    name: "NDVI",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/273275f84a580af17930754c8d02af5e-5f44a8d79628f3c1e482f8ce22664956/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "near-real-time",
    metadata: {
      minValue: 0,
      maxValue: 1,
      unit: "",
      colors: ["#FFFFFF", "#CE7E45", "#DF923D", "#F1B555", "#FCD163", "#99B718", "#74A901", "#66A000", "#529400", "#3E8601", "#207401", "#056201", "#004C00", "#023B01", "#012E01", "#011D01", "#011301"],
    }
  },
  {
    id: 12,
    name: "Bare ground cover",
    url: "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/maps/791b350dafa05ace0d15beebe48ea7d7-22b3f473692d97a0b2cd13a55cd89198/tiles/{z}/{x}/{y}",
    type: "raster",
    group: "near-real-time",
    metadata: {
      minValue: 0,
      maxValue: 60,
      unit: "%",
      colors: ["#FFFFCC", "#FFEDA0", "#FED976", "#FEB24C", "#FD8D3C", "#FC4E2A", "#E31A1C", "#B10026"],
    }
  }
]