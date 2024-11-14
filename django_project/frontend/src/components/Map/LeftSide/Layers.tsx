import React, { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box
} from "@chakra-ui/react";
import { GroupName, Layer } from "../DataTypes";
import { layerData } from "../DataFixtures";
import LayerCheckbox from "./LayerCheckbox";


export interface LayerCheckboxProps {
  onLayerChecked: (layer: Layer) => void;
  onLayerUnchecked: (layer: Layer) => void;
}

/** Layers component of map. */
export default function Layers(
  { onLayerChecked, onLayerUnchecked }: LayerCheckboxProps
) {
  const [layers, setLayers] = useState<Array<Layer> | null>(null);

  // TODO:
  //  Fetch the data here
  useEffect(() => {
    setLayers(layerData)
  }, []);

  return (
    <Accordion allowMultiple>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
              Baseline (Average)
            </Box>
            <AccordionIcon/>
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          {
            layers?.filter(
              layer => layer.group === GroupName.BaselineGroup
            ).map(
              layer => <LayerCheckbox
                layer={layer}
                onToggle={(checked) => checked ? onLayerChecked(layer) : onLayerUnchecked(layer)}
              />
            )
          }
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
              Near-real time
            </Box>
            <AccordionIcon/>
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          Coming soon
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

