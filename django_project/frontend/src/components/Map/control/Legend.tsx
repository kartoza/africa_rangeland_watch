import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Layer } from '../../../store/layerSlice';
import ScrollableListCard from './ScrollableListCard';


interface Props {

}

/** Legend.*/
export const Legend = forwardRef(
  (props: Props, ref
  ) => {
    const [layers, setLayers] = useState<Array<Layer>>([]);

    useImperativeHandle(ref, () => ({
      /** Render layer */
      renderLayer(layer: Layer) {
        if (layers.findIndex(_layer => _layer.id === layer.id) === -1) {
          setLayers([...layers, layer])
        }
      },
      /** Hide layer */
      removeLayer(layer: Layer) {
        setLayers(layers.filter(_layer => _layer.id !== layer.id))
      }
    }));

    return (
      <div>
        { layers && layers.length > 0 && <ScrollableListCard items={layers} /> }
      </div>
    )
  }
)
