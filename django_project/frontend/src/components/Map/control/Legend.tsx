import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Layer } from '../../../store/layerSlice';

interface CardProps {
  layer: Layer;
}

/** Card of legend */
function Card({ layer }: CardProps) {
  const metadata = layer.metadata;
  let colors: string[] = []
  if (metadata?.colors) {
    const step = 100 / (metadata.colors.length - 1);
    colors = metadata.colors.map((color, int) => {
      return `${color} ${step * int}%`
    })
  }
  return (
    <div className='Card'>
      <b>{layer.name} {metadata?.unit ? `(${metadata?.unit})` : ''}</b>
      {
        metadata ?
          <div className='LegendColorWrapper'>
            <div className='LegendValue'>
              <div>{metadata.minValue}</div>
              <div>{metadata.maxValue}</div>
            </div>
            <div
              className='LegendColor'
              style={
                colors ? {
                  background: `linear-gradient(90deg, ${colors.join(',')})`
                } : {}
              }/>
          </div> : null
      }
    </div>
  )
}

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
        setLayers([...layers, layer])
      },
      /** Hide layer */
      removeLayer(layer: Layer) {
        setLayers(layers.filter(_layer => _layer.id !== layer.id))
      }
    }));

    return (
      <div>
        {layers && layers.map(layer => <Card key={layer.id} layer={layer}/>)}
      </div>
    )
  }
)
