import React, {
  forwardRef,
  useEffect,
  useRef,
  useState
} from 'react';
import maplibregl, { FilterSpecification } from 'maplibre-gl';
import {FeatureCollection} from "geojson";
import { Box } from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { removeSource, doRenderLayer, doRemoveLayer, hasSource } from "./utils";
import { Layer, setSelectedNrtLayer } from '../../store/layerSlice';
import { selectIsLoggedIn } from "../../store/authSlice";
import { COMMUNITY_ID } from "./DataTypes";
import { useMap } from '../../MapContext';
import { useMapSetup } from './useMapSetup';
import EarthRanger from "../Map/EarthRanger";

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

interface Props {

}

interface ReusableMapProps {
  mapContainerId: string;
  initialBound: [number, number, number, number];
  layer?: Layer | null;
  selectedCommmunityIds?: string[];
  referenceLayer?: FeatureCollection | null;
  referenceLayerId?: string;
  config?: any;
}

const RASTER_LAYER_PADDING = 70;
const REFERENCE_LAYER_ID = 'reference-layer';

/**
 * MapLibre component.
 */
export const MapLibre = forwardRef(
  (props: Props, ref
  ) => {
    const dispatch = useDispatch<AppDispatch>();
    const legendRef = useRef(null);
    const baseMapRef = useRef(null);
    const { mapRef, isMapLoaded, setIsMapLoaded } = useMap();
    const { selected: selectedLandscape } = useSelector((state: RootState) => state.landscape);
    const { selectedNrt } = useSelector((state: RootState) => state.layer);
    const isAuthenticated = useSelector(selectIsLoggedIn);

    useMapSetup(
      ref,
      'map',
      mapRef,
      isMapLoaded,
      setIsMapLoaded,
      baseMapRef,
      legendRef,
      null
    );

    // zoom when landscape is selected
    useEffect(() => {
      if (!isMapLoaded || !mapRef.current) {
        return;
      }
      const map = mapRef.current;
      if (!selectedLandscape) {
        if (selectedNrt) {
          // remove previous NRT layer
          doRemoveLayer(mapRef, selectedNrt, false, legendRef)
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
        doRenderLayer(mapRef, _copyLayer, isAuthenticated ? COMMUNITY_ID : null, legendRef)
      }
    }, [selectedLandscape, selectedNrt])

    return (
      <Box id="map" flexGrow={1}/>
    )
  }
)


/**
 * Reusable Maplibre component
  */
export const ReusableMapLibre = forwardRef(
  (props: ReusableMapProps, ref) => {
    const baseMapRef = useRef(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    useMapSetup(
      ref,
      props.mapContainerId,
      mapRef,
      isMapLoaded,
      setIsMapLoaded,
      baseMapRef,
      null,
      props.initialBound,
      true,
      1,
      RASTER_LAYER_PADDING
    );

    // render layer when map is loaded
    useEffect(() => {
      if (!isMapLoaded || !mapRef.current) {
        return;
      }
      if (!props.layer) {
        return;
      }
      doRenderLayer(mapRef, props.layer, COMMUNITY_ID, null)

    }, [isMapLoaded, props.layer])

    // render selected community layers
    useEffect(() => {
      if (!isMapLoaded || !mapRef.current) {
        return;
      }
      const map = mapRef.current;
      if (!props.selectedCommmunityIds || props.selectedCommmunityIds.length === 0) {
        map.setFilter(
          (COMMUNITY_ID + '-community'), ["==", "id", '']
        )
      } else {
        map.setFilter(
          (COMMUNITY_ID + '-community'), ["in", "id", ...props.selectedCommmunityIds]
        )
      }
    }, [isMapLoaded, props.selectedCommmunityIds])

    // render reference layer when map is loaded
    useEffect(() => {
      if (!isMapLoaded || !mapRef.current) {
        return;
      }
      if (!props.referenceLayer) {
        return;
      }
      const map = mapRef.current;
      if (hasSource(map, REFERENCE_LAYER_ID)) {
        removeSource(map, REFERENCE_LAYER_ID);
      }
      map.addSource(REFERENCE_LAYER_ID, {
        type: 'geojson',
        data: props.referenceLayer
      });

      let filter: FilterSpecification = ['all'];
      if (props.referenceLayerId) {
        filter = ['all',
          ['==', '$type', 'Polygon'],
          ['==', 'id', props.referenceLayerId]
        ];
      } else {
        filter = ['==', '$type', 'Polygon'];
      }
      map.addLayer({
        id: REFERENCE_LAYER_ID,
        type: 'line',
        source: REFERENCE_LAYER_ID,
        filter: filter,
        paint: {
          'line-color': '#FF0000',
          'line-width': 2
        }
      });

    }, [isMapLoaded, props.referenceLayer, props.referenceLayerId])

    return (
      <Box id={props.mapContainerId} flexGrow={1}>
        <EarthRanger
          isVisible={props.config?.earth_ranger} 
          isMapLoaded={isMapLoaded} 
          mapRef={mapRef}
          initialBound={props.initialBound}/>
      </Box>
    )
  }
)
