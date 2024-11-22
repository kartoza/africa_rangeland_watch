import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { BaseMap } from '../../../store/baseMapSlice';


interface CardProps {
  basemap: BaseMap;
  isSelected: boolean;
  onSelected: () => void;
}

/** Card of basemap */
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
  baseMaps: BaseMap[];
  onSelected: (basemap: BaseMap) => void;
}

/** Basemaps selector.*/
export const BasemapSelector = forwardRef(
  ({ baseMaps, onSelected }: Props, ref
  ) => {
    const [selected, setSelected] = useState<BaseMap | null>(null);

    // When selected
    useEffect(() => {
      if (selected) {
        onSelected(selected)
      }
    }, [selected]);

    useImperativeHandle(ref, () => ({
      /** Render layer */
      setBaseMapLayer(baseMap: BaseMap) {
        setSelected(baseMap)
      }
    }));

    return (
      <div className='BasemapSelector'>
        {
          baseMaps.map(
            (basemap: BaseMap) => <Card
              key={basemap.id}
              onSelected={() => setSelected(basemap)}
              isSelected={selected?.id === basemap.id}
              basemap={basemap}
            />
          )
        }
      </div>
    )
  }
)
