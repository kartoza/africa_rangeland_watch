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
import { useState } from 'react';


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
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
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

  const handleDownloadNrt = async (id: string, event: React.MouseEvent) => {
    try {
      event.preventDefault();
      setIsDownloading(id);  // Optional: to show loading state per layer
  
      const url = `/layers/download_nrt/${id}`;
      const response = await fetch(url);
  
      if (!response.ok) {
        setIsDownloading(null);
        if (response.status === 404) {
          alert("File not found. Please try again later.");
        } else {
          alert(`Download failed: ${response.status}`);
        }
        return;
      }
  
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${id}.tif`;
  
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
  
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("NRT Download failed", error);
      alert("An error occurred while downloading the file.");
    } finally {
      setIsDownloading(null);
    }
  };

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
                    <Button
                      size="xs"
                      ml={2}
                      colorScheme="blue"
                      onClick={(e) => handleDownloadNrt(layer.id, e)}
                      isLoading={isDownloading === layer.id}
                    >
                      Download
                    </Button>
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
