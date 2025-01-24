import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import maplibregl, { FillLayerSpecification } from 'maplibre-gl';
import { Box } from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { BasemapControl, LegendControl } from "./control";
import { hasSource, removeLayer, removeSource } from "./utils";
import { fetchBaseMaps } from '../../store/baseMapSlice';
import { fetchMapConfig } from '../../store/mapConfigSlice';
import { Layer, setSelectedNrtLayer } from '../../store/layerSlice';
import { selectIsLoggedIn } from "../../store/authSlice";
import { COMMUNITY_ID } from "./DataTypes";
import { useMap } from '../../MapContext';

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

interface Props {

}

/**
 * MapLibre component.
 */
export const MapLibre = forwardRef(
  (props: Props, ref
  ) => {
    const dispatch = useDispatch<AppDispatch>();
    const legendRef = useRef(null);
    const baseMapRef = useRef(null);
    const { map, setMap } = useMap();
    const { mapConfig } = useSelector((state: RootState) => state.mapConfig);
    const { baseMaps } = useSelector((state: RootState) => state.baseMap);
    const { selected: selectedLandscape } = useSelector((state: RootState) => state.landscape);
    const { selectedNrt } = useSelector((state: RootState) => state.layer);
    const isAuthenticated = useSelector(selectIsLoggedIn);

    const doRenderLayer = (layer: Layer) => {
      if (map) {
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
          map.addLayer(layerStyle, isAuthenticated ? COMMUNITY_ID : null)
        } else if (layer.type === "raster") {
          if (!hasSource(map, ID)) {
            map.addSource(ID, {
                type: "raster",
                tiles: [layer.url],
                tileSize: 256
              }
            )
          }
          map.addLayer(
            {
              id: ID,
              source: ID,
              type: "raster"
            },
            isAuthenticated ? COMMUNITY_ID : null
          )
          legendRef?.current?.renderLayer(layer)
        }
      }
    }

    const doRemoveLayer = (layer: Layer, isRemoveSource?: boolean) => {
      if (map) {
        const ID = `layer-${layer.id}`
        if (isRemoveSource) {
          removeSource(map, ID)
        } else {
          removeLayer(map, ID)
        }
        legendRef?.current?.removeLayer(layer)
      }
    }

    //  Fetch the data here
    useEffect(() => {
      dispatch(fetchBaseMaps())
      dispatch(fetchMapConfig())
    }, [dispatch]);

    // Toggle
    useImperativeHandle(ref, () => ({
      /** Render layer */
      renderLayer(layer: Layer) {
        doRenderLayer(layer)
      },
      /** Hide layer */
      removeLayer(layer: Layer, isRemoveSource?: boolean) {
        doRemoveLayer(layer, isRemoveSource)
      }
    }));

    /** First initiate */
    useEffect(() => {
      if (map) {
        return;
      }

      const _map = new maplibregl.Map({
        container: 'map',
        style: {
          version: 8,
          sources: {},
          layers: [],
          glyphs: "/static/fonts/{fontstack}/{range}.pbf"
        },
        center: [0, 0],
        zoom: 1
      });

      _map.once("load", () => {
        setMap(_map)
      })
      _map.addControl(new BasemapControl(baseMaps, baseMapRef), 'bottom-left');
      _map.addControl(new LegendControl(legendRef), 'top-left');
      _map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

      // Clean up the map on component unmount
      return () => {
          // avoid removing map synchronously
          setTimeout(() => {
            _map.remove();
            setMap(null)
          }, 0)
      };
    }, [setMap]);

    useEffect(() => {
      if (!map) {
        return;
      }
      if (!mapConfig) {
        return;
      }

      map.fitBounds(mapConfig.initial_bound,
        {
          pitch: 0,
          bearing: 0
        }
      )
    }, [map, mapConfig])

    useEffect(() => {
      if (!map) {
        return;
      }
      if (baseMaps.length == 0) {
        return;
      }

      // render default base map
      baseMapRef?.current?.setBaseMapLayer(baseMaps[0])
    }, [map, baseMaps])


    // zoom when landscape is selected
    useEffect(() => {
      if (!map) {
        return;
      }
      if (!selectedLandscape) {
        if (selectedNrt) {
          // remove previous NRT layer
          doRemoveLayer(selectedNrt)
          dispatch(setSelectedNrtLayer(null))
        }
        return;
      }

      if (selectedNrt) {
        // remove previous NRT layer
        const ID = `layer-${selectedNrt.id}`
        removeSource(map, ID)
      }

      map.fitBounds(new maplibregl.LngLatBounds(selectedLandscape.bbox as [number, number, number, number]),
        {
          pitch: 0,
          bearing: 0
        }
      )

      if (selectedNrt && selectedLandscape.urls[selectedNrt.id] !== undefined) {
        // render NRT layer from landscape url
        let _copyLayer = { ...selectedNrt }
        _copyLayer.url = selectedLandscape.urls[selectedNrt.id]
        doRenderLayer(_copyLayer)
      }
    }, [selectedLandscape, selectedNrt])

    return (
      <Box id="map" flexGrow={1}/>
    )
  }
)
