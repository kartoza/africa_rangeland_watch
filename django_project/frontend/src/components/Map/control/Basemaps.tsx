import React, { useEffect, useState } from 'react';
import { Basemap } from "../DataTypes";
import { basemapData } from "../DataFixtures";


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
                  key={basemap.id}
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
