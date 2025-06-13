import React, { createContext, useContext, useState, useRef } from 'react';
import { Map } from 'maplibre-gl';

interface MapContextProps {
    mapRef: React.MutableRefObject<maplibregl.Map | null>;
    isMapLoaded: boolean;
    setIsMapLoaded: React.Dispatch<React.SetStateAction<boolean>>;
}

const MapContext = createContext<MapContextProps | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const mapRef = useRef<Map | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    return (
        <MapContext.Provider value={{ mapRef, isMapLoaded, setIsMapLoaded }}>
            {children}
        </MapContext.Provider>
    );
};

export const useMap = (): MapContextProps => {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('useMap must be used within a MapProvider');
    }
    return context;
};
