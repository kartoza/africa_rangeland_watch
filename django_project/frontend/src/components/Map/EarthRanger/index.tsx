import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import maplibregl from "maplibre-gl";
import { EARTH_EANGER_EVENT } from "../DataTypes";
import { useMap } from '../../../MapContext';
import EarthRangerEventPopup from './EarthRangerEventPopup';

let clickFunction: (ev: maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
} & Object) => void = null

/** Landscape geometry selector. */
export default function EarthRanger() {
  const { mapRef, isMapLoaded } = useMap();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const map = mapRef.current;
      if (!isMapLoaded || !map) {
        return
      }
      // render Earth Ranger Events
      map.addSource(
        EARTH_EANGER_EVENT, {
          type: 'vector',
          tiles: [
            document.location.origin + '/frontend-api/earth-ranger/events/vector_tile/{z}/{x}/{y}/'
          ]
        }
      );
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
        }
      });

    } catch (err) {
      console.log(err)
    }
  }, [isMapLoaded])

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map) {
      return
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
      
  }, [isMapLoaded])

  // Handle popup close
  const handlePopupClose = () => {
    setPopupOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      {/* Render popup when event is selected */}
      {selectedEvent && (
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
