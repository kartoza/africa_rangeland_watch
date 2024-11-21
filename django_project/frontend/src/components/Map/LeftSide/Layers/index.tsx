import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box
} from "@chakra-ui/react";
import { Layer } from '../../../../store/layerSlice';
import { Landscape } from '../../../../store/landscapeSlice';
import { GroupName } from "../../DataTypes";
import LayerCheckbox from "./LayerCheckbox";
import LandscapeSelector from "./LandscapeSelector";
import LeftSideLoading from "../Loading";


export interface LayerCheckboxProps {
  onLayerChecked: (layer: Layer) => void;
  onLayerUnchecked: (layer: Layer) => void;
}

export interface Props extends LayerCheckboxProps {
  landscapes?: Landscape[];
  layers?: Layer[];
}

/** Layers component of map. */
export default function Layers(
  { landscapes, layers, onLayerChecked, onLayerUnchecked }: Props
) {
  return (
    <Accordion allowMultiple defaultIndex={[0, 1]}>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
              Baseline (Average)
            </Box>
            <AccordionIcon/>
          </AccordionButton>
        </h2>
        <AccordionPanel
          pb={4}
          fontSize='13px'
        >
          {
            layers ?
              layers?.filter(
                layer => layer.group === GroupName.BaselineGroup
              ).map(
                layer => <LayerCheckbox
                  key={layer.id}
                  layer={layer}
                  onToggle={(checked) => checked ? onLayerChecked(layer) : onLayerUnchecked(layer)}
                />
              ) :
              <LeftSideLoading/>
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
        <AccordionPanel
          pb={4}
          fontSize='13px'
        >
          <Box mb={4}>
            Average for past 30 days
          </Box>
          <Box mb={4}>
            <LandscapeSelector landscapes={landscapes}/>
          </Box>
          {
            layers ?
              layers?.filter(
                layer => layer.group === GroupName.NearRealtimeGroup
              ).map(
                layer => <LayerCheckbox
                  key={layer.id}
                  layer={layer}
                  onToggle={(checked) => checked ? onLayerChecked(layer) : onLayerUnchecked(layer)}
                />
              ) :
              <LeftSideLoading/>
          }
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

