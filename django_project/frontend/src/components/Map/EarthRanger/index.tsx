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
export default function AnalysisLandscapeGeometrySelector() {
  const { map } = useMap();
  const [popup, setPopup] = useState<maplibregl.Popup | null>(null);
  const [popupData, setPopupData] = useState<any>(null);

  useEffect(() => {
    try {
      if (!map) {
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
  }, [map])

  useEffect(() => {
    if (!map) {
      return
    }

    // Click event for Earth Ranger Events
    map.off('click', EARTH_EANGER_EVENT, clickFunction);
    clickFunction = (e: any) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties;
        
        // Close existing popup
        if (popup) {
          popup.remove();
        }

        // Parse the data JSON
        let eventData;
        try {
          eventData = properties;
        } catch (error) {
          console.error('Error parsing event data:', error);
          return;
        }

        // Create popup container
        const popupContainer = document.createElement('div');
        
        // Create new popup
        const newPopup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          maxWidth: '400px'
        })
          .setLngLat(e.lngLat)
          .setDOMContent(popupContainer)
          .addTo(map);

        setPopup(newPopup);
        setPopupData({
          data: eventData,
          earthRangerUuid: properties.earth_ranger_uuid,
          container: popupContainer
        });
      }
    };
    map.on('click', EARTH_EANGER_EVENT, clickFunction);

    // Add hover effect for Earth Ranger events using type assertion
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
    };

    // Use type assertion to bypass TypeScript errors
    (map as any).on('mouseenter', EARTH_EANGER_EVENT, handleMouseEnter);
    (map as any).on('mouseleave', EARTH_EANGER_EVENT, handleMouseLeave);

    return () => {
      map.off('click', EARTH_EANGER_EVENT, clickFunction);
      // Clean up mouse events with type assertion
      (map as any).off('mouseenter', EARTH_EANGER_EVENT, handleMouseEnter);
      (map as any).off('mouseleave', EARTH_EANGER_EVENT, handleMouseLeave);
      if (popup) {
        popup.remove();
      }
    }
      
  }, [map, popup])

  // Handle popup close
  const handlePopupClose = () => {
    if (popup) {
      popup.remove();
      setPopup(null);
      setPopupData(null);
    }
  };

  // Render popup content when popupData is available
  useEffect(() => {
    if (popupData && popupData.container) {
      const root = ReactDOM.createRoot(popupData.container);
      root.render(
        <EarthRangerEventPopup
          data={popupData.data}
          earthRangerUuid={popupData.earthRangerUuid}
          onClose={handlePopupClose}
        />
      );
    }
  }, [popupData]);

  return <></>
}
