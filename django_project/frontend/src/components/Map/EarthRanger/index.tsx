import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import maplibregl from "maplibre-gl";
import { EARTH_EANGER_EVENT } from "../DataTypes";
import { useMap } from '../../../MapContext';
import EarthRangerEventPopup from './EarthRangerEventPopup';
import { m } from 'framer-motion';
import { filter } from '@chakra-ui/react';

let clickFunction: (ev: maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
} & Object) => void = null

interface EarthRangerProps {
  isVisible: boolean;
  mapRef?: React.MutableRefObject<maplibregl.Map | null>;
  isMapLoaded?: boolean;
  initialBound?: [number, number, number, number];
}

/** Landscape geometry selector. */
export default function EarthRanger({ isVisible, mapRef: externalMapRef, isMapLoaded: externalIsMapLoaded, initialBound }: EarthRangerProps) {
  const contextMap = useMap();
  const mapRef = externalMapRef || contextMap.mapRef;
  const isMapLoaded = externalIsMapLoaded !== undefined ? externalIsMapLoaded : contextMap.isMapLoaded;
  
  // const { mapRef, isMapLoaded } = useMap();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  let layerFilter: any = undefined;
  if (initialBound && 
      Array.isArray(initialBound) && 
      initialBound.length === 4 &&
      initialBound.every(val => typeof val === 'number' && !isNaN(val))) {
    
    const [west, south, east, north] = initialBound;
    layerFilter = [
            'within',
            {
              'type': 'Polygon',
              'coordinates': [[
                [west, south],
                [east, south], 
                [east, north],
                [west, north],
                [west, south]
              ]]
            }
          ];
  }

  // Effect to handle layer visibility changes
  useEffect(() => {
    const map = mapRef.current;

    if (!isMapLoaded || !map) {
      return;
    }

    if (isVisible) {
      // Add source and layer if they don't exist
      try {
        if (!map.getSource(EARTH_EANGER_EVENT)) {
          map.addSource(EARTH_EANGER_EVENT, {
            type: 'vector',
            tiles: [
              document.location.origin + '/frontend-api/earth-ranger/events/vector_tile/{z}/{x}/{y}/'
            ]
          });
        }

        if (!map.getLayer(EARTH_EANGER_EVENT)) {
          // Create the layer config with proper typing
          let layerConfig: maplibregl.AddLayerObject = {
            'id': EARTH_EANGER_EVENT,
            'type': 'circle',
            'source': EARTH_EANGER_EVENT,
            'source-layer': 'default',
            'paint': {
              'circle-radius': 15,
              'circle-color': '#FF0000',
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-opacity': 1
            }
          } as maplibregl.CircleLayerSpecification;

          if (layerFilter) {
            (layerConfig as maplibregl.CircleLayerSpecification).filter = layerFilter;
          }

          map.addLayer(layerConfig);

          map.addLayer({
            'id': EARTH_EANGER_EVENT,
            'type': 'circle',
            'source': EARTH_EANGER_EVENT,
            'source-layer': 'default',
            'paint': {
              'circle-radius': 15,
              'circle-color': '#FF0000',
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-opacity': 1
            },
            'filter': layerFilter
          });
        } else {
          // If layer exists but was hidden, show it
          map.setLayoutProperty(EARTH_EANGER_EVENT, 'visibility', 'visible');
        }
      } catch (err) {
        console.log('Error adding EarthRanger layer:', err);
      }
    } else {
      // Hide the layer when not visible
      try {
        map.removeLayer(EARTH_EANGER_EVENT);
        map.removeSource(EARTH_EANGER_EVENT);
        // Close any open popup when hiding the layer
        setPopupOpen(false);
        setSelectedEvent(null);
      } catch (err) {
        console.log('Error hiding EarthRanger layer:', err);
      }
    }
  }, [isMapLoaded, isVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map || !isVisible) {
      return;
    }

    // Click event for Earth Ranger Events
    map.off('click', EARTH_EANGER_EVENT, clickFunction);
    clickFunction = (e: any) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = JSON.parse(feature.properties.data);
        
        // Parse the data JSON
        let eventData;
        try {
          eventData = properties;
        } catch (error) {
          console.error('Error parsing event data:', error);
          return;
        }

        // Get screen coordinates for the popup
        const canvas = map.getCanvas();
        const rect = canvas.getBoundingClientRect();
        setClickPosition({
          x: e.point.x + rect.left,
          y: e.point.y + rect.top
        });

        // Set the selected event and open popup
        setSelectedEvent({
          data: eventData,
          earthRangerUuid: properties.earth_ranger_uuid || properties.id
        });
        setPopupOpen(true);
      }
    };
    map.on('click', EARTH_EANGER_EVENT, clickFunction);

    // Add hover effect for Earth Ranger events
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    (map as any).on('mouseenter', EARTH_EANGER_EVENT, handleMouseEnter);
    (map as any).on('mouseleave', EARTH_EANGER_EVENT, handleMouseLeave);

    return () => {
      map.off('click', EARTH_EANGER_EVENT, clickFunction);
      (map as any).off('mouseenter', EARTH_EANGER_EVENT, handleMouseEnter);
      (map as any).off('mouseleave', EARTH_EANGER_EVENT, handleMouseLeave);
    }
      
  }, [isMapLoaded, isVisible]);

  // Handle popup close
  const handlePopupClose = () => {
    setPopupOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      {/* Render popup when event is selected and layer is visible */}
      {selectedEvent && isVisible && (
        <EarthRangerEventPopup
          data={selectedEvent.data}
          earthRangerUuid={selectedEvent.earthRangerUuid}
          isOpen={popupOpen}
          onClose={handlePopupClose}
          position={clickPosition}
        />
      )}
    </>
  )
}
