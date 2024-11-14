import React, { useEffect, useState } from 'react';

// TODO:
//  Move this to use API
const basemapData = [
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

interface Basemap {
  id: number,
  name: string,
  url: string
  thumbnail?: string,
}

interface CardProps {
  basemap: Basemap;
  isSelected: boolean;
  onSelected: () => void;
}

/**
 * Card of basemap
 */
function Card({ basemap, isSelected, onSelected }: CardProps) {
  return (
    <div
      className={'Card ' + (isSelected ? 'Selected' : '')}
      title={basemap.name}
      onClick={onSelected}
    >
      {
        basemap.thumbnail ?
          <img src={basemap.thumbnail} alt={basemap.name}/> : null
      }
    </div>
  )
}

interface Props {
  onSelected: (basemap: Basemap) => void;
}

/** Basemaps selector.*/
export default function BasemapSelector({ onSelected }: Props) {
  const [selected, setSelected] = useState<Basemap | null>(null);
  const [basemaps, setBasemaps] = useState<Array<Basemap> | null>(null);

  // TODO:
  //  Fetch the data here
  useEffect(() => {
    setBasemaps(basemapData)
  }, []);

  // Default basemap
  useEffect(() => {
    if (basemaps) {
      setSelected(basemaps[0])
    }
  }, [basemaps]);

  // When selected
  useEffect(() => {
    if (selected) {
      onSelected(selected)
    }
  }, [selected]);

  return (
    <>
      {
        basemaps ?
          <div className='BasemapSelector'>
            {
              basemaps.map(
                (basemap: Basemap) => <Card
                  onSelected={() => setSelected(basemap)}
                  isSelected={selected?.id === basemap.id}
                  basemap={basemap}
                />
              )
            }
          </div> : null
      }
    </>
  )
}
