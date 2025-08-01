import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../store";
import { Layer, setSelectedNrtLayer } from '../../../../store/layerSlice';
import { Landscape } from '../../../../store/landscapeSlice';
import { GroupName } from "../../DataTypes";
import LayerCheckbox from "./LayerCheckbox";
import LandscapeSelector from "./LandscapeSelector";
import LeftSideLoading from "../Loading";
import CogDownloadButton from './LayerDownloadButton';


export interface LayerCheckboxProps {
  onLayerChecked: (layer: Layer) => void;
  onLayerUnchecked: (layer: Layer, isRemoveSource?: boolean) => void;
}

export interface Props extends LayerCheckboxProps {
  landscapes?: Landscape[];
  layers?: Layer[];
}

/** Layers component of map. */
export default function Layers(
  { landscapes, layers, onLayerChecked, onLayerUnchecked }: Props
) {
  const dispatch = useDispatch<AppDispatch>();
  const { selected: selectedLandscape } = useSelector((state: RootState) => state.landscape);
  const selectedNrt = useSelector((state: RootState) => state.layer.selectedNrt);

  const handleNrtLayerChecked = (layer: Layer) => {
    let _copyLayer = {...layer}
    if (selectedLandscape && selectedLandscape.urls[layer.id] !== undefined) {
      _copyLayer.url = selectedLandscape.urls[layer.id]
    }
    dispatch(setSelectedNrtLayer(layer))
    onLayerChecked(_copyLayer)
  }

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
              EarthRanger
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
                layer => layer.group === GroupName.EarthRangerGroup
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
          {layers && selectedLandscape ? (
            layers
              .filter(layer => layer.group === GroupName.NearRealtimeGroup)
              .map(layer => (
                <Box key={layer.id} display="flex" alignItems="center" justifyContent="space-between" pl={2}>
                  <LayerCheckbox
                    layer={layer}
                    onToggle={(checked) => checked ? handleNrtLayerChecked(layer) : onLayerUnchecked(layer)}
                  />
                  {selectedNrt?.id === layer.id && (
                    <Box display="flex" gap={2}>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        onClick={async () => {
                          const res = await fetch(`/nrt-layer/${layer.id}/export/`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "X-CSRFToken": document.cookie.match(/csrftoken=([\w-]+)/)?.[1] || "",
                            },
                            body: JSON.stringify({
                              landscape_id: selectedLandscape?.id,
                            }),
                          });
                          if (res.ok) {
                            alert("COG export task started.");
                          } else {
                            alert("Failed to trigger export.");
                          }
                        }}
                      >
                        Generate
                      </Button>
                
                      <CogDownloadButton
                        layerId={layer.id}
                        isSelected={true}
                      />
                    </Box>
                  )}
                </Box>
              ))
          ) : (
            layers ? null : <LeftSideLoading />
          )}
        </AccordionPanel>
      </AccordionItem>

      { layers?.find(layer => layer.group === GroupName.UserDefinedGroup) && (
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight='bold' fontSize='13px'>
                User Defined
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
                  layer => layer.group === GroupName.UserDefinedGroup
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
      )
      }
      
    </Accordion>
  )
}
