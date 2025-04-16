import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Layer } from '../../../store/layerSlice';
import ScrollableListCard from './ScrollableListCard';


interface Props {
  map: maplibregl.Map | null;
}

/** Legend.*/
export const Legend = forwardRef(
  (props: Props, ref
  ) => {
    // Layer at first index will be rendered on top
    const [layers, setLayers] = useState<Array<Layer>>([]);

    useImperativeHandle(ref, () => ({
      /** Render layer */
      renderLayer(layer: Layer) {
        if (layers.findIndex(_layer => _layer.id === layer.id) === -1) {
          setLayers([layer, ...layers])
        }
      },
      /** Hide layer */
      removeLayer(layer: Layer) {
        setLayers(layers.filter(_layer => _layer.id !== layer.id))
      }
    }));

    return (
      <div>
        { layers && layers.length > 0 && <ScrollableListCard initialItems={layers} map={props.map} /> }
      </div>
    )
  }
)
