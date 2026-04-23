import React, { useEffect, useState } from 'react';
import maplibregl from "maplibre-gl";
import { EARTH_EANGER_EVENT } from "../DataTypes";
import { useMap } from '../../../MapContext';
import EarthRangerEventPopup from './EarthRangerEventPopup';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

let clickFunction: (ev: maplibregl.MapMouseEvent & {
  features?: maplibregl.MapGeoJSONFeature[];
} & Object) => void = null

interface EarthRangerProps {
  isVisible: boolean;
  mapRef?: React.MutableRefObject<maplibregl.Map | null>;
  isMapLoaded?: boolean;
  initialBound?: [number, number, number, number];
}

function buildTileUrl(eventTypes: string[]): string {
  const base =
    document.location.origin +
    '/frontend-api/earth-ranger/events/vector_tile/{z}/{x}/{y}/';
  if (!eventTypes.length) return base;
  const qs = eventTypes
    .map((t) => `event_type=${encodeURIComponent(t)}`)
    .join('&');
  return `${base}?${qs}`;
}

/** EarthRanger events layer. */
export default function EarthRanger({ isVisible, mapRef: externalMapRef, isMapLoaded: externalIsMapLoaded, initialBound }: EarthRangerProps) {
  const contextMap = useMap();
  const mapRef = externalMapRef || contextMap.mapRef;
  const isMapLoaded = externalIsMapLoaded !== undefined ? externalIsMapLoaded : contextMap.isMapLoaded;

  const selectedEventTypes = useSelector(
    (s: RootState) => s.earthRanger.selectedEventTypes
  );

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  let layerFilter: any = undefined;
  if (
    initialBound &&
    Array.isArray(initialBound) &&
    initialBound.length === 4 &&
    initialBound.every((val) => typeof val === 'number' && !isNaN(val))
  ) {
    const [west, south, east, north] = initialBound;
    layerFilter = [
      'within',
      {
        type: 'Polygon',
        coordinates: [
          [
            [west, south],
            [east, south],
            [east, north],
            [west, north],
            [west, south],
          ],
        ],
      },
    ];
  }

  // Rebuild source/layer whenever visibility or filters change
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map) return;

    // Always clean up first
    try {
      if (map.getLayer(EARTH_EANGER_EVENT)) map.removeLayer(EARTH_EANGER_EVENT);
      if (map.getSource(EARTH_EANGER_EVENT)) map.removeSource(EARTH_EANGER_EVENT);
    } catch (_) {}

    if (!isVisible) {
      setPopupOpen(false);
      setSelectedEvent(null);
      return;
    }

    try {
      map.addSource(EARTH_EANGER_EVENT, {
        type: 'vector',
        tiles: [buildTileUrl(selectedEventTypes)],
      });

      const layerConfig: maplibregl.CircleLayerSpecification = {
        id: EARTH_EANGER_EVENT,
        type: 'circle',
        source: EARTH_EANGER_EVENT,
        'source-layer': 'default',
        paint: {
          'circle-radius': 15,
          'circle-color': '#FF0000',
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-opacity': 1,
        },
      };

      if (layerFilter) layerConfig.filter = layerFilter;

      map.addLayer(layerConfig);
    } catch (err) {
      console.log('Error adding EarthRanger layer:', err);
    }
  }, [isMapLoaded, isVisible, selectedEventTypes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapLoaded || !map || !isVisible) return;

    map.off('click', EARTH_EANGER_EVENT, clickFunction);
    clickFunction = (e: any) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = JSON.parse(feature.properties.data);

        const canvas = map.getCanvas();
        const rect = canvas.getBoundingClientRect();
        setClickPosition({
          x: e.point.x + rect.left,
          y: e.point.y + rect.top,
        });

        setSelectedEvent({
          data: properties,
          earthRangerUuid: properties.earth_ranger_uuid || properties.id,
        });
        setPopupOpen(true);
      }
    };
    map.on('click', EARTH_EANGER_EVENT, clickFunction);

    const handleMouseEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const handleMouseLeave = () => { map.getCanvas().style.cursor = ''; };

    (map as any).on('mouseenter', EARTH_EANGER_EVENT, handleMouseEnter);
    (map as any).on('mouseleave', EARTH_EANGER_EVENT, handleMouseLeave);

    return () => {
      map.off('click', EARTH_EANGER_EVENT, clickFunction);
      (map as any).off('mouseenter', EARTH_EANGER_EVENT, handleMouseEnter);
      (map as any).off('mouseleave', EARTH_EANGER_EVENT, handleMouseLeave);
    };
  }, [isMapLoaded, isVisible]);

  const handlePopupClose = () => {
    setPopupOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
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
  );
}
