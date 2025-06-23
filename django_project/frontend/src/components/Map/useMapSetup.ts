import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import maplibregl from 'maplibre-gl';
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchBaseMaps } from '../../store/baseMapSlice';
import { fetchMapConfig } from '../../store/mapConfigSlice';
import { selectIsLoggedIn } from "../../store/authSlice";
import { Layer } from '../../store/layerSlice';
import { COMMUNITY_ID } from "./DataTypes";
import { BasemapControl, LegendControl } from "./control";
import { doRenderLayer, doRemoveLayer } from "./utils";

const COMMUNITY_FILL_ID = COMMUNITY_ID + '-fill';

export const useMapSetup = (
    ref: React.ForwardedRef<any>,
    mapContainerId: string,
    mapRef: React.MutableRefObject<maplibregl.Map | null>,
    isMapLoaded: boolean,
    setIsMapLoaded: React.Dispatch<React.SetStateAction<boolean>>,
    baseMapRef: React.MutableRefObject<any>,
    legendRef: React.MutableRefObject<any> | null,
    initialBound: [number, number, number, number] | null = null,
    interactive: boolean = true,
    initialZoom: number = 1,
    initialBoundsPadding: number = null
) => {
    const dispatch = useDispatch<AppDispatch>();
    const { baseMaps } = useSelector((state: RootState) => state.baseMap);
    const { mapConfig } = useSelector((state: RootState) => state.mapConfig);
    const isAuthenticated = useSelector(selectIsLoggedIn);
    
    // Add a ref to track the basemap control
    const basemapControlRef = useRef<BasemapControl | null>(null);

    /** Fetch the initial data **/
    useEffect(() => {
        dispatch(fetchBaseMaps())
        dispatch(fetchMapConfig())
    }, []);

    /** Create map **/
    useEffect(() => {
        const map = mapRef.current;
        if (map) {
            return;
        }

        const _map = new maplibregl.Map({
            container: mapContainerId,
            style: {
                version: 8,
                sources: {},
                layers: [],
                glyphs: "/static/fonts/{fontstack}/{range}.pbf"
            },
            center: [0, 0],
            zoom: initialZoom,
            interactive: interactive
        });

        _map.once("load", () => {
            mapRef.current = _map;
            setIsMapLoaded(true);
        })

        if (legendRef) {
            _map.addControl(new LegendControl(legendRef), 'top-left');
        }

        // Add navigation control if required
        if (interactive) {
            _map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
        }

        // Clean up the map on component unmount
        return () => {
            // avoid removing map synchronously
            setTimeout(() => {
                _map.remove();
                mapRef.current = null;
                setIsMapLoaded(false);
            }, 0)
        };
    }, []);

    /** Handle basemap control - only add when both map and baseMaps are ready **/
    useEffect(() => {
        const map = mapRef.current;
        if (!isMapLoaded || !map || baseMaps.length === 0) {
            return;
        }

        // Only add if we haven't added it yet
        if (!basemapControlRef.current) {
            const basemapControl = new BasemapControl(baseMaps, baseMapRef);
            basemapControlRef.current = basemapControl;
            map.addControl(basemapControl, 'bottom-left');
            
            // Set default basemap
            baseMapRef?.current?.setBaseMapLayer(baseMaps[0]);
        }
    }, [isMapLoaded, baseMaps]);



    /** Handle map config changes **/
    useEffect(() => {
        if (!isMapLoaded || !mapRef.current) {
            return;
        }

        const map = mapRef.current;
        if (initialBound != null) {
            let config = {
              pitch: 0,
              bearing: 0,
              padding: 0
            }
            if (initialBoundsPadding) {
                config.padding = initialBoundsPadding;
            }

            map.fitBounds(initialBound, config)
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
    }, [isMapLoaded, mapConfig])

    /** Attach handler to render and hide layer **/
    useImperativeHandle(ref, () => ({
        /** Render layer */
        renderLayer(layer: Layer) {
            doRenderLayer(mapRef, layer, isAuthenticated ? COMMUNITY_ID : null, legendRef)
        },
        /** Hide layer */
        removeLayer(layer: Layer, isRemoveSource?: boolean) {
            doRemoveLayer(mapRef, layer, isRemoveSource, legendRef)
        }
    }));

    /** Render Communities Landscape */
    useEffect(() => {
        try {
          const map = mapRef.current;
          if (!isMapLoaded || !map) {
            return
          }
          // render community layer
          map.addSource(
            COMMUNITY_ID, {
              type: 'vector',
              tiles: [
                document.location.origin + '/frontend-api/landscapes/vector_tile/{z}/{x}/{y}/'
              ]
            }
          );
          map.addLayer({
            'id': COMMUNITY_ID,
            'type': 'line',
            'source': COMMUNITY_ID,
            'source-layer': 'default',
            'paint': {
              'line-color': '#777777',
              'line-width': 1
            }
          });
          map.addLayer({
            'id': COMMUNITY_ID + '-community',
            'type': 'line',
            'source': COMMUNITY_ID,
            'source-layer': 'default',
            'paint': {
              'line-color': '#0B6623',
              'line-width': 2
            },
            "filter": ["==", "landscape_id", 0]
          });
          map.addLayer({
            'id': COMMUNITY_ID + '-highlight',
            'type': 'fill',
            'source': COMMUNITY_ID,
            'source-layer': 'default',
            'paint': {
              'fill-color': '#0B6623',
              'fill-opacity': 0.5
            },
            "filter": ["==", "landscape_id", 0]
          });
          map.addLayer({
            'id': COMMUNITY_FILL_ID,
            'type': 'fill',
            'source': COMMUNITY_ID,
            'source-layer': 'default',
            'paint': {
              'fill-color': '#777777',
              'fill-opacity': 0
            }
          });
        } catch (err) {
          console.log(err)
        }
    }, [isMapLoaded])

};
